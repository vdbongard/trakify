import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, of, retry } from 'rxjs';
import { getLocalStorage } from '../helper/local-storage';
import { LocalStorage } from '../../types/enum';
import { TmdbConfiguration, TmdbEpisode, TmdbShow } from '../../types/interfaces/Tmdb';
import { Config } from '../config';

@Injectable({
  providedIn: 'root',
})
export class TmdbService {
  tmdbConfig$ = new BehaviorSubject<TmdbConfiguration | undefined>(
    getLocalStorage<TmdbConfiguration>(LocalStorage.TMDB_CONFIG)
  );

  constructor(private http: HttpClient) {}

  fetchTmdbConfig(): Observable<TmdbConfiguration> {
    return this.http.get<TmdbConfiguration>(
      `${Config.tmdbBaseUrl}/configuration`,
      Config.tmdbOptions
    );
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
