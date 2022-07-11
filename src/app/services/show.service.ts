import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import {
  BehaviorSubject,
  catchError,
  combineLatest,
  forkJoin,
  map,
  Observable,
  of,
  switchMap,
  take,
  zip,
} from 'rxjs';
import {
  Episode,
  EpisodeAiring,
  EpisodeFull,
  EpisodeProgress,
  Ids,
  LastActivity,
  RecommendedShow,
  SeasonProgress,
  SeasonWatched,
  ShowHidden,
  ShowProgress,
  ShowSearch,
  ShowWatched,
  ShowWatchedHistory,
  Stats,
  TraktShow,
  TrendingShow,
} from '../../types/interfaces/Trakt';
import { Filter, LocalStorage, Sort, SortOptions } from '../../types/enum';
import { getLocalStorage, setLocalStorage } from '../helper/local-storage';
import { episodeId } from '../helper/episodeId';
import { Config } from '../config';
import { ShowInfo } from '../../types/interfaces/Show';
import { TmdbService } from './tmdb.service';
import { TmdbEpisode, TmdbShow } from '../../types/interfaces/Tmdb';
import { formatDate } from '@angular/common';
import { ConfigService } from './config.service';
import { Config as IConfig } from '../../types/interfaces/Config';
import { MatDialog } from '@angular/material/dialog';
import { ListDialogComponent } from '../shared/components/list-dialog/list-dialog.component';
import { ListItemsDialogData, ListsDialogData } from '../../types/interfaces/Dialog';
import { AddListDialogComponent } from '../shared/components/add-list-dialog/add-list-dialog.component';
import { Router } from '@angular/router';
import { ListItemsDialogComponent } from '../shared/components/list-items-dialog/list-items-dialog.component';
import {
  AddToHistoryResponse,
  AddToListResponse,
  AddToWatchlistResponse,
  RemoveFromHistoryResponse,
  RemoveFromListResponse,
  RemoveFromWatchlistResponse,
} from '../../types/interfaces/TraktResponse';
import { List, ListItem, WatchlistItem } from '../../types/interfaces/TraktList';
import { syncArrayTrakt, syncObjectsTrakt } from '../helper/sync';
import { HttpOptions } from '../../types/interfaces/Http';

@Injectable({
  providedIn: 'root',
})
export class ShowService {
  showsWatched$: BehaviorSubject<ShowWatched[]>;
  syncShowsWatched: () => Promise<void>;

  showsProgress$: BehaviorSubject<{ [showId: number]: ShowProgress }>;
  syncShowProgress: (showId: number) => Promise<void>;

  showsHidden$: BehaviorSubject<ShowHidden[]>;
  syncShowsHidden: () => Promise<void>;

  showsEpisodes$: BehaviorSubject<{ [episodeId: string]: EpisodeFull }>;
  syncShowEpisode: (
    showId: number | undefined,
    seasonNumber: number | undefined,
    episodeNumber: number | undefined
  ) => Promise<void>;
  fetchShowEpisode: (
    showId: number,
    seasonNumber: number,
    episodeNumber: number
  ) => Observable<EpisodeFull>;

  favorites$: BehaviorSubject<number[]>;
  syncFavorites: () => Promise<void>;

  addedShowInfos$: BehaviorSubject<{ [showId: number]: ShowInfo }>;
  syncAddedShowInfo: (showId: number) => Promise<void>;

  watchlist$: BehaviorSubject<WatchlistItem[]>;
  syncWatchlist: () => Promise<void>;

  updated = new BehaviorSubject(undefined);

