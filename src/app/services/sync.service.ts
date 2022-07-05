import { Injectable, OnDestroy } from '@angular/core';
import { BehaviorSubject, Observable, of, Subscription, switchMap } from 'rxjs';
import {
  Episode as TraktEpisode,
  Ids,
  LastActivity,
  ShowHidden,
  ShowProgress,
  ShowWatched,
} from '../../types/interfaces/Trakt';
import { TmdbService } from './tmdb.service';
import { OAuthService } from 'angular-oauth2-oidc';
import { ConfigService } from './config.service';
import { ShowService } from './show.service';
import { getLocalStorage, setLocalStorage } from '../helper/local-storage';
import { LocalStorage } from '../../types/enum';
import { HttpClient } from '@angular/common/http';
import { TmdbConfiguration } from '../../types/interfaces/Tmdb';
import { episodeId } from '../helper/episodeId';
import { Config } from '../config';
import { AuthService } from './auth.service';
import { MatSnackBar } from '@angular/material/snack-bar';

@Injectable({
  providedIn: 'root',
})
export class SyncService implements OnDestroy {
  subscriptions: Subscription[] = [];
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
    this.subscriptions = [
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
        }),
      this.showService.showsProgress$.subscribe((showsProgress) => {
        Object.entries(showsProgress).forEach(async ([showId, showProgress]) => {
          if (!showProgress.next_episode) return;
          await this.syncShowsEpisodes(
            parseInt(showId),
            showProgress.next_episode.season,
            showProgress.next_episode.number
          );
        });
      }),
    ];
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach((subscription) => subscription.unsubscribe());
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
      promises.push(this.syncShows());
      promises.push(this.syncShowsHidden());
      promises.push(this.syncFavorites());
      promises.push(this.syncTmdbConfig());
      promises.push(this.syncConfig());
    } else {
      const isShowWatchedLater =
        new Date(lastActivity.episodes.watched_at) >
        new Date(localLastActivity.episodes.watched_at);

      const isShowHiddenLater =
        new Date(lastActivity.shows.hidden_at) > new Date(localLastActivity.shows.hidden_at);

      if (isShowWatchedLater) {
        promises.push(this.syncShows());
      }

      if (isShowHiddenLater) {
        promises.push(this.syncShowsHidden());
      }
    }

    await Promise.all(promises);

    this.isSyncing.next(false);
  }

  syncShows(): Promise<void> {
    return new Promise((resolve) => {
      this.showService.fetchShowsWatched().subscribe(async (showsWatched) => {
        setLocalStorage<{ shows: ShowWatched[] }>(LocalStorage.SHOWS_WATCHED, {
          shows: showsWatched,
        });
        this.showService.showsWatched$.next(showsWatched);

        const promises = showsWatched.map((showWatched) => {
          const showId = showWatched.show.ids.trakt;
          return this.syncShowProgress(showId, showWatched);
        });

        await Promise.all(promises);
        resolve();
      });
    });
  }

  async syncShowProgress(showId: number, showWatched: ShowWatched, force?: boolean): Promise<void> {
    return new Promise((resolve) => {
      const showsProgress = this.showService.showsProgress$.value;
      const showProgress = showsProgress[showId];
      const localShowWatched = this.showService.getShowWatched(showId);
      const showsProgressSubscriptions = this.showService.showsProgressSubscriptions$.value;
      const localLastActivity = getLocalStorage<LastActivity>(LocalStorage.LAST_ACTIVITY);

      const isExisting = showProgress || showsProgressSubscriptions[showId];

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

      if (isExisting && !isShowWatchedLater && !isProgressLater && !isShowUpdatedLater && !force) {
        resolve();
        return;
      }

      showsProgressSubscriptions[showId] = this.showService
        .fetchShowProgress(showId)
        .subscribe((showProgress) => {
          showsProgress[showId] = showProgress;
          setLocalStorage<{ [id: number]: ShowProgress }>(
            LocalStorage.SHOWS_PROGRESS,
            showsProgress
          );
          this.showService.showsProgress$.next(showsProgress);
          delete showsProgressSubscriptions[showId];
          this.showService.showsProgressSubscriptions$.next(showsProgressSubscriptions);
          resolve();
        });
      this.showService.showsProgressSubscriptions$.next(showsProgressSubscriptions);
    });
  }

  syncShowsHidden(): Promise<void> {
    return new Promise((resolve) => {
      this.showService.fetchShowsHidden().subscribe((shows) => {
        setLocalStorage<{ shows: ShowHidden[] }>(LocalStorage.SHOWS_HIDDEN, { shows });
        this.showService.showsHidden$.next(shows);
        resolve();
      });
    });
  }

  syncFavorites(): Promise<void> {
    return new Promise((resolve) => {
      const favoriteShows = getLocalStorage<{ shows: number[] }>(LocalStorage.FAVORITES)?.shows;
      if (favoriteShows) {
        this.showService.favorites$.next(favoriteShows);
      }
      resolve();
    });
  }

  syncShowsEpisodes(showId: number, seasonNumber: number, episodeNumber: number): Promise<void> {
    return new Promise((resolve) => {
      const id = episodeId(showId, seasonNumber, episodeNumber);
      const episodes = this.showService.showsEpisodes$.value;
      const episodesSubscriptions = this.showService.showsEpisodesSubscriptions$.value;
      const episode = episodes[id];
      const episodeSubscription = episodesSubscriptions[id];

      if (episode || episodeSubscription) {
        resolve();
        return;
      }

      episodesSubscriptions[id] = this.showService
        .fetchShowsEpisode(showId, seasonNumber, episodeNumber)
        .subscribe((episode) => {
          this.showService.setShowEpisode(showId, episode);

          delete episodesSubscriptions[id];
          this.showService.showsEpisodesSubscriptions$.next(episodesSubscriptions);
          resolve();
        });
      this.showService.showsEpisodesSubscriptions$.next(episodesSubscriptions);
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

  async syncTmdbConfig(): Promise<void> {
    return new Promise((resolve) => {
      this.tmdbService.fetchTmdbConfig().subscribe((config: TmdbConfiguration) => {
        setLocalStorage<TmdbConfiguration>(LocalStorage.TMDB_CONFIG, config);
        this.tmdbService.tmdbConfig$.next(config);
        resolve();
      });
    });
  }

  async syncConfig(): Promise<void> {
    return new Promise((resolve) => {
      const config = this.configService.config$.value;
      setLocalStorage(LocalStorage.CONFIG, config);
      this.configService.config$.next(config);
      resolve();
    });
  }
}
