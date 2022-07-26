import { Injectable } from '@angular/core';
import { BehaviorSubject, combineLatest, map, Observable, of, switchMap } from 'rxjs';
import {
  AddToListResponse,
  AddToWatchlistResponse,
  RemoveFromListResponse,
  RemoveFromWatchlistResponse,
} from '../../../types/interfaces/TraktResponse';
import { List, ListItem, WatchlistItem } from '../../../types/interfaces/TraktList';
import { Config } from '../../config';
import { Ids } from '../../../types/interfaces/Trakt';
import { syncArraysTrakt, syncArrayTrakt } from '../../helper/sync';
import { LocalStorage } from '../../../types/enum';
import { HttpClient } from '@angular/common/http';
import { ShowService } from './show.service';
import { TranslationService } from './translation.service';

@Injectable({
  providedIn: 'root',
})
export class ListService {
  watchlist$: BehaviorSubject<WatchlistItem[]>;
  syncWatchlist: () => Observable<void>;

  lists$: BehaviorSubject<List[]>;
  syncLists: () => Observable<void>;

  listItems$: BehaviorSubject<{ [listId: string]: ListItem[] }>;
  syncListItems: (listSlug: string, force?: boolean) => Observable<void>;
  private readonly fetchListItems: (
    listId: number | string,
    sync?: boolean
  ) => Observable<ListItem[] | undefined>;

  updated = new BehaviorSubject(undefined);

  constructor(
    private http: HttpClient,
    private showService: ShowService,
    private translationService: TranslationService
  ) {
    const [watchlist$, syncWatchlist] = syncArrayTrakt<WatchlistItem>({
      http: this.http,
      url: '/users/me/watchlist/shows',
      localStorageKey: LocalStorage.WATCHLIST,
    });
    this.watchlist$ = watchlist$;
    this.syncWatchlist = syncWatchlist;

    const [lists$, syncLists] = syncArrayTrakt<List>({
      http: this.http,
      url: '/users/me/lists',
      localStorageKey: LocalStorage.LISTS,
    });
    this.lists$ = lists$;
    this.syncLists = syncLists;

    const [listItems$, syncListItems, fetchListItems] = syncArraysTrakt<ListItem>({
      http: this.http,
      url: '/users/me/lists/%/items/show',
      localStorageKey: LocalStorage.LIST_ITEMS,
    });
    this.listItems$ = listItems$;
    this.syncListItems = syncListItems;
    this.fetchListItems = fetchListItems;
  }

  getListItems$(listSlug: string, sync?: boolean): Observable<ListItem[] | undefined> {
    return combineLatest([this.listItems$, this.translationService.showsTranslations$]).pipe(
      switchMap(([listsListItems, showsTranslations]) => {
        const listItems: ListItem[] = listsListItems[listSlug];
        if (!listItems) {
          return this.fetchListItems(listSlug, sync).pipe(
            map((listItems) => {
              if (listItems) {
                listItems.forEach((listItem) => {
                  listItem.show.title =
                    showsTranslations[listItem.show.ids.trakt]?.title || listItem.show.title;
                });
              }
              return listItems;
            })
          );
        }
        listItems.forEach((listItem) => {
          listItem.show.title =
            showsTranslations[listItem.show.ids.trakt]?.title || listItem.show.title;
        });
        return of(listItems);
      })
    );
  }

  getWatchlistItems$(): Observable<WatchlistItem[] | undefined> {
    return combineLatest([this.watchlist$, this.translationService.showsTranslations$]).pipe(
      switchMap(([watchlistItems, showsTranslations]) => {
        watchlistItems.forEach((listItem) => {
          listItem.show.title =
            showsTranslations[listItem.show.ids.trakt]?.title || listItem.show.title;
        });
        return of(watchlistItems);
      })
    );
  }

  addList(list: Partial<List>, userId = 'me'): Observable<List> {
    return this.http.post<List>(`${Config.traktBaseUrl}/users/${userId}/lists`, list);
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

  executeAddToWatchlist(ids: Ids): void {
    this.addToWatchlist(ids).subscribe(async (res) => {
      if (res.not_found.shows.length > 0) {
        console.error('res', res);
      }
      await this.syncWatchlist();
      this.updated.next(undefined);
    });
  }

  async executeRemoveFromWatchlist(ids: Ids): Promise<void> {
    this.removeFromWatchlist(ids).subscribe(async (res) => {
      if (res.not_found.shows.length > 0) {
        console.error('res', res);
      }
      await this.syncWatchlist();
      this.updated.next(undefined);
    });
  }
}
