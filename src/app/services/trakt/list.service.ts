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
import type { Ids } from '@type/interfaces/Trakt';
import { api } from '../../api';
import { urlReplace } from '@helper/urlReplace';

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

  addToWatchlist(ids: Ids): Observable<AddToWatchlistResponse> {
    return this.http.post<AddToWatchlistResponse>(api.syncWatchlist, {
      shows: [{ ids }],
    });
  }

  removeFromWatchlist(ids: Ids): Observable<RemoveFromWatchlistResponse> {
    return this.http.post<RemoveFromWatchlistResponse>(api.syncWatchlistRemove, {
      shows: [{ ids }],
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

  removeFromWatchlistLocally(ids: Ids): void {
    const items = this.watchlist.$.value?.filter(
      (watchlistItem) => watchlistItem.show.ids.trakt !== ids.trakt
    );
    this.watchlist.$.next(items);
  }
}
