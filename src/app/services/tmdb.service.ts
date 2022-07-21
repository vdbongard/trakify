import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, of, switchMap } from 'rxjs';
import { LocalStorage } from '../../types/enum';
import { TmdbConfiguration, TmdbEpisode, TmdbShow } from '../../types/interfaces/Tmdb';
import { syncObjectsTmdb, syncObjectTmdb } from '../helper/sync';
import { episodeId } from '../helper/episodeId';

@Injectable({
  providedIn: 'root',
})
export class TmdbService {
  tmdbConfig$: BehaviorSubject<TmdbConfiguration | undefined>;
  syncTmdbConfig: () => Observable<void>;

  tmdbShows$: BehaviorSubject<{ [showId: number]: TmdbShow }>;
  syncTmdbShow: (showId: number, force?: boolean) => Observable<void>;
  private readonly fetchTmdbShow: (showId: number, sync?: boolean) => Observable<TmdbShow>;

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
  ) => Observable<TmdbEpisode>;

  constructor(private http: HttpClient) {
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

  getTmdbShow$(showId: number, sync?: boolean): Observable<TmdbShow> {
    return this.tmdbShows$.pipe(
      switchMap((tmdbShows) => {
        const tmdbShow = tmdbShows[showId];
        if (!tmdbShow) return this.fetchTmdbShow(showId, sync);
        return of(tmdbShow);
      })
    );
  }

  getTmdbEpisode$(
    showId: number | undefined,
    seasonNumber: number | undefined,
    episodeNumber: number | undefined,
    sync?: boolean
  ): Observable<TmdbEpisode | undefined> {
    if (!showId || seasonNumber === undefined || !episodeNumber) return of(undefined);
    return this.tmdbEpisodes$.pipe(
      switchMap((tmdbEpisodes) => {
        const tmdbEpisode = tmdbEpisodes[episodeId(showId, seasonNumber, episodeNumber)];
        if (!tmdbEpisode) return this.fetchTmdbEpisode(showId, seasonNumber, episodeNumber, sync);
        return of(tmdbEpisode);
      })
    );
  }
}
