import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import {
  BehaviorSubject,
  combineLatest,
  concat,
  distinctUntilChanged,
  map,
  Observable,
  of,
  switchMap,
  take,
} from 'rxjs';
import { ConfigService } from '../config.service';
import { ListService } from './list.service';
import { TranslationService } from './translation.service';
import { syncArray, syncObjects } from '@helper/sync';
import { setLocalStorage } from '@helper/localStorage';
import { translated } from '@helper/translation';

import { LocalStorage } from '@type/enum';

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
  RemoveFromHistoryResponse,
} from '@type/interfaces/TraktResponse';
import type { FetchOptions } from '@type/interfaces/Sync';
import { parseResponse } from '@helper/parseResponse.operator';
import { api } from 'src/app/api';
import { urlReplace } from '@helper/urlReplace';

@Injectable({
  providedIn: 'root',
})
export class ShowService {
  activeShow = new BehaviorSubject<Show | undefined>(undefined);

  showsWatched = syncArray<ShowWatched>({
    http: this.http,
    url: api.showsWatched,
    localStorageKey: LocalStorage.SHOWS_WATCHED,
    schema: showWatchedSchema.array(),
  });
  showsProgress = syncObjects<ShowProgress>({
    http: this.http,
    url: api.showProgress,
    localStorageKey: LocalStorage.SHOWS_PROGRESS,
    schema: showProgressSchema,
    ignoreExisting: true,
  });
  showsHidden = syncArray<ShowHidden>({
    http: this.http,
    url: api.showsHidden,
    localStorageKey: LocalStorage.SHOWS_HIDDEN,
    schema: showHiddenSchema.array(),
  });
  favorites = syncArray<number>({
    localStorageKey: LocalStorage.FAVORITES,
  });

  constructor(
    private http: HttpClient,
    private configService: ConfigService,
    private listService: ListService,
    private translationService: TranslationService
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
      .get<ShowWatchedHistory[]>(api.showsWatchedHistory, options)
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

  addShow(show: Show): Observable<AddToHistoryResponse> {
    return this.http.post<AddToHistoryResponse>(api.showAdd, {
      shows: [show],
    });
  }

  removeShow(show: Show): Observable<RemoveFromHistoryResponse> {
    return this.http.post<RemoveFromHistoryResponse>(api.showRemove, {
      shows: [show],
    });
  }

  isFavorite(show?: Show): boolean {
    const favorites = this.favorites.$.value;
    return !!show && !!favorites?.includes(show.ids.trakt);
  }

  addFavorite(show?: Show): void {
    if (!show) return;
    let favorites = this.favorites.$.value;
    if (!favorites) {
      this.favorites.$.next([show.ids.trakt]);
      setLocalStorage<number[]>(LocalStorage.FAVORITES, this.favorites.$.value);
      return;
    }
    if (favorites.includes(show.ids.trakt)) return;
    favorites.push(show.ids.trakt);
    this.favorites.sync();
  }

  removeFavorite(show?: Show): void {
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

  getShowWatched$(showId?: number): Observable<ShowWatched | undefined> {
    if (!showId) throw Error('Show id is empty');

    const showWatched = this.showsWatched.$.pipe(
      map((showsWatched) => {
        return showsWatched?.find((showWatched) => showWatched.show.ids.trakt === showId);
      })
    );

    return combineLatest([showWatched, this.translationService.getShowTranslation$(showId)]).pipe(
      map(([showWatched, showTranslation]) => {
        if (!showWatched) return;
        return {
          ...showWatched,
          show: translated(showWatched.show, showTranslation),
        };
      })
    );
  }

  getShows$(): Observable<Show[]> {
    const showsWatched = this.showsWatched.$.pipe(
      map((showsWatched) => showsWatched?.map((showWatched) => showWatched.show))
    );
    const showsWatchlisted = this.listService.watchlist.$.pipe(
      map((watchlistItems) => watchlistItems?.map((watchlistItem) => watchlistItem.show))
    );

    return combineLatest([
      showsWatched,
      showsWatchlisted,
      this.translationService.showsTranslations.$,
    ]).pipe(
      map(([showsWatched, showsWatchlisted, showsTranslations]) => {
        const shows: Show[] = [...(showsWatched ?? []), ...(showsWatchlisted ?? [])];
        return shows.map((show) => translated(show, showsTranslations[show.ids.trakt]));
      })
    );
  }

  getShowBySlug$(slug?: string | null, options?: FetchOptions): Observable<Show | undefined> {
    if (!slug) throw Error('Slug is empty');

    return this.getShows$().pipe(
      switchMap((shows) => {
        const show = shows.find((show) => show?.ids.slug === slug);
        if (options?.fetchAlways || (options?.fetch && !show)) {
          let showObservable = this.fetchShow(slug);
          const showTranslationObservable = this.translationService.getShowTranslationBySlug$(
            slug,
            show ? true : options?.sync
          );
          if (show)
            showObservable = concat(of(show), showObservable).pipe(
              distinctUntilChanged((a, b) => JSON.stringify(a) === JSON.stringify(b))
            );
          return combineLatest([showObservable, showTranslationObservable]).pipe(
            map(([show, showTranslation]) => translated(show, showTranslation))
          );
        }

        if (show && !Object.keys(show).length) throw Error('Show is empty');

        return of(show);
      })
    );
  }

  getShowProgress$(showId?: number): Observable<ShowProgress | undefined> {
    if (!showId) throw Error('Show id is empty');
    return this.showsProgress.$.pipe(map((showsProgress) => showsProgress[showId]));
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

  removeShowProgress(show: Show): void {
    const showsProgress = this.showsProgress.$.value;
    delete showsProgress[show.ids.trakt];
    this.showsProgress.$.next(showsProgress);
    setLocalStorage(LocalStorage.SHOWS_PROGRESS, showsProgress);
  }
}
