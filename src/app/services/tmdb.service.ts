import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, combineLatest, map, Observable, of, switchMap } from 'rxjs';
import { LocalStorage } from '../../types/enum';
import { TmdbConfiguration, TmdbEpisode, TmdbShow } from '../../types/interfaces/Tmdb';
import { syncObjectsTmdb, syncObjectTmdb } from '../helper/sync';
import { episodeId } from '../helper/episodeId';
import { ShowService } from './trakt/show.service';
import { Ids } from '../../types/interfaces/Trakt';
import { TranslationService } from './trakt/translation.service';

@Injectable({
  providedIn: 'root',
})
export class TmdbService {
  tmdbConfig$: BehaviorSubject<TmdbConfiguration | undefined>;
  syncTmdbConfig: () => Observable<void>;

  tmdbShows$: BehaviorSubject<{ [showId: number]: TmdbShow }>;
  syncTmdbShow: (showId: number, force?: boolean) => Observable<void>;
  private readonly fetchTmdbShow: (
    showId: number,
    sync?: boolean
  ) => Observable<TmdbShow | undefined>;

  tmdbEpisodes$: BehaviorSubject<{ [showId: string]: TmdbEpisode }>;
  syncTmdbEpisode: (
    showId: number,
    seasonNumber: number,
    episodeNumber: number,
    force?: boolean
  ) => Observable<void>;
  private readonly fetchTmdbEpisode: (
    showId: number,
    seasonNumber: number,
    episodeNumber: number,
    sync?: boolean
  ) => Observable<TmdbEpisode | undefined>;

  constructor(
    private http: HttpClient,
    private showService: ShowService,
    private translationService: TranslationService
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
        const tmdbShow: TmdbShow = tmdbShows[ids.tmdb];
        if (fetch && !tmdbShow)
          return this.fetchTmdbShow(ids.tmdb, sync).pipe(
            map((tmdbShow) => {
              if (tmdbShow) {
                tmdbShow.name = showTranslation?.title || tmdbShow.name;
                tmdbShow.overview = showTranslation?.overview || tmdbShow.overview;
              }
              return tmdbShow;
            })
          );
        if (tmdbShow) {
          tmdbShow.name = showTranslation?.title || tmdbShow.name;
          tmdbShow.overview = showTranslation?.overview || tmdbShow.overview;
        }
        return of(tmdbShow);
      })
    );
  }

  getTmdbEpisode$(
    showId: number | undefined,
    seasonNumber: number | undefined,
    episodeNumber: number | undefined,
    sync?: boolean,
    fetch?: boolean
  ): Observable<TmdbEpisode | undefined> {
    if (!showId || seasonNumber === undefined || !episodeNumber) return of(undefined);
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
