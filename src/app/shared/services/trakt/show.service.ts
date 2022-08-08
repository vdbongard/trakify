import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, combineLatest, map, Observable, of, switchMap, take } from 'rxjs';
import {
  Ids,
  RecommendedShow,
  ShowHidden,
  ShowProgress,
  ShowSearch,
  ShowWatched,
  ShowWatchedHistory,
  TraktShow,
  TrendingShow,
} from '../../../../types/interfaces/Trakt';
import { LocalStorage } from '../../../../types/enum';
import { setLocalStorage } from '../../helper/localStorage';
import { Config } from '../../../config';
import { ConfigService } from '../config.service';
import { syncArrayTrakt, syncObjectsTrakt } from '../../helper/sync';
import { HttpOptions } from '../../../../types/interfaces/Http';
import { ListService } from './list.service';
import { TranslationService } from './translation.service';
import { SyncOptions } from '../../../../types/interfaces/Sync';

@Injectable({
  providedIn: 'root',
})
export class ShowService {
  showsWatched$: BehaviorSubject<ShowWatched[]>;
  syncShowsWatched: (options?: SyncOptions) => Observable<void>;

  showsProgress$: BehaviorSubject<{ [showId: number]: ShowProgress }>;
  syncShowProgress: (showId: number, options?: SyncOptions) => Observable<void>;

  showsHidden$: BehaviorSubject<ShowHidden[]>;
  syncShowsHidden: (options?: SyncOptions) => Observable<void>;

  favorites$: BehaviorSubject<number[]>;
  syncFavorites: (options?: SyncOptions) => Observable<void>;

  constructor(
    private http: HttpClient,
    private configService: ConfigService,
    private listService: ListService,
    private translationService: TranslationService
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
  }

  private fetchShow(showId: number | string): Observable<TraktShow> {
    return this.http.get<TraktShow>(`${Config.traktBaseUrl}/shows/${showId}`);
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

  getShow$(ids?: Ids, sync?: boolean, fetch?: boolean): Observable<TraktShow | undefined> {
    if (!ids) throw Error('Show id is empty');

    return this.getShows$().pipe(
      switchMap((shows) => {
        const show = shows.find((show) => show.ids.trakt === ids.trakt);
        if (fetch && !show) {
          const showObservable = this.fetchShow(ids.trakt);
          const showTranslationObservable = this.translationService.getShowTranslation$(
            ids.trakt,
            sync,
            fetch
          );
          return combineLatest([showObservable, showTranslationObservable]).pipe(
            map(([show, showTranslation]) => {
              const showClone = { ...show };
              showClone.title = showTranslation?.title ?? show.title;
              return showClone;
            })
          );
        }
        return of(show);
      })
    );
  }

  getShows$(): Observable<TraktShow[]> {
    const showsWatched = this.showsWatched$.pipe(
      map((showsWatched) => showsWatched.map((showWatched) => showWatched.show))
    );
    const showsWatchlisted = this.listService.watchlist$.pipe(
      map((watchlistItems) => watchlistItems.map((watchlistItem) => watchlistItem.show))
    );

    return combineLatest([
      showsWatched,
      showsWatchlisted,
      this.translationService.showsTranslations$,
    ]).pipe(
      map(([showsWatched, showsWatchlisted, showsTranslations]) => {
        const shows: TraktShow[] = [...showsWatched, ...showsWatchlisted];

        return shows.map((show) => {
          const showCloned = { ...show };
          showCloned.title = showsTranslations[show.ids.trakt]?.title ?? show.title;
          return showCloned;
        });
      })
    );
  }

  getShowsAdded$(): Observable<TraktShow[]> {
    const showsWatched = this.showsWatched$.pipe(
      map((showsWatched) => showsWatched.map((showWatched) => showWatched.show))
    );

    return combineLatest([showsWatched, this.translationService.showsTranslations$]).pipe(
      map(([showsWatched, showsTranslations]) =>
        showsWatched.map((show) => {
          const showCloned = { ...show };
          showCloned.title = showsTranslations[show.ids.trakt]?.title ?? show.title;
          return showCloned;
        })
      )
    );
  }

  getShowsWatched$(): Observable<ShowWatched[]> {
    return combineLatest([this.showsWatched$, this.translationService.showsTranslations$]).pipe(
      map(([showsWatched, showsTranslations]) =>
        showsWatched.map((show) => {
          const showCloned = { ...show };
          showCloned.show = { ...show.show };
          showCloned.show.title = showsTranslations[show.show.ids.trakt]?.title ?? show.show.title;
          return showCloned;
        })
      )
    );
  }

  getShows(): TraktShow[] {
    return [
      ...this.showsWatched$.value.map((showWatched) => showWatched.show),
      ...this.listService.watchlist$.value.map((watchlistItem) => watchlistItem.show),
    ].filter(Boolean) as TraktShow[];
  }

  getShowWatched$(showId?: number): Observable<ShowWatched | undefined> {
    if (!showId) throw Error('Show id is empty');

    const showWatched = this.showsWatched$.pipe(
      map((showsWatched) => {
        return showsWatched.find((showWatched) => showWatched.show.ids.trakt === showId);
      })
    );

    return combineLatest([showWatched, this.translationService.getShowTranslation$(showId)]).pipe(
      map(([showWatched, showTranslation]) => {
        if (!showWatched) return;

        const watchedClone = { ...showWatched };
        watchedClone.show = { ...watchedClone.show };
        showWatched.show.title = showTranslation?.title ?? showWatched.show.title;

        return watchedClone;
      })
    );
  }

  getShowWatched(showId?: number): ShowWatched | undefined {
    if (!showId) return;
    return this.showsWatched$.value.find((show) => show.show.ids.trakt === showId);
  }

  getShowProgress$(showId?: number): Observable<ShowProgress | undefined> {
    if (!showId) throw Error('Show id is empty');
    return this.showsProgress$.pipe(map((showsProgress) => showsProgress[showId]));
  }

  getIdsBySlug$(slug?: string, fetch?: boolean): Observable<Ids | undefined> {
    if (!slug) throw Error('Slug is empty');
    return this.getShows$().pipe(
      switchMap((shows) => {
        const ids = shows.find((show) => show?.ids.slug === slug)?.ids;
        if (fetch && !ids) return this.fetchShow(slug).pipe(map((show) => show.ids));
        return of(ids);
      })
    );
  }

  getIdsByTraktId(traktId?: number): Ids | undefined {
    if (!traktId) return;
    return this.getShows().find((show) => show?.ids.trakt === traktId)?.ids;
  }

  getIdsByTraktId$(traktId?: number): Observable<Ids | undefined> {
    if (!traktId) throw Error('Show id is empty');
    return this.getShows$().pipe(
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
    return this.getShows$().pipe(
      switchMap((shows) => {
        const showsTranslations = this.translationService.showsTranslations$.pipe(
          map((showsTranslations) => shows.map((show) => showsTranslations[show.ids.trakt]))
        );
        return combineLatest([of(shows), showsTranslations]);
      }),
      switchMap(([shows, showsTranslations]) => {
        const showsTranslated: TraktShow[] = shows.map((show, i) => {
          return { ...show, title: showsTranslations[i]?.title ?? show.title };
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
}
