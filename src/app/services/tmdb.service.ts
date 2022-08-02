import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, combineLatest, forkJoin, map, Observable, of, switchMap } from 'rxjs';
import { LocalStorage } from '../../types/enum';
import { TmdbConfiguration, TmdbEpisode, TmdbSeason, TmdbShow } from '../../types/interfaces/Tmdb';
import { syncObjectsTmdb, syncObjectTmdb } from '../helper/sync';
import { episodeId, seasonId } from '../helper/episodeId';
import { ShowService } from './trakt/show.service';
import { Ids } from '../../types/interfaces/Trakt';
import { TranslationService } from './trakt/translation.service';
import { SyncOptions } from '../../types/interfaces/Sync';
import { ConfigService } from './config.service';

@Injectable({
  providedIn: 'root',
})
export class TmdbService {
  tmdbConfig$: BehaviorSubject<TmdbConfiguration | undefined>;
  syncTmdbConfig: (options?: SyncOptions) => Observable<void>;

  tmdbShows$: BehaviorSubject<{ [showId: number]: TmdbShow }>;
  syncTmdbShow: (showId: number, options?: SyncOptions) => Observable<void>;
  private readonly fetchTmdbShow: (showId: number, sync?: boolean) => Observable<TmdbShow>;

  tmdbSeasons$: BehaviorSubject<{ [seasonId: string]: TmdbSeason }>;
  syncTmdbSeason: (showId: number, seasonNumber: number, options?: SyncOptions) => Observable<void>;
  private readonly fetchTmdbSeason: (
    showId: number,
    seasonNumber: number,
    sync?: boolean
  ) => Observable<TmdbSeason>;

  tmdbEpisodes$: BehaviorSubject<{ [showId: string]: TmdbEpisode }>;
  syncTmdbEpisode: (
    showId: number,
    seasonNumber: number,
    episodeNumber: number,
    options?: SyncOptions
  ) => Observable<void>;
  private readonly fetchTmdbEpisode: (
    showId: number,
    seasonNumber: number,
    episodeNumber: number,
    sync?: boolean
  ) => Observable<TmdbEpisode>;

  constructor(
    private http: HttpClient,
    private showService: ShowService,
    private translationService: TranslationService,
    private configService: ConfigService
  ) {
    const [tmdbConfig$, syncTmdbConfig] = syncObjectTmdb<TmdbConfiguration>({
      http: this.http,
      url: '/configuration',
      localStorageKey: LocalStorage.TMDB_CONFIG,
    });
    this.tmdbConfig$ = tmdbConfig$;
    this.syncTmdbConfig = syncTmdbConfig;

    const [tmdbShows$, syncTmdbShow, fetchTmdbShow] = syncObjectsTmdb<TmdbShow>({
      http: this.http,
      url: '/tv/%',
      localStorageKey: LocalStorage.TMDB_SHOWS,
    });
    this.tmdbShows$ = tmdbShows$;
    this.syncTmdbShow = syncTmdbShow;
    this.fetchTmdbShow = fetchTmdbShow;

    const [tmdbSeasons$, syncTmdbSeason, fetchTmdbSeason] = syncObjectsTmdb<TmdbSeason>({
      http: this.http,
      url: '/tv/%/season/%',
      localStorageKey: LocalStorage.TMDB_SEASONS,
      idFormatter: seasonId as (...args: unknown[]) => string,
    });
    this.tmdbSeasons$ = tmdbSeasons$;
    this.syncTmdbSeason = syncTmdbSeason;
    this.fetchTmdbSeason = fetchTmdbSeason;

    const [tmdbEpisodes$, syncTmdbEpisode, fetchTmdbEpisode] = syncObjectsTmdb<TmdbEpisode>({
      http: this.http,
      url: '/tv/%/season/%/episode/%',
      localStorageKey: LocalStorage.TMDB_EPISODES,
      idFormatter: episodeId as (...args: unknown[]) => string,
    });
    this.tmdbEpisodes$ = tmdbEpisodes$;
    this.syncTmdbEpisode = syncTmdbEpisode;
    this.fetchTmdbEpisode = fetchTmdbEpisode;
  }

  getTmdbShow$(ids: Ids, sync?: boolean, fetch?: boolean): Observable<TmdbShow | undefined> {
    return combineLatest([
      this.tmdbShows$,
      this.translationService.getShowTranslation$(ids.trakt),
    ]).pipe(
      switchMap(([tmdbShows, showTranslation]) => {
        const tmdbShow: TmdbShow | undefined = tmdbShows[ids.tmdb];

        if (fetch && !tmdbShow) {
          const tmdbShow = this.fetchTmdbShow(ids.tmdb, sync);
          const language = this.configService.config$.value.language.substring(0, 2);
          const showTranslationFetch = this.translationService.fetchShowTranslation(
            ids.trakt,
            language
          );

          return forkJoin([tmdbShow, showTranslationFetch]).pipe(
            map(([tmdbShow, showTranslation]) => {
              const tmdbShowClone = { ...tmdbShow };
              tmdbShowClone.name = showTranslation?.title ?? tmdbShow.name;
              tmdbShowClone.overview = showTranslation?.overview ?? tmdbShow.overview;
              return tmdbShowClone;
            })
          );
        }
        if (!tmdbShow) return of(undefined);

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
  ): Observable<TmdbSeason | undefined> {
    if (!ids || seasonNumber === undefined) throw Error('Argument is empty');
    return this.tmdbSeasons$.pipe(
      switchMap((tmdbSeasons) => {
        const tmdbSeason = tmdbSeasons[seasonId(ids.tmdb, seasonNumber)];
        if (fetch && !tmdbSeason) return this.fetchTmdbSeason(ids.tmdb, seasonNumber, sync);
        return of(tmdbSeason);
      })
    );
  }

  getTmdbEpisode$(
    showId: number | undefined,
    seasonNumber: number | undefined,
    episodeNumber: number | undefined,
    sync?: boolean,
    fetch?: boolean
  ): Observable<TmdbEpisode | undefined | null> {
    if (!showId || seasonNumber === undefined || !episodeNumber) throw Error('Argument is empty');
    return this.tmdbEpisodes$.pipe(
      switchMap((tmdbEpisodes) => {
        const tmdbEpisode = tmdbEpisodes[episodeId(showId, seasonNumber, episodeNumber)];
        if (fetch && !tmdbEpisode)
          return this.fetchTmdbEpisode(showId, seasonNumber, episodeNumber, sync);
        return of(tmdbEpisode);
      })
    );
  }
}
