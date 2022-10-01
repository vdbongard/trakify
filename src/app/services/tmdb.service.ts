import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { combineLatest, concat, forkJoin, map, Observable, of, switchMap, take } from 'rxjs';

import { ShowService } from './trakt/show.service';
import { TranslationService } from './trakt/translation.service';
import { syncObjects } from '@helper/sync';
import { episodeId, seasonId } from '@helper/episodeId';
import { setLocalStorage } from '@helper/localStorage';

import { LocalStorage } from '@type/enum';

import type { TmdbEpisode, TmdbSeason, TmdbShow } from '@type/interfaces/Tmdb';
import { tmdbEpisodeSchema, tmdbSeasonSchema, tmdbShowSchema } from '@type/interfaces/Tmdb';
import type { Show } from '@type/interfaces/Trakt';
import type { FetchOptions } from '@type/interfaces/Sync';
import { api } from '../api';
import { translated } from '@helper/translation';
import { distinctUntilDeepChanged } from '@helper/distinctUntilDeepChanged.operator';

@Injectable({
  providedIn: 'root',
})
export class TmdbService {
  tmdbShows = syncObjects<TmdbShow>({
    http: this.http,
    url: api.tmdbShow,
    localStorageKey: LocalStorage.TMDB_SHOWS,
    schema: tmdbShowSchema,
  });
  tmdbSeasons = syncObjects<TmdbSeason>({
    http: this.http,
    url: api.tmdbSeason,
    localStorageKey: LocalStorage.TMDB_SEASONS,
    schema: tmdbSeasonSchema,
    idFormatter: seasonId as (...args: unknown[]) => string,
  });
  tmdbEpisodes = syncObjects<TmdbEpisode>({
    http: this.http,
    url: api.tmdbEpisode,
    localStorageKey: LocalStorage.TMDB_EPISODES,
    schema: tmdbEpisodeSchema,
    idFormatter: episodeId as (...args: unknown[]) => string,
  });

  constructor(
    private http: HttpClient,
    private showService: ShowService,
    private translationService: TranslationService
  ) {}

  getTmdbShows$(): Observable<{ [showId: number]: TmdbShow }> {
    return combineLatest([
      this.tmdbShows.$,
      this.translationService.showsTranslations.$,
      this.showService.getShows$(),
    ]).pipe(
      switchMap(([tmdbShows, showsTranslation, shows]) => {
        const tmdbShowsTranslated = Object.entries(tmdbShows).map(([tmdbIdString, tmdbShow]) => {
          if (!tmdbShow) return [tmdbIdString, tmdbShow];
          const traktId = shows.find((show) => show.ids.tmdb === parseInt(tmdbIdString))?.ids.trakt;

          return [
            tmdbIdString,
            translated(tmdbShow, traktId ? showsTranslation[traktId] : undefined),
          ];
        });

        return of(Object.fromEntries(tmdbShowsTranslated));
      })
    );
  }

  getTmdbShow$(show?: Show, options?: FetchOptions): Observable<TmdbShow> {
    if (!show) throw Error('Show is empty (getTmdbShow$)');
    return combineLatest([
      this.tmdbShows.$,
      this.translationService.getShowTranslation$(show),
    ]).pipe(
      switchMap(([tmdbShows, showTranslation]) => {
        const tmdbShow: TmdbShow | undefined = show.ids.tmdb ? tmdbShows[show.ids.tmdb] : undefined;

        if (show.ids.tmdb && (options?.fetchAlways || (options?.fetch && !tmdbShow))) {
          let tmdbShow$ = this.tmdbShows.fetch(show.ids.tmdb, !!tmdbShow || options.sync);
          const showTranslationFetch = this.translationService
            .getShowTranslation$(show, {
              sync: !!tmdbShows || options.sync,
            })
            .pipe(take(1));

          if (tmdbShow)
            tmdbShow$ = concat(of(tmdbShow), tmdbShow$).pipe(distinctUntilDeepChanged());

          return forkJoin([tmdbShow$, showTranslationFetch]).pipe(
            map(([tmdbShow, showTranslation]) => {
              if (!tmdbShow) throw Error('Show is empty (getTmdbShow$)');
              return translated(tmdbShow, showTranslation);
            })
          );
        }

        if (!tmdbShow || (tmdbShow && !Object.keys(tmdbShow).length))
          throw Error('Show is empty (getTmdbShow$)');

        return of(translated(tmdbShow, showTranslation));
      })
    );
  }

  getTmdbSeason$(
    show: Show,
    seasonNumber: number | undefined,
    sync?: boolean,
    fetch?: boolean
  ): Observable<TmdbSeason> {
    if (!show || !show.ids.tmdb || seasonNumber === undefined)
      throw Error('Argument is empty (getTmdbSeason$)');
    return this.tmdbSeasons.$.pipe(
      switchMap((tmdbSeasons) => {
        const tmdbSeason = tmdbSeasons[seasonId(show.ids.tmdb, seasonNumber)];
        if (fetch && !tmdbSeason) return this.tmdbSeasons.fetch(show.ids.tmdb, seasonNumber, sync);
        if (!tmdbSeason) throw Error('Season is empty (getTmdbSeason$)');
        return of(tmdbSeason);
      })
    );
  }

  getTmdbEpisode$(
    show: Show,
    seasonNumber: number | undefined,
    episodeNumber: number | undefined,
    options?: FetchOptions
  ): Observable<TmdbEpisode | undefined | null> {
    if (!show || seasonNumber === undefined || !episodeNumber)
      throw Error('Argument is empty (getTmdbEpisode$)');

    return this.tmdbEpisodes.$.pipe(
      switchMap((tmdbEpisodes) => {
        const tmdbEpisode = tmdbEpisodes[episodeId(show.ids.tmdb, seasonNumber, episodeNumber)];

        if (show.ids.tmdb && (options?.fetchAlways || (options?.fetch && !tmdbEpisode))) {
          let tmdbEpisode$ = this.tmdbEpisodes.fetch(
            show.ids.tmdb,
            seasonNumber,
            episodeNumber,
            options.sync || !!tmdbEpisode
          );
          if (tmdbEpisode)
            tmdbEpisode$ = concat(of(tmdbEpisode), tmdbEpisode$).pipe(distinctUntilDeepChanged());
          return tmdbEpisode$;
        }

        if (tmdbEpisode && !Object.keys(tmdbEpisode).length)
          throw Error('Episode is empty (getTmdbEpisode$)');

        return of(tmdbEpisode);
      })
    );
  }

  removeShow(show: Show): void {
    const tmdbShows = this.tmdbShows.$.value;
    delete tmdbShows[show.ids.trakt];
    this.tmdbShows.$.next(tmdbShows);
    setLocalStorage(LocalStorage.TMDB_SHOWS, tmdbShows);
  }
}
