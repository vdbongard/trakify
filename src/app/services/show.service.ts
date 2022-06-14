import { Injectable, OnDestroy } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, Subscription } from 'rxjs';
import {
  EpisodeFull,
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

  showsEpisodes = new BehaviorSubject<{ [id: number]: EpisodeFull[] }>(
    this.getLocalShowsEpisodes() || {}
  );

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

  getShowsWatched(): Observable<ShowWatched[]> {
    return this.http.get(`${this.baseUrl}/sync/watched/shows`, this.options) as Observable<
      ShowWatched[]
    >;
  }

  getShowWatchedLocally(id: number): ShowWatched | undefined {
    return this.showsWatched.value.find((show) => show.show.ids.trakt === id);
  }

  getIdForSlug(slug: string): Ids | undefined {
    return this.showsWatched.value.find((show) => show.show.ids.slug === slug)?.show.ids;
  }

  getShowsWatchedHistory(): Observable<ShowWatchedHistory[]> {
    return this.http.get(`${this.baseUrl}/sync/history/shows`, this.options) as Observable<
      ShowWatchedHistory[]
    >;
  }

  getShowProgress(id: number): Observable<ShowProgress> {
    return this.http.get(
      `${this.baseUrl}/shows/${id}/progress/watched`,
      this.options
    ) as Observable<ShowProgress>;
  }

  getShowsProgressLocally(id: number): ShowProgress | undefined {
    return this.showsProgress.value[id];
  }

  getSeasonProgressLocally(id: number, season: number): SeasonProgress | undefined {
    return this.getShowsProgressLocally(id)?.seasons?.[season - 1];
  }

  getLocalShowsProgress(): { [id: number]: ShowProgress } {
    return getLocalStorage(LocalStorage.SHOWS_PROGRESS) as { [id: number]: ShowProgress };
  }

  setLocalShowsProgress(showProgress: { [id: number]: ShowProgress }): void {
    setLocalStorage(LocalStorage.SHOWS_PROGRESS, showProgress);
  }

  syncShowProgress(id: number): void {
    const showsProgress = this.showsProgress.value;

    if (!showsProgress[id]) {
      this.getShowProgress(id).subscribe((showProgress) => {
        showsProgress[id] = showProgress;
        this.setLocalShowsProgress(showsProgress);
        this.showsProgress.next(showsProgress);
      });
    }
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

  getShowsHidden(): Observable<ShowHidden[]> {
    return this.http.get(
      `${this.baseUrl}/users/hidden/progress_watched?type=show`,
      this.options
    ) as Observable<ShowHidden[]>;
  }

  getLocalShowsHidden(): { shows: ShowHidden[] } {
    return getLocalStorage(LocalStorage.SHOWS_HIDDEN) as { shows: ShowHidden[] };
  }

  setLocalShowsHidden(showHidden: ShowHidden[]): void {
    setLocalStorage(LocalStorage.SHOWS_HIDDEN, { shows: showHidden });
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

  getShowsEpisode(id: number, season: number, episode: number): Observable<EpisodeFull> {
    return this.http.get(
      `${this.baseUrl}/shows/${id}/seasons/${season}/episodes/${episode}?extended=full`,
      this.options
    ) as Observable<EpisodeFull>;
  }

  getLocalShowsEpisodes(): { [id: number]: EpisodeFull[] } {
    return getLocalStorage(LocalStorage.SHOWS_EPISODES) as { [id: number]: EpisodeFull[] };
  }

  setLocalShowsEpisodes(showsEpisodes: { [id: number]: EpisodeFull[] }): void {
    setLocalStorage(LocalStorage.SHOWS_EPISODES, showsEpisodes);
  }

  syncShowsEpisodes(id: number, season: number, episodeNumber: number): void {
    const showsEpisodes = this.showsEpisodes.value;

    if (!showsEpisodes[id]) showsEpisodes[id] = [];

    if (
      !showsEpisodes[id].find(
        (episode) => episode.season === season && episode.number === episodeNumber
      )
    ) {
      this.getShowsEpisode(id, season, episodeNumber).subscribe((episode) => {
        showsEpisodes[id].push(episode);
        this.setLocalShowsEpisodes(showsEpisodes);
        this.showsEpisodes.next(showsEpisodes);
      });
    }
  }

  getLocalFavorites(): { shows: number[] } {
    return getLocalStorage(LocalStorage.FAVORITES) as { shows: number[] };
  }

  setLocalFavorites(favorites: number[]): void {
    setLocalStorage(LocalStorage.FAVORITES, { shows: favorites });
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
