import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import {
  BehaviorSubject,
  combineLatest,
  concat,
  distinctUntilKeyChanged,
  map,
  Observable,
  of,
  switchMap,
  take,
  tap,
} from 'rxjs';
import { ListService } from '../../lists/data/list.service';
import { TranslationService } from './translation.service';

import { translated } from '@helper/translation';

import { LoadingState, LocalStorage } from '@type/enum';

import {
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
  ShowWatchedHistory,
  showWatchedHistorySchema,
  showWatchedSchema,
  TrendingShow,
  trendingShowSchema,
} from '@type/interfaces/Trakt';
import type { HttpOptions } from '@type/interfaces/Http';
import type {
  AddToHistoryResponse,
  AddToUsersResponse,
  RemoveFromHistoryResponse,
  RemoveFromUsersResponse,
} from '@type/interfaces/TraktResponse';
import type { FetchOptions } from '@type/interfaces/Sync';
import { parseResponse } from '@operator/parseResponse';
import { api } from '@shared/api';
import { urlReplace } from '@helper/urlReplace';
import { distinctUntilChangedDeep } from '@operator/distinctUntilChangedDeep';
import { catchErrorAndReplay } from '@operator/catchErrorAndReplay';
import { MatSnackBar } from '@angular/material/snack-bar';
import { LocalStorageService } from '@services/local-storage.service';
import { SyncDataService } from '@services/sync-data.service';

@Injectable({
  providedIn: 'root',
})
export class ShowService {
  activeShow$ = new BehaviorSubject<Show | undefined>(undefined);

  showsWatched = this.syncDataService.syncArray<ShowWatched>({
    url: api.syncHistoryShowsNoSeasons,
    localStorageKey: LocalStorage.SHOWS_WATCHED,
    schema: showWatchedSchema.array(),
  });
  showsProgress = this.syncDataService.syncObjects<ShowProgress>({
    url: api.showProgress,
    localStorageKey: LocalStorage.SHOWS_PROGRESS,
    schema: showProgressSchema,
    ignoreExisting: true,
  });
  showsHidden = this.syncDataService.syncArray<ShowHidden>({
    url: api.showsHidden,
    localStorageKey: LocalStorage.SHOWS_HIDDEN,
    schema: showHiddenSchema.array(),
  });
  favorites = this.syncDataService.syncArray<number>({
    localStorageKey: LocalStorage.FAVORITES,
  });

  constructor(
    private http: HttpClient,
    private listService: ListService,
    private translationService: TranslationService,
    private snackBar: MatSnackBar,
    private localStorageService: LocalStorageService,
    private syncDataService: SyncDataService
  ) {}

  private fetchShow(showId: number | string): Observable<Show> {
    return this.http.get<Show>(urlReplace(api.show, [showId])).pipe(parseResponse(showSchema));
  }

  fetchShowsWatchedHistory(startAt?: string): Observable<ShowWatchedHistory[]> {
    const options: HttpOptions = {};

    if (startAt) {
      // eslint-disable-next-line @typescript-eslint/naming-convention
      options.params = { start_at: startAt };
    }

    return this.http
      .get<ShowWatchedHistory[]>(api.syncHistoryShows, options)
      .pipe(parseResponse(showWatchedHistorySchema.array()));
  }

  fetchSearchForShows(query: string): Observable<ShowSearch[]> {
    return this.http
      .get<ShowSearch[]>(urlReplace(api.showSearch, [query]))
      .pipe(parseResponse(showSearchSchema.array()));
  }

  fetchTrendingShows(): Observable<TrendingShow[]> {
    return this.http
      .get<TrendingShow[]>(api.showsTrending)
      .pipe(parseResponse(trendingShowSchema.array()));
  }

  fetchPopularShows(): Observable<Show[]> {
    return this.http.get<Show[]>(api.showsPopular).pipe(parseResponse(showSchema.array()));
  }

  fetchRecommendedShows(): Observable<RecommendedShow[]> {
    return this.http
      .get<RecommendedShow[]>(api.showsRecommended)
      .pipe(parseResponse(recommendedShowSchema.array()));
  }

  addShowAsSeen(show: Show): Observable<AddToHistoryResponse> {
    return this.http.post<AddToHistoryResponse>(api.syncHistory, {
      shows: [show],
    });
  }

  removeShowAsSeen(show: Show): Observable<RemoveFromHistoryResponse> {
    return this.http.post<RemoveFromHistoryResponse>(api.syncHistoryRemove, {
      shows: [show],
    });
  }

  addShowHidden(show: Show): Observable<AddToUsersResponse> {
    return this.http.post<AddToUsersResponse>(api.showAddHidden, {
      shows: [show],
    });
  }

