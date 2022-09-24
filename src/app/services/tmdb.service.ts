import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import {
  combineLatest,
  concat,
  distinctUntilChanged,
  forkJoin,
  map,
  Observable,
  of,
  switchMap,
} from 'rxjs';

import { ShowService } from './trakt/show.service';
import { TranslationService } from './trakt/translation.service';
import { ConfigService } from './config.service';
import { syncObjects } from '@helper/sync';
import { episodeId, seasonId } from '@helper/episodeId';
import { setLocalStorage } from '@helper/localStorage';

import { LocalStorage } from '@type/enum';

import type { TmdbEpisode, TmdbSeasonWithEpisodes, TmdbShow } from '@type/interfaces/Tmdb';
import {
  tmdbEpisodeSchema,
  tmdbSeasonWithEpisodesSchema,
  tmdbShowSchema,
} from '@type/interfaces/Tmdb';
import type { Show } from '@type/interfaces/Trakt';
import type { FetchOptions } from '@type/interfaces/Sync';
import { api } from '../api';
import { translated } from '@helper/translation';

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
  tmdbSeasons = syncObjects<TmdbSeasonWithEpisodes>({
    http: this.http,
    url: api.tmdbSeason,
    localStorageKey: LocalStorage.TMDB_SEASONS,
    schema: tmdbSeasonWithEpisodesSchema,
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
    private translationService: TranslationService,
    private configService: ConfigService
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

  getTmdbShow$(show?: Show, options?: FetchOptions): Observable<TmdbShow | undefined> {
    if (!show) return of(undefined);
    return combineLatest([
      this.tmdbShows.$,
      this.translationService.getShowTranslation$(show.ids.trakt),
    ]).pipe(
      switchMap(([tmdbShows, showTranslation]) => {
        const tmdbShow: TmdbShow | undefined = show.ids.tmdb ? tmdbShows[show.ids.tmdb] : undefined;

        if (show.ids.tmdb && (options?.fetchAlways || (options?.fetch && !tmdbShow))) {
          let tmdbShowObservable = this.tmdbShows.fetch(
            show.ids.tmdb,
            tmdbShow ? true : options.sync
          );
          const language = this.configService.config.$.value.language.substring(0, 2);
          const showTranslationFetch = this.translationService.showsTranslations.fetch(
            show.ids.trakt,
            language,
            !!tmdbShows
          );

          if (tmdbShow)
            tmdbShowObservable = concat(of(tmdbShow), tmdbShowObservable).pipe(
              distinctUntilChanged((a, b) => JSON.stringify(a) === JSON.stringify(b))
            );

          return forkJoin([tmdbShowObservable, showTranslationFetch]).pipe(
            map(([tmdbShow, showTranslation]) => {
              if (!tmdbShow) return undefined;
              return translated(tmdbShow, showTranslation);
            })
          );
        }
        if (!tmdbShow) return of(undefined);
        if (tmdbShow && !Object.keys(tmdbShow).length) throw Error('Tmdb show empty');

        return of(translated(tmdbShow, showTranslation));
      })
    );
  }

  getTmdbSeason$(
    show: Show,
    seasonNumber: number | undefined,
    sync?: boolean,
    fetch?: boolean
  ): Observable<TmdbSeasonWithEpisodes | undefined> {
    if (!show || seasonNumber === undefined) throw Error('Argument is empty');
    return this.tmdbSeasons.$.pipe(
      switchMap((tmdbSeasons) => {
        const tmdbSeason = tmdbSeasons[seasonId(show.ids.tmdb, seasonNumber)];
        if (show.ids.tmdb && fetch && !tmdbSeason)
          return this.tmdbSeasons.fetch(show.ids.tmdb, seasonNumber, sync);
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
    if (!show || seasonNumber === undefined || !episodeNumber) throw Error('Argument is empty');
    return this.tmdbEpisodes.$.pipe(
      switchMap((tmdbEpisodes) => {
        const tmdbEpisode = tmdbEpisodes[episodeId(show.ids.tmdb, seasonNumber, episodeNumber)];
        if (show.ids.tmdb && (options?.fetchAlways || (options?.fetch && !tmdbEpisode))) {
          let tmdbEpisodeObservable = this.tmdbEpisodes.fetch(
            show.ids.tmdb,
            seasonNumber,
            episodeNumber,
            options.sync || !!tmdbEpisode
          );
          if (tmdbEpisode)
            tmdbEpisodeObservable = concat(of(tmdbEpisode), tmdbEpisodeObservable).pipe(
              distinctUntilChanged((a, b) => JSON.stringify(a) === JSON.stringify(b))
            );
          return tmdbEpisodeObservable;
        }
        if (tmdbEpisode && !Object.keys(tmdbEpisode).length) throw Error('Tmdb episode empty');
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
