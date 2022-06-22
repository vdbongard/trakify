import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, retry } from 'rxjs';
import { getLocalStorage, setLocalStorage } from '../helper/local-storage';
import { LocalStorage } from '../../types/enum';
import { Episode, TmdbShow, TmdbConfiguration } from '../../types/interfaces/Tmdb';
import { ConfigService } from './config.service';

@Injectable({
  providedIn: 'root',
})
export class TmdbService {
  tmdbConfig = new BehaviorSubject<TmdbConfiguration | undefined>(this.getLocalTmdbConfig());
  shows = new BehaviorSubject<{ [key: number]: TmdbShow }>(this.getLocalShows() || {});

  constructor(private http: HttpClient, private configService: ConfigService) {
    if (!this.tmdbConfig.value) {
      this.syncTmdbConfig();
    }
  }

  getTmdbConfig(): Observable<TmdbConfiguration> {
    return this.http.get<TmdbConfiguration>(
      `${this.configService.tmdbBaseUrl}/configuration`,
      this.configService.tmdbOptions
    );
  }

  syncTmdbConfig(): void {
    this.getTmdbConfig().subscribe((config: TmdbConfiguration) => {
      this.setLocalTmdbConfig(config);
      this.tmdbConfig.next(config);
    });
  }

  getLocalTmdbConfig(): TmdbConfiguration | undefined {
    return getLocalStorage(LocalStorage.TMDB_CONFIG);
  }

  setLocalTmdbConfig(lastActivity: TmdbConfiguration): void {
    setLocalStorage(LocalStorage.TMDB_CONFIG, lastActivity);
  }

  getShow(id: number): Observable<TmdbShow> {
    return this.http
      .get<TmdbShow>(`${this.configService.tmdbBaseUrl}/tv/${id}`, this.configService.tmdbOptions)
      .pipe(retry({ count: 3, delay: 2000 }));
  }

  getLocalShows(): { [key: number]: TmdbShow } {
    return getLocalStorage(LocalStorage.TMDB_SHOWS) as { [key: number]: TmdbShow };
  }

  setLocalShows(shows: { [key: number]: TmdbShow }): void {
    setLocalStorage(LocalStorage.TMDB_SHOWS, shows);
  }

  getShowLocally(id: number): TmdbShow {
    return this.shows.value[id];
  }

  getEpisode(tvId: number, seasonNumber: number, episodeNumber: number): Observable<Episode> {
    return this.http.get<Episode>(
      `${this.configService.tmdbBaseUrl}/tv/${tvId}/season/${seasonNumber}/episode/${episodeNumber}`,
      this.configService.tmdbOptions
    );
  }
}
