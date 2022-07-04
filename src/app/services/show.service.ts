import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import {
  BehaviorSubject,
  catchError,
  combineLatest,
  combineLatestWith,
  forkJoin,
  map,
  Observable,
  of,
  retry,
  Subscription,
  switchMap,
  zip,
} from 'rxjs';
import {
  Episode,
  EpisodeAiring,
  EpisodeFull,
  EpisodeProgress,
  Ids,
  RecommendedShow,
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

@Injectable({
  providedIn: 'root',
})
export class ShowService {
  showsWatched$ = new BehaviorSubject<ShowWatched[]>(
    getLocalStorage<{ shows: ShowWatched[] }>(LocalStorage.SHOWS_WATCHED)?.shows || []
  );
  showsHidden$ = new BehaviorSubject<ShowHidden[]>(
    getLocalStorage<{ shows: ShowHidden[] }>(LocalStorage.SHOWS_HIDDEN)?.shows || []
  );
  showsProgress$ = new BehaviorSubject<{ [id: number]: ShowProgress }>(
    getLocalStorage<{ [id: number]: ShowProgress }>(LocalStorage.SHOWS_PROGRESS) || {}
  );
  showsProgressSubscriptions$ = new BehaviorSubject<{ [id: number]: Subscription }>({});
  showsEpisodes$ = new BehaviorSubject<{ [id: string]: EpisodeFull }>(
    getLocalStorage<{ [id: string]: EpisodeFull }>(LocalStorage.SHOWS_EPISODES) || {}
  );
  showsEpisodesSubscriptions$ = new BehaviorSubject<{ [id: string]: Subscription }>({});
  favorites$ = new BehaviorSubject<number[]>(
    getLocalStorage<{ shows: number[] }>(LocalStorage.FAVORITES)?.shows || []
  );
  addedShowInfos$ = new BehaviorSubject<{ [id: number]: ShowInfo }>(
    getLocalStorage<{ [id: number]: ShowInfo }>(LocalStorage.ADDED_SHOW_INFO) || {}
  );

  updated = new BehaviorSubject(undefined);

  constructor(
    private http: HttpClient,
    private tmdbService: TmdbService,
    private configService: ConfigService,
    private dialog: MatDialog,
    private router: Router
  ) {}

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

  fetchShowsEpisode(
    showId: number,
    seasonNumber: number,
    episodeNumber: number
  ): Observable<EpisodeFull> {
    const options = Config.traktOptions;
    options.params = { ...options.params, ...{ extended: 'full' } };

    return this.http
      .get<EpisodeFull>(
        `${Config.traktBaseUrl}/shows/${showId}/seasons/${seasonNumber}/episodes/${episodeNumber}`,
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

  fetchCalendar(startDate = new Date(), days = 31): Observable<EpisodeAiring[]> {
    return this.http.get<EpisodeAiring[]>(
      `${Config.traktBaseUrl}/calendars/my/shows/${formatDate(
        startDate,
        'yyyy-MMM-dd',
        'en-US'
      )}/${days}`,
      Config.traktOptions
    );
  }

  fetchWatchlist(id = 'me'): Observable<WatchlistItem[]> {
    return this.http.get<WatchlistItem[]>(
      `${Config.traktBaseUrl}/users/${id}/watchlist/shows`,
      Config.traktOptions
    );
  }

  fetchLists(id = 'me'): Observable<List[]> {
    return this.http.get<List[]>(`${Config.traktBaseUrl}/users/${id}/lists`, Config.traktOptions);
  }

  fetchListItems(listId: string | number, userId = 'me'): Observable<ListItem[]> {
    return this.http.get<ListItem[]>(
      `${Config.traktBaseUrl}/users/${userId}/lists/${listId}/items/show`,
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

  addShowsToList(listId: number, showIds: number[], userId = 'me'): Observable<AddToListResponse> {
    return this.http.post<AddToListResponse>(
      `${Config.traktBaseUrl}/users/${userId}/lists/${listId}/items`,
      {
        shows: showIds.map((showId) => ({
          ids: {
            trakt: showId,
          },
        })),
      },
      Config.traktOptions
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
      },
      Config.traktOptions
    );
  }

  getShowWatched(showId?: number): ShowWatched | undefined {
    if (!showId) return;
    return (
      this.showsWatched$.value.find((show) => show.show.ids.trakt === showId) ||
      this.addedShowInfos$.value[showId]?.showWatched
    );
  }

  getSeasonWatched(id: number, season: number): SeasonWatched | undefined {
    return this.getShowWatched(id)?.seasons?.[season - 1];
  }

  getShowProgress(showId?: number): ShowProgress | undefined {
    if (!showId) return;
    return this.showsProgress$.value[showId] || this.addedShowInfos$.value[showId]?.showProgress;
  }

  getSeasonProgress(id: number, season: number): SeasonProgress | undefined {
    return this.getShowProgress(id)?.seasons?.[season - 1];
  }

  getEpisodeProgress(showId: number, season: number, episode: number): EpisodeProgress | undefined {
    return this.getSeasonProgress(showId, season)?.episodes?.[episode - 1];
  }

  getEpisode(showId: number, season: number, episode: number): EpisodeFull | undefined {
    return this.showsEpisodes$.value[episodeId(showId, season, episode)];
  }

  getEpisode$(
    ids: Ids,
    seasonNumber: number,
    episodeNumber: number
  ): Observable<[EpisodeFull, TmdbEpisode]> {
    const episode$ = this.showsEpisodes$.pipe(
      map((episodes) => episodes[episodeId(ids.trakt, seasonNumber, episodeNumber)])
    );

    const tmdbEpisodeFetch$ = this.tmdbService.fetchEpisode(ids.tmdb, seasonNumber, episodeNumber);

    const episodeWithFallbackFetch$ = episode$.pipe(
      switchMap((episodeFull) =>
        episodeFull
          ? of(episodeFull)
          : this.fetchShowsEpisode(ids.trakt, seasonNumber, episodeNumber)
      )
    );

    return combineLatest([episodeWithFallbackFetch$, tmdbEpisodeFetch$]);
  }

  getIdForSlug(slug?: string): Ids | undefined {
    if (!slug) return;
    return [
      ...this.showsWatched$.value.map((showWatched) => showWatched.show),
      ...Object.values(this.addedShowInfos$.value).map((showInfo) => showInfo.show),
    ].find((show) => show?.ids.slug === slug)?.ids;
  }

  addFavorite(id: number): void {
    const favorites = this.favorites$.value;
    if (favorites.includes(id)) return;

    favorites.push(id);
    setLocalStorage<{ shows: number[] }>(LocalStorage.FAVORITES, { shows: favorites });
    this.favorites$.next(favorites);
  }

  removeFavorite(id: number): void {
    let favorites = this.favorites$.value;
    if (!favorites.includes(id)) return;

    favorites = favorites.filter((favorite) => favorite !== id);
    setLocalStorage<{ shows: number[] }>(LocalStorage.FAVORITES, { shows: favorites });
    this.favorites$.next(favorites);
  }

  searchForAddedShows$(query: string): Observable<TraktShow[]> {
    return this.getShowsAll$().pipe(
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
      })
    );
  }

  addNewShow(ids: Ids, episode?: Episode): void {
    if (episode && !(episode.season === 1 && episode.number === 1)) return;

    const showInfos = this.addedShowInfos$.value;

    forkJoin([
      this.fetchShow(ids.trakt),
      this.tmdbService.fetchShow(ids.tmdb),
      this.fetchShowsEpisode(ids.trakt, 1, 1),
    ]).subscribe(([show, tmdbShow, nextEpisode]) => {
      const showInfo = this.getShowInfoForNewShow(show, tmdbShow, nextEpisode);
      if (!showInfo) return;
      showInfos[show.ids.trakt] = showInfo;
      setLocalStorage<{ [id: number]: ShowInfo }>(LocalStorage.ADDED_SHOW_INFO, showInfos);
      this.addedShowInfos$.next(showInfos);
    });
  }

  removeNewShow(showId: number): void {
    const addedShow = this.addedShowInfos$.value[showId];
    if (!addedShow) return;

    delete this.addedShowInfos$.value[showId];
    setLocalStorage<{ [id: number]: ShowInfo }>(
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

  getShowsAll$(): Observable<TraktShow[]> {
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
    season?: number,
    episode?: number
  ): Observable<EpisodeFull | undefined> {
    if (!showId || !season || !episode) return of(undefined);

    const showEpisode: Observable<EpisodeFull | undefined> = this.showsEpisodes$.pipe(
      map((showsEpisodes) => showsEpisodes[episodeId(showId, season, episode)])
    );
    const showAddedEpisode = this.addedShowInfos$.pipe(
      map((addedShowInfos) => addedShowInfos[showId]?.nextEpisode)
    );
    return combineLatest([showEpisode, showAddedEpisode]).pipe(
      map(([showEpisode, showAddedEpisode]) => showEpisode || showAddedEpisode)
    );
  }

  getShowsFilteredAndSorted$(): Observable<ShowInfo[] | undefined> {
    return this.getShowsAll$().pipe(
      switchMap((shows) => {
        return forkJoin(
          shows.map((show) => {
            return this.tmdbService.fetchShow(show.ids.tmdb);
          })
        );
      }),
      combineLatestWith(
        this.getShowsAll$(),
        this.showsProgress$,
        this.showsHidden$,
        this.showsEpisodes$,
        this.favorites$,
        this.addedShowInfos$,
        this.configService.config$
      ),
      map(
        ([
          tmdbShows,
          showsAll,
          showsProgress,
          showsHidden,
          showsEpisodes,
          favorites,
          addedShowInfos,
          config,
        ]) => {
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

          if (this.isMissing(showsAll, tmdbShows, showsProgress, showsEpisodes)) return;

          const shows: ShowInfo[] = [];

          showsAll.forEach((show) => {
            const showProgress = showsProgress[show.ids.trakt];
            const tmdbShow = tmdbShows.find((tmdbShow) => tmdbShow?.id === show.ids.tmdb);

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
    showsEpisodes: { [id: string]: EpisodeFull }
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
    showsProgress: { [id: number]: ShowProgress },
    showsEpisodes: { [id: string]: EpisodeFull }
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

  private hideHidden(showsHidden: ShowHidden[], id: number): boolean {
    return !!showsHidden.find((show) => show.show.ids.trakt === id);
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
    showsEpisodes: { [id: string]: EpisodeFull }
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
    combineLatest([this.fetchListItems(list.ids.trakt), this.getShowsAll$()]).subscribe(
      ([listItems, shows]) => {
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
      }
    );
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
    return this.http.post<List>(
      `${Config.traktBaseUrl}/users/${userId}/lists`,
      list,
      Config.traktOptions
    );
  }

  addToWatchlist(ids: Ids): Observable<AddToWatchlistResponse> {
    return this.http.post<AddToWatchlistResponse>(
      `${Config.traktBaseUrl}/sync/watchlist`,
      { shows: [{ ids }] },
      Config.traktOptions
    );
  }

  removeFromWatchlist(ids: Ids): Observable<RemoveFromWatchlistResponse> {
    return this.http.post<RemoveFromWatchlistResponse>(
      `${Config.traktBaseUrl}/sync/watchlist/remove`,
      { shows: [{ ids }] },
      Config.traktOptions
    );
  }

  executeAddToWatchlist(ids: Ids): void {
    this.addToWatchlist(ids).subscribe((res) => {
      if (res.not_found.shows.length > 0) {
        console.error('res', res);
      }
      this.updated.next(undefined);
    });
  }

  executeRemoveFromWatchlist(ids: Ids): void {
    this.removeFromWatchlist(ids).subscribe((res) => {
      if (res.not_found.shows.length > 0) {
        console.error('res', res);
      }
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
}
