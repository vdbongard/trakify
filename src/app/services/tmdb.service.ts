import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, of, retry } from 'rxjs';
import { LocalStorage } from '../../types/enum';
import { TmdbConfiguration, TmdbEpisode, TmdbShow } from '../../types/interfaces/Tmdb';
import { Config } from '../config';
import { syncCustomObjectTmdb } from '../helper/sync';

@Injectable({
  providedIn: 'root',
})
export class TmdbService {
  tmdbConfig$: BehaviorSubject<TmdbConfiguration | undefined>;
  syncTmdbConfig: () => Promise<void>;

  constructor(private http: HttpClient) {
    const [tmdbConfig$, syncTmdbConfig] = syncCustomObjectTmdb<TmdbConfiguration>({
      providers: [this.http],
      url: '/configuration',
      localStorageKey: LocalStorage.TMDB_CONFIG,
    });
    this.tmdbConfig$ = tmdbConfig$;
    this.syncTmdbConfig = syncTmdbConfig;
  }

  fetchShow(id: number | undefined): Observable<TmdbShow | undefined> {
    if (!id) return of(undefined);
    return this.http
      .get<TmdbShow>(`${Config.tmdbBaseUrl}/tv/${id}`, Config.tmdbOptions)
      .pipe(retry({ count: 3, delay: 2000 }));
  }

  fetchEpisode(tvId: number, seasonNumber: number, episodeNumber: number): Observable<TmdbEpisode> {
    return this.http.get<TmdbEpisode>(
      `${Config.tmdbBaseUrl}/tv/${tvId}/season/${seasonNumber}/episode/${episodeNumber}`,
      Config.tmdbOptions
    );
  }
}
