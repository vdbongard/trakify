import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { combineLatest, concat, forkJoin, map, Observable, of, switchMap } from 'rxjs';

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
import type { Ids, Show } from '@type/interfaces/Trakt';
import type { FetchOptions } from '@type/interfaces/Sync';
import { api } from '../api';

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
          const tmdbShowClone = { ...tmdbShow };
          const traktId = shows.find((show) => show.ids.tmdb === parseInt(tmdbIdString))?.ids.trakt;
          if (traktId) {
            tmdbShowClone.name = showsTranslation[traktId]?.title ?? tmdbShow.name;
            tmdbShowClone.overview = showsTranslation[traktId]?.overview ?? tmdbShow.overview;
          }
          return [tmdbIdString, tmdbShowClone];
        });

        return of(Object.fromEntries(tmdbShowsTranslated));
      })
    );
  }

  getTmdbShow$(ids?: Ids, options?: FetchOptions): Observable<TmdbShow | undefined> {
    if (!ids) return of(undefined);
    return combineLatest([
      this.tmdbShows.$,
      this.translationService.getShowTranslation$(ids.trakt),
    ]).pipe(
      switchMap(([tmdbShows, showTranslation]) => {
        const tmdbShow: TmdbShow | undefined = ids.tmdb ? tmdbShows[ids.tmdb] : undefined;

        if (ids.tmdb && (options?.fetchAlways || (options?.fetch && !tmdbShow))) {
          let tmdbShowObservable = this.tmdbShows.fetch(ids.tmdb, tmdbShow ? true : options.sync);
          const language = this.configService.config.$.value.language.substring(0, 2);
          const showTranslationFetch = this.translationService.showsTranslations.fetch(
            ids.trakt,
            language,
            !!tmdbShows
          );

          if (tmdbShow) tmdbShowObservable = concat(of(tmdbShow), tmdbShowObservable);

          return forkJoin([tmdbShowObservable, showTranslationFetch]).pipe(
            map(([tmdbShow, showTranslation]) => {
              if (!tmdbShow) return undefined;
              const tmdbShowClone = { ...tmdbShow };
              tmdbShowClone.name = showTranslation?.title ?? tmdbShow.name;
              tmdbShowClone.overview = showTranslation?.overview ?? tmdbShow.overview;
              return tmdbShowClone;
            })
          );
        }
        if (!tmdbShow) return of(undefined);
        if (tmdbShow && !Object.keys(tmdbShow).length) throw Error('Tmdb show empty');

        const tmdbShowClone = { ...tmdbShow };
        tmdbShowClone.name = showTranslation?.title ?? tmdbShow.name;
        tmdbShowClone.overview = showTranslation?.overview ?? tmdbShow.overview;

        return of(tmdbShowClone);
      })
    );
  }

  getTmdbSeason$(
    ids: Ids,
    seasonNumber: number | undefined,
    sync?: boolean,
    fetch?: boolean
  ): Observable<TmdbSeasonWithEpisodes | undefined> {
    if (!ids || seasonNumber === undefined) throw Error('Argument is empty');
    return this.tmdbSeasons.$.pipe(
      switchMap((tmdbSeasons) => {
        const tmdbSeason = tmdbSeasons[seasonId(ids.tmdb, seasonNumber)];
        if (ids.tmdb && fetch && !tmdbSeason)
          return this.tmdbSeasons.fetch(ids.tmdb, seasonNumber, sync);
        return of(tmdbSeason);
      })
    );
  }

  getTmdbEpisode$(
    showId: number | undefined | null,
    seasonNumber: number | undefined,
    episodeNumber: number | undefined,
    options?: FetchOptions
  ): Observable<TmdbEpisode | undefined | null> {
    if (!showId || seasonNumber === undefined || !episodeNumber) throw Error('Argument is empty');
    return this.tmdbEpisodes.$.pipe(
      switchMap((tmdbEpisodes) => {
        const tmdbEpisode = tmdbEpisodes[episodeId(showId, seasonNumber, episodeNumber)];
        if (showId && (options?.fetchAlways || (options?.fetch && !tmdbEpisode))) {
          let tmdbEpisodeObservable = this.tmdbEpisodes.fetch(
            showId,
            seasonNumber,
            episodeNumber,
            options.sync || !!tmdbEpisode
          );
          if (tmdbEpisode) tmdbEpisodeObservable = concat(of(tmdbEpisode), tmdbEpisodeObservable);
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