  constructor(
    private http: HttpClient,
    private tmdbService: TmdbService,
    private configService: ConfigService,
    private dialog: MatDialog,
    private router: Router
  ) {
    const [showsWatched$, syncShowsWatched] = syncArrayTrakt<ShowWatched>({
      http: this.http,
      url: '/sync/watched/shows?extended=noseasons',
      localStorageKey: LocalStorage.SHOWS_WATCHED,
    });
    this.showsWatched$ = showsWatched$;
    this.syncShowsWatched = syncShowsWatched;

    const [showsProgress$, syncShowProgress] = syncObjectsTrakt<ShowProgress>({
      http: this.http,
      url: '/shows/%/progress/watched',
      localStorageKey: LocalStorage.SHOWS_PROGRESS,
      ignoreExisting: true,
    });
    this.showsProgress$ = showsProgress$;
    this.syncShowProgress = syncShowProgress;

    const [showsHidden$, syncShowsHidden] = syncArrayTrakt<ShowHidden>({
      http: this.http,
      url: '/users/hidden/progress_watched?type=show',
      localStorageKey: LocalStorage.SHOWS_HIDDEN,
    });
    this.showsHidden$ = showsHidden$;
    this.syncShowsHidden = syncShowsHidden;

    const [showsEpisodes$, syncShowEpisode, fetchShowEpisode] = syncObjectsTrakt<EpisodeFull>({
      http: this.http,
      url: '/shows/%/seasons/%/episodes/%?extended=full',
      localStorageKey: LocalStorage.SHOWS_EPISODES,
      // @ts-ignore
      idFormatter: episodeId,
    });
    this.showsEpisodes$ = showsEpisodes$;
    this.syncShowEpisode = syncShowEpisode;
    this.fetchShowEpisode = fetchShowEpisode;

    const [favorites$, syncFavorites] = syncArrayTrakt<number>({
      localStorageKey: LocalStorage.FAVORITES,
    });
    this.favorites$ = favorites$;
    this.syncFavorites = syncFavorites;

    const [addedShowInfos$, syncAddedShowInfo] = syncObjectsTrakt<ShowInfo>({
      localStorageKey: LocalStorage.ADDED_SHOW_INFO,
    });
    this.addedShowInfos$ = addedShowInfos$;
    this.syncAddedShowInfo = syncAddedShowInfo;

    const [watchlist$, syncWatchlist] = syncArrayTrakt<WatchlistItem>({
      http: this.http,
      url: '/users/me/watchlist/shows',
      localStorageKey: LocalStorage.WATCHLIST,
    });
    this.watchlist$ = watchlist$;
    this.syncWatchlist = syncWatchlist;
  }

  async syncShowsProgress(
    showsWatched: ShowWatched[],
    showsProgress$: BehaviorSubject<{ [p: number]: ShowProgress }>
  ): Promise<void> {
    const localLastActivity = getLocalStorage<LastActivity>(LocalStorage.LAST_ACTIVITY);
    const isFirstSync = !localLastActivity;

    const promises = showsWatched
      .map((showWatched) => {
        const showId = showWatched.show.ids.trakt;

        if (isFirstSync) {
          return this.syncShowProgress(showId);
        }

        const localShowWatched = this.getShowWatched(showId);
        const showsProgress = showsProgress$.value;
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

        return this.syncShowProgress(showId);
      })
      .filter(Boolean) as Promise<void>[];

    await Promise.all(promises);
  }

  fetchShowsWatchedHistory(startAt?: string): Observable<ShowWatchedHistory[]> {
    const options: HttpOptions = {};

    if (startAt) {
      // eslint-disable-next-line @typescript-eslint/naming-convention
      options.params = { start_at: startAt };
    }

    return this.http.get<ShowWatchedHistory[]>(
      `${Config.traktBaseUrl}/sync/history/shows`,
      options
    );
  }

  fetchShow(showId: number | string): Observable<TraktShow> {
    return this.http.get<TraktShow>(`${Config.traktBaseUrl}/shows/${showId}`);
  }

  fetchSearchForShows(query: string): Observable<ShowSearch[]> {
    return this.http.get<ShowSearch[]>(`${Config.traktBaseUrl}/search/show?query=${query}`);
  }

  fetchTrendingShows(): Observable<TrendingShow[]> {
    return this.http.get<TrendingShow[]>(`${Config.traktBaseUrl}/shows/trending`);
  }

  fetchPopularShows(): Observable<TraktShow[]> {
    return this.http.get<TraktShow[]>(`${Config.traktBaseUrl}/shows/popular`);
  }

  fetchRecommendedShows(): Observable<RecommendedShow[]> {
    return this.http.get<RecommendedShow[]>(`${Config.traktBaseUrl}/shows/recommended`);
  }

