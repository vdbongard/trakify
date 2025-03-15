import { computed, inject, Injectable, Injector, Signal } from '@angular/core';
import {
  catchError,
  combineLatest,
  concat,
  EMPTY,
  forkJoin,
  lastValueFrom,
  map,
  merge,
  Observable,
  of,
  switchMap,
  take,
  throwError,
} from 'rxjs';
import { ShowService } from './show.service';
import { TranslationService } from './translation.service';
import { toEpisodeId, toSeasonId } from '@helper/toEpisodeId';
import { LocalStorage } from '@type/Enum';
import { pick } from '@helper/pick';
import { translated } from '@helper/translation';
import { distinctUntilChangedDeep } from '@operator/distinctUntilChangedDeep';
import { LocalStorageService } from '@services/local-storage.service';
import { SyncDataService } from '@services/sync-data.service';
import { API } from '@shared/api';
import { ShowInfo } from '@type/Show';
import type { FetchOptions } from '@type/Sync';
import {
  TmdbEpisode,
  tmdbEpisodeSchema,
  TmdbSeason,
  tmdbSeasonSchema,
  TmdbShow,
  tmdbShowSchema,
  TmdbShowWithId,
} from '@type/Tmdb';
import type { Show } from '@type/Trakt';
import { toObservable } from '@angular/core/rxjs-interop';
import { injectQueries, QueryObserverResult } from '@tanstack/angular-query-experimental';

@Injectable({
  providedIn: 'root',
})
export class TmdbService {
  showService = inject(ShowService);
  translationService = inject(TranslationService);
  localStorageService = inject(LocalStorageService);
  syncDataService = inject(SyncDataService);
  injector = inject(Injector);

  static tmdbShowExtendedString = '?append_to_response=videos,external_ids,aggregate_credits';

  tmdbShows = this.syncDataService.syncObjects<TmdbShow>({
    url: API.tmdbShow,
    schema: tmdbShowSchema,
    mapFunction: (tmdbShow: TmdbShow) => {
      const tmdbShowData = pick(
        tmdbShow,
        'aggregate_credits',
        'created_by',
        'episode_run_time',
        'external_ids',
        'first_air_date',
        'genres',
        'homepage',
        'id',
        'name',
        'networks',
        'number_of_episodes',
        'overview',
        'poster_path',
        'seasons',
        'status',
        'type',
        'videos',
        'vote_average',
        'vote_count',
      );
      if (tmdbShowData.aggregate_credits) {
        tmdbShowData.aggregate_credits.cast = tmdbShowData.aggregate_credits.cast.slice(0, 20);
        delete tmdbShowData.aggregate_credits?.crew;
      }
      if (tmdbShowData.videos) {
        tmdbShowData.videos.results = tmdbShowData.videos.results.filter((video) =>
          ['Trailer', 'Teaser'].includes(video.type),
        );
      }
      return tmdbShowData;
    },
  });

  tmdbSeasons = this.syncDataService.syncObjects<TmdbSeason>({
    url: API.tmdbSeason,
    localStorageKey: LocalStorage.TMDB_SEASONS,
    schema: tmdbSeasonSchema,
    idFormatter: toSeasonId as (...args: unknown[]) => string,
    mapFunction: (tmdbSeason: TmdbSeason) => {
      const tmdbSeasonData = pick<TmdbSeason>(tmdbSeason, 'episodes', 'id', 'name', 'poster_path');
      tmdbSeasonData.episodes = tmdbSeasonData.episodes.map((episode) =>
        pick(episode, 'air_date', 'episode_number', 'id', 'name', 'season_number'),
      );
      return tmdbSeasonData;
    },
  });

  tmdbEpisodes = this.syncDataService.syncObjects<TmdbEpisode>({
    url: API.tmdbEpisode,
    localStorageKey: LocalStorage.TMDB_EPISODES,
    schema: tmdbEpisodeSchema,
    idFormatter: toEpisodeId as (...args: unknown[]) => string,
    mapFunction: (tmdbEpisode: TmdbEpisode) =>
      pick<TmdbEpisode>(
        tmdbEpisode,
        'air_date',
        'episode_number',
        'id',
        'name',
        'season_number',
        'still_path',
      ),
  });

  getTmdbShow$(show: Show, extended?: boolean, options?: FetchOptions): Observable<TmdbShow> {
    return toObservable(this.tmdbShows.s, { injector: this.injector }).pipe(
      switchMap((tmdbShows) => {
        const tmdbShow: TmdbShow | undefined = show.ids.tmdb ? tmdbShows[show.ids.tmdb] : undefined;

        const showTranslation$ = show
          ? this.translationService.getShowTranslation$(show, {
              ...options,
              sync: !!tmdbShow || options?.sync,
            })
          : of(undefined);

        if (show.ids.tmdb && (options?.fetchAlways || (options?.fetch && !tmdbShow))) {
          const tmdbShowUntranslated$ = merge(
            tmdbShow ? of(tmdbShow) : EMPTY,
            this.tmdbShows.fetch(
              show.ids.tmdb,
              extended ? TmdbService.tmdbShowExtendedString : '',
              !!tmdbShow || options.sync,
            ),
          ).pipe(distinctUntilChangedDeep());

          return merge(
            history.state.showInfo && !tmdbShow
              ? of((history.state.showInfo as ShowInfo).tmdbShow!)
              : EMPTY,
            combineLatest([tmdbShowUntranslated$, showTranslation$]).pipe(
              map(([tmdbShowUntranslated, showTranslation]) =>
                translated(tmdbShowUntranslated, showTranslation),
              ),
            ),
          ).pipe(distinctUntilChangedDeep());
        }

        if (!tmdbShow || (tmdbShow && !Object.keys(tmdbShow).length))
          return throwError(() => new Error('Tmdb show is empty (getTmdbShow$)'));

        return combineLatest([of(tmdbShow), showTranslation$]).pipe(
          map(([tmdbShow, showTranslation]) => translated(tmdbShow, showTranslation)),
        );
      }),
      distinctUntilChangedDeep(),
    );
  }

