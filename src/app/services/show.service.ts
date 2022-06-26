import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, of, retry, Subscription } from 'rxjs';
import {
  AddToHistoryResponse,
  Episode,
  EpisodeFull,
  EpisodeProgress,
  Ids,
  RecommendedShow,
  RemoveFromHistoryResponse,
  SeasonProgress,
  SeasonWatched,
  ShowHidden,
  ShowProgress,
  ShowSearch,
  ShowWatched,
  ShowWatchedHistory,
  TraktShow,
  TrendingShow,
} from '../../types/interfaces/Trakt';
import { LocalStorage } from '../../types/enum';
import { getLocalStorage, setLocalStorage } from '../helper/local-storage';
import { ConfigService } from './config.service';
import { episodeId } from '../helper/episodeId';

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
    return this.http
      .get<ShowProgress>(
        `${this.configService.traktBaseUrl}/shows/${id}/progress/watched`,
        this.configService.traktOptions
      )
      .pipe(retry({ count: 3, delay: 2000 }));
  }

  getShowsHidden(): Observable<ShowHidden[]> {
    return this.http.get<ShowHidden[]>(
      `${this.configService.traktBaseUrl}/users/hidden/progress_watched?type=show`,
      this.configService.traktOptions
    );
  }

  getShow(id: number | string): Observable<TraktShow> {
    const options = this.configService.traktOptions;
    return this.http.get<TraktShow>(`${this.configService.traktBaseUrl}/shows/${id}`, options);
  }

  getShowsEpisode(id: number, season: number, episode: number): Observable<EpisodeFull> {
    const options = this.configService.traktOptions;
    options.params = { ...options.params, ...{ extended: 'full' } };

    return this.http
      .get<EpisodeFull>(
        `${this.configService.traktBaseUrl}/shows/${id}/seasons/${season}/episodes/${episode}`,
        options
      )
      .pipe(retry({ count: 3, delay: 2000 }));
  }

  getSearchForShows(query: string): Observable<ShowSearch[]> {
    return this.http.get<ShowSearch[]>(
      `${this.configService.traktBaseUrl}/search/show?query=${query}`,
      this.configService.traktOptions
    );
  }

  getTrendingShows(): Observable<TrendingShow[]> {
    return this.http.get<TrendingShow[]>(
      `${this.configService.traktBaseUrl}/shows/trending`,
      this.configService.traktOptions
    );
  }

  getPopularShows(): Observable<TraktShow[]> {
    return this.http.get<TraktShow[]>(
      `${this.configService.traktBaseUrl}/shows/popular`,
      this.configService.traktOptions
    );
  }

  getRecommendedShows(): Observable<RecommendedShow[]> {
    return this.http.get<RecommendedShow[]>(
      `${this.configService.traktBaseUrl}/shows/recommended`,
      this.configService.traktOptions
    );
  }

  addToHistory(episode: Episode): Observable<AddToHistoryResponse> {
    return this.http.post<AddToHistoryResponse>(
      `${this.configService.traktBaseUrl}/sync/history`,
      { episodes: [episode] },
      this.configService.traktOptions
    );
  }

  removeFromHistory(episode: Episode): Observable<RemoveFromHistoryResponse> {
    return this.http.post<RemoveFromHistoryResponse>(
      `${this.configService.traktBaseUrl}/sync/history/remove`,
      { episodes: [episode] },
      this.configService.traktOptions
    );
  }

  getShowWatchedLocally(id: number): ShowWatched | undefined {
    return this.showsWatched.value.find((show) => show.show.ids.trakt === id);
  }

  getSeasonWatchedLocally(id: number, season: number): SeasonWatched | undefined {
    return this.getShowWatchedLocally(id)?.seasons?.[season - 1];
  }

  getShowsProgressLocally(id: number): ShowProgress | undefined {
    return this.showsProgress.value[id];
  }

  getSeasonProgressLocally(id: number, season: number): SeasonProgress | undefined {
    return this.getShowsProgressLocally(id)?.seasons?.[season - 1];
  }

  getEpisodeProgressLocally(
    showId: number,
    season: number,
    episode: number
  ): EpisodeProgress | undefined {
    return this.getSeasonProgressLocally(showId, season)?.episodes?.[episode - 1];
  }

  getEpisodeLocally(showId: number, season: number, episode: number): EpisodeFull | undefined {
    return this.showsEpisodes.value[episodeId(showId, season, episode)];
  }

  getIdForSlug(slug: string): Ids | undefined {
    return this.showsWatched.value.find((show) => show.show.ids.slug === slug)?.show.ids;
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

  getLocalShowsHidden(): { shows: ShowHidden[] } {
    return getLocalStorage<{ shows: ShowHidden[] }>(LocalStorage.SHOWS_HIDDEN) || { shows: [] };
  }

  setLocalShowsHidden(showHidden: ShowHidden[]): void {
    setLocalStorage(LocalStorage.SHOWS_HIDDEN, {
      shows: showHidden,
    });
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

  getSearchForAddedShows(query: string): Observable<TraktShow[]> {
    const queryLowerCase = query.toLowerCase();
    const shows = this.showsWatched.value
      .filter((showWatched) => showWatched.show.title.toLowerCase().includes(queryLowerCase))
      .map((showWatched) => showWatched.show);
    shows.sort((a, b) =>
      a.title.toLowerCase().startsWith(queryLowerCase) &&
      !b.title.toLowerCase().startsWith(queryLowerCase)
        ? -1
        : 1
    );
    return of(shows);
  }

  addShow(id: number): void {
    console.log('Add show ' + id);
  }
}
