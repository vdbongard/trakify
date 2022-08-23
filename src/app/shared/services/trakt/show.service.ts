import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, combineLatest, map, Observable, of, switchMap, take } from 'rxjs';
import {
  Ids,
  RecommendedShow,
  Show,
  ShowHidden,
  ShowProgress,
  ShowSearch,
  ShowWatched,
  ShowWatchedHistory,
  TrendingShow,
} from '../../../../types/interfaces/Trakt';
import { LocalStorage } from '../../../../types/enum';
import { Config } from '../../../config';
import { ConfigService } from '../config.service';
import { syncArrayTrakt, syncObjectsTrakt } from '../../helper/sync';
import { HttpOptions } from '../../../../types/interfaces/Http';
import { ListService } from './list.service';
import { TranslationService } from './translation.service';
import { RemoveFromHistoryResponse } from '../../../../types/interfaces/TraktResponse';
import { setLocalStorage } from '../../helper/localStorage';
import { FetchOptions } from '../../../../types/interfaces/Sync';

@Injectable({
  providedIn: 'root',
})
export class ShowService {
  activeShow = new BehaviorSubject<Show | undefined>(undefined);

  showsWatched = syncArrayTrakt<ShowWatched>({
    http: this.http,
    url: '/sync/watched/shows?extended=noseasons',
    localStorageKey: LocalStorage.SHOWS_WATCHED,
  });
  showsProgress = syncObjectsTrakt<ShowProgress>({
    http: this.http,
    url: '/shows/%/progress/watched?specials=true&count_specials=false',
    localStorageKey: LocalStorage.SHOWS_PROGRESS,
    ignoreExisting: true,
  });
  showsHidden = syncArrayTrakt<ShowHidden>({
    http: this.http,
    url: '/users/hidden/progress_watched?type=show',
    localStorageKey: LocalStorage.SHOWS_HIDDEN,
  });
  favorites = syncArrayTrakt<number>({
    localStorageKey: LocalStorage.FAVORITES,
  });

  constructor(
    private http: HttpClient,
    private configService: ConfigService,
    private listService: ListService,
    private translationService: TranslationService
  ) {}

  private fetchShow(showId: number | string): Observable<Show> {
    return this.http.get<Show>(`${Config.traktBaseUrl}/shows/${showId}`);
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

  fetchPopularShows(): Observable<Show[]> {
    return this.http.get<Show[]>(`${Config.traktBaseUrl}/shows/popular`);
  }

  fetchRecommendedShows(): Observable<RecommendedShow[]> {
    return this.http.get<RecommendedShow[]>(`${Config.traktBaseUrl}/shows/recommended`);
  }

  addShow(show: Show): Observable<RemoveFromHistoryResponse> {
    return this.http.post<RemoveFromHistoryResponse>(`${Config.traktBaseUrl}/sync/history`, {
      shows: [show],
    });
  }

  removeShow(show: Show): Observable<RemoveFromHistoryResponse> {
    return this.http.post<RemoveFromHistoryResponse>(`${Config.traktBaseUrl}/sync/history/remove`, {
      shows: [show],
    });
  }

  addFavorite(show: Show): void {
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

  removeFavorite(show: Show): void {
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

        const watchedClone = { ...showWatched };
        watchedClone.show = { ...watchedClone.show };
        showWatched.show.title = showTranslation?.title ?? showWatched.show.title;

        return watchedClone;
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

        return shows.map((show) => {
          const showCloned = { ...show };
          showCloned.title = showsTranslations[show.ids.trakt]?.title ?? show.title;
          return showCloned;
        });
      })
    );
  }

  getShow$(ids?: Ids, options?: FetchOptions): Observable<Show | undefined> {
    if (!ids) throw Error('Show id is empty');

    return this.getShows$().pipe(
      switchMap((shows) => {
        const show = shows.find((show) => show.ids.trakt === ids.trakt);
        if (options?.fetch && !show) {
          const showObservable = this.fetchShow(ids.trakt);
          const showTranslationObservable = this.translationService.getShowTranslation$(
            ids.trakt,
            options?.sync,
            options?.fetch
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

  getShowProgress$(showId?: number): Observable<ShowProgress | undefined> {
    if (!showId) throw Error('Show id is empty');
    return this.showsProgress.$.pipe(map((showsProgress) => showsProgress[showId]));
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
