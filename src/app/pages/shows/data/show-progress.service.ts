import { computed, inject, Injectable, Signal, signal } from '@angular/core';
import { isPast } from 'date-fns';
import { toEpisodeId, toSeasonId } from '@helper/toShowId';
import { translated } from '@helper/translation';
import type {
  ShowProgressSummary,
  NextEpisodeState,
  SeasonProgressSummary,
} from '@type/ShowProgress';
import type { EpisodeFull, SeasonProgress, Show, ShowProgress, Translation } from '@type/Trakt';
import type { TmdbSeason } from '@type/Tmdb';
import { EpisodeService } from './episode.service';
import { ShowService } from './show.service';
import { TmdbService } from './tmdb.service';
import { TranslationService } from './translation.service';

export const SYNTHETIC_EPISODE_TRAKT_ID = 0;

@Injectable({
  providedIn: 'root',
})
export class ShowProgressService {
  private readonly showService = inject(ShowService);
  private readonly episodeService = inject(EpisodeService);
  private readonly tmdbService = inject(TmdbService);
  private readonly translationService = inject(TranslationService);

  private readonly cachedSeasonEpisodes = signal<Record<string, EpisodeFull[]>>({});
  private readonly progressSignals = new Map<number, Signal<ShowProgressSummary>>();

  progress(show: Show): Signal<ShowProgressSummary> {
    const showId = show.ids.trakt;
    const cached = this.progressSignals.get(showId);
    if (cached) return cached;

    const progress = computed(() => this.buildProgress(show));
    this.progressSignals.set(showId, progress);
    return progress;
  }

  /** Adds details already fetched by the Show or Season page to the derived view. */
  setSeasonEpisodes(show: Show, seasonNumber: number, episodes: EpisodeFull[]): void {
    const key = this.seasonEpisodesKey(show.ids.trakt, seasonNumber);
    this.cachedSeasonEpisodes.update((current) => ({ ...current, [key]: episodes }));
  }

  private buildProgress(show: Show): ShowProgressSummary {
    const progress = this.showService.showsProgress.s()[show.ids.trakt];
    const episodes = this.episodeService.showsEpisodes.s();
    const translations = this.translationService.showsEpisodesTranslations.s();
    const tmdbSeasons = this.tmdbService.tmdbSeasons.s();
    const nextEpisode = this.getNextEpisodeState(show, progress, episodes, translations);
    const tmdbSeason =
      nextEpisode.state === 'episode' || nextEpisode.state === 'pending'
        ? show.ids.tmdb == null
          ? undefined
          : tmdbSeasons[toSeasonId(show.ids.tmdb, nextEpisode.episode.season)]
        : undefined;

    if (!progress) {
      return {
        aired: undefined,
        completed: undefined,
        remaining: undefined,
        nextEpisode,
        seasons: new Map(),
        tmdbSeason,
      };
    }

    const seasonProgress = progress.seasons ?? [];
    const seasonNumbers = new Set(seasonProgress.map((season) => season.number));
    for (const season of this.episodeServiceSeasonNumbers(show)) seasonNumbers.add(season);
    for (const season of this.tmdbService.tmdbShows.s()[show.ids.tmdb ?? -1]?.seasons ?? []) {
      if (season.season_number !== undefined) seasonNumbers.add(season.season_number);
    }

    const seasonSummaries = new Map<number, SeasonProgressSummary>();
    let seasonalAired = 0;
    for (const seasonNumber of seasonNumbers) {
      const seasonProgressItem = seasonProgress.find((season) => season.number === seasonNumber);
      const aired = this.getAiredForSeason(show, seasonNumber, seasonProgressItem, tmdbSeasons);
      const completed = seasonProgressItem?.completed ?? 0;
      seasonSummaries.set(seasonNumber, {
        aired,
        remaining: Math.max(0, aired - completed),
      });
      if (seasonNumber !== 0) seasonalAired += aired;
    }

    const aired =
      progress.seasons === undefined ? progress.aired : Math.max(progress.aired, seasonalAired);

    return {
      aired,
      completed: progress.completed,
      remaining: Math.max(0, aired - progress.completed),
      nextEpisode,
      seasons: seasonSummaries,
      tmdbSeason,
    };
  }

  private getNextEpisodeState(
    show: Show,
    progress: ShowProgress | undefined,
    episodes: Record<string, EpisodeFull | undefined>,
    translations: Record<string, Translation | undefined>,
  ): NextEpisodeState {
    const nextEpisode = progress?.next_episode;
    if (nextEpisode === undefined) return { state: 'unknown' };
    if (nextEpisode === null || nextEpisode.season === 0) return { state: 'none' };

    const episodeId = toEpisodeId(show.ids.trakt, nextEpisode.season, nextEpisode.number);
    const episode = episodes[episodeId]
      ? translated(episodes[episodeId]!, translations[episodeId])
      : (translated(nextEpisode, translations[episodeId]) as EpisodeFull);
    return nextEpisode.ids?.trakt === SYNTHETIC_EPISODE_TRAKT_ID
      ? { state: 'pending', episode }
      : { state: 'episode', episode };
  }

  private getAiredForSeason(
    show: Show,
    seasonNumber: number,
    seasonProgress: SeasonProgress | undefined,
    tmdbSeasons: Record<string, TmdbSeason | undefined>,
  ): number {
    const episodeDetails = this.episodeService.showsEpisodes.s();
    const cachedEpisodes =
      this.cachedSeasonEpisodes()[this.seasonEpisodesKey(show.ids.trakt, seasonNumber)];
    const storedEpisodes = Object.entries(episodeDetails)
      .filter(([id]) => id.startsWith(`${show.ids.trakt}-${seasonNumber}-`))
      .map(([, episode]) => episode)
      .filter((episode): episode is EpisodeFull => !!episode);
    const episodeDatesAired = this.countAiredEpisodes([
      ...(cachedEpisodes ?? []),
      ...storedEpisodes,
    ]);

    const tmdbEpisodes =
      show.ids.tmdb == null
        ? undefined
        : tmdbSeasons[toSeasonId(show.ids.tmdb, seasonNumber)]?.episodes;
    const tmdbDatesAired =
      tmdbEpisodes?.filter((episode) => episode.air_date && isPast(episode.air_date)).length ?? 0;

    return Math.max(seasonProgress?.aired ?? 0, episodeDatesAired, tmdbDatesAired);
  }

  private countAiredEpisodes(episodes: EpisodeFull[]): number {
    return episodes.filter((episode) => episode.first_aired && isPast(episode.first_aired)).length;
  }

  private episodeServiceSeasonNumbers(show: Show): number[] {
    const prefix = `${show.ids.trakt}-`;
    const seasonNumbers = new Set<number>();
    for (const episodeId of Object.keys(this.episodeService.showsEpisodes.s())) {
      if (!episodeId.startsWith(prefix)) continue;
      const seasonNumber = Number(episodeId.slice(prefix.length).split('-')[0]);
      if (Number.isInteger(seasonNumber)) seasonNumbers.add(seasonNumber);
    }
    for (const key of Object.keys(this.cachedSeasonEpisodes())) {
      if (!key.startsWith(prefix)) continue;
      const seasonNumber = Number(key.slice(prefix.length));
      if (Number.isInteger(seasonNumber)) seasonNumbers.add(seasonNumber);
    }
    return [...seasonNumbers];
  }

  private seasonEpisodesKey(showId: number, seasonNumber: number): string {
    return `${showId}-${seasonNumber}`;
  }
}
