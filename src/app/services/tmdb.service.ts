import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable } from 'rxjs';
import { LocalStorage } from '../../types/enum';
import { TmdbConfiguration, TmdbEpisode, TmdbShow } from '../../types/interfaces/Tmdb';
import { Config } from '../config';
import { syncObjectsTmdb, syncObjectTmdb } from '../helper/sync';

@Injectable({
  providedIn: 'root',
})
export class TmdbService {
  tmdbConfig$: BehaviorSubject<TmdbConfiguration | undefined>;
  syncTmdbConfig: () => Promise<void>;

  tmdbShows$: BehaviorSubject<{ [showId: number]: TmdbShow }>;
  syncTmdbShow: (showId: number) => Promise<void>;
  fetchTmdbShow: (showId: number) => Observable<TmdbShow>;

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
  }

  fetchEpisode(
    showId: number,
    seasonNumber: number,
    episodeNumber: number
  ): Observable<TmdbEpisode> {
    return this.http.get<TmdbEpisode>(
      `${Config.tmdbBaseUrl}/tv/${showId}/season/${seasonNumber}/episode/${episodeNumber}`
    );
  }
}