  private fetchSingleCalendar(days = 33, date: string): Observable<EpisodeAiring[]> {
    return this.http.get<EpisodeAiring[]>(
      `${Config.traktBaseUrl}/calendars/my/shows/${date}/${days}`
    );
  }

  fetchCalendar(days = 33, startDate = new Date()): Observable<EpisodeAiring[]> {
    const daysEach = 33;
    const formatCustomDate = (date: Date): string => formatDate(date, 'yyyy-MM-dd', 'en-US');

    if (days < daysEach) {
      return this.fetchSingleCalendar(days, formatCustomDate(startDate));
    }

    const times = Math.ceil(days / daysEach);
    const timesArray = Array(times).fill(0);

    const dateEach = timesArray.map((_, i) => {
      const date = new Date(startDate);
      if (i > 0) date.setDate(date.getDate() + i * daysEach);
      const dateFormatted = formatCustomDate(date);
      const singleDays = i === times - 1 ? days % daysEach || daysEach : daysEach;
      return this.fetchSingleCalendar(singleDays, dateFormatted);
    });

    return forkJoin(dateEach).pipe(map((results) => results.flat()));
  }

  fetchLists(userId = 'me'): Observable<List[]> {
    return this.http.get<List[]>(`${Config.traktBaseUrl}/users/${userId}/lists`);
  }

  fetchListItems(listId: string | number, userId = 'me'): Observable<ListItem[]> {
    return this.http.get<ListItem[]>(
      `${Config.traktBaseUrl}/users/${userId}/lists/${listId}/items/show`
    );
  }

  fetchStats(userId = 'me'): Observable<Stats> {
    return this.http.get<Stats>(`${Config.traktBaseUrl}/users/${userId}/stats`);
  }

  addToHistory(episode: Episode): Observable<AddToHistoryResponse> {
    return this.http.post<AddToHistoryResponse>(`${Config.traktBaseUrl}/sync/history`, {
      episodes: [episode],
    });
  }

  removeFromHistory(episode: Episode): Observable<RemoveFromHistoryResponse> {
    return this.http.post<RemoveFromHistoryResponse>(`${Config.traktBaseUrl}/sync/history/remove`, {
      episodes: [episode],
    });
  }

  addShowsToList(listId: number, showIds: number[], userId = 'me'): Observable<AddToListResponse> {
    return this.http.post<AddToListResponse>(
      `${Config.traktBaseUrl}/users/${userId}/lists/${listId}/items`,
      {
        shows: showIds.map((showId) => ({
          ids: {
            trakt: showId,
          },
        })),
      }
    );
  }

  removeShowsFromList(
    listId: number,
    showIds: number[],
    userId = 'me'
  ): Observable<RemoveFromListResponse> {
    return this.http.post<RemoveFromListResponse>(
      `${Config.traktBaseUrl}/users/${userId}/lists/${listId}/items/remove`,
      {
        shows: showIds.map((showId) => ({
          ids: {
            trakt: showId,
          },
        })),
      }
    );
  }

  getShowWatched(showId?: number): ShowWatched | undefined {
    if (!showId) return;
    return (
      this.showsWatched$.value.find((show) => show.show.ids.trakt === showId) ||
      this.addedShowInfos$.value[showId]?.showWatched
    );
  }

  getShow(showId?: number): TraktShow | undefined {
    if (!showId) return;
    const shows = this.getShows();
    return shows.find((show) => show.ids.trakt === showId);
  }

  getShowProgress(showId?: number): ShowProgress | undefined {
    if (!showId) return;
    return this.showsProgress$.value[showId] || this.addedShowInfos$.value[showId]?.showProgress;
  }

  getSeasonProgress(showId: number, seasonNumber: number): SeasonProgress | undefined {
    return this.getShowProgress(showId)?.seasons?.[seasonNumber - 1];
  }

  getEpisodeProgress(
    showId: number,
    seasonNumber: number,
    episodeNumber: number
  ): EpisodeProgress | undefined {
    return this.getSeasonProgress(showId, seasonNumber)?.episodes?.[episodeNumber - 1];
  }

  getEpisode(showId: number, seasonNumber: number, episodeNumber: number): EpisodeFull | undefined {
    return this.showsEpisodes$.value[episodeId(showId, seasonNumber, episodeNumber)];
  }

