import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { WatchedSeries } from '../../types/interfaces/Trakt';

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

  getWatchedSeries(): Observable<WatchedSeries[]> {
    return this.http.get(`${this.baseUrl}/sync/watched/shows`, this.options) as Observable<
      WatchedSeries[]
    >;
  }
}
