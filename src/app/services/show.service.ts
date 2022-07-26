import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, combineLatest, map, Observable, of, switchMap, take } from 'rxjs';
import {
  Episode,
  Ids,
  RecommendedShow,
  SeasonProgress,
  ShowHidden,
  ShowProgress,
  ShowSearch,
  ShowWatched,
  ShowWatchedHistory,
  TraktShow,
  Translation,
  TrendingShow,
} from '../../types/interfaces/Trakt';
import { LocalStorage } from '../../types/enum';
import { setLocalStorage } from '../helper/localStorage';
import { Config } from '../config';
import { ShowInfo } from '../../types/interfaces/Show';
import { TmdbService } from './tmdb.service';
import { ConfigService } from './config.service';
import { syncArrayTrakt, syncObjectsTrakt } from '../helper/sync';
import { HttpOptions } from '../../types/interfaces/Http';
import { ListService } from './list.service';

@Injectable({
  providedIn: 'root',
})
export class ShowService {
  showsWatched$: BehaviorSubject<ShowWatched[]>;
  syncShowsWatched: () => Observable<void>;

  showsTranslations$: BehaviorSubject<{ [showId: string]: Translation }>;
  syncShowTranslation: (
    showId: number | undefined,
    language: string,
    force?: boolean
  ) => Observable<void>;
  private readonly fetchShowTranslation: (
    showId: number | string | undefined,
    language: string,
    sync?: boolean
  ) => Observable<Translation>;

  showsProgress$: BehaviorSubject<{ [showId: number]: ShowProgress }>;
  syncShowProgress: (showId: number) => Observable<void>;

  showsHidden$: BehaviorSubject<ShowHidden[]>;
  syncShowsHidden: () => Observable<void>;

  favorites$: BehaviorSubject<number[]>;
  syncFavorites: () => Observable<void>;

  addedShowInfos$: BehaviorSubject<{ [showId: number]: ShowInfo }>;
  syncAddedShowInfo: (showId: number) => Observable<void>;