  getEpisode$(
    ids: Ids,
    seasonNumber: number,
    episodeNumber: number
  ): Observable<[EpisodeFull, TmdbEpisode]> {
    const episode$ = this.showsEpisodes$.pipe(
      map((episodes) => episodes[episodeId(ids.trakt, seasonNumber, episodeNumber)])
    );

    const episodeWithFallbackFetch$ = episode$.pipe(
      switchMap((episodeFull) =>
        episodeFull
          ? of(episodeFull)
          : this.fetchShowEpisode(ids.trakt, seasonNumber, episodeNumber)
      ),
      take(1)
    );

    const tmdbEpisodeFetch$ = this.tmdbService.fetchEpisode(ids.tmdb, seasonNumber, episodeNumber);

    return forkJoin([episodeWithFallbackFetch$, tmdbEpisodeFetch$]);
  }

  getIdForSlug(slug?: string): Ids | undefined {
    if (!slug) return;
    const shows = this.getShows();
    return shows.find((show) => show?.ids.slug === slug)?.ids;
  }

  getShows(): TraktShow[] {
    return [
      ...this.showsWatched$.value.map((showWatched) => showWatched.show),
      ...this.watchlist$.value.map((watchlistItem) => watchlistItem.show),
      ...Object.values(this.addedShowInfos$.value).map((showInfo) => showInfo.show),
    ].filter(Boolean) as TraktShow[];
  }

  addFavorite(showId: number): void {
    const favorites = this.favorites$.value;
    if (favorites.includes(showId)) return;

    favorites.push(showId);
    setLocalStorage<{ shows: number[] }>(LocalStorage.FAVORITES, { shows: favorites });
    this.favorites$.next(favorites);
  }

  removeFavorite(showId: number): void {
    let favorites = this.favorites$.value;
    if (!favorites.includes(showId)) return;

    favorites = favorites.filter((favorite) => favorite !== showId);
    setLocalStorage<{ shows: number[] }>(LocalStorage.FAVORITES, { shows: favorites });
    this.favorites$.next(favorites);
  }

  searchForAddedShows$(query: string): Observable<TraktShow[]> {
    return this.getShowsWatchedWatchlistedAndAdded$().pipe(
      map((shows) => {
        const queryLowerCase = query.toLowerCase();
        shows = shows.filter((show) => show.title.toLowerCase().includes(queryLowerCase));
        shows.sort((a, b) =>
          a.title.toLowerCase().startsWith(queryLowerCase) &&
          !b.title.toLowerCase().startsWith(queryLowerCase)
            ? -1
            : 1
        );
        return shows;
      }),
      take(1)
    );
  }

  addNewShow(ids: Ids, episode?: Episode): void {
    if (episode && !(episode.season === 1 && episode.number === 1)) return;

    const showInfos = this.addedShowInfos$.value;

    forkJoin([
      this.fetchShow(ids.trakt),
      this.tmdbService.fetchTmdbShow(ids.tmdb),
      this.fetchShowEpisode(ids.trakt, 1, 1),
    ]).subscribe(([show, tmdbShow, nextEpisode]) => {
      const showInfo = this.getShowInfoForNewShow(show, tmdbShow, nextEpisode);
      if (!showInfo) return;
      showInfos[show.ids.trakt] = showInfo;
      setLocalStorage<{ [showId: number]: ShowInfo }>(LocalStorage.ADDED_SHOW_INFO, showInfos);
      this.addedShowInfos$.next(showInfos);
    });
  }

  removeNewShow(showId: number): void {
    const addedShow = this.addedShowInfos$.value[showId];
    if (!addedShow) return;

    delete this.addedShowInfos$.value[showId];
    setLocalStorage<{ [showId: number]: ShowInfo }>(
      LocalStorage.ADDED_SHOW_INFO,
      this.addedShowInfos$.value
    );
    this.addedShowInfos$.next(this.addedShowInfos$.value);
    this.removeFavorite(showId);
  }

