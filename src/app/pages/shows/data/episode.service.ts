import { computed, inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import {
  buffer,
  catchError,
  debounceTime,
  forkJoin,
  map,
  Observable,
  of,
  shareReplay,
  Subject,
  switchMap,
} from 'rxjs';
import { TmdbService } from './tmdb.service';
import { ShowService } from './show.service';
import { TranslationService } from './translation.service';
import { toEpisodeId } from '@helper/toShowId';
import { translated, translatedOrUndefined } from '@helper/translation';
import { LocalStorage } from '@type/Enum';
import {
  Episode,
  EpisodeAiring,
  episodeAiringSchema,
  EpisodeFull,
  episodeFullSchema,
  EpisodeProgress,
  SeasonProgress,
  Show,
  ShowProgress,
} from '@type/Trakt';
import type { AddToHistoryResponse, RemoveFromHistoryResponse } from '@type/TraktResponse';
import { parseResponse } from '@operator/parseResponse';
import { API } from '@shared/api';
import { toUrl } from '@helper/toUrl';
import { LocalStorageService } from '@services/local-storage.service';
import { SyncDataService } from '@services/sync-data.service';
import { pick } from '@helper/pick';
import { SeasonService } from './season.service';
import { TmdbShow } from '@type/Tmdb';
import { CustomEpisode } from '@type/Episode';

@Injectable({
  providedIn: 'root',
})
export class EpisodeService {
  http = inject(HttpClient);
  tmdbService = inject(TmdbService);
  showService = inject(ShowService);
  translationService = inject(TranslationService);
  localStorageService = inject(LocalStorageService);
  syncDataService = inject(SyncDataService);
  seasonService = inject(SeasonService);

  showsEpisodes = this.syncDataService.syncObjects<EpisodeFull>({
    url: API.episode,
    localStorageKey: LocalStorage.SHOWS_EPISODES,
    schema: episodeFullSchema,
    idFormatter: toEpisodeId as (...args: unknown[]) => string,
    parseItem: (episode: EpisodeFull) =>
      pick<EpisodeFull>(
        episode,
        'first_aired',
        'ids',
        'number',
        'overview',
        'season',
        'title',
        'translations',
      ),
  });

  constructor() {
    this.addMissingShowProgress();
  }

  addMissingShowProgress(): void {
    this.showService.reconcileAiredEntries(this.showsEpisodes.s());
  }

  episodeToAdd = new Subject<CustomEpisode>();
  episodesToAdd$ = this.episodeToAdd.pipe(
    buffer(this.episodeToAdd.pipe(debounceTime(1000))),
    switchMap((episodes: CustomEpisode[]) => {
      const watchedAt = episodes[episodes.length - 1].watchedAt?.toISOString();
      if (!watchedAt) throw new Error('watchedAt is undefined');
      const episodeIds = episodes.map((episode: CustomEpisode) => ({ ids: episode.episode.ids }));
      return this.http.post<AddToHistoryResponse>(API.syncHistory, {
        episodes: episodeIds,
        watched_at: watchedAt,
      });
    }),
    shareReplay({ bufferSize: 1, refCount: true }),
  );

  addEpisode(
    episode: Episode,
    watchedAt = new Date(),
    options: { batch?: boolean } = {},
  ): Observable<AddToHistoryResponse> {
    if (!options.batch) {
      return this.http.post<AddToHistoryResponse>(API.syncHistory, {
        episodes: [{ ids: episode.ids }],
        watched_at: watchedAt.toISOString(),
      });
    }

    // Wait a tick so this episode joins the season-page checkbox batch before it is subscribed.
    setTimeout(() => this.episodeToAdd.next({ episode, watchedAt }));
    return this.episodesToAdd$;
  }

  episodeToRemove = new Subject<CustomEpisode>();
  episodesToRemove$ = this.episodeToRemove.pipe(
    buffer(this.episodeToRemove.pipe(debounceTime(1000))),
    switchMap((episodes: CustomEpisode[]) => {
      const episodeIds = episodes.map((episode: CustomEpisode) => ({ ids: episode.episode.ids }));
      return this.http.post<RemoveFromHistoryResponse>(API.syncHistoryRemove, {
        episodes: episodeIds,
      });
    }),
    shareReplay({ bufferSize: 1, refCount: true }),
  );

  removeEpisode(
    episode: Episode,
    options: { batch?: boolean } = {},
  ): Observable<RemoveFromHistoryResponse> {
    if (!options.batch) {
      return this.http.post<RemoveFromHistoryResponse>(API.syncHistoryRemove, {
        episodes: [{ ids: episode.ids }],
      });
    }

    // Wait a tick so this episode joins the season-page checkbox batch before it is subscribed.
    setTimeout(() => this.episodeToRemove.next({ episode }));
    return this.episodesToRemove$;
  }

  fetchEpisode(
    show?: Show,
    seasonNumber?: number,
    episodeNumber?: number,
    options?: { force?: boolean; persist?: boolean },
  ): Promise<EpisodeFull | undefined | null> {
    if (!show || seasonNumber === undefined || !episodeNumber)
      throw Error('Argument is empty (fetchEpisode)');

    const cached = this.showsEpisodes.s()[toEpisodeId(show.ids.trakt, seasonNumber, episodeNumber)];
    const cachedTranslation = this.translationService.getEpisodeTranslation(
      show,
      seasonNumber,
      episodeNumber,
    );
    if (!options?.force && cached) {
      if (!Object.keys(cached).length) throw Error('Episode is empty (fetchEpisode)');
      return Promise.resolve(translatedOrUndefined(cached, cachedTranslation));
    }

    return Promise.all([
      this.showsEpisodes.fetchIds([show.ids.trakt, seasonNumber, episodeNumber], {
        persist: options?.persist ?? !!cached,
      }),
      this.translationService.ensureEpisodeTranslation(show, seasonNumber, episodeNumber, {
        force: options?.force,
        persist: options?.persist ?? !!cachedTranslation,
      }),
    ]).then(([episode, episodeTranslation]) => translatedOrUndefined(episode, episodeTranslation));
  }

  episodes = computed(() => {
    const showsEpisodes = this.showsEpisodes.s();
    const episodesTranslations = this.translationService.showsEpisodesTranslations.s();

    return Object.fromEntries(
      Object.entries(showsEpisodes).map(([episodeId, episode]) => [
        episodeId,
        translatedOrUndefined(episode, episodesTranslations[episodeId]),
      ]),
    );
  });

  removeShowsEpisodes(show: Show): void {
    let isChanged = false;
    const showsEpisodes = Object.fromEntries(
      Object.entries(this.showsEpisodes.s()).filter(([episodeId]) => {
        const filter = !episodeId.startsWith(`${show.ids.trakt}-`);
        if (!filter) isChanged = true;
        return filter;
      }),
    );
    if (!isChanged) return;

    this.showsEpisodes.s.set({ ...showsEpisodes });
    this.localStorageService.setObject(LocalStorage.SHOWS_EPISODES, showsEpisodes);
  }

  getEpisodeProgress(
    seasonProgress: SeasonProgress,
    episodeNumber: number,
  ): EpisodeProgress | undefined {
    return seasonProgress.episodes.find((e) => e.number === episodeNumber);
  }

  getEpisodeFromEpisodeFull(episode: EpisodeFull | null | undefined): Episode | null | undefined {
    if (!episode) return episode;
    return {
      ids: episode.ids,
      number: episode.number,
      season: episode.season,
      title: episode.title,
    };
  }

  fetchEpisodesFromShow(
    tmdbShow: TmdbShow | null | undefined,
    show: Show,
  ): Observable<Record<string, EpisodeFull[] | undefined>> {
    if (!tmdbShow) return of({});
    return forkJoin([
      ...tmdbShow.seasons.map((season) =>
        forkJoin([
          of(season.season_number),
          this.seasonService.getSeasonEpisodes$<EpisodeFull>(show, season.season_number),
        ]).pipe(catchError(() => of([season.season_number, [] as EpisodeFull[]]))),
      ),
    ]).pipe(map((seasons) => Object.fromEntries(seasons)));
  }

  fetchCalendar(days: number, date: string): Observable<EpisodeAiring[]> {
    return this.http
      .get<EpisodeAiring[]>(toUrl(API.calendar, [date, days]))
      .pipe(parseResponse(episodeAiringSchema.array()));
  }

  toNextEpisode(
    showProgress: ShowProgress | undefined,
    showEpisodes: Record<string, EpisodeFull | undefined> | undefined,
    show: Show,
  ): EpisodeFull | undefined {
    if (!showProgress?.next_episode) return;

    const nextEpisode = showProgress.next_episode;
    const episodeId = toEpisodeId(show.ids.trakt, nextEpisode.season, nextEpisode.number);

    const storedEpisode = showEpisodes?.[episodeId];
    if (storedEpisode) return storedEpisode;

    // The next episode's detail is no longer pre-fetched during sync (ADR 0003); when it is
    // missing, fall back to the overview's compact next_episode — which carries its air date
    // (first_aired is a base field of Trakt's progress response) — blended with its stored
    // translation, so the list row keeps its line without a per-show request.
    const translation = this.translationService.showsEpisodesTranslations.s()?.[episodeId];
    const fallback = translated(nextEpisode, translation);
    return fallback as EpisodeFull;
  }
}
