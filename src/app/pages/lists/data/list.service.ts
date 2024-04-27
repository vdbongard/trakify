import { inject, Injectable, Injector } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { combineLatest, map, type Observable, of, switchMap } from 'rxjs';
import { TranslationService } from '../../shows/data/translation.service';
import { translated } from '@helper/translation';
import { LocalStorage } from '@type/Enum';
import type {
  AddToListResponse,
  AddToWatchlistResponse,
  RemoveFromListResponse,
  RemoveFromWatchlistResponse,
} from '@type/TraktResponse';
import type { List, ListItem, WatchlistItem } from '@type/TraktList';
import { listItemSchema, listSchema, watchlistItemSchema } from '@type/TraktList';
import type { Show } from '@type/Trakt';
import { API } from '@shared/api';
import { urlReplace } from '@helper/urlReplace';
import { LocalStorageService } from '@services/local-storage.service';
import { SyncDataService } from '@services/sync-data.service';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';

@Injectable({
  providedIn: 'root',
})
export class ListService {
  http = inject(HttpClient);
  translationService = inject(TranslationService);
  localStorageService = inject(LocalStorageService);
  syncDataService = inject(SyncDataService);
  injector = inject(Injector);

  watchlist = this.syncDataService.syncArray<WatchlistItem>({
    url: API.watchlist,
    localStorageKey: LocalStorage.WATCHLIST,
    schema: watchlistItemSchema.array(),
  });
  lists = this.syncDataService.syncArray<List>({
    url: API.lists,
    localStorageKey: LocalStorage.LISTS,
    schema: listSchema.array(),
  });
  listItems = this.syncDataService.syncArrays<ListItem>({
    url: API.listItems,
    localStorageKey: LocalStorage.LIST_ITEMS,
    schema: listItemSchema.array(),
  });

  addList(list: Partial<List>, userId = 'me'): Observable<List> {
    return this.http.post<List>(urlReplace(API.listAdd, [userId]), list);
  }

  removeList(list: Partial<List>, userId = 'me'): Observable<void> {
    return this.http.delete<void>(urlReplace(API.listRemove, [userId, list.ids?.slug]));
  }

  addToWatchlist(show: Show): Observable<AddToWatchlistResponse> {
    return this.http.post<AddToWatchlistResponse>(API.syncWatchlist, {
      shows: [{ ids: show.ids }],
    });
  }

  removeFromWatchlist(show: Show): Observable<RemoveFromWatchlistResponse> {
    return this.http.post<RemoveFromWatchlistResponse>(API.syncWatchlistRemove, {
      shows: [{ ids: show.ids }],
    });
  }

  addShowsToList(listId: number, showIds: number[], userId = 'me'): Observable<AddToListResponse> {
    return this.http.post<AddToListResponse>(urlReplace(API.listAddShow, [userId, listId]), {
      shows: showIds.map((showId) => ({
        ids: {
          trakt: showId,
        },
      })),
    });
  }

  removeShowsFromList(
    listId: number,
    showIds: number[],
    userId = 'me',
  ): Observable<RemoveFromListResponse> {
    return this.http.post<RemoveFromListResponse>(
      urlReplace(API.listRemoveShow, [userId, listId]),
      {
        shows: showIds.map((showId) => ({
          ids: {
            trakt: showId,
          },
        })),
      },
    );
  }

  getListItems$(
    listSlug: string | undefined,
    sync?: boolean,
    fetch?: boolean,
  ): Observable<ListItem[] | undefined> {
    if (!listSlug) return of([]);
    return combineLatest([
      toObservable(this.listItems.s, { injector: this.injector }),
      toObservable(this.translationService.showsTranslations.s, { injector: this.injector }),
    ]).pipe(
      switchMap(([listsListItems, showsTranslations]) => {
        const listItems: ListItem[] | undefined = listsListItems[listSlug];

        if (fetch && !listItems) {
          return this.listItems.fetch(listSlug, sync).pipe(
            map((listItems) =>
              listItems.map((listItem) => ({
                ...listItem,
                show: translated(listItem.show, showsTranslations[listItem.show.ids.trakt]),
              })),
            ),
          );
        }

        return of(
          listItems?.map((listItem) => ({
            ...listItem,
            show: translated(listItem.show, showsTranslations[listItem.show.ids.trakt]),
          })),
        );
      }),
    );
  }

  getWatchlistItems$(): Observable<WatchlistItem[]> {
    return combineLatest([
      toObservable(this.watchlist.s, { injector: this.injector }),
      toObservable(this.translationService.showsTranslations.s, { injector: this.injector }),
    ]).pipe(
      switchMap(([watchlistItems, showsTranslations]) =>
        of(
          watchlistItems?.map((listItem) => ({
            ...listItem,
            show: translated(listItem.show, showsTranslations[listItem.show.ids.trakt]),
          })) ?? [],
        ),
      ),
    );
  }

  watchlistItems = toSignal(this.getWatchlistItems$(), { initialValue: [] });

  updateWatchlist(watchlistItems = this.watchlist.s()): void {
    this.watchlist.s.set([...(watchlistItems ?? [])]);
    this.localStorageService.setObject(LocalStorage.WATCHLIST, watchlistItems);
  }

  addToWatchlistOptimistically(show: Show): void {
    const watchlistItems = this.watchlist.s();
    if (!watchlistItems) throw Error('Watchlist empty');

    watchlistItems.push({
      id: show.ids.trakt,
      show,
      listed_at: new Date().toISOString(),
      notes: null,
      type: 'show',
    });

    this.updateWatchlist();
  }

  removeFromWatchlistOptimistically(show: Show): void {
    let watchlistItems = this.watchlist.s();
    if (!watchlistItems) throw Error('Watchlist empty');

    let isChanged = false;

    watchlistItems = watchlistItems.filter((watchlistItem) => {
      const isSameShow = watchlistItem.show.ids.trakt === show.ids.trakt;
      if (isSameShow) isChanged = true;
      return !isSameShow;
    });

    if (isChanged) this.updateWatchlist(watchlistItems);
  }

  isWatchlistItem(watchlistItems, show: Show): boolean {
    return !!watchlistItems?.find(
      (watchlistItem) => watchlistItem.show.ids.trakt === show.ids.trakt,
    );
  }
}