  removeShowHidden(show: Show): Observable<RemoveFromUsersResponse> {
    return this.http.post<RemoveFromUsersResponse>(api.showRemoveHidden, {
      shows: [show],
    });
  }

  isFavorite(show?: Show, favorites = this.favorites.$.value): boolean {
    return !!show && !!favorites?.includes(show.ids.trakt);
  }

  isHidden(show?: Show): boolean {
    const showsHidden = this.showsHidden.$.value;
    return (
      !!show &&
      !!showsHidden?.map((showHidden) => showHidden.show.ids.trakt).includes(show.ids.trakt)
    );
  }

  addFavorite(show?: Show | null): void {
    if (!show) return;
    let favorites = this.favorites.$.value;
    if (!favorites) {
      this.favorites.$.next([show.ids.trakt]);
      this.localStorageService.setObject<number[]>(LocalStorage.FAVORITES, this.favorites.$.value);
      return;
    }
    if (favorites.includes(show.ids.trakt)) return;
    favorites.push(show.ids.trakt);
    this.favorites.sync();
  }

  removeFavorite(show?: Show | null): void {
    if (!show) return;
    let favorites = this.favorites.$.value;
    if (!favorites?.includes(show.ids.trakt)) return;
    favorites = favorites.filter((favorite) => favorite !== show.ids.trakt);
    this.favorites.$.next(favorites);
    this.favorites.sync({ publishSingle: false });
  }

