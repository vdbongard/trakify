import { computed, inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
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
import { toUrl } from '@helper/toUrl';
import { LocalStorageService } from '@services/local-storage.service';
import { SyncDataService } from '@services/sync-data.service';

@Injectable({
  providedIn: 'root',
})
export class ListService {
  http = inject(HttpClient);
  translationService = inject(TranslationService);
  localStorageService = inject(LocalStorageService);
  syncDataService = inject(SyncDataService);

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
    return this.http.post<List>(toUrl(API.listAdd, [userId]), list);
  }

  removeList(list: Partial<List>, userId = 'me'): Observable<void> {
    return this.http.delete<void>(toUrl(API.listRemove, [userId, list.ids?.slug]));
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
    return this.http.post<AddToListResponse>(toUrl(API.listAddShow, [userId, listId]), {
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
    return this.http.post<RemoveFromListResponse>(toUrl(API.listRemoveShow, [userId, listId]), {
      shows: showIds.map((showId) => ({
        ids: {
          trakt: showId,
        },
      })),
    });
  }

  getListItems(listSlug: string | undefined): ListItem[] | undefined {
    if (!listSlug) return [];
    const lists = this.lists.s();
    const listsListItems = this.listItems.s();
    const showsTranslations = this.translationService.showsTranslations.s();

    // Lists are looked up by slug (routing), but the list-items API call and store key
    // use the numeric Trakt id: Trakt rejects some numeric list slugs (e.g. "1") with
    // "List is private or does not exist" (403), while the id always resolves.
    const list = lists?.find((list) => list.ids.slug === listSlug);
    const listId = list ? String(list.ids.trakt) : listSlug;
    const items = listsListItems[listId];

    return items?.map((listItem) => ({
      ...listItem,
      show: translated(listItem.show, showsTranslations[listItem.show.ids.trakt]),
    }));
  }

  watchlistItems = computed(() => {
    const watchlistItems = this.watchlist.s();
    const showsTranslations = this.translationService.showsTranslations.s();

    return (
      watchlistItems?.map((listItem) => ({
        ...listItem,
        show: translated(listItem.show, showsTranslations[listItem.show.ids.trakt]),
      })) ?? []
    );
  });

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

  isWatchlistItem(watchlistItems = this.watchlist.s(), show: Show): boolean {
    return watchlistItems.some((watchlistItem) => watchlistItem.show.ids.trakt === show.ids.trakt);
  }
}
