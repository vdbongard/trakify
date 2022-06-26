import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, retry } from 'rxjs';
import { getLocalStorage, setLocalStorage } from '../helper/local-storage';
import { LocalStorage } from '../../types/enum';
import { TmdbEpisode, TmdbShow, TmdbConfiguration } from '../../types/interfaces/Tmdb';
import { ConfigService } from './config.service';

@Injectable({
  providedIn: 'root',
})
export class TmdbService {
  tmdbConfig = new BehaviorSubject<TmdbConfiguration | undefined>(this.getLocalTmdbConfig());
  tmdbShows = new BehaviorSubject<{ [key: number]: TmdbShow }>(this.getLocalShows() || {});

  constructor(private http: HttpClient, private configService: ConfigService) {}

  fetchTmdbConfig(): Observable<TmdbConfiguration> {
    return this.http.get<TmdbConfiguration>(
      `${this.configService.tmdbBaseUrl}/configuration`,
      this.configService.tmdbOptions
    );
  }

  fetchShow(id: number): Observable<TmdbShow> {
    return this.http
      .get<TmdbShow>(`${this.configService.tmdbBaseUrl}/tv/${id}`, this.configService.tmdbOptions)
      .pipe(retry({ count: 3, delay: 2000 }));
  }

  fetchEpisode(tvId: number, seasonNumber: number, episodeNumber: number): Observable<TmdbEpisode> {
    return this.http.get<TmdbEpisode>(
      `${this.configService.tmdbBaseUrl}/tv/${tvId}/season/${seasonNumber}/episode/${episodeNumber}`,
      this.configService.tmdbOptions
    );
  }

  getLocalTmdbConfig(): TmdbConfiguration | undefined {
    return getLocalStorage(LocalStorage.TMDB_CONFIG);
  }

  setLocalTmdbConfig(lastActivity: TmdbConfiguration): void {
    setLocalStorage(LocalStorage.TMDB_CONFIG, lastActivity);
  }

  getLocalShows(): { [key: number]: TmdbShow } {
    return getLocalStorage(LocalStorage.TMDB_SHOWS) as { [key: number]: TmdbShow };
  }

  setLocalShows(shows: { [key: number]: TmdbShow }): void {
    setLocalStorage(LocalStorage.TMDB_SHOWS, shows);
  }

  getShow(id: number): TmdbShow {
    return this.tmdbShows.value[id];
  }
}
