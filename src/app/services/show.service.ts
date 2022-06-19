import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, Subscription } from 'rxjs';
import {
  EpisodeFull,
  EpisodeProgress,
  Ids,
  SeasonProgress,
  ShowHidden,
  ShowProgress,
  ShowWatched,
  ShowWatchedHistory,
} from '../../types/interfaces/Trakt';
import { LocalStorage } from '../../types/enum';
import { getLocalStorage, setLocalStorage } from '../helper/local-storage';
import { ConfigService } from './config.service';

@Injectable({
  providedIn: 'root',
})
export class ShowService {
  showsWatched = new BehaviorSubject<ShowWatched[]>(this.getLocalShowsWatched().shows);
  showsHidden = new BehaviorSubject<ShowHidden[]>(this.getLocalShowsHidden().shows);
  showsProgress = new BehaviorSubject<{ [id: number]: ShowProgress }>(this.getLocalShowsProgress());
  showsProgressSubscriptions = new BehaviorSubject<{ [id: number]: Subscription }>({});
  showsEpisodes = new BehaviorSubject<{ [id: string]: EpisodeFull }>(this.getLocalShowsEpisodes());
  showsEpisodesSubscriptions = new BehaviorSubject<{ [id: string]: Subscription }>({});
  favorites = new BehaviorSubject<number[]>(this.getLocalFavorites().shows);

  constructor(private http: HttpClient, private configService: ConfigService) {}

  getShowsWatched(): Observable<ShowWatched[]> {
    return this.http.get<ShowWatched[]>(
      `${this.configService.traktBaseUrl}/sync/watched/shows?extended=noseasons`,
      this.configService.traktOptions
    );
  }

  getShowWatchedLocally(id: number): ShowWatched | undefined {
    return this.showsWatched.value.find((show) => show.show.ids.trakt === id);
  }

  getIdForSlug(slug: string): Ids | undefined {
    return this.showsWatched.value.find((show) => show.show.ids.slug === slug)?.show.ids;
  }

  getShowsWatchedHistory(startAt?: string): Observable<ShowWatchedHistory[]> {
    const options = this.configService.traktOptions;

    if (startAt) {
      // eslint-disable-next-line @typescript-eslint/naming-convention
      options.params = { ...options.params, ...{ start_at: startAt } };
    }

    return this.http.get<ShowWatchedHistory[]>(
      `${this.configService.traktBaseUrl}/sync/history/shows`,
      options
    );
  }

  getShowProgress(id: number): Observable<ShowProgress> {
    return this.http.get<ShowProgress>(
      `${this.configService.traktBaseUrl}/shows/${id}/progress/watched`,
      this.configService.traktOptions
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

  getLocalShowsProgress(): { [id: number]: ShowProgress } {
    return getLocalStorage<{ [id: number]: ShowProgress }>(LocalStorage.SHOWS_PROGRESS) || {};
  }

  setLocalShowsProgress(showProgress: { [id: number]: ShowProgress }): void {
    setLocalStorage(LocalStorage.SHOWS_PROGRESS, showProgress);
  }

  getLocalShowsWatched(): { shows: ShowWatched[] } {
    return getLocalStorage<{ shows: ShowWatched[] }>(LocalStorage.SHOWS_WATCHED) || { shows: [] };
  }

  setLocalShowsWatched(showsWatched: { shows: ShowWatched[] }): void {
    setLocalStorage(LocalStorage.SHOWS_WATCHED, showsWatched);
  }

  getShowsHidden(): Observable<ShowHidden[]> {
    return this.http.get<ShowHidden[]>(
      `${this.configService.traktBaseUrl}/users/hidden/progress_watched?type=show`,
      this.configService.traktOptions
    );
  }

  getLocalShowsHidden(): { shows: ShowHidden[] } {
    return getLocalStorage<{ shows: ShowHidden[] }>(LocalStorage.SHOWS_HIDDEN) || { shows: [] };
  }

  setLocalShowsHidden(showHidden: ShowHidden[]): void {
    setLocalStorage(LocalStorage.SHOWS_HIDDEN, {
      shows: showHidden,
    });
  }

  getShowsEpisode(id: number, season: number, episode: number): Observable<EpisodeFull> {
    return this.http.get<EpisodeFull>(
      `${this.configService.traktBaseUrl}/shows/${id}/seasons/${season}/episodes/${episode}?extended=full`,
      this.configService.traktOptions
    );
  }

  getLocalShowsEpisodes(): { [id: string]: EpisodeFull } {
    return getLocalStorage<{ [id: string]: EpisodeFull }>(LocalStorage.SHOWS_EPISODES) || {};
  }

  setLocalShowsEpisodes(showsEpisodes: { [id: string]: EpisodeFull }): void {
    setLocalStorage(LocalStorage.SHOWS_EPISODES, showsEpisodes);
  }

  getLocalFavorites(): { shows: number[] } {
    return getLocalStorage<{ shows: number[] }>(LocalStorage.FAVORITES) || { shows: [] };
  }

  setLocalFavorites(favorites: number[]): void {
    setLocalStorage(LocalStorage.FAVORITES, {
      shows: favorites,
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
