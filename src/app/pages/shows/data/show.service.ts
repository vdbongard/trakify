import { inject, Injectable, Injector, signal, WritableSignal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import {
  combineLatest,
  concat,
  distinctUntilKeyChanged,
  EMPTY,
  map,
  merge,
  Observable,
  of,
  switchMap,
  take,
  tap,
} from 'rxjs';
import { ListService } from '../../lists/data/list.service';
import { TranslationService } from './translation.service';
import { translated } from '@helper/translation';
import { LoadingState, LocalStorage } from '@type/Enum';
import {
  AnticipatedShow,
  anticipatedShowSchema,
  Period,
  RecommendedShow,
  recommendedShowSchema,
  Show,
  ShowHidden,
  showHiddenSchema,
  ShowProgress,
  showProgressSchema,
  showSchema,
  ShowSearch,
  showSearchSchema,
  ShowWatched,
  ShowWatchedOrPlayedAll,
  showWatchedOrPlayedAllSchema,
  showWatchedSchema,
  TrendingShow,
  trendingShowSchema,
} from '@type/Trakt';
import type {
  AddToHistoryResponse,
  AddToUsersResponse,
  RemoveFromHistoryResponse,
  RemoveFromUsersResponse,
} from '@type/TraktResponse';
import type { FetchOptions } from '@type/Sync';
import { parseResponse } from '@operator/parseResponse';
import { API } from '@shared/api';
import { toUrl } from '@helper/toUrl';
import { distinctUntilChangedDeep } from '@operator/distinctUntilChangedDeep';
import { catchErrorAndReplay } from '@operator/catchErrorAndReplay';
import { MatSnackBar } from '@angular/material/snack-bar';
import { LocalStorageService } from '@services/local-storage.service';
import { SyncDataService } from '@services/sync-data.service';
import { ShowInfo } from '@type/Show';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';

@Injectable({
  providedIn: 'root',
})
export class ShowService {
  http = inject(HttpClient);
  listService = inject(ListService);
  translationService = inject(TranslationService);
  snackBar = inject(MatSnackBar);
  localStorageService = inject(LocalStorageService);
  syncDataService = inject(SyncDataService);
  injector = inject(Injector);

  activeShow = signal<Show | undefined>(undefined);

  showsWatched = this.syncDataService.syncArray<ShowWatched>({
    url: API.syncHistoryShowsNoSeasons,
    localStorageKey: LocalStorage.SHOWS_WATCHED,
    schema: showWatchedSchema.array(),
  });
  showsProgress = this.syncDataService.syncObjects<ShowProgress>({
    url: API.showProgress,
    localStorageKey: LocalStorage.SHOWS_PROGRESS,
    schema: showProgressSchema,
    ignoreExisting: true,
  });
  showsHidden = this.syncDataService.syncArray<ShowHidden>({
    url: API.showsHidden,
    localStorageKey: LocalStorage.SHOWS_HIDDEN,
    schema: showHiddenSchema.array(),
  });
  favorites = this.syncDataService.syncArray<number>({
    localStorageKey: LocalStorage.FAVORITES,
  });

  private fetchShow(showId: number | string): Observable<Show> {
    return this.http.get<Show>(toUrl(API.show, [showId])).pipe(parseResponse(showSchema));
  }

  fetchSearchForShows(query: string): Observable<ShowSearch[]> {
    return this.http
      .get<ShowSearch[]>(toUrl(API.showSearch, [query]))
      .pipe(parseResponse(showSearchSchema.array()));
  }

  fetchTrendingShows(): Observable<TrendingShow[]> {
    return this.http
      .get<TrendingShow[]>(API.showsTrending)
      .pipe(parseResponse(trendingShowSchema.array()));
  }

  fetchPopularShows(): Observable<Show[]> {
    return this.http.get<Show[]>(API.showsPopular).pipe(parseResponse(showSchema.array()));
  }

  fetchRecommendedShows(): Observable<RecommendedShow[]> {
    return this.http
      .get<RecommendedShow[]>(API.showsRecommended)
      .pipe(parseResponse(recommendedShowSchema.array()));
  }

  fetchAnticipatedShows(): Observable<AnticipatedShow[]> {
    return this.http
      .get<AnticipatedShow[]>(API.showsAnticipated)
      .pipe(parseResponse(anticipatedShowSchema.array()));
  }

  fetchWatchedShows(period: Period): Observable<ShowWatchedOrPlayedAll[]> {
    return this.http
      .get<ShowWatchedOrPlayedAll[]>(toUrl(API.showsWatched, [period]))
      .pipe(parseResponse(showWatchedOrPlayedAllSchema.array()));
  }

  fetchPlayedShows(period: Period): Observable<ShowWatchedOrPlayedAll[]> {
    return this.http
      .get<ShowWatchedOrPlayedAll[]>(toUrl(API.showsPlayed, [period]))
      .pipe(parseResponse(showWatchedOrPlayedAllSchema.array()));
  }

  addShowAsSeen(show: Show): Observable<AddToHistoryResponse> {
    return this.http.post<AddToHistoryResponse>(API.syncHistory, {
      shows: [show],
    });
  }

  removeShowAsSeen(show: Show): Observable<RemoveFromHistoryResponse> {
    return this.http.post<RemoveFromHistoryResponse>(API.syncHistoryRemove, {
      shows: [show],
    });
  }

  addShowHidden(show: Show): Observable<AddToUsersResponse> {
    return this.http.post<AddToUsersResponse>(API.showAddHidden, {
      shows: [show],
    });
  }

  removeShowHidden(show: Show): Observable<RemoveFromUsersResponse> {
    return this.http.post<RemoveFromUsersResponse>(API.showRemoveHidden, {
      shows: [show],
    });
  }

  isFavorite(show?: Show, favorites = this.favorites.s()): boolean {
    return !!show && favorites?.includes(show.ids.trakt);
  }

  isHidden(show?: Show): boolean {
    const showsHidden = this.showsHidden.s();
    return (
      !!show && showsHidden?.map((showHidden) => showHidden.show.ids.trakt).includes(show.ids.trakt)
    );
  }

  addFavorite(show?: Show | null): void {
    if (!show) return;
    const favorites = this.favorites.s();
    if (!favorites) {
      this.favorites.s.set([show.ids.trakt]);
      this.localStorageService.setObject<number[]>(LocalStorage.FAVORITES, this.favorites.s());
      return;
    }
    if (favorites.includes(show.ids.trakt)) return;
    favorites.push(show.ids.trakt);
    this.favorites.sync();
  }

  removeFavorite(show?: Show | null): void {
    if (!show) return;
    let favorites = this.favorites.s();
    if (!favorites?.includes(show.ids.trakt)) return;
    favorites = favorites.filter((favorite) => favorite !== show.ids.trakt);
    this.favorites.s.set([...(favorites ?? [])]);
    this.favorites.sync({ publishSingle: false });
  }

  getShowsWatched$(): Observable<ShowWatched[]> {
    return combineLatest([
      toObservable(this.showsWatched.s, { injector: this.injector }),
      toObservable(this.translationService.showsTranslations.s, { injector: this.injector }),
    ]).pipe(
      map(([showsWatched, showsTranslations]) => {
        const showsWatchedOrEmpty: ShowWatched[] =
          showsWatched?.map((show) => {
            const showCloned = { ...show };
            showCloned.show = { ...show.show };
            showCloned.show.title =
              showsTranslations[show.show.ids.trakt]?.title ?? show.show.title;
            return showCloned;
          }) ?? [];
        return showsWatchedOrEmpty;
      }),
    );
  }

  getShowsWatched = toSignal(this.getShowsWatched$(), { initialValue: [] });

  getShowWatched$(show?: Show): Observable<ShowWatched | undefined> {
    if (!show) throw Error('Show is empty (getShowWatched$)');
    let isEmpty = false;

    const showWatched = toObservable(this.showsWatched.s, { injector: this.injector }).pipe(
      map((showsWatched) => {
        const showWatched = showsWatched?.find(
          (showWatched) => showWatched.show.ids.trakt === show.ids.trakt,
        );
        isEmpty = !showWatched;
        return showWatched;
      }),
    );

    if (isEmpty) return of(undefined);

    return showWatched;
  }

  getShows$(withTranslation?: boolean): Observable<Show[]> {
    const showsWatched = toObservable(this.showsWatched.s, { injector: this.injector }).pipe(
      map((showsWatched) => showsWatched?.map((showWatched) => showWatched.show)),
    );
    const showsWatchlisted = toObservable(this.listService.watchlist.s, {
      injector: this.injector,
    }).pipe(map((watchlistItems) => watchlistItems?.map((watchlistItem) => watchlistItem.show)));

    return withTranslation
      ? combineLatest([
          showsWatched,
          showsWatchlisted,
          toObservable(this.translationService.showsTranslations.s, { injector: this.injector }),
        ]).pipe(
          map(([showsWatched, showsWatchlisted, showsTranslations]) => {
            const shows: Show[] = [...(showsWatched ?? []), ...(showsWatchlisted ?? [])];
            return shows.map((show) => translated(show, showsTranslations[show.ids.trakt]));
          }),
          distinctUntilChangedDeep(),
        )
      : combineLatest([showsWatched, showsWatchlisted]).pipe(
          map(([showsWatched, showsWatchlisted]) => [
            ...(showsWatched ?? []),
            ...(showsWatchlisted ?? []),
          ]),
          distinctUntilChangedDeep(),
        );
  }

  getShows(): Show[] {
    return [
      ...(this.showsWatched.s()?.map((showWatched) => showWatched.show) ?? []),
      ...(this.listService.watchlist.s()?.map((watchlistItem) => watchlistItem.show) ?? []),
    ];
  }

  getShowBySlug$(slug?: string | null, options?: FetchOptions): Observable<Show> {
    if (!slug) throw Error('Slug is empty (getShowBySlug$)');

    return this.getShows$(true).pipe(
      switchMap((shows) => {
        const show = shows.find((show) => show?.ids.slug === slug);
        if (options?.fetchAlways || (options?.fetch && !show)) {
          let show$ = merge(
            history.state?.showInfo ? of((history.state.showInfo as ShowInfo).show!) : EMPTY,
            combineLatest([
              this.fetchShow(slug),
              show
                ? this.translationService.getShowTranslation$(show, { fetch: true })
                : of(undefined),
            ]).pipe(map(([show, translation]) => translated(show, translation))),
          ).pipe(distinctUntilChangedDeep());
          if (show) show$ = concat(of(show), show$).pipe(distinctUntilChangedDeep());
          return show$;
        }

        if (!show || (show && !Object.keys(show).length))
          throw Error('Show is empty (getShowBySlug$)');

        return of(show);
      }),
    );
  }

  getShowProgress$(show?: Show, options?: FetchOptions): Observable<ShowProgress | undefined> {
    if (!show) throw Error('Show is empty (getShowProgress$)');
    return toObservable(this.showsProgress.s, { injector: this.injector }).pipe(
      switchMap((showsProgress) => {
        const showProgress = showsProgress[show.ids.trakt];

        if (options?.fetchAlways || (options?.fetch && !showProgress)) {
          let showProgress$ = merge(
            showProgress ? of(showProgress) : EMPTY,
            history.state?.showInfo ? of((history.state.showInfo as ShowInfo).showProgress) : EMPTY,
            this.showsProgress.fetch(show.ids.trakt, !!showProgress || options.sync),
          ).pipe(distinctUntilChangedDeep());
          if (showProgress)
            showProgress$ = concat(of(showProgress), showProgress$).pipe(
              distinctUntilChangedDeep(),
            );
          return showProgress$;
        }

        return of(showProgress);
      }),
    );
  }

  searchForAddedShows$(query: string): Observable<Show[]> {
    return this.getShows$(true).pipe(
      switchMap((shows) => {
        const showsTranslations = toObservable(this.translationService.showsTranslations.s, {
          injector: this.injector,
        }).pipe(map((showsTranslations) => shows.map((show) => showsTranslations[show.ids.trakt])));
        return combineLatest([of(shows), showsTranslations]);
      }),
      switchMap(([shows, showsTranslations]) => {
        const showsTranslated: Show[] = shows.map((show, i) => {
          return { ...show, title: showsTranslations[i]?.title ?? show.title };
        });
        const queryLowerCase = query.toLowerCase();
        const showsSearched: Show[] = showsTranslated.filter((show) =>
          show.title.toLowerCase().includes(queryLowerCase),
        );
        showsSearched.sort((a, b) =>
          a.title.toLowerCase().startsWith(queryLowerCase) &&
          !b.title.toLowerCase().startsWith(queryLowerCase)
            ? -1
            : 1,
        );
        return of(showsSearched);
      }),
      take(1),
    );
  }

  removeShowProgress(showIdTrakt: number): void {
    const showsProgress = this.showsProgress.s();
    if (!showsProgress[showIdTrakt]) return;

    console.debug('removing show progress:', showIdTrakt, showsProgress[showIdTrakt]);
    delete showsProgress[showIdTrakt];
    this.showsProgress.s.set({ ...showsProgress });
    this.localStorageService.setObject(LocalStorage.SHOWS_PROGRESS, showsProgress);
  }

  show$(
    params$: Observable<{ show: string }>,
    pageStates: WritableSignal<LoadingState>[],
  ): Observable<Show> {
    return params$.pipe(
      distinctUntilKeyChanged('show'),
      switchMap((params) => this.getShowBySlug$(params.show, { fetchAlways: true })),
      distinctUntilChangedDeep(),
      tap((show) => setTimeout(() => this.activeShow.set({ ...show }))),
      catchErrorAndReplay('show', this.snackBar, pageStates),
    );
  }

  getShowWatchedIndex(show: Show): number {
    const showsWatched = this.showsWatched.s();
    if (!showsWatched) throw Error('Shows watched empty');

    return showsWatched?.findIndex((showWatched) => showWatched.show.ids.trakt === show.ids.trakt);
  }

  moveShowWatchedToFront(showWatchedIndex: number): void {
    const showsWatched = this.showsWatched.s();
    if (!showsWatched) throw Error('Shows watched empty');
    showsWatched.unshift(showsWatched.splice(showWatchedIndex, 1)[0]);
    this.updateShowsWatched(showsWatched);
  }

  updateShowsWatched(showsWatched: ShowWatched[]): void {
    this.showsWatched.s.set([...showsWatched]);
    this.localStorageService.setObject(LocalStorage.SHOWS_WATCHED, showsWatched);
  }

  getShowProgress(show: Show): ShowProgress | undefined {
    const showsProgress = this.showsProgress.s();
    if (!showsProgress) throw Error('Shows progress empty');

    return showsProgress[show.ids.trakt];
  }

  updateShowsProgress(showsProgress = this.showsProgress.s(), options = { save: true }): void {
    this.showsProgress.s.set({ ...showsProgress });
    if (options.save) {
      this.localStorageService.setObject(LocalStorage.SHOWS_PROGRESS, showsProgress);
    }
  }

  removeShowWatched(show: Show): void {
    const showsWatched = this.showsWatched.s();
    if (!showsWatched) return;

    const showWatchedIndex = showsWatched.findIndex(
      (showWatched) => showWatched.show.ids.trakt === show.ids.trakt,
    );
    if (showWatchedIndex === -1) return;

    console.debug('removing show watched:', show.ids.trakt, showsWatched[showWatchedIndex]);
    showsWatched.splice(showWatchedIndex, 1);
    this.showsWatched.s.set([...(showsWatched ?? [])]);
    this.localStorageService.setObject(LocalStorage.SHOWS_WATCHED, showsWatched);
  }

  updateShowsHidden(showsHidden = this.showsHidden.s()): void {
    this.showsHidden.s.set([...(showsHidden ?? [])]);
    this.localStorageService.setObject(LocalStorage.SHOWS_HIDDEN, showsHidden);
  }
}