  getShowInfoForNewShow(
    show: TraktShow,
    tmdbShow: TmdbShow | undefined,
    nextEpisode: EpisodeFull
  ): ShowInfo | undefined {
    if (!tmdbShow) return;
    return {
      show,
      nextEpisode,
      showProgress: {
        aired: tmdbShow.number_of_episodes,
        completed: 0,
        // eslint-disable-next-line @typescript-eslint/naming-convention
        last_episode: null,
        // eslint-disable-next-line @typescript-eslint/naming-convention
        last_watched_at: null,
        // eslint-disable-next-line @typescript-eslint/naming-convention
        next_episode: {
          ids: {
            imdb: '',
            slug: '',
            tmdb: 0,
            trakt: 0,
            tvdb: 0,
            tvrage: 0,
          },
          number: 1,
          season: 1,
          title: nextEpisode.title,
        },
        // eslint-disable-next-line @typescript-eslint/naming-convention
        reset_at: null,
        seasons: tmdbShow.seasons
          .map((tmdbSeason) => {
            if (tmdbSeason.season_number === 0) return;
            return {
              aired: tmdbSeason.episode_count,
              completed: 0,
              episodes: Array(tmdbSeason.episode_count)
                .fill(0)
                .map((_, index) => {
                  return {
                    completed: false,
                    // eslint-disable-next-line @typescript-eslint/naming-convention
                    last_watched_at: null,
                    number: index + 1,
                  };
                }),
              number: tmdbSeason.season_number,
              title: tmdbSeason.name,
            };
          })
          .filter(Boolean) as SeasonProgress[],
      },
      showWatched: {
        // eslint-disable-next-line @typescript-eslint/naming-convention
        last_updated_at: null,
        // eslint-disable-next-line @typescript-eslint/naming-convention
        last_watched_at: null,
        plays: 0,
        // eslint-disable-next-line @typescript-eslint/naming-convention
        reset_at: null,
        seasons: tmdbShow.seasons
          .map((tmdbSeason) => {
            if (tmdbSeason.season_number === 0) return;
            return {
              number: tmdbSeason.season_number,
              episodes: Array(tmdbSeason.episode_count)
                .fill(0)
                .map((_, index) => {
                  return {
                    // eslint-disable-next-line @typescript-eslint/naming-convention
                    last_watched_at: null,
                    number: index + 1,
                    plays: 0,
                  };
                }),
            };
          })
          .filter(Boolean) as SeasonWatched[],
        show,
      },
    };
  }

  getShowsAdded$(): Observable<TraktShow[]> {
    const showsWatched = this.showsWatched$.pipe(
      map((showsWatched) => showsWatched.map((showWatched) => showWatched.show))
    );
    const showsAdded = this.addedShowInfos$.pipe(
      map(
        (addedShowInfos) =>
          Object.values(addedShowInfos)
            .map((addedShowInfo) => addedShowInfo.show)
            .filter(Boolean) as TraktShow[]
      )
    );
    return combineLatest([showsWatched, showsAdded]).pipe(
      map(([showsWatched, showsAdded]) => [...showsWatched, ...showsAdded])
    );
  }

  getShowsWatchedWatchlistedAndAdded$(): Observable<TraktShow[]> {
    const showsWatched = this.showsWatched$.pipe(
      map((showsWatched) => showsWatched.map((showWatched) => showWatched.show))
    );
    const watchlist = this.watchlist$.pipe(
      map((watchlistItems) => watchlistItems.map((watchlistItem) => watchlistItem.show))
    );
    const showsAdded = this.addedShowInfos$.pipe(
      map(
        (addedShowInfos) =>
          Object.values(addedShowInfos)
            .map((addedShowInfo) => addedShowInfo.show)
            .filter(Boolean) as TraktShow[]
      )
    );
    return combineLatest([showsWatched, watchlist, showsAdded]).pipe(
      map(([showsWatched, watchlist, showsAdded]) => [...showsWatched, ...watchlist, ...showsAdded])
    );
  }

  getShowProgressAll$(showId?: number): Observable<ShowProgress | undefined> {
    if (!showId) return of(undefined);

    const showProgress: Observable<ShowProgress | undefined> = this.showsProgress$.pipe(
      map((showsProgress) => showsProgress[showId])
    );
    const showAddedProgress = this.addedShowInfos$.pipe(
      map((addedShowInfos) => addedShowInfos[showId]?.showProgress)
    );
    return combineLatest([showProgress, showAddedProgress]).pipe(
      map(([showProgress, showAddedProgress]) => showProgress || showAddedProgress)
    );
  }

