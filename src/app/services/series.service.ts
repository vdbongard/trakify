import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { SeriesProgress, SeriesWatched, SeriesWatchedHistory } from '../../types/interfaces/Trakt';

@Injectable({
  providedIn: 'root',
})
export class SeriesService {
  baseUrl = 'https://api.trakt.tv';
  options = {
    headers: {
      // eslint-disable-next-line @typescript-eslint/naming-convention
      'trakt-api-version': '2',
      // eslint-disable-next-line @typescript-eslint/naming-convention
      'trakt-api-key': '85ac87a505a1a8f62d1e4284ea630f0632459afcd0a9e5c9244ad4674e90140e',
    },
  };

  constructor(private http: HttpClient) {}

  getSeriesWatched(): Observable<SeriesWatched[]> {
    return this.http.get(`${this.baseUrl}/sync/watched/shows`, this.options) as Observable<
      SeriesWatched[]
    >;
  }

  getSeriesWatchedHistory(): Observable<SeriesWatchedHistory[]> {
    return this.http.get(`${this.baseUrl}/sync/history/shows`, this.options) as Observable<
      SeriesWatchedHistory[]
    >;
  }

  getSeriesProgress(id: string): Observable<SeriesProgress[]> {
    return this.http.get(
      `${this.baseUrl}/shows/${id}/progress/watched`,
      this.options
    ) as Observable<SeriesProgress[]>;
  }
}