  getShowsWatched$(): Observable<ShowWatched[]> {
    return combineLatest([this.showsWatched.$, this.translationService.showsTranslations.$]).pipe(
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
      })
    );
  }

  getShowWatched$(show?: Show): Observable<ShowWatched | undefined> {
    if (!show) throw Error('Show is empty (getShowWatched$)');
    let isEmpty = false;

    const showWatched = this.showsWatched.$.pipe(
      map((showsWatched) => {
        const showWatched = showsWatched?.find(
          (showWatched) => showWatched.show.ids.trakt === show.ids.trakt
        );
        isEmpty = !showWatched;
        return showWatched;
      })
    );

    if (isEmpty) return of(undefined);

    return combineLatest([showWatched, this.translationService.getShowTranslation$(show)]).pipe(
      map(([showWatched, showTranslation]) => {
        if (!showWatched) return;
        return {
          ...showWatched,
          show: translated(showWatched.show, showTranslation),
        };
      })
    );
  }

  getShows$(withTranslation?: boolean): Observable<Show[]> {
    const showsWatched = this.showsWatched.$.pipe(
      map((showsWatched) => showsWatched?.map((showWatched) => showWatched.show))
    );
    const showsWatchlisted = this.listService.watchlist.$.pipe(
      map((watchlistItems) => watchlistItems?.map((watchlistItem) => watchlistItem.show))
    );

    return withTranslation
      ? combineLatest([
          showsWatched,
          showsWatchlisted,
          this.translationService.showsTranslations.$,
        ]).pipe(
          map(([showsWatched, showsWatchlisted, showsTranslations]) => {
            const shows: Show[] = [...(showsWatched ?? []), ...(showsWatchlisted ?? [])];
            return shows.map((show) => translated(show, showsTranslations[show.ids.trakt]));
          }),
          distinctUntilChangedDeep()
        )
      : combineLatest([showsWatched, showsWatchlisted]).pipe(
          map(([showsWatched, showsWatchlisted]) => [
            ...(showsWatched ?? []),
            ...(showsWatchlisted ?? []),
          ]),
          distinctUntilChangedDeep()
        );
  }

  getShows(): Show[] {
    return [
      ...(this.showsWatched.$.value?.map((showWatched) => showWatched.show) ?? []),
      ...(this.listService.watchlist.$.value?.map((watchlistItem) => watchlistItem.show) ?? []),
    ];
  }

  getShowBySlug$(slug?: string | null, options?: FetchOptions): Observable<Show> {
    if (!slug) throw Error('Slug is empty (getShowBySlug$)');

    return this.getShows$().pipe(
      switchMap((shows) => {
        const show = shows.find((show) => show?.ids.slug === slug);
        if (options?.fetchAlways || (options?.fetch && !show)) {
          let show$ = this.fetchShow(slug);
          if (show) show$ = concat(of(show), show$).pipe(distinctUntilChangedDeep());
          return show$;
        }

        if (!show || (show && !Object.keys(show).length))
          throw Error('Show is empty (getShowBySlug$)');

        return of(show);
      })
    );
  }

  getShowProgress$(show?: Show, options?: FetchOptions): Observable<ShowProgress | undefined> {
    if (!show) throw Error('Show is empty (getShowProgress$)');
    return this.showsProgress.$.pipe(
      switchMap((showsProgress) => {
        const showProgress = showsProgress[show.ids.trakt];

        if (options?.fetchAlways || (options?.fetch && !showProgress)) {
          let showProgress$ = this.showsProgress.fetch(
            show.ids.trakt,
            !!showProgress || options.sync
          );
          if (showProgress)
            showProgress$ = concat(of(showProgress), showProgress$).pipe(
              distinctUntilChangedDeep()
            );
          return showProgress$;
        }

        return of(showProgress);
      })
    );
  }

  searchForAddedShows$(query: string): Observable<Show[]> {
    return this.getShows$().pipe(
      switchMap((shows) => {
        const showsTranslations = this.translationService.showsTranslations.$.pipe(
          map((showsTranslations) => shows.map((show) => showsTranslations[show.ids.trakt]))
        );
        return combineLatest([of(shows), showsTranslations]);
      }),
      switchMap(([shows, showsTranslations]) => {
        const showsTranslated: Show[] = shows.map((show, i) => {
          return { ...show, title: showsTranslations[i]?.title ?? show.title };
        });
        const queryLowerCase = query.toLowerCase();
        const showsSearched: Show[] = showsTranslated.filter((show) =>
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

  removeShowProgress(showIdTrakt: number): void {
    const showsProgress = this.showsProgress.$.value;
    if (!showsProgress[showIdTrakt]) return;

    console.debug('removing show progress:', showIdTrakt, showsProgress[showIdTrakt]);
    delete showsProgress[showIdTrakt];
    this.showsProgress.$.next(showsProgress);
    this.localStorageService.setObject(LocalStorage.SHOWS_PROGRESS, showsProgress);
  }

  show$(
    params$: Observable<{ show: string }>,
    pageState: BehaviorSubject<LoadingState>
  ): Observable<Show> {
    return params$.pipe(
      distinctUntilKeyChanged('show'),
      switchMap((params) => this.getShowBySlug$(params.show, { fetchAlways: true })),
      distinctUntilChangedDeep(),
      tap((show) => this.activeShow$.next(show)),
      catchErrorAndReplay('show', this.snackBar, pageState)
    );
  }

  getShowWatchedIndex(show: Show): number {
    const showsWatched = this.showsWatched.$.value;
    if (!showsWatched) throw Error('Shows watched empty');

    return showsWatched?.findIndex((showWatched) => showWatched.show.ids.trakt === show.ids.trakt);
  }

  moveShowWatchedToFront(showWatchedIndex: number): void {
    const showsWatched = this.showsWatched.$.value;
    if (!showsWatched) throw Error('Shows watched empty');
    showsWatched.unshift(showsWatched.splice(showWatchedIndex, 1)[0]);
    this.updateShowsWatched(showsWatched);
  }

  updateShowsWatched(showsWatched: ShowWatched[]): void {
    this.showsWatched.$.next(showsWatched);
    this.localStorageService.setObject(LocalStorage.SHOWS_WATCHED, showsWatched);
  }

  getShowProgress(show: Show): ShowProgress | undefined {
    const showsProgress = this.showsProgress.$.value;
    if (!showsProgress) throw Error('Shows progress empty');

    return showsProgress[show.ids.trakt];
  }

  updateShowsProgress(
    showsProgress = this.showsProgress.$.value,
    options = { clone: true, save: true }
  ): void {
    const showsProgressData = options.clone
      ? JSON.parse(JSON.stringify(showsProgress))
      : showsProgress;
    this.showsProgress.$.next(showsProgressData);
    if (options.save) {
      this.localStorageService.setObject(LocalStorage.SHOWS_PROGRESS, showsProgressData);
    }
  }

  removeShowWatched(show: Show): void {
    const showsWatched = this.showsWatched.$.value;
    if (!showsWatched) return;

    const showWatchedIndex = showsWatched.findIndex(
      (showWatched) => showWatched.show.ids.trakt === show.ids.trakt
    );
    if (showWatchedIndex === -1) return;

    console.debug('removing show watched:', show.ids.trakt, showsWatched[showWatchedIndex]);
    showsWatched.splice(showWatchedIndex, 1);
    this.showsWatched.$.next(showsWatched);
    this.localStorageService.setObject(LocalStorage.SHOWS_WATCHED, showsWatched);
  }

  updateShowsHidden(showsHidden = this.showsHidden.$.value): void {
    this.showsHidden.$.next(showsHidden);
    this.localStorageService.setObject(LocalStorage.SHOWS_HIDDEN, showsHidden);
  }
}