  getShowEpisodeAll$(
    showId?: number,
    seasonNumber?: number,
    episodeNumber?: number
  ): Observable<EpisodeFull | undefined> {
    if (!showId || !seasonNumber || !episodeNumber) return of(undefined);

    const showEpisode: Observable<EpisodeFull | undefined> = this.showsEpisodes$.pipe(
      map((showsEpisodes) => showsEpisodes[episodeId(showId, seasonNumber, episodeNumber)])
    );
    const showAddedEpisode = this.addedShowInfos$.pipe(
      map((addedShowInfos) => addedShowInfos[showId]?.nextEpisode)
    );
    return combineLatest([showEpisode, showAddedEpisode]).pipe(
      switchMap(([showEpisode, showAddedEpisode]) => {
        const episode = showEpisode || showAddedEpisode;
        return episode ? of(episode) : this.fetchShowEpisode(showId, seasonNumber, episodeNumber);
      })
    );
  }

  getShowsFilteredAndSorted$(): Observable<ShowInfo[]> {
    return combineLatest([
      this.tmdbService.tmdbShows$,
      this.getShowsAdded$(),
      this.showsProgress$,
      this.showsHidden$,
      this.showsEpisodes$,
      this.favorites$,
      this.addedShowInfos$,
      this.configService.config$,
    ]).pipe(
      map(
        ([
          tmdbShows,
          showsAdded,
          showsProgress,
          showsHidden,
          showsEpisodes,
          favorites,
          addedShowInfos,
          config,
        ]) => {
          const tmdbShowsArray = Object.values(tmdbShows);

          Object.entries(addedShowInfos).forEach(([id, showInfo]) => {
            const showId = parseInt(id);
            showsProgress[showId] = showInfo.showProgress as ShowProgress;
            showsEpisodes[
              episodeId(
                showId,
                (showInfo.showProgress as ShowProgress).next_episode.season,
                (showInfo.showProgress as ShowProgress).next_episode.number
              )
            ] = showInfo.nextEpisode as EpisodeFull;
          });

          if (this.isMissing(showsAdded, tmdbShowsArray, showsProgress, showsEpisodes)) return [];

          const shows: ShowInfo[] = [];

          showsAdded.forEach((show) => {
            const showProgress = showsProgress[show.ids.trakt];
            const tmdbShow = tmdbShowsArray.find((tmdbShow) => tmdbShow?.id === show.ids.tmdb);

            if (this.filter(config, showProgress, tmdbShow, showsHidden, show)) return;

            const showWatched = this.getShowWatched(show.ids.trakt);

            shows.push(this.getShowInfo(show, showProgress, tmdbShow, favorites, showWatched));
          });

          this.sortShows(config, shows, showsEpisodes);

          return shows;
        }
      )
    );
  }

  private filter(
    config: IConfig,
    showProgress: ShowProgress,
    tmdbShow: TmdbShow | undefined,
    showsHidden: ShowHidden[],
    show: TraktShow
  ): boolean {
    for (const filter of config.filters.filter((filter) => filter.value)) {
      switch (filter.name) {
        case Filter.NO_NEW_EPISODES:
          if (this.hideNoNewEpisodes(showProgress)) return true;
          break;
        case Filter.COMPLETED:
          if (this.hideCompleted(showProgress, tmdbShow)) return true;
          break;
        case Filter.HIDDEN:
          if (this.hideHidden(showsHidden, show.ids.trakt)) return true;
          break;
      }
    }
    return false;
  }

  private sortShows(
    config: IConfig,
    shows: ShowInfo[],
    showsEpisodes: { [episodeId: string]: EpisodeFull }
  ): void {
    switch (config.sort.by) {
      case Sort.NEWEST_EPISODE:
        shows.sort((a, b) => this.sortByNewestEpisode(a, b, showsEpisodes));
        break;
      case Sort.LAST_WATCHED:
        break;
    }

    switch (config.sortOptions.find((sortOption) => sortOption.value)?.name) {
      case SortOptions.FAVORITES_FIRST:
        shows.sort((a, b) => this.sortFavoritesFirst(a, b));
        break;
    }
  }

