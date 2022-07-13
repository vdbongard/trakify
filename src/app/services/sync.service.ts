import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, of, switchMap, take } from 'rxjs';
import { Episode, Ids, LastActivity } from '../../types/interfaces/Trakt';
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
import { ListService } from './list.service';

@Injectable({
  providedIn: 'root',
})
export class SyncService {
  isSyncing = new BehaviorSubject<boolean>(false);

  mapKeyToSync: Record<string, () => Promise<void>> = {
    [LocalStorage.SHOWS_WATCHED]: this.showService.syncShowsWatched,
    [LocalStorage.SHOWS_HIDDEN]: this.showService.syncShowsHidden,
    [LocalStorage.WATCHLIST]: this.listService.syncWatchlist,
    [LocalStorage.TMDB_CONFIG]: this.tmdbService.syncTmdbConfig,
  };

  constructor(
    private http: HttpClient,
    private tmdbService: TmdbService,
    private oauthService: OAuthService,
    private showService: ShowService,
    private configService: ConfigService,
    private authService: AuthService,
    private snackBar: MatSnackBar,
    private listService: ListService
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

  async sync(lastActivity?: LastActivity): Promise<void> {
    this.isSyncing.next(true);

    let promises: Promise<void>[] = [];

    const localLastActivity = getLocalStorage<LastActivity>(LocalStorage.LAST_ACTIVITY);

    const isFirstSync = !localLastActivity;

    if (isFirstSync) {
      promises.push(...Object.values(this.mapKeyToSync).map((syncValues) => syncValues()));
      promises.push(this.configService.syncConfig());
      promises.push(this.showService.syncFavorites());
    } else {
      if (lastActivity) {
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
          promises.push(this.listService.syncWatchlist());
        }
      }

      promises.push(...this.syncEmpty());
    }

    await Promise.all(promises);

    promises = [this.syncShowsProgressAndTranslation(), this.syncTmdbShows()];
    await Promise.allSettled(promises);

    promises = [this.syncShowsEpisodes()];
    await Promise.allSettled(promises);

    if (lastActivity) setLocalStorage(LocalStorage.LAST_ACTIVITY, lastActivity);
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

  syncShowsProgressAndTranslation(): Promise<void> {
    const language = this.configService.config$.value.language.substring(0, 2);
    return new Promise((resolve) => {
      this.showService.showsWatched$.pipe(take(1)).subscribe(async (showsWatched) => {
        const localLastActivity = getLocalStorage<LastActivity>(LocalStorage.LAST_ACTIVITY);
        const isFirstSync = !localLastActivity;
        const showsProgress = this.showService.showsProgress$.value;

        const promises = showsWatched
          .map((showWatched) => {
            const showId = showWatched.show.ids.trakt;

            if (isFirstSync || Object.keys(showsProgress).length === 0) {
              return this.showService.syncShowProgress(showId);
            }

            const localShowWatched = this.showService.getShowWatched(showId);
            const showProgress = showsProgress[showId];

            const isShowWatchedLater =
              localShowWatched?.last_watched_at &&
              localLastActivity &&
              new Date(localShowWatched.last_watched_at) >
                new Date(localLastActivity.episodes.watched_at);

            const isProgressLater =
              localShowWatched?.last_watched_at &&
              showProgress?.last_watched_at &&
              new Date(showProgress.last_watched_at) > new Date(localShowWatched.last_watched_at);

            const isShowUpdatedLater =
              localShowWatched?.last_updated_at &&
              showWatched?.last_updated_at &&
              new Date(showWatched.last_updated_at) > new Date(localShowWatched.last_updated_at);

            if (!isShowWatchedLater && !isProgressLater && !isShowUpdatedLater) {
              return;
            }

            return this.showService.syncShowProgress(showId);
          })
          .filter(Boolean) as Promise<void>[];

        if (language !== 'en') {
          promises.push(
            ...showsWatched.map((showWatched) => {
              const showId = showWatched.show.ids.trakt;
              return this.showService.syncShowTranslation(showId, language);
            })
          );
        }

        await Promise.all(promises);

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
    const language = this.configService.config$.value.language.substring(0, 2);
    return new Promise((resolve) => {
      this.showService.showsProgress$.pipe(take(1)).subscribe((showsProgress) => {
        Object.entries(showsProgress).forEach(async ([showId, showProgress]) => {
          if (!showProgress.next_episode) return;
          const showIdNumber = parseInt(showId);
          await this.showService.syncShowEpisode(
            showIdNumber,
            showProgress.next_episode.season,
            showProgress.next_episode.number
          );
          const tmdbId = this.showService.getIdsByTraktId(showIdNumber)?.tmdb;
          if (tmdbId) {
            await this.tmdbService.syncTmdbEpisode(
              tmdbId,
              showProgress.next_episode.season,
              showProgress.next_episode.number
            );
          }
          if (language !== 'en') {
            await this.showService.syncShowEpisodeTranslation(
              showIdNumber,
              showProgress.next_episode.season,
              showProgress.next_episode.number,
              language
            );
          }
          resolve();
        });
      });
    });
  }

  syncAddToHistory(ids: Ids, episode: Episode): void {
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

  syncRemoveFromHistory(ids: Ids, episode: Episode): void {
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
