import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { combineLatest, map, Observable, of, switchMap } from 'rxjs';
import { TranslationService } from './translation.service';
import { syncArray, syncArrays } from '@helper/sync';
import { translated } from '@helper/translation';

import { LocalStorage } from '@type/enum';

import type {
  AddToListResponse,
  AddToWatchlistResponse,
  RemoveFromListResponse,
  RemoveFromWatchlistResponse,
} from '@type/interfaces/TraktResponse';
import type { List, ListItem, WatchlistItem } from '@type/interfaces/TraktList';
import { listItemSchema, listSchema, watchlistItemSchema } from '@type/interfaces/TraktList';
import type { Show } from '@type/interfaces/Trakt';
import { api } from '../../api';
import { urlReplace } from '@helper/urlReplace';
import { setLocalStorage } from '@helper/localStorage';

@Injectable({
  providedIn: 'root',
})
export class ListService {
  watchlist = syncArray<WatchlistItem>({
    http: this.http,
    url: api.watchlist,
    localStorageKey: LocalStorage.WATCHLIST,
    schema: watchlistItemSchema.array(),
  });
  lists = syncArray<List>({
    http: this.http,
    url: api.lists,
    localStorageKey: LocalStorage.LISTS,
    schema: listSchema.array(),
  });
  listItems = syncArrays<ListItem>({
    http: this.http,
    url: api.listItems,
    localStorageKey: LocalStorage.LIST_ITEMS,
    schema: listItemSchema.array(),
  });

  constructor(private http: HttpClient, private translationService: TranslationService) {}

  addList(list: Partial<List>, userId = 'me'): Observable<List> {
    return this.http.post<List>(urlReplace(api.listAdd, [userId]), list);
  }

  removeList(list: Partial<List>, userId = 'me'): Observable<void> {
    return this.http.delete<void>(urlReplace(api.listRemove, [userId, list.ids?.slug]));
  }

  addToWatchlist(show: Show): Observable<AddToWatchlistResponse> {
    return this.http.post<AddToWatchlistResponse>(api.syncWatchlist, {
      shows: [{ ids: show.ids }],
    });
  }

  removeFromWatchlist(show: Show): Observable<RemoveFromWatchlistResponse> {
    return this.http.post<RemoveFromWatchlistResponse>(api.syncWatchlistRemove, {
      shows: [{ ids: show.ids }],
    });
  }

  addShowsToList(listId: number, showIds: number[], userId = 'me'): Observable<AddToListResponse> {
    return this.http.post<AddToListResponse>(urlReplace(api.listAddShow, [userId, listId]), {
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
    userId = 'me'
  ): Observable<RemoveFromListResponse> {
    return this.http.post<RemoveFromListResponse>(
      urlReplace(api.listRemoveShow, [userId, listId]),
      {
        shows: showIds.map((showId) => ({
          ids: {
            trakt: showId,
          },
        })),
      }
    );
  }

  getListItems$(
    listSlug: string | undefined,
    sync?: boolean,
    fetch?: boolean
  ): Observable<ListItem[] | undefined> {
    if (!listSlug) return of([]);
    return combineLatest([this.listItems.$, this.translationService.showsTranslations.$]).pipe(
      switchMap(([listsListItems, showsTranslations]) => {
        const listItems: ListItem[] | undefined = listsListItems[listSlug];

        if (fetch && !listItems) {
          return this.listItems.fetch(listSlug, sync).pipe(
            map((listItems) =>
              listItems.map((listItem) => ({
                ...listItem,
                show: translated(listItem.show, showsTranslations[listItem.show.ids.trakt]),
              }))
            )
          );
        }

        return of(
          listItems?.map((listItem) => ({
            ...listItem,
            show: translated(listItem.show, showsTranslations[listItem.show.ids.trakt]),
          }))
        );
      })
    );
  }

  getWatchlistItems$(): Observable<WatchlistItem[]> {
    return combineLatest([this.watchlist.$, this.translationService.showsTranslations.$]).pipe(
      switchMap(([watchlistItems, showsTranslations]) =>
        of(
          watchlistItems?.map((listItem) => ({
            ...listItem,
            show: translated(listItem.show, showsTranslations[listItem.show.ids.trakt]),
          })) ?? []
        )
      )
    );
  }

  updateWatchlist(watchlistItems = this.watchlist.$.value): void {
    this.watchlist.$.next(watchlistItems);
    setLocalStorage(LocalStorage.WATCHLIST, watchlistItems);
  }

  addToWatchlistOptimistically(show: Show): void {
    const watchlistItems = this.watchlist.$.value;
    if (!watchlistItems) throw Error('Watchlist empty');

    watchlistItems.push({
      id: show.ids.trakt,
      show,
      // eslint-disable-next-line @typescript-eslint/naming-convention
      listed_at: new Date().toISOString(),
      notes: null,
      type: 'show',
    });

    this.updateWatchlist();
  }

  removeFromWatchlistOptimistically(show: Show): void {
    let watchlistItems = this.watchlist.$.value;
    if (!watchlistItems) throw Error('Watchlist empty');

    let isChanged = false;

    watchlistItems = watchlistItems.filter((watchlistItem) => {
      const isSameShow = watchlistItem.show.ids.trakt === show.ids.trakt;
      if (isSameShow) isChanged = true;
      return !isSameShow;
    });

    if (isChanged) this.updateWatchlist(watchlistItems);
  }
}
