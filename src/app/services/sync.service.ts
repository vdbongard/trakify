import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, of, switchMap, take } from 'rxjs';
import { Episode as TraktEpisode, Ids, LastActivity } from '../../types/interfaces/Trakt';
import { TmdbService } from './tmdb.service';
import { OAuthService } from 'angular-oauth2-oidc';
import { ConfigService } from './config.service';
import { ShowService } from './show.service';
import { HttpClient } from '@angular/common/http';
import { Config } from '../config';
import { AuthService } from './auth.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { getLocalStorage, setLocalStorage } from '../helper/local-storage';
import { LocalStorage } from '../../types/enum';

@Injectable({
  providedIn: 'root',
})
export class SyncService {
  isSyncing = new BehaviorSubject<boolean>(false);

  mapKeyToSync: Record<string, () => Promise<void>> = {
    [LocalStorage.SHOWS_WATCHED]: this.showService.syncShowsWatched,
    [LocalStorage.SHOWS_HIDDEN]: this.showService.syncShowsHidden,
    [LocalStorage.TMDB_CONFIG]: this.tmdbService.syncTmdbConfig,
    [LocalStorage.WATCHLIST]: this.showService.syncWatchlist,
  };

  constructor(
    private http: HttpClient,
    private tmdbService: TmdbService,
    private oauthService: OAuthService,
    private showService: ShowService,
    private configService: ConfigService,
    private authService: AuthService,
    private snackBar: MatSnackBar
  ) {
    this.authService.isLoggedIn$
      .pipe(switchMap((isLoggedIn) => (isLoggedIn ? this.fetchLastActivity() : of(undefined))))
      .subscribe({
        next: async (lastActivity: LastActivity | undefined) => {
          if (!lastActivity) return;
          await this.sync(lastActivity);
        },
        error: () => {
          this.snackBar.open(`An error occurred while fetching trakt`, undefined, {
            duration: 2000,
          });
        },
      });
  }

  fetchLastActivity(): Observable<LastActivity> {
    return this.http.get<LastActivity>(`${Config.traktBaseUrl}/sync/last_activities`);
  }

  async sync(lastActivity: LastActivity): Promise<void> {
    this.isSyncing.next(true);

    const promises: Promise<void>[] = [];

    const localLastActivity = getLocalStorage<LastActivity>(LocalStorage.LAST_ACTIVITY);

    const isFirstSync = !localLastActivity;

    if (isFirstSync) {
      promises.push(this.showService.syncShowsWatched());
      promises.push(this.showService.syncShowsHidden());
      promises.push(this.showService.syncFavorites());
      promises.push(this.tmdbService.syncTmdbConfig());
      promises.push(this.configService.syncConfig());
      promises.push(this.showService.syncWatchlist());
    } else {
      const isShowWatchedLater =
        new Date(lastActivity.episodes.watched_at) >
        new Date(localLastActivity.episodes.watched_at);

      if (isShowWatchedLater) {
        promises.push(this.showService.syncShowsWatched());
      }

      const isShowHiddenLater =
        new Date(lastActivity.shows.hidden_at) > new Date(localLastActivity.shows.hidden_at);

      if (isShowHiddenLater) {
        promises.push(this.showService.syncShowsHidden());
      }

      const isWatchlistLater =
        new Date(lastActivity.watchlist.updated_at) >
        new Date(localLastActivity.watchlist.updated_at);

      if (isWatchlistLater) {
        promises.push(this.showService.syncWatchlist());
      }

      promises.push(...this.syncEmpty());
    }

    await this.syncShowsProgress();
    await this.syncTmdbShows();
    await this.syncShowsEpisodes();

    await Promise.all(promises);

    setLocalStorage(LocalStorage.LAST_ACTIVITY, lastActivity);
    this.isSyncing.next(false);
  }

  syncEmpty(): Promise<void>[] {
    return Object.entries(this.mapKeyToSync).map(([localStorageKey, syncValues]) => {
      const stored = getLocalStorage(localStorageKey);

      if (!stored) {
        return syncValues();
      }

      return Promise.resolve();
    });
  }

  syncShowsProgress(): Promise<void> {
    return new Promise((resolve) => {
      this.showService.showsWatched$.pipe(take(1)).subscribe(async (showsWatched) => {
        await this.showService.syncShowsProgress(showsWatched, this.showService.showsProgress$);
        resolve();
      });
    });
  }

  syncTmdbShows(): Promise<void> {
    return new Promise((resolve) => {
      this.showService
        .getShowsWatchedWatchlistedAndAdded$()
        .pipe(take(1))
        .subscribe(async (shows) => {
          await Promise.all(
            shows.map((show) => {
              const showId = show.ids.tmdb;
              return this.tmdbService.syncTmdbShow(showId);
            })
          );
          resolve();
        });
    });
  }

  syncShowsEpisodes(): Promise<void> {
    return new Promise((resolve) => {
      this.showService.showsProgress$.pipe(take(1)).subscribe((showsProgress) => {
        Object.entries(showsProgress).forEach(async ([showId, showProgress]) => {
          if (!showProgress.next_episode) return;
          await this.showService.syncShowEpisode(
            parseInt(showId),
            showProgress.next_episode.season,
            showProgress.next_episode.number
          );
          resolve();
        });
      });
    });
  }

  syncAddToHistory(episode: TraktEpisode, ids: Ids): void {
    this.showService.addToHistory(episode).subscribe(async (res) => {
      if (res.not_found.episodes.length > 0) {
        console.error('res', res);
        return;
      }

      this.fetchLastActivity().subscribe((lastActivity) => {
        this.sync(lastActivity);
        this.showService.removeNewShow(ids.trakt);
      });
    });
  }

  syncRemoveFromHistory(episode: TraktEpisode, ids: Ids): void {
    this.showService.removeFromHistory(episode).subscribe(async (res) => {
      if (res.not_found.episodes.length > 0) {
        console.error('res', res);
        return;
      }

      this.fetchLastActivity().subscribe((lastActivity) => {
        this.sync(lastActivity);
        this.showService.addNewShow(ids, episode);
      });
    });
  }
}
