import { Injectable, OnDestroy } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, Subscription } from 'rxjs';
import {
  EpisodeFull,
  EpisodeProgress,
  Ids,
  LastActivity,
  SeasonProgress,
  ShowHidden,
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
  showsHidden = new BehaviorSubject<ShowHidden[]>(this.getLocalShowsHidden()?.shows || []);
  showsProgress = new BehaviorSubject<{ [id: number]: ShowProgress }>(
    this.getLocalShowsProgress() || {}
  );

  showsProgressSubscriptions = new BehaviorSubject<{ [id: number]: Subscription }>({});
  showsEpisodes = new BehaviorSubject<{ [id: string]: EpisodeFull }>(
    this.getLocalShowsEpisodes() || {}
  );

  showsEpisodesSubscriptions = new BehaviorSubject<{ [id: string]: Subscription }>({});
  favorites = new BehaviorSubject<number[]>(this.getLocalFavorites()?.shows || []);

  constructor(
    private http: HttpClient,
    private tmdbService: TmdbService,
    private oauthService: OAuthService
  ) {
    if (!this.oauthService.hasValidAccessToken()) return;

    this.subscriptions = [
      this.getLastActivity().subscribe(async (lastActivity: LastActivity) => {
        const localLastActivity = this.getLocalLastActivity();
        if (
          localLastActivity &&
          Object.keys(localLastActivity).length > 0 &&
          new Date(lastActivity.episodes.watched_at) <=
            new Date(localLastActivity.episodes.watched_at)
        )
          return;

        this.setLocalLastActivity(lastActivity);
        await this.syncShows();
        await this.syncShowsHidden();
        await this.syncFavorites();
        this.showsWatched.value.forEach((show) => {
          this.tmdbService.syncShow(show.show.ids.tmdb);
        });
      }),
      this.showsProgress.subscribe((showsProgress) => {
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

  syncShows(): Promise<void> {
    return new Promise((resolve) => {
      this.getShowsWatched().subscribe((shows) => {
        this.setLocalShowsWatched({ shows });
        this.showsWatched.next(shows);
        shows.forEach((show) => {
          this.syncShowProgress(show.show.ids.trakt);
          resolve();
        });
      });
    });
  }

  syncShowsHidden(): Promise<void> {
    return new Promise((resolve) => {
      this.getShowsHidden().subscribe((shows) => {
        this.setLocalShowsHidden(shows);
        this.showsHidden.next(shows);
        resolve();
      });
    });
  }

  syncFavorites(): Promise<void> {
    return new Promise((resolve) => {
      const favoriteShows = this.getLocalFavorites()?.shows;
      if (favoriteShows) {
        this.favorites.next(favoriteShows);
      }
      resolve();
    });
  }

  syncShowsEpisodes(showId: number, season: number, episodeNumber: number): void {
    const showsEpisodes = this.showsEpisodes.value;
    const episode = showsEpisodes[`${showId}-${season}-${episodeNumber}`];
    const showsEpisodesSubscriptions = this.showsEpisodesSubscriptions.value;

    if (
      (!episode && !showsEpisodesSubscriptions[`${showId}-${season}-${episodeNumber}`]) ||
      !showsEpisodesSubscriptions[`${showId}-${season}-${episodeNumber}`]
    ) {
      showsEpisodesSubscriptions[`${showId}-${season}-${episodeNumber}`] = this.getShowsEpisode(
        showId,
        season,
        episodeNumber
      ).subscribe((episode) => {
        showsEpisodes[`${showId}-${season}-${episodeNumber}`] = episode;
        this.setLocalShowsEpisodes(showsEpisodes);
        this.showsEpisodes.next(showsEpisodes);
        delete showsEpisodesSubscriptions[`${showId}-${season}-${episodeNumber}`];
        this.showsEpisodesSubscriptions.next(showsEpisodesSubscriptions);
      });
      this.showsEpisodesSubscriptions.next(showsEpisodesSubscriptions);
    }
  }

  syncShowProgress(id: number): void {
    const showsProgress = this.showsProgress.value;
    const showProgress = showsProgress[id];
    const showsProgressSubscriptions = this.showsProgressSubscriptions.value;
    const localLastActivity = this.getLocalLastActivity();

    if (
      (!showProgress && !showsProgressSubscriptions[id]) ||
      !showsProgressSubscriptions[id] ||
      (localLastActivity &&
        Object.keys(localLastActivity).length > 0 &&
        new Date(showProgress.last_watched_at) < new Date(localLastActivity.episodes.watched_at))
    ) {
      showsProgressSubscriptions[id] = this.getShowProgress(id).subscribe((showProgress) => {
        showsProgress[id] = showProgress;
        this.setLocalShowsProgress(showsProgress);
        this.showsProgress.next(showsProgress);
        delete showsProgressSubscriptions[id];
        this.showsProgressSubscriptions.next(showsProgressSubscriptions);
      });
      this.showsProgressSubscriptions.next(showsProgressSubscriptions);
    }
  }

  getShowsWatched(): Observable<ShowWatched[]> {
    return this.http.get<ShowWatched[]>(`${this.baseUrl}/sync/watched/shows`, this.options);
  }

  getShowWatchedLocally(id: number): ShowWatched | undefined {
    return this.showsWatched.value.find((show) => show.show.ids.trakt === id);
  }

  getIdForSlug(slug: string): Ids | undefined {
    return this.showsWatched.value.find((show) => show.show.ids.slug === slug)?.show.ids;
  }

  getShowsWatchedHistory(): Observable<ShowWatchedHistory[]> {
    return this.http.get<ShowWatchedHistory[]>(`${this.baseUrl}/sync/history/shows`, this.options);
  }

  getShowProgress(id: number): Observable<ShowProgress> {
    return this.http.get<ShowProgress>(
      `${this.baseUrl}/shows/${id}/progress/watched`,
      this.options
    );
  }

  getShowsProgressLocally(id: number): ShowProgress | undefined {
    return this.showsProgress.value[id];
  }

  getSeasonProgressLocally(id: number, season: number): SeasonProgress | undefined {
    return this.getShowsProgressLocally(id)?.seasons?.[season - 1];
  }

  getEpisodeProgressLocally(
    id: number,
    season: number,
    episode: number
  ): EpisodeProgress | undefined {
    return this.getSeasonProgressLocally(id, season)?.episodes?.[episode - 1];
  }

  getLocalShowsProgress(): { [id: number]: ShowProgress } | undefined {
    return getLocalStorage<{ [id: number]: ShowProgress }>(LocalStorage.SHOWS_PROGRESS);
  }

  setLocalShowsProgress(showProgress: { [id: number]: ShowProgress }): void {
    setLocalStorage(LocalStorage.SHOWS_PROGRESS, showProgress);
  }

  getLastActivity(): Observable<LastActivity> {
    return this.http.get<LastActivity>(`${this.baseUrl}/sync/last_activities`, this.options);
  }

  getLocalLastActivity(): LastActivity | undefined {
    return getLocalStorage<LastActivity>(LocalStorage.LAST_ACTIVITY);
  }

  setLocalLastActivity(lastActivity: LastActivity): void {
    setLocalStorage(LocalStorage.LAST_ACTIVITY, lastActivity);
  }

  getLocalShowsWatched(): { shows: ShowWatched[] } | undefined {
    return getLocalStorage<{ shows: ShowWatched[] }>(LocalStorage.SHOWS_WATCHED);
  }

  setLocalShowsWatched(showsWatched: { shows: ShowWatched[] }): void {
    setLocalStorage(LocalStorage.SHOWS_WATCHED, showsWatched);
  }

  getShowsHidden(): Observable<ShowHidden[]> {
    return this.http.get<ShowHidden[]>(
      `${this.baseUrl}/users/hidden/progress_watched?type=show`,
      this.options
    );
  }

  getLocalShowsHidden(): { shows: ShowHidden[] } | undefined {
    return getLocalStorage<{ shows: ShowHidden[] }>(LocalStorage.SHOWS_HIDDEN);
  }

  setLocalShowsHidden(showHidden: ShowHidden[]): void {
    setLocalStorage(LocalStorage.SHOWS_HIDDEN, { shows: showHidden });
  }

  getShowsEpisode(id: number, season: number, episode: number): Observable<EpisodeFull> {
    return this.http.get<EpisodeFull>(
      `${this.baseUrl}/shows/${id}/seasons/${season}/episodes/${episode}?extended=full`,
      this.options
    );
  }

  getLocalShowsEpisodes(): { [id: string]: EpisodeFull } | undefined {
    return getLocalStorage<{ [id: string]: EpisodeFull }>(LocalStorage.SHOWS_EPISODES);
  }

  setLocalShowsEpisodes(showsEpisodes: { [id: string]: EpisodeFull }): void {
    setLocalStorage(LocalStorage.SHOWS_EPISODES, showsEpisodes);
  }

  getLocalFavorites(): { shows: number[] } | undefined {
    return getLocalStorage<{ shows: number[] }>(LocalStorage.FAVORITES);
  }

  setLocalFavorites(favorites: number[]): void {
    setLocalStorage(LocalStorage.FAVORITES, { shows: favorites });
  }

  addFavorite(id: number): void {
    const favorites = this.favorites.value;
    if (favorites.includes(id)) return;

    favorites.push(id);
    this.setLocalFavorites(favorites);
    this.favorites.next(favorites);
  }

  removeFavorite(id: number): void {
    let favorites = this.favorites.value;
    if (!favorites.includes(id)) return;

    favorites = favorites.filter((favorite) => favorite !== id);
    this.setLocalFavorites(favorites);
    this.favorites.next(favorites);
  }
}
