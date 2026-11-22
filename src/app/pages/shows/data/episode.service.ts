import { computed, inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, ReplaySubject, throwError } from 'rxjs';
import { fetchParsed } from '@helper/fetchParsed';
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
import { API } from '@shared/api';
import { toUrl } from '@helper/toUrl';
import { LocalStorageService } from '@services/local-storage.service';
import { SyncDataService } from '@services/sync-data.service';
import { pick } from '@helper/pick';
import { SeasonService } from './season.service';
import { TmdbShow } from '@type/Tmdb';
import { CustomEpisode } from '@type/Episode';

const episodeBatchWindowMs = 1000;

interface PendingEpisodeBatch<T> {
  entries: CustomEpisode[];
  result: ReplaySubject<T>;
  timer?: ReturnType<typeof setTimeout>;
}

class EpisodeBatchQueue<T> {
  private pending: PendingEpisodeBatch<T> | undefined;

  constructor(private readonly send: (entries: CustomEpisode[]) => Observable<T>) {}

  add(entry: CustomEpisode): Observable<T> {
    const batch = this.pending ?? this.startBatch();
    batch.entries.push(entry);
    clearTimeout(batch.timer);
    batch.timer = setTimeout(() => this.flush(), episodeBatchWindowMs);
    return batch.result.asObservable();
  }

  flush(): void {
    const batch = this.pending;
    if (!batch) return;
    this.pending = undefined;
    clearTimeout(batch.timer);
    this.send(batch.entries).subscribe({
      next: (response) => {
        batch.result.next(response);
        batch.result.complete();
      },
      error: (error: unknown) => batch.result.error(error),
    });
  }

  private startBatch(): PendingEpisodeBatch<T> {
    const batch: PendingEpisodeBatch<T> = { entries: [], result: new ReplaySubject<T>(1) };
    this.pending = batch;
    return batch;
  }
}

@Injectable({
  providedIn: 'root',
})
export class EpisodeService {
  http = inject(HttpClient);
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

  private readonly episodeBatch = new EpisodeBatchQueue<AddToHistoryResponse>((episodes) => {
    const watchedAt = episodes[episodes.length - 1].watchedAt?.toISOString();
    if (!watchedAt) return throwError(() => new Error('watchedAt is undefined'));
    return this.http.post<AddToHistoryResponse>(API.syncHistory, {
      episodes: episodes.map((episode: CustomEpisode) => ({ ids: episode.episode.ids })),
      watched_at: watchedAt,
    });
  });

  private readonly removeBatch = new EpisodeBatchQueue<RemoveFromHistoryResponse>((episodes) =>
    this.http.post<RemoveFromHistoryResponse>(API.syncHistoryRemove, {
      episodes: episodes.map((episode: CustomEpisode) => ({ ids: episode.episode.ids })),
    }),
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

    return this.episodeBatch.add({ episode, watchedAt });
  }

  removeEpisode(
    episode: Episode,
    options: { batch?: boolean } = {},
  ): Observable<RemoveFromHistoryResponse> {
    if (!options.batch) {
      return this.http.post<RemoveFromHistoryResponse>(API.syncHistoryRemove, {
        episodes: [{ ids: episode.ids }],
      });
    }

    return this.removeBatch.add({ episode });
  }

  fetchEpisode(
    show: Show,
    seasonNumber: number,
    episodeNumber: number,
    options?: { force?: boolean; persist?: boolean },
  ): Promise<EpisodeFull | null> {
    const cached = this.showsEpisodes.s()[toEpisodeId(show.ids.trakt, seasonNumber, episodeNumber)];
    const cachedTranslation = this.translationService.getEpisodeTranslation(
      show,
      seasonNumber,
      episodeNumber,
    );
    if (!options?.force && cached) {
      if (!Object.keys(cached).length) throw Error('Episode is empty (fetchEpisode)');
      return Promise.resolve(translatedOrUndefined(cached, cachedTranslation) ?? null);
    }

    return Promise.all([
      this.showsEpisodes.fetchIds([show.ids.trakt, seasonNumber, episodeNumber], {
        persist: options?.persist ?? !!cached,
      }),
      this.translationService.ensureEpisodeTranslation(show, seasonNumber, episodeNumber, {
        force: options?.force,
        persist: options?.persist ?? !!cachedTranslation,
      }),
    ]).then(
      ([episode, episodeTranslation]) => translatedOrUndefined(episode, episodeTranslation) ?? null,
    );
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

  getEpisodeFromEpisodeFull(episode: EpisodeFull | null): Episode | null {
    if (!episode) return episode;
    return {
      ids: episode.ids,
      number: episode.number,
      season: episode.season,
      title: episode.title,
    };
  }

  async fetchEpisodesFromShow(
    tmdbShow: TmdbShow | null,
    show: Show,
  ): Promise<Record<string, EpisodeFull[] | undefined>> {
    if (!tmdbShow) return {};
    const entries = await Promise.all(
      tmdbShow.seasons.map(async (season): Promise<[number, EpisodeFull[] | undefined]> => {
        try {
          const episodes = await this.seasonService.getSeasonEpisodes<EpisodeFull>(
            show,
            season.season_number,
          );
          return [season.season_number, episodes];
        } catch {
          return [season.season_number, []];
        }
      }),
    );
    return Object.fromEntries(entries);
  }

  fetchCalendar(days: number, date: string): Promise<EpisodeAiring[]> {
    return fetchParsed(
      this.http.get<EpisodeAiring[]>(toUrl(API.calendar, [date, days])),
      episodeAiringSchema.array(),
    );
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

    const translation = this.translationService.showsEpisodesTranslations.s()?.[episodeId];
    const fallback = translated(nextEpisode, translation);
    return fallback as EpisodeFull;
  }
}
