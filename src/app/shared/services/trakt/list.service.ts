import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { combineLatest, map, Observable, of, switchMap } from 'rxjs';

import { Config } from '../../../config';
import { TranslationService } from './translation.service';
import { syncArraysTrakt, syncArrayTrakt } from '@helper/sync';
import { translated } from '@helper/translation';

import { LocalStorage } from '@type/enum';

import type {
  AddToListResponse,
  AddToWatchlistResponse,
  RemoveFromListResponse,
  RemoveFromWatchlistResponse,
} from '@type/interfaces/TraktResponse';
import type { List, ListItem, WatchlistItem } from '@type/interfaces/TraktList';
import type { Ids } from '@type/interfaces/Trakt';

@Injectable({
  providedIn: 'root',
})
export class ListService {
  watchlist = syncArrayTrakt<WatchlistItem>({
    http: this.http,
    url: '/users/me/watchlist/shows',
    localStorageKey: LocalStorage.WATCHLIST,
  });
  lists = syncArrayTrakt<List>({
    http: this.http,
    url: '/users/me/lists',
    localStorageKey: LocalStorage.LISTS,
  });
  listItems = syncArraysTrakt<ListItem>({
    http: this.http,
    url: '/users/me/lists/%/items/show',
    localStorageKey: LocalStorage.LIST_ITEMS,
  });

  constructor(private http: HttpClient, private translationService: TranslationService) {}

  addList(list: Partial<List>, userId = 'me'): Observable<List> {
    return this.http.post<List>(`${Config.traktBaseUrl}/users/${userId}/lists`, list);
  }

  removeList(list: Partial<List>, userId = 'me'): Observable<void> {
    return this.http.delete<void>(`${Config.traktBaseUrl}/users/${userId}/lists/${list.ids?.slug}`);
  }

  addToWatchlist(ids: Ids): Observable<AddToWatchlistResponse> {
    return this.http.post<AddToWatchlistResponse>(`${Config.traktBaseUrl}/sync/watchlist`, {
      shows: [{ ids }],
    });
  }

  removeFromWatchlist(ids: Ids): Observable<RemoveFromWatchlistResponse> {
    return this.http.post<RemoveFromWatchlistResponse>(
      `${Config.traktBaseUrl}/sync/watchlist/remove`,
      { shows: [{ ids }] }
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
      }
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
