import { Injectable, OnDestroy } from '@angular/core';
import { BehaviorSubject, Observable, of, Subscription, switchMap } from 'rxjs';
import { LastActivity } from '../../types/interfaces/Trakt';
import { TmdbService } from './tmdb.service';
import { OAuthService } from 'angular-oauth2-oidc';
import { ConfigService } from './config.service';
import { ShowService } from './show.service';
import { getLocalStorage, setLocalStorage } from '../helper/local-storage';
import { LocalStorage } from '../../types/enum';
import { HttpClient } from '@angular/common/http';

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
    private configService: ConfigService
  ) {
    this.subscriptions = [
      this.configService.isLoggedIn
        .pipe(
          switchMap((isLoggedIn) => {
            if (isLoggedIn) return this.getLastActivity();
            return of(undefined);
          })
        )
        .subscribe(async (lastActivity: LastActivity | undefined) => {
          if (!lastActivity) return;
          this.isSyncing.next(true);
          const localLastActivity = this.getLocalLastActivity();
          if (!localLastActivity) {
            this.setLocalLastActivity(lastActivity);
            await this.syncAll();
            this.isSyncing.next(false);
            return;
          }

          const episodesWatchedLater =
            new Date(lastActivity.episodes.watched_at) >
            new Date(localLastActivity.episodes.watched_at);
          const showHiddenLater =
            new Date(lastActivity.shows.hidden_at) > new Date(localLastActivity.shows.hidden_at);

          if (episodesWatchedLater) {
            await this.syncNewShows();
          }

          if (showHiddenLater) {
            await this.syncNewShowsHidden();
          }

          this.isSyncing.next(false);
        }),
      this.showService.showsProgress.subscribe((showsProgress) => {
        Object.entries(showsProgress).forEach(([showId, showProgress]) => {
          if (!showProgress.next_episode) return;
          this.syncShowsEpisodes(
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
      this.showService.getShowsWatched().subscribe((shows) => {
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
      this.showService.getShowsHidden().subscribe((shows) => {
        this.showService.setLocalShowsHidden(shows);
        this.showService.showsHidden.next(shows);
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

  syncShowsEpisodes(showId: number, season: number, episodeNumber: number): void {
    const showsEpisodes = this.showService.showsEpisodes.value;
    const episode = showsEpisodes[`${showId}-${season}-${episodeNumber}`];
    const showsEpisodesSubscriptions = this.showService.showsEpisodesSubscriptions.value;

    if (!episode && !showsEpisodesSubscriptions[`${showId}-${season}-${episodeNumber}`]) {
      showsEpisodesSubscriptions[`${showId}-${season}-${episodeNumber}`] = this.showService
        .getShowsEpisode(showId, season, episodeNumber)
        .subscribe((episode) => {
          showsEpisodes[`${showId}-${season}-${episodeNumber}`] = episode;
          this.showService.setLocalShowsEpisodes(showsEpisodes);
          this.showService.showsEpisodes.next(showsEpisodes);
          delete showsEpisodesSubscriptions[`${showId}-${season}-${episodeNumber}`];
          this.showService.showsEpisodesSubscriptions.next(showsEpisodesSubscriptions);
        });
      this.showService.showsEpisodesSubscriptions.next(showsEpisodesSubscriptions);
    }
  }

  syncShowProgress(id: number): void {
    const showsProgress = this.showService.showsProgress.value;
    const showProgress = showsProgress[id];
    const showsWatched = this.showService.showsWatched.value;
    const showWatched = showsWatched.find((show) => show.show.ids.trakt === id);
    const showsProgressSubscriptions = this.showService.showsProgressSubscriptions.value;
    const localLastActivity = this.getLocalLastActivity();

    if (
      (!showWatched && !showsProgressSubscriptions[id]) ||
      (localLastActivity &&
        showWatched &&
        new Date(showWatched.last_watched_at) > new Date(localLastActivity.episodes.watched_at)) ||
      (showWatched &&
        new Date(showWatched.last_watched_at) < new Date(showProgress.last_watched_at))
    ) {
      showsProgressSubscriptions[id] = this.showService
        .getShowProgress(id)
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
      const shows = this.tmdbService.shows.value;

      if (!shows[id]) {
        this.tmdbService.getShow(id).subscribe((show) => {
          shows[id] = show;
          this.tmdbService.setLocalShows(shows);
          this.tmdbService.shows.next(shows);
          resolve();
        });
      } else {
        resolve();
      }
    });
  }

  getLastActivity(): Observable<LastActivity> {
    return this.http.get<LastActivity>(
      `${this.configService.traktBaseUrl}/sync/last_activities`,
      this.configService.traktOptions
    );
  }

  getLocalLastActivity(): LastActivity | undefined {
    return getLocalStorage<LastActivity>(LocalStorage.LAST_ACTIVITY);
  }

  setLocalLastActivity(lastActivity: LastActivity): void {
    setLocalStorage(LocalStorage.LAST_ACTIVITY, lastActivity);
  }
}
