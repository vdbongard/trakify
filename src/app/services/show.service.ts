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
import { episodeId } from '../helper/episodeId';
import { Config } from '../config';

@Injectable({
  providedIn: 'root',
})
export class ShowService {
  showsWatched = new BehaviorSubject<ShowWatched[]>(
    getLocalStorage<{ shows: ShowWatched[] }>(LocalStorage.SHOWS_WATCHED)?.shows || []
  );
  showsHidden = new BehaviorSubject<ShowHidden[]>(
    getLocalStorage<{ shows: ShowHidden[] }>(LocalStorage.SHOWS_HIDDEN)?.shows || []
  );
  showsProgress = new BehaviorSubject<{ [id: number]: ShowProgress }>(
    getLocalStorage<{ [id: number]: ShowProgress }>(LocalStorage.SHOWS_PROGRESS) || {}
  );
  showsProgressSubscriptions = new BehaviorSubject<{ [id: number]: Subscription }>({});
  showsEpisodes = new BehaviorSubject<{ [id: string]: EpisodeFull }>(
    getLocalStorage<{ [id: string]: EpisodeFull }>(LocalStorage.SHOWS_EPISODES) || {}
  );
  showsEpisodesSubscriptions = new BehaviorSubject<{ [id: string]: Subscription }>({});
  favorites = new BehaviorSubject<number[]>(
    getLocalStorage<{ shows: number[] }>(LocalStorage.FAVORITES)?.shows || []
  );

  constructor(private http: HttpClient) {}

  fetchShowsWatched(): Observable<ShowWatched[]> {
    return this.http.get<ShowWatched[]>(
      `${Config.traktBaseUrl}/sync/watched/shows?extended=noseasons`,
      Config.traktOptions
    );
  }

  fetchShowsWatchedHistory(startAt?: string): Observable<ShowWatchedHistory[]> {
    const options = Config.traktOptions;

    if (startAt) {
      // eslint-disable-next-line @typescript-eslint/naming-convention
      options.params = { ...options.params, ...{ start_at: startAt } };
    }

    return this.http.get<ShowWatchedHistory[]>(
      `${Config.traktBaseUrl}/sync/history/shows`,
      options
    );
  }

  fetchShowProgress(id: number): Observable<ShowProgress> {
    return this.http
      .get<ShowProgress>(`${Config.traktBaseUrl}/shows/${id}/progress/watched`, Config.traktOptions)
      .pipe(retry({ count: 3, delay: 2000 }));
  }

  fetchShowsHidden(): Observable<ShowHidden[]> {
    return this.http.get<ShowHidden[]>(
      `${Config.traktBaseUrl}/users/hidden/progress_watched?type=show`,
      Config.traktOptions
    );
  }

  fetchShow(id: number | string): Observable<TraktShow> {
    const options = Config.traktOptions;
    return this.http.get<TraktShow>(`${Config.traktBaseUrl}/shows/${id}`, options);
  }

  fetchShowsEpisode(id: number, season: number, episode: number): Observable<EpisodeFull> {
    const options = Config.traktOptions;
    options.params = { ...options.params, ...{ extended: 'full' } };

    return this.http
      .get<EpisodeFull>(
        `${Config.traktBaseUrl}/shows/${id}/seasons/${season}/episodes/${episode}`,
        options
      )
      .pipe(retry({ count: 3, delay: 2000 }));
  }

  fetchSearchForShows(query: string): Observable<ShowSearch[]> {
    return this.http.get<ShowSearch[]>(
      `${Config.traktBaseUrl}/search/show?query=${query}`,
      Config.traktOptions
    );
  }

  fetchTrendingShows(): Observable<TrendingShow[]> {
    return this.http.get<TrendingShow[]>(
      `${Config.traktBaseUrl}/shows/trending`,
      Config.traktOptions
    );
  }

  fetchPopularShows(): Observable<TraktShow[]> {
    return this.http.get<TraktShow[]>(`${Config.traktBaseUrl}/shows/popular`, Config.traktOptions);
  }

  fetchRecommendedShows(): Observable<RecommendedShow[]> {
    return this.http.get<RecommendedShow[]>(
      `${Config.traktBaseUrl}/shows/recommended`,
      Config.traktOptions
    );
  }

  addToHistory(episode: Episode): Observable<AddToHistoryResponse> {
    return this.http.post<AddToHistoryResponse>(
      `${Config.traktBaseUrl}/sync/history`,
      { episodes: [episode] },
      Config.traktOptions
    );
  }

  removeFromHistory(episode: Episode): Observable<RemoveFromHistoryResponse> {
    return this.http.post<RemoveFromHistoryResponse>(
      `${Config.traktBaseUrl}/sync/history/remove`,
      { episodes: [episode] },
      Config.traktOptions
    );
  }

  getShowWatched(id: number): ShowWatched | undefined {
    return this.showsWatched.value.find((show) => show.show.ids.trakt === id);
  }

  getSeasonWatched(id: number, season: number): SeasonWatched | undefined {
    return this.getShowWatched(id)?.seasons?.[season - 1];
  }

  getShowsProgress(id: number): ShowProgress | undefined {
    return this.showsProgress.value[id];
  }

  getSeasonProgress(id: number, season: number): SeasonProgress | undefined {
    return this.getShowsProgress(id)?.seasons?.[season - 1];
  }

  getEpisodeProgress(showId: number, season: number, episode: number): EpisodeProgress | undefined {
    return this.getSeasonProgress(showId, season)?.episodes?.[episode - 1];
  }

  getEpisode(showId: number, season: number, episode: number): EpisodeFull | undefined {
    return this.showsEpisodes.value[episodeId(showId, season, episode)];
  }

  getIdForSlug(slug: string): Ids | undefined {
    return this.showsWatched.value.find((show) => show.show.ids.slug === slug)?.show.ids;
  }

  addFavorite(id: number): void {
    const favorites = this.favorites.value;
    if (favorites.includes(id)) return;

    favorites.push(id);
    setLocalStorage<{ shows: number[] }>(LocalStorage.FAVORITES, { shows: favorites });
    this.favorites.next(favorites);
  }

  removeFavorite(id: number): void {
    let favorites = this.favorites.value;
    if (!favorites.includes(id)) return;

    favorites = favorites.filter((favorite) => favorite !== id);
    setLocalStorage<{ shows: number[] }>(LocalStorage.FAVORITES, { shows: favorites });
    this.favorites.next(favorites);
  }

  searchForAddedShows(query: string): Observable<TraktShow[]> {
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
