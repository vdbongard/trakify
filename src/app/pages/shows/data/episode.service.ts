import { inject, Injectable, Injector } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import {
  buffer,
  catchError,
  combineLatest,
  concat,
  debounceTime,
  distinctUntilChanged,
  forkJoin,
  map,
  merge,
  Observable,
  of,
  shareReplay,
  Subject,
  switchMap,
  take,
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
import type { FetchOptions } from '@type/Sync';
import { parseResponse } from '@operator/parseResponse';
import { API } from '@shared/api';
import { toUrl } from '@helper/toUrl';
import { LocalStorageService } from '@services/local-storage.service';
import { SyncDataService } from '@services/sync-data.service';
import { pick } from '@helper/pick';
import { isFuture } from 'date-fns';
import { sum } from '@helper/sum';
import { distinctUntilChangedDeep } from '@operator/distinctUntilChangedDeep';
import { SeasonService } from './season.service';
import { TmdbShow } from '@type/Tmdb';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
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
  injector = inject(Injector);

  showsEpisodes = this.syncDataService.syncObjects<EpisodeFull>({
    url: API.episode,
    localStorageKey: LocalStorage.SHOWS_EPISODES,
    schema: episodeFullSchema,
    idFormatter: toEpisodeId as (...args: unknown[]) => string,
    mapFunction: (episode: EpisodeFull) =>
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
    let isChanged = false;

    const showProgressEntries = Object.entries(this.showService.showsProgress.s()).map(
      ([showId, showProgress]) => {
        const nextEpisode = Object.entries(this.showsEpisodes.s()).find(([episodeId]) =>
          episodeId.startsWith(showId + '-'),
        );

        if (
          !showProgress ||
          !nextEpisode?.[1]?.first_aired ||
          isFuture(new Date(nextEpisode[1].first_aired))
        )
          return [showId, showProgress];

        // check if show progress is already existing
        const seasonProgress = showProgress.seasons.find(
          (season) => season.number === nextEpisode[1]!.season,
        );
        const episodeProgress = seasonProgress?.episodes.find(
          (episode) => episode.number === nextEpisode[1]!.number,
        );
        if (episodeProgress) return [showId, showProgress];

        // otherwise push new one and update aired values for season and show
        const episodeProgressNew: EpisodeProgress = {
          number: nextEpisode[1]!.number,
          completed: false,
          last_watched_at: null,
        };

        if (!seasonProgress) {
          const seasonProgressNew: SeasonProgress = {
            aired: 1,
            completed: 0,
            episodes: [episodeProgressNew],
            number: nextEpisode[1]?.season,
            title: null,
          };
          showProgress.seasons.push(seasonProgressNew);
        } else {
          seasonProgress.episodes.push(episodeProgressNew);
          seasonProgress.aired = seasonProgress.episodes.length;
        }

        showProgress.aired = sum(
          showProgress.seasons
            .filter((season) => season.number !== 0)
            .map((season) => season.aired),
        );

        isChanged = true;

        return [showId, showProgress];
      },
    );

    if (isChanged) {
      this.showService.updateShowsProgress(Object.fromEntries(showProgressEntries));
    }
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

  addEpisode(episode: Episode, watchedAt = new Date()): Observable<AddToHistoryResponse> {
    // wait a tick to make sure the episode is added to the subject before subscribing to it
    setTimeout(() => {
      this.episodeToAdd.next({ episode, watchedAt });
    });
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

  removeEpisode(episode: Episode): Observable<RemoveFromHistoryResponse> {
    // wait a tick to make sure the episode is added to the subject before subscribing to it
    setTimeout(() => {
      this.episodeToRemove.next({ episode });
    });
    return this.episodesToRemove$;
  }

  getEpisode$(
    show?: Show,
    seasonNumber?: number,
    episodeNumber?: number,
    options?: FetchOptions,
  ): Observable<EpisodeFull | undefined | null> {
    if (!show || seasonNumber === undefined || !episodeNumber)
      throw Error('Argument is empty (getEpisode$)');

    const episode$ = toObservable(this.showsEpisodes.s, { injector: this.injector }).pipe(
      take(1),
      switchMap((showsEpisodes) => {
        const episode = showsEpisodes[toEpisodeId(show.ids.trakt, seasonNumber, episodeNumber)];

        if (options?.fetchAlways || (options?.fetch && !episode)) {
          let showEpisode$ = merge(
            // history.state.showInfo ? of((history.state.showInfo as ShowInfo).nextEpisode) : EMPTY, // todo fix mark as seen
            combineLatest([
              this.showsEpisodes.fetch(
                show.ids.trakt,
                seasonNumber,
                episodeNumber,
                options.sync || !!episode,
              ),
              this.translationService.getEpisodeTranslation$(show, seasonNumber, episodeNumber, {
                fetch: true,
              }),
            ]).pipe(map(([show, translation]) => translated(show, translation))),
          ).pipe(distinctUntilChangedDeep());

          if (episode)
            showEpisode$ = concat(of(episode), showEpisode$).pipe(
              distinctUntilChanged(
                (a, b) =>
                  JSON.stringify({ ...a, updated_at: '' }) ===
                  JSON.stringify({ ...b, updated_at: '' }),
              ),
            );
          return showEpisode$;
        }

        if (episode && !Object.keys(episode).length) throw Error('Episode is empty (getEpisode$)');

        return of(episode);
      }),
    );

    const episodeTranslation$ = this.translationService.getEpisodeTranslation$(
      show,
      seasonNumber,
      episodeNumber,
      options,
    );

    return combineLatest([episode$, episodeTranslation$]).pipe(
      map(([episode, episodeTranslation]) => translatedOrUndefined(episode, episodeTranslation)),
      distinctUntilChanged(
        (a, b) =>
          JSON.stringify({ ...a, updated_at: '' }) === JSON.stringify({ ...b, updated_at: '' }),
      ),
    );
  }

  getEpisodeProgress$(
    show?: Show,
    seasonNumber?: number,
    episodeNumber?: number,
  ): Observable<EpisodeProgress | undefined> {
    if (!show || seasonNumber === undefined || !episodeNumber)
      throw Error('Argument is empty (getEpisodeProgress$)');

    return toObservable(this.showService.showsProgress.s, { injector: this.injector }).pipe(
      map(
        (showsProgress) =>
          showsProgress[show.ids.trakt]?.seasons.find((season) => season.number === seasonNumber)
            ?.episodes[episodeNumber - 1],
      ),
    );
  }

  getEpisodes$(): Observable<Record<string, EpisodeFull | undefined>> {
    return combineLatest([
      toObservable(this.showsEpisodes.s, { injector: this.injector }),
      toObservable(this.translationService.showsEpisodesTranslations.s, {
        injector: this.injector,
      }),
    ]).pipe(
      map(([showsEpisodes, episodesTranslations]) => {
        return Object.fromEntries(
          Object.entries(showsEpisodes).map(([episodeId, episode]) => [
            episodeId,
            translatedOrUndefined(episode, episodesTranslations[episodeId]),
          ]),
        );
      }),
    );
  }

  getEpisodes = toSignal(this.getEpisodes$(), { initialValue: {} });

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
    if (!showProgress?.next_episode || !showEpisodes) return;

    const nextEpisode = showProgress.next_episode;
    const episodeId = toEpisodeId(show.ids.trakt, nextEpisode.season, nextEpisode.number);
    const nextEpisodeFull = showEpisodes[episodeId];
    return nextEpisodeFull;
  }
}