  getTmdbSeason$(
    show: Show,
    seasonNumber: number | undefined,
    sync?: boolean,
    fetch?: boolean,
  ): Observable<TmdbSeason> {
    if (!show?.ids.tmdb || seasonNumber === undefined)
      throw Error('Argument is empty (getTmdbSeason$)');
    return toObservable(this.tmdbSeasons.s, { injector: this.injector }).pipe(
      switchMap((tmdbSeasons) => {
        const tmdbSeason = tmdbSeasons[toSeasonId(show.ids.tmdb, seasonNumber)];
        if (fetch && !tmdbSeason)
          return merge(
            history.state.showInfo ? of((history.state.showInfo as ShowInfo).tmdbSeason!) : EMPTY,
            this.tmdbSeasons.fetch(show.ids.tmdb, seasonNumber, sync),
          ).pipe(distinctUntilChangedDeep());
        if (!tmdbSeason) throw Error('Season is empty (getTmdbSeason$)');
        return of(tmdbSeason);
      }),
    );
  }

  getTmdbEpisode$(
    show: Show,
    seasonNumber: number | undefined,
    episodeNumber: number | undefined,
    options?: FetchOptions,
  ): Observable<TmdbEpisode | undefined | null> {
    if (!show || seasonNumber === undefined || !episodeNumber)
      throw Error('Argument is empty (getTmdbEpisode$)');

    return toObservable(this.tmdbEpisodes.s, { injector: this.injector }).pipe(
      switchMap((tmdbEpisodes) => {
        const tmdbEpisode = tmdbEpisodes[toEpisodeId(show.ids.tmdb, seasonNumber, episodeNumber)];

        if (show.ids.tmdb && (options?.fetchAlways || (options?.fetch && !tmdbEpisode))) {
          let tmdbEpisode$ = merge(
            history.state.showInfo
              ? of((history.state.showInfo as ShowInfo).tmdbNextEpisode)
              : EMPTY,
            combineLatest([
              this.tmdbEpisodes.fetch(
                show.ids.tmdb,
                seasonNumber,
                episodeNumber,
                options.sync || !!tmdbEpisode,
              ),
              this.translationService.getEpisodeTranslation$(show, seasonNumber, episodeNumber, {
                sync: options.sync || !!tmdbEpisode,
              }),
            ]).pipe(
              map(([tmdbEpisode, episodeTranslation]) =>
                translated(tmdbEpisode, episodeTranslation),
              ),
            ),
          ).pipe(distinctUntilChangedDeep());

          if (tmdbEpisode)
            tmdbEpisode$ = concat(of(tmdbEpisode), tmdbEpisode$).pipe(distinctUntilChangedDeep());

          return tmdbEpisode$;
        }

        if (tmdbEpisode && !Object.keys(tmdbEpisode).length)
          throw Error('Episode is empty (getTmdbEpisode$)');

        return of(tmdbEpisode);
      }),
    );
  }

  removeShow(showIdTmdb: number | null): void {
    if (!showIdTmdb) return;

    const tmdbShows = this.tmdbShows.s();
    if (!tmdbShows[showIdTmdb]) return;

    console.debug('removing tmdb show:', showIdTmdb, tmdbShows[showIdTmdb]);
    delete tmdbShows[showIdTmdb];
    this.tmdbShows.s.set({ ...tmdbShows });
    this.localStorageService.setObject(LocalStorage.TMDB_SHOWS, tmdbShows);
  }

  getTmdbSeason(show: Show, seasonNumber: number): TmdbSeason {
    const tmdbSeasons = this.tmdbSeasons.s();
    if (!tmdbSeasons) throw Error('Tmdb seasons empty');

    const tmdbSeason = tmdbSeasons[toSeasonId(show.ids.tmdb, seasonNumber)];
    if (!tmdbSeason) throw Error('Tmdb season empty');

    return tmdbSeason;
  }

  getTmdbEpisode(show: Show, seasonNumber: number, episodeNumber: number): TmdbEpisode | undefined {
    const tmdbSeason = this.getTmdbSeason(show, seasonNumber);
    return tmdbSeason.episodes.find((e) => e.episode_number === episodeNumber);
  }

  fetchTmdbShow(show: Show): Promise<TmdbShowWithId> {
    const tmdbShow$ = this.getTmdbShow$(show, false, { fetch: true }).pipe(
      catchError(() => of(null)),
      take(1),
    );
    const traktId = show.ids.trakt;
    return lastValueFrom(forkJoin([tmdbShow$, of({ traktId })]));
  }

  getTmdbShowQueries(shows: Signal<Show[]>): Signal<QueryObserverResult<TmdbShowWithId>[]> {
    return injectQueries({
      queries: computed(() =>
        shows().map((show) => ({
          queryKey: ['tmdbShow', show.ids.trakt],
          queryFn: (): Promise<TmdbShowWithId> => this.fetchTmdbShow(show),
        })),
      ),
    });
  }
}
