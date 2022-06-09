import { Injectable, OnDestroy } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, Subscription } from 'rxjs';
import {
  LastActivity,
  SeriesProgress,
  SeriesWatched,
  SeriesWatchedHistory,
} from '../../types/interfaces/Trakt';
import { LocalStorage } from '../../types/enum';
import { getLocalStorage, setLocalStorage } from '../helper/local-storage';
import { TmdbService } from './tmdb.service';

@Injectable({
  providedIn: 'root',
})
export class SeriesService implements OnDestroy {
  baseUrl = 'https://api.trakt.tv';
  options = {
    headers: {
      // eslint-disable-next-line @typescript-eslint/naming-convention
      'trakt-api-version': '2',
      // eslint-disable-next-line @typescript-eslint/naming-convention
      'trakt-api-key': '85ac87a505a1a8f62d1e4284ea630f0632459afcd0a9e5c9244ad4674e90140e',
    },
  };

  subscriptions: Subscription[] = [];
  seriesWatched = new BehaviorSubject<SeriesWatched[]>(this.getLocalSeriesWatched()?.series || []);

  constructor(private http: HttpClient, private tmdbService: TmdbService) {
    this.subscriptions = [
      this.getLastActivity().subscribe((lastActivity: LastActivity) => {
        const localLastActivity = this.getLocalLastActivity();
        if (
          Object.keys(localLastActivity).length > 0 &&
          new Date(lastActivity.episodes.watched_at) <=
            new Date(localLastActivity.episodes.watched_at)
        )
          return;

        this.setLocalLastActivity(lastActivity);
        this.sync();
        this.seriesWatched.value.forEach((series) => {
          this.tmdbService.syncSeries(series.show.ids.tmdb);
        });
      }),
    ];
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach((subscription) => subscription.unsubscribe());
  }

  getSeriesWatched(): Observable<SeriesWatched[]> {
    return this.http.get(`${this.baseUrl}/sync/watched/shows`, this.options) as Observable<
      SeriesWatched[]
    >;
  }

  getSeriesWatchedLocally(slug: string): SeriesWatched | undefined {
    return this.seriesWatched.value.find((series) => series.show.ids.slug === slug);
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

  getLastActivity(): Observable<LastActivity> {
    return this.http.get(
      `${this.baseUrl}/sync/last_activities`,
      this.options
    ) as Observable<LastActivity>;
  }

  getLocalLastActivity(): LastActivity {
    return getLocalStorage(LocalStorage.LAST_ACTIVITY) as LastActivity;
  }

  setLocalLastActivity(lastActivity: LastActivity): void {
    setLocalStorage(LocalStorage.LAST_ACTIVITY, lastActivity);
  }

  getLocalSeriesWatched(): { series: SeriesWatched[] } {
    return getLocalStorage(LocalStorage.SERIES_WATCHED) as { series: SeriesWatched[] };
  }

  setLocalSeriesWatched(seriesWatched: { series: SeriesWatched[] }): void {
    setLocalStorage(LocalStorage.SERIES_WATCHED, seriesWatched);
  }

  sync(): void {
    this.getSeriesWatched().subscribe((series) => {
      this.setLocalSeriesWatched({ series });
      this.seriesWatched.next(series);
    });
  }
}