  constructor(
    private http: HttpClient,
    private tmdbService: TmdbService,
    private configService: ConfigService,
    private listService: ListService
  ) {
    const [showsWatched$, syncShowsWatched] = syncArrayTrakt<ShowWatched>({
      http: this.http,
      url: '/sync/watched/shows?extended=noseasons',
      localStorageKey: LocalStorage.SHOWS_WATCHED,
    });
    this.showsWatched$ = showsWatched$;
    this.syncShowsWatched = syncShowsWatched;

    const [showsTranslations$, syncShowTranslation, fetchShowTranslation] =
      syncObjectsTrakt<Translation>({
        http: this.http,
        url: '/shows/%/translations/%',
        localStorageKey: LocalStorage.SHOWS_TRANSLATIONS,
      });
    this.showsTranslations$ = showsTranslations$;
    this.syncShowTranslation = syncShowTranslation;
    this.fetchShowTranslation = fetchShowTranslation;

    const [showsProgress$, syncShowProgress] = syncObjectsTrakt<ShowProgress>({
      http: this.http,
      url: '/shows/%/progress/watched?specials=true&count_specials=false',
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

    this.configService.config$.subscribe((config) => {
      if (
        config.language === 'en-US' &&
        this.showsTranslations$.value &&
        Object.keys(this.showsTranslations$.value).length > 0
      ) {
        this.showsTranslations$.next({});
        localStorage.removeItem(LocalStorage.SHOWS_TRANSLATIONS);
      }
    });
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

  getShowWatched(showId?: number): ShowWatched | undefined {
    if (!showId) return;
    return (
      this.showsWatched$.value.find((show) => show.show.ids.trakt === showId) ||
      this.addedShowInfos$.value[showId]?.showWatched
    );
  }

  getShowWatched$(showId?: number): Observable<ShowWatched | undefined> {
    if (!showId) return of(undefined);

    const showWatched = this.showsWatched$.pipe(
      map((showsWatched) => {
        return showsWatched.find((showWatched) => showWatched.show.ids.trakt === showId);
      })
    );

    const showAdded = this.addedShowInfos$.pipe(
      map((addedShowInfos) => {
        return addedShowInfos[showId]?.showWatched;
      })
    );

    return combineLatest([showWatched, showAdded]).pipe(
      map(([showWatched, showAdded]) => showWatched || showAdded)
    );
  }

  getShowProgress(showId?: number): ShowProgress | undefined {
    if (!showId) return;
    return this.showsProgress$.value[showId] || this.addedShowInfos$.value[showId]?.showProgress;
  }

  getIdsBySlug$(slug?: string): Observable<Ids | undefined> {
    if (!slug) return of(undefined);
    return this.getLocalShows$().pipe(
      switchMap((shows) => {
        const ids = shows.find((show) => show?.ids.slug === slug)?.ids;
        if (!ids) return this.fetchShow(slug).pipe(map((show) => show.ids));
        return of(ids);
      })
    );
  }

  getIdsByTraktId(traktId?: number): Ids | undefined {
    if (!traktId) return;
    return this.getShows().find((show) => show?.ids.trakt === traktId)?.ids;
  }

  getIdsByTraktId$(traktId?: number): Observable<Ids | undefined> {
    if (!traktId) return of(undefined);
    return this.getLocalShows$().pipe(
      map((shows) => {
        return shows.find((show) => show?.ids.trakt === traktId)?.ids;
      })
    );
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
    return this.getLocalShows$().pipe(
      switchMap((shows) => {
        const showsTranslations = this.showsTranslations$.pipe(
          map((showsTranslations) => shows.map((show) => showsTranslations[show.ids.trakt]))
        );
        return combineLatest([of(shows), showsTranslations]);
      }),
      switchMap(([shows, showsTranslations]) => {
        const showsTranslated: TraktShow[] = shows.map((show, i) => {
          return { ...show, title: showsTranslations[i]?.title || show.title };
        });
        const queryLowerCase = query.toLowerCase();
        const showsSearched: TraktShow[] = showsTranslated.filter((show) =>
          show.title.toLowerCase().includes(queryLowerCase)
        );
        showsSearched.sort((a, b) =>
          a.title.toLowerCase().startsWith(queryLowerCase) &&
          !b.title.toLowerCase().startsWith(queryLowerCase)
            ? -1
            : 1
        );
        return of(showsSearched);
      }),
      take(1)
    );
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

  getShowsAddedProgress$(): Observable<{ [episodeId: string]: ShowProgress }> {
    const showsProgress = this.showsProgress$.asObservable();
    const showsAddedProgress = this.addedShowInfos$.pipe(
      map((addedShowInfos) => {
        const array = Object.entries(addedShowInfos)
          .map(([showId, addedShowInfo]) => {
            if (!addedShowInfo.showProgress) return;
            return [showId, addedShowInfo.showProgress];
          })
          .filter(Boolean) as [string, ShowProgress][];

        return Object.fromEntries(array);
      })
    );
    return combineLatest([showsProgress, showsAddedProgress]).pipe(
      map(([showsProgress, showsAddedProgress]) => ({ ...showsAddedProgress, ...showsProgress }))
    );
  }

  getShowProgress$(showId?: number): Observable<ShowProgress | undefined> {
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

  getShowTranslation$(showId?: number, sync?: boolean): Observable<Translation | undefined> {
    if (!showId) return of(undefined);

    return this.showsTranslations$.pipe(
      switchMap((showsTranslations) => {
        const showTranslation = showsTranslations[showId];
        if (!showTranslation) {
          const language = this.configService.config$.value.language.substring(0, 2);
          return this.fetchShowTranslation(showId, language, sync);
        }
        return of(showTranslation);
      })
    );
  }

  getShows(): TraktShow[] {
    return [
      ...this.showsWatched$.value.map((showWatched) => showWatched.show),
      ...this.listService.watchlist$.value.map((watchlistItem) => watchlistItem.show),
      ...Object.values(this.addedShowInfos$.value).map((showInfo) => showInfo.show),
    ].filter(Boolean) as TraktShow[];
  }

  getSeasonProgress$(
    showId?: number,
    seasonNumber?: number
  ): Observable<SeasonProgress | undefined> {
    if (showId === undefined || seasonNumber === undefined) return of(undefined);

    const seasonProgress: Observable<SeasonProgress | undefined> = this.showsProgress$.pipe(
      map((showsProgress) =>
        showsProgress[showId]?.seasons.find((season) => season.number === seasonNumber)
      )
    );
    const showAddedSeasonProgress = this.addedShowInfos$.pipe(
      map((addedShowInfos) =>
        addedShowInfos[showId]?.showProgress?.seasons.find(
          (season) => season.number === seasonNumber
        )
      )
    );
    return combineLatest([seasonProgress, showAddedSeasonProgress]).pipe(
      map(([seasonProgress, showAddedSeasonProgress]) => seasonProgress || showAddedSeasonProgress)
    );
  }

  getLocalShows$(): Observable<TraktShow[]> {
    const showsWatched = this.showsWatched$.pipe(
      map((showsWatched) => showsWatched.map((showWatched) => showWatched.show))
    );
    const showsWatchlisted = this.listService.watchlist$.pipe(
      map((watchlistItems) => watchlistItems.map((watchlistItem) => watchlistItem.show))
    );
    const showsAdded = this.addedShowInfos$.pipe(
      map((addedShowInfos) => {
        return Object.values(addedShowInfos)
          .map((addedShowInfo) => addedShowInfo.show)
          .filter(Boolean) as TraktShow[];
      })
    );

    return combineLatest([showsWatched, showsWatchlisted, showsAdded]).pipe(
      map(([showsWatched, showsWatchlisted, showsAdded]) => [
        ...showsWatched,
        ...showsWatchlisted,
        ...showsAdded,
      ])
    );
  }

  getShow$(showId?: number | string): Observable<TraktShow | undefined> {
    if (!showId) return of(undefined);

    return this.getLocalShows$().pipe(
      switchMap((shows) => {
        const show = shows.find((show) => show.ids.trakt === showId);
        if (!show) return this.fetchShow(showId);
        return of(show);
      })
    );
  }

  setNextEpisode(showId: number | undefined, nextEpisode: Episode | null | undefined): void {
    if (!showId || nextEpisode === undefined) return;
    const showsProgress = this.showsProgress$.value;
    const showProgress = showsProgress[showId];
    showProgress.next_episode = nextEpisode;
    this.showsProgress$.next(showsProgress);
  }
}
