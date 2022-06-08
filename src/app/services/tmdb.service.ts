import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Config } from '../config';
import { BehaviorSubject, Observable } from 'rxjs';
import { getLocalStorage, setLocalStorage } from '../helper/local-storage';
import { LocalStorage } from '../../types/enum';
import { Configuration, Series } from '../../types/interfaces/Tmdb';

@Injectable({
  providedIn: 'root',
})
export class TmdbService {
  baseUrl = 'https://api.themoviedb.org/3';
  // eslint-disable-next-line @typescript-eslint/naming-convention
  options = { headers: { Authorization: `Bearer ${Config.tmdbToken}` } };

  config = new BehaviorSubject<Configuration>(this.getLocalConfiguration() || {});
  series = new BehaviorSubject(this.getLocalSeries() || {});

  constructor(private http: HttpClient) {
    if (Object.keys(this.getLocalConfiguration()).length === 0) {
      this.getConfig().subscribe((config: Configuration) => {
        this.setLocalConfiguration(config);
        this.config.next(config);
      });
    }
  }

  getConfig(): Observable<Configuration> {
    return this.http.get(
      `${this.baseUrl}/configuration`,
      this.options
    ) as Observable<Configuration>;
  }

  getSeries(id: number): Observable<Series> {
    return this.http.get(`${this.baseUrl}/tv/${id}`, this.options) as Observable<Series>;
  }

  getLocalConfiguration(): Configuration {
    return getLocalStorage(LocalStorage.TMDB_CONFIG) as Configuration;
  }

  setLocalConfiguration(lastActivity: Configuration): void {
    setLocalStorage(LocalStorage.TMDB_CONFIG, lastActivity);
  }

  getLocalSeries(): { [key: number]: Series } {
    return getLocalStorage(LocalStorage.TMDB_SERIES) as { [key: number]: Series };
  }

  setLocalSeries(series: { [key: number]: Series }): void {
    setLocalStorage(LocalStorage.TMDB_SERIES, series);
  }

  syncSeries(id: number): void {
    const seriesAll = this.series.value;

    if (!seriesAll[id]) {
      this.getSeries(id).subscribe((series) => {
        seriesAll[id] = series;
        this.setLocalSeries(seriesAll);
        this.series.next(seriesAll);
      });
    }
  }
}
