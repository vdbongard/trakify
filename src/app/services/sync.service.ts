import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, of, switchMap } from 'rxjs';
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

    this.showService.showsProgress$.subscribe((showsProgress) => {
      Object.entries(showsProgress).forEach(async ([showId, showProgress]) => {
        if (!showProgress.next_episode) return;
        await this.showService.syncShowEpisode(
          parseInt(showId),
          showProgress.next_episode.season,
          showProgress.next_episode.number
        );
      });
    });
  }

  fetchLastActivity(): Observable<LastActivity> {
    return this.http.get<LastActivity>(
      `${Config.traktBaseUrl}/sync/last_activities`,
      Config.traktOptions
    );
  }

  async sync(lastActivity: LastActivity): Promise<void> {
    this.isSyncing.next(true);

    const promises: Promise<void>[] = [];

    const localLastActivity = getLocalStorage<LastActivity>(LocalStorage.LAST_ACTIVITY);
    setLocalStorage(LocalStorage.LAST_ACTIVITY, lastActivity);

    const isFirstSync = !localLastActivity;

    if (isFirstSync) {
      promises.push(this.showService.syncShowsWatched());
      promises.push(this.showService.syncShowsHidden());
      promises.push(this.showService.syncFavorites());
      promises.push(this.tmdbService.syncTmdbConfig());
      promises.push(this.configService.syncConfig());
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
    }

    await Promise.all(promises);

    this.isSyncing.next(false);
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
