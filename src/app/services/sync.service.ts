import { Injectable, OnDestroy } from '@angular/core';
import { BehaviorSubject, Observable, of, Subscription, switchMap } from 'rxjs';
import {
  Episode as TraktEpisode,
  EpisodeFull,
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
import { TmdbConfiguration, TmdbShow } from '../../types/interfaces/Tmdb';
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
    this.syncConfig();

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
        setLocalStorage<{ shows: ShowWatched[] }>(LocalStorage.SHOWS_WATCHED, { shows });
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
        setLocalStorage<{ shows: ShowHidden[] }>(LocalStorage.SHOWS_HIDDEN, { shows });
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
      const favoriteShows = getLocalStorage<{ shows: number[] }>(LocalStorage.FAVORITES)?.shows;
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
            setLocalStorage<{ [id: number]: EpisodeFull }>(
              LocalStorage.SHOWS_EPISODES,
              showsEpisodes
            );
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
      (showWatched?.last_watched_at &&
        localLastActivity &&
        new Date(showWatched.last_watched_at) > new Date(localLastActivity.episodes.watched_at)) ||
      (showWatched?.last_watched_at &&
        showProgress?.last_watched_at &&
        new Date(showWatched.last_watched_at) < new Date(showProgress.last_watched_at)) ||
      force
    ) {
      showsProgressSubscriptions[id] = this.showService
        .fetchShowProgress(id)
        .subscribe((showProgress) => {
          showsProgress[id] = showProgress;
          setLocalStorage<{ [id: number]: ShowProgress }>(
            LocalStorage.SHOWS_PROGRESS,
            showsProgress
          );
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
          setLocalStorage<{ [key: number]: TmdbShow }>(LocalStorage.TMDB_SHOWS, shows);
          this.tmdbService.tmdbShows.next(shows);
          resolve();
        });
      } else {
        resolve();
      }
    });
  }

  syncAddToHistory(episode: TraktEpisode, ids: Ids): void {
    this.showService.addToHistory(episode).subscribe(async (res) => {
      if (res.not_found.episodes.length > 0) {
        console.error('res', res);
        return;
      }

      this.syncShowProgress(ids.trakt, true);

      this.fetchLastActivity().subscribe((lastActivity) => {
        this.sync(lastActivity);
        this.showService.removeNewShow(ids);
      });
    });
  }

  syncRemoveFromHistory(episode: TraktEpisode, ids: Ids): void {
    this.showService.removeFromHistory(episode).subscribe(async (res) => {
      if (res.not_found.episodes.length > 0) {
        console.error('res', res);
        return;
      }

      this.syncShowProgress(ids.trakt, true);

      this.fetchLastActivity().subscribe((lastActivity) => {
        this.sync(lastActivity);
        this.showService.addNewShow(ids);
      });
    });
  }

  syncTmdbConfig(): void {
    this.tmdbService.fetchTmdbConfig().subscribe((config: TmdbConfiguration) => {
      setLocalStorage<TmdbConfiguration>(LocalStorage.TMDB_CONFIG, config);
      this.tmdbService.tmdbConfig.next(config);
    });
  }

  syncConfig(withPublish = true): void {
    const config = this.configService.config.value;
    this.configService.setLocalConfig(config);
    if (withPublish) {
      this.configService.config.next(config);
    }
  }

  getLocalLastActivity(): LastActivity | undefined {
    return getLocalStorage<LastActivity>(LocalStorage.LAST_ACTIVITY);
  }

  setLocalLastActivity(lastActivity: LastActivity): void {
    setLocalStorage(LocalStorage.LAST_ACTIVITY, lastActivity);
  }
}