  private getShowInfo(
    show: TraktShow,
    showProgress: ShowProgress,
    tmdbShow: TmdbShow | undefined,
    favorites: number[],
    showWatched: ShowWatched | undefined
  ): ShowInfo {
    const isFavorite = favorites.includes(show.ids.trakt);
    const nextEpisode =
      showProgress.next_episode &&
      this.getEpisode(
        show.ids.trakt,
        showProgress.next_episode.season,
        showProgress.next_episode.number
      );

    return { show, showProgress, tmdbShow, isFavorite, nextEpisode, showWatched };
  }

  private isMissing(
    showsAll: TraktShow[],
    tmdbShows: (TmdbShow | undefined)[],
    showsProgress: { [showId: number]: ShowProgress },
    showsEpisodes: { [episodeId: string]: EpisodeFull }
  ): boolean {
    for (const show of showsAll) {
      if (!tmdbShows.find((tmdbShow) => tmdbShow?.id === show.ids.tmdb)) return true;
      const showProgress = showsProgress[show.ids.trakt];
      if (!showProgress) return true;
      if (
        showProgress.next_episode &&
        !showsEpisodes[
          episodeId(
            show.ids.trakt,
            showProgress.next_episode.season,
            showProgress.next_episode.number
          )
        ]
      )
        return true;
    }
    return false;
  }

  private hideHidden(showsHidden: ShowHidden[], showId: number): boolean {
    return !!showsHidden.find((show) => show.show.ids.trakt === showId);
  }

  private hideNoNewEpisodes(showProgress: ShowProgress | undefined): boolean {
    return !!showProgress && showProgress.aired === showProgress.completed;
  }

  private hideCompleted(
    showProgress: ShowProgress | undefined,
    tmdbShow: TmdbShow | undefined
  ): boolean {
    return (
      !!showProgress &&
      !!tmdbShow &&
      ['Ended', 'Canceled'].includes(tmdbShow.status) &&
      showProgress.aired === showProgress.completed
    );
  }

  private sortByNewestEpisode(
    a: ShowInfo,
    b: ShowInfo,
    showsEpisodes: { [episodeId: string]: EpisodeFull }
  ): number {
    const nextEpisodeA =
      a.showProgress?.next_episode &&
      showsEpisodes[
        episodeId(
          a.show?.ids.trakt,
          a.showProgress.next_episode.season,
          a.showProgress.next_episode.number
        )
      ];
    const nextEpisodeB =
      b.showProgress?.next_episode &&
      showsEpisodes[
        episodeId(
          b.show?.ids.trakt,
          b.showProgress.next_episode.season,
          b.showProgress.next_episode.number
        )
      ];
    if (!nextEpisodeA) return 1;
    if (!nextEpisodeB) return -1;
    return (
      new Date(nextEpisodeB.first_aired).getTime() - new Date(nextEpisodeA.first_aired).getTime()
    );
  }

  private sortFavoritesFirst(a: ShowInfo, b: ShowInfo): number {
    if (a.isFavorite && !b.isFavorite) return -1;
    return 1;
  }

  manageListsViaDialog(showId: number): void {
    this.fetchLists()
      .pipe(
        switchMap((lists) =>
          zip([of(lists), forkJoin(lists.map((list) => this.fetchListItems(list.ids.trakt)))])
        )
      )
      .subscribe(([lists, listsListItems]) => {
        const isListContainingShow = listsListItems.map(
          (list) => !!list.find((listItem) => listItem.show.ids.trakt === showId)
        );
        const listIds = lists
          .map((list, i) => isListContainingShow[i] && list.ids.trakt)
          .filter(Boolean) as number[];

        const dialogRef = this.dialog.open<ListDialogComponent, ListsDialogData>(
          ListDialogComponent,
          {
            width: '250px',
            data: { showId, lists, listIds },
          }
        );

        dialogRef.afterClosed().subscribe((result) => {
          if (!result) return;

          const observables: Observable<AddToListResponse | RemoveFromListResponse>[] = [];

          if (result.added.length > 0) {
            observables.push(
              ...result.added.map((add: number) => this.addShowsToList(add, [showId]))
            );
          }

          if (result.removed.length > 0) {
            observables.push(
              ...result.removed.map((remove: number) => this.removeShowsFromList(remove, [showId]))
            );
          }

          forkJoin(observables).subscribe((responses) => {
            responses.forEach((res) => {
              if (res.not_found.shows.length > 0) {
                console.error('res', res);
              }
            });
          });
        });
      });
  }

