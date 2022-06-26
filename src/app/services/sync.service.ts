import { Injectable, OnDestroy } from '@angular/core';
import { BehaviorSubject, Observable, of, Subscription, switchMap } from 'rxjs';
import { Episode as TraktEpisode, LastActivity, ShowWatched } from '../../types/interfaces/Trakt';
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
    private authService: AuthService
  ) {
    if (!this.tmdbService.tmdbConfig.value) {
      this.syncTmdbConfig();
    }

    this.subscriptions = [
      this.authService.isLoggedIn
        .pipe(
          switchMap((isLoggedIn) => {
            if (isLoggedIn) return this.fetchLastActivity();
            return of(undefined);
          })
        )
        .subscribe(async (lastActivity: LastActivity | undefined) => {
          if (!lastActivity) return;
          await this.sync(lastActivity);
        }),
      this.showService.showsProgress.subscribe((showsProgress) => {
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
    const localLastActivity = this.getLocalLastActivity();

    if (!localLastActivity) {
      this.setLocalLastActivity(lastActivity);
      await this.syncAll();
      this.isSyncing.next(false);
      return;
    }

    const episodesWatchedLater =
      new Date(lastActivity.episodes.watched_at) > new Date(localLastActivity.episodes.watched_at);
    const showHiddenLater =
      new Date(lastActivity.shows.hidden_at) > new Date(localLastActivity.shows.hidden_at);

    if (episodesWatchedLater) {
      await this.syncNewShows();
    }

    if (showHiddenLater) {
      await this.syncNewShowsHidden();
    }

    this.setLocalLastActivity(lastActivity);
    this.isSyncing.next(false);
  }

  private async syncAll(): Promise<void> {
    await Promise.all([this.syncShows(), this.syncShowsHidden(), this.syncFavorites()]);
    await Promise.all(
      this.showService.showsWatched.value.map((show) => {
        return this.syncTmdbShow(show.show.ids.tmdb);
      })
    );
  }

  private async syncNewShows(): Promise<void> {
    await this.syncShows();
    await Promise.all(
      this.showService.showsWatched.value.map((show) => {
        return this.syncTmdbShow(show.show.ids.tmdb);
      })
    );
  }

  private async syncNewShowsHidden(): Promise<void> {
    await this.syncShowsHidden();
    await Promise.all(
      this.showService.showsHidden.value.map((show) => {
        return this.syncTmdbShow(show.show.ids.tmdb);
      })
    );
  }

  syncShows(): Promise<void> {
    return new Promise((resolve) => {
      this.showService.fetchShowsWatched().subscribe((shows) => {
        this.showService.setLocalShowsWatched({ shows });
        this.showService.showsWatched.next(shows);
        shows.forEach((show) => {
          this.syncShowProgress(show.show.ids.trakt);
          resolve();
        });
      });
    });
  }

  syncShowsHidden(): Promise<void> {
    return new Promise((resolve) => {
      this.showService.fetchShowsHidden().subscribe((shows) => {
        this.showService.setLocalShowsHidden(shows);
        this.showService.showsHidden.next(shows);
        resolve();
      });
    });
  }

  syncLastActivity(): Promise<void> {
    return new Promise((resolve) => {
      this.fetchLastActivity().subscribe((lastActivity) => {
        this.setLocalLastActivity(lastActivity);
        resolve();
      });
    });
  }

  syncFavorites(): Promise<void> {
    return new Promise((resolve) => {
      const favoriteShows = this.showService.getLocalFavorites().shows;
      if (favoriteShows) {
        this.showService.favorites.next(favoriteShows);
      }
      resolve();
    });
  }

  syncShowsEpisodes(showId: number, season: number, episodeNumber: number): Promise<void> {
    return new Promise((resolve) => {
      const showsEpisodes = this.showService.showsEpisodes.value;
      const episode = showsEpisodes[episodeId(showId, season, episodeNumber)];
      const showsEpisodesSubscriptions = this.showService.showsEpisodesSubscriptions.value;

      if (!episode && !showsEpisodesSubscriptions[episodeId(showId, season, episodeNumber)]) {
        showsEpisodesSubscriptions[episodeId(showId, season, episodeNumber)] = this.showService
          .fetchShowsEpisode(showId, season, episodeNumber)
          .subscribe((episode) => {
            showsEpisodes[episodeId(showId, season, episodeNumber)] = episode;
            this.showService.setLocalShowsEpisodes(showsEpisodes);
            this.showService.showsEpisodes.next(showsEpisodes);
            delete showsEpisodesSubscriptions[episodeId(showId, season, episodeNumber)];
            this.showService.showsEpisodesSubscriptions.next(showsEpisodesSubscriptions);
            resolve();
          });
        this.showService.showsEpisodesSubscriptions.next(showsEpisodesSubscriptions);
      } else {
        resolve();
      }
    });
  }

  syncShowProgress(id: number, force?: boolean): void {
    const showsProgress = this.showService.showsProgress.value;
    const showProgress = showsProgress[id];
    const showsWatched = this.showService.showsWatched.value;
    const showWatched = showsWatched.find((show) => show.show.ids.trakt === id);
    const showsProgressSubscriptions = this.showService.showsProgressSubscriptions.value;
    const localLastActivity = this.getLocalLastActivity();

    if (
      (!showProgress && !showsProgressSubscriptions[id]) ||
      (showWatched &&
        localLastActivity &&
        new Date(showWatched.last_watched_at) > new Date(localLastActivity.episodes.watched_at)) ||
      (showWatched &&
        showProgress &&
        new Date(showWatched.last_watched_at) < new Date(showProgress.last_watched_at)) ||
      force
    ) {
      showsProgressSubscriptions[id] = this.showService
        .fetchShowProgress(id)
        .subscribe((showProgress) => {
          showsProgress[id] = showProgress;
          this.showService.setLocalShowsProgress(showsProgress);
          this.showService.showsProgress.next(showsProgress);
          delete showsProgressSubscriptions[id];
          this.showService.showsProgressSubscriptions.next(showsProgressSubscriptions);
        });
      this.showService.showsProgressSubscriptions.next(showsProgressSubscriptions);
    }
  }

  syncTmdbShow(id: number): Promise<void> {
    return new Promise((resolve) => {
      const shows = this.tmdbService.tmdbShows.value;

      if (!shows[id]) {
        this.tmdbService.fetchShow(id).subscribe((show) => {
          shows[id] = show;
          this.tmdbService.setLocalShows(shows);
          this.tmdbService.tmdbShows.next(shows);
          resolve();
        });
      } else {
        resolve();
      }
    });
  }

  syncAddToHistory(episode: TraktEpisode, watched: ShowWatched): void {
    this.showService.addToHistory(episode).subscribe(async (res) => {
      if (res.not_found.episodes.length > 0) {
        console.error('res', res);
        return;
      }

      this.syncShowProgress(watched.show.ids.trakt, true);

      this.fetchLastActivity().subscribe((lastActivity) => {
        this.sync(lastActivity);
      });
    });
  }

  syncRemoveFromHistory(episode: TraktEpisode, watched: ShowWatched): void {
    this.showService.removeFromHistory(episode).subscribe(async (res) => {
      if (res.not_found.episodes.length > 0) {
        console.error('res', res);
        return;
      }

      this.syncShowProgress(watched.show.ids.trakt, true);

      this.fetchLastActivity().subscribe((lastActivity) => {
        this.sync(lastActivity);
      });
    });
  }

  syncTmdbConfig(): void {
    this.tmdbService.fetchTmdbConfig().subscribe((config: TmdbConfiguration) => {
      this.tmdbService.setLocalTmdbConfig(config);
      this.tmdbService.tmdbConfig.next(config);
    });
  }

  getLocalLastActivity(): LastActivity | undefined {
    return getLocalStorage<LastActivity>(LocalStorage.LAST_ACTIVITY);
  }

  setLocalLastActivity(lastActivity: LastActivity): void {
    setLocalStorage(LocalStorage.LAST_ACTIVITY, lastActivity);
  }
}
