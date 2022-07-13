import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, map, Observable, of } from 'rxjs';
import { LocalStorage } from '../../types/enum';
import { TmdbConfiguration, TmdbEpisode, TmdbShow } from '../../types/interfaces/Tmdb';
import { syncObjectsTmdb, syncObjectTmdb } from '../helper/sync';
import { episodeId } from '../helper/episodeId';

@Injectable({
  providedIn: 'root',
})
export class TmdbService {
  tmdbConfig$: BehaviorSubject<TmdbConfiguration | undefined>;
  syncTmdbConfig: () => Promise<void>;

  tmdbShows$: BehaviorSubject<{ [showId: number]: TmdbShow }>;
  syncTmdbShow: (showId: number) => Promise<void>;
  fetchTmdbShow: (showId: number) => Observable<TmdbShow>;

  tmdbEpisodes$: BehaviorSubject<{ [showId: string]: TmdbEpisode }>;
  syncTmdbEpisode: (
    showId: number,
    seasonNumber: number,
    episodeNumber: number,
    force?: boolean
  ) => Promise<void>;
  fetchTmdbEpisode: (
    showId: number,
    seasonNumber: number,
    episodeNumber: number
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

  getTmdbShow$(showId?: number): Observable<TmdbShow | undefined> {
    if (!showId) return of(undefined);

    return this.tmdbShows$.pipe(
      map((tmdbShows) => {
        return tmdbShows[showId];
      })
    );
  }

  getTmdbEpisode$(
    showId?: number,
    seasonNumber?: number,
    episodeNumber?: number
  ): Observable<TmdbEpisode | undefined> {
    if (!showId || !seasonNumber || !episodeNumber) return of(undefined);

    return this.tmdbEpisodes$.pipe(
      map((tmdbEpisodes) => {
        return tmdbEpisodes[episodeId(showId, seasonNumber, episodeNumber)];
      })
    );
  }
}
