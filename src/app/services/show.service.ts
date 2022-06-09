import { Injectable, OnDestroy } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, Subscription } from 'rxjs';
import {
  LastActivity,
  ShowProgress,
  ShowWatched,
  ShowWatchedHistory,
} from '../../types/interfaces/Trakt';
import { LocalStorage } from '../../types/enum';
import { getLocalStorage, setLocalStorage } from '../helper/local-storage';
import { TmdbService } from './tmdb.service';
import { OAuthService } from 'angular-oauth2-oidc';

@Injectable({
  providedIn: 'root',
})
export class ShowService implements OnDestroy {
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
  showsWatched = new BehaviorSubject<ShowWatched[]>(this.getLocalShowsWatched()?.shows || []);

  constructor(
    private http: HttpClient,
    private tmdbService: TmdbService,
    private oauthService: OAuthService
  ) {
    if (!this.oauthService.hasValidAccessToken()) return;

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
        this.syncShows();
        this.showsWatched.value.forEach((show) => {
          this.tmdbService.syncShow(show.show.ids.tmdb);
        });
      }),
    ];
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach((subscription) => subscription.unsubscribe());
  }

  getShowsWatched(): Observable<ShowWatched[]> {
    return this.http.get(`${this.baseUrl}/sync/watched/shows`, this.options) as Observable<
      ShowWatched[]
    >;
  }

  getShowWatchedLocally(slug: string): ShowWatched | undefined {
    return this.showsWatched.value.find((show) => show.show.ids.slug === slug);
  }

  getShowWatchedHistory(): Observable<ShowWatchedHistory[]> {
    return this.http.get(`${this.baseUrl}/sync/history/shows`, this.options) as Observable<
      ShowWatchedHistory[]
    >;
  }

  getShowProgress(id: string): Observable<ShowProgress[]> {
    return this.http.get(
      `${this.baseUrl}/shows/${id}/progress/watched`,
      this.options
    ) as Observable<ShowProgress[]>;
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

  getLocalShowsWatched(): { shows: ShowWatched[] } {
    return getLocalStorage(LocalStorage.SHOWS_WATCHED) as { shows: ShowWatched[] };
  }

  setLocalShowsWatched(showsWatched: { shows: ShowWatched[] }): void {
    setLocalStorage(LocalStorage.SHOWS_WATCHED, showsWatched);
  }

  syncShows(): void {
    this.getShowsWatched().subscribe((shows) => {
      this.setLocalShowsWatched({ shows });
      this.showsWatched.next(shows);
    });
  }
}