  manageListItemsViaDialog(list: List): void {
    combineLatest([
      this.fetchListItems(list.ids.trakt),
      this.getShowsWatchedWatchlistedAndAdded$(),
    ]).subscribe(([listItems, shows]) => {
      shows.sort((a, b) => {
        return a.title > b.title ? 1 : -1;
      });
      const dialogRef = this.dialog.open<ListItemsDialogComponent, ListItemsDialogData>(
        ListItemsDialogComponent,
        {
          width: '500px',
          data: { list, listItems, shows },
        }
      );

      dialogRef.afterClosed().subscribe((result?: { added: number[]; removed: number[] }) => {
        if (!result) return;

        const observables: Observable<AddToListResponse | RemoveFromListResponse>[] = [];

        if (result.added.length > 0) {
          observables.push(this.addShowsToList(list.ids.trakt, result.added));
        }

        if (result.removed.length > 0) {
          observables.push(this.removeShowsFromList(list.ids.trakt, result.removed));
        }

        forkJoin(observables).subscribe((responses) => {
          responses.forEach((res) => {
            if (res.not_found.shows.length > 0) {
              console.error('res', res);
            }
          });
          this.updated.next(undefined);
        });
      });
    });
  }

  addListViaDialog(): void {
    const dialogRef = this.dialog.open<AddListDialogComponent>(AddListDialogComponent);

    dialogRef.afterClosed().subscribe((result: Partial<List>) => {
      if (!result) return;

      this.addList(result).subscribe(async (response) => {
        await this.router.navigateByUrl(`/lists?slug=${response.ids.slug}`);
        this.updated.next(undefined);
      });
    });
  }

  addList(list: Partial<List>, userId = 'me'): Observable<List> {
    return this.http.post<List>(`${Config.traktBaseUrl}/users/${userId}/lists`, list);
  }

  addToWatchlist(ids: Ids): Observable<AddToWatchlistResponse> {
    return this.http.post<AddToWatchlistResponse>(`${Config.traktBaseUrl}/sync/watchlist`, {
      shows: [{ ids }],
    });
  }

  removeFromWatchlist(ids: Ids): Observable<RemoveFromWatchlistResponse> {
    return this.http.post<RemoveFromWatchlistResponse>(
      `${Config.traktBaseUrl}/sync/watchlist/remove`,
      { shows: [{ ids }] }
    );
  }

  executeAddToWatchlist(ids: Ids): void {
    this.addToWatchlist(ids).subscribe(async (res) => {
      if (res.not_found.shows.length > 0) {
        console.error('res', res);
      }
      await this.syncWatchlist();
      this.updated.next(undefined);
    });
  }

  async executeRemoveFromWatchlist(ids: Ids): Promise<void> {
    this.removeFromWatchlist(ids).subscribe(async (res) => {
      if (res.not_found.shows.length > 0) {
        console.error('res', res);
      }
      await this.syncWatchlist();
      this.updated.next(undefined);
    });
  }

  getNextEpisode$(
    show: TraktShow,
    seasonNumber: number,
    episodeNumber: number
  ): Observable<[EpisodeFull, TmdbEpisode] | undefined> {
    return this.getEpisode$(show.ids, seasonNumber, episodeNumber + 1).pipe(
      catchError(() => {
        return this.getEpisode$(show.ids, seasonNumber + 1, 1);
      })
    );
  }

  setShowEpisode(showId: number, episode: EpisodeFull, withPublish = true): void {
    const showsEpisodes = this.showsEpisodes$.value;
    showsEpisodes[episodeId(showId, episode.season, episode.number)] = episode;
    setLocalStorage<{ [episodeId: number]: EpisodeFull }>(
      LocalStorage.SHOWS_EPISODES,
      showsEpisodes
    );
    if (withPublish) this.showsEpisodes$.next(showsEpisodes);
  }
}
