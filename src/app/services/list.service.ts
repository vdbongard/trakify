import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import {
  AddToListResponse,
  AddToWatchlistResponse,
  RemoveFromListResponse,
  RemoveFromWatchlistResponse,
} from '../../types/interfaces/TraktResponse';
import { List, ListItem, WatchlistItem } from '../../types/interfaces/TraktList';
import { Config } from '../config';
import { Ids } from '../../types/interfaces/Trakt';
import { syncArrayTrakt } from '../helper/sync';
import { LocalStorage } from '../../types/enum';
import { HttpClient } from '@angular/common/http';

@Injectable({
  providedIn: 'root',
})
export class ListService {
  watchlist$: BehaviorSubject<WatchlistItem[]>;
  syncWatchlist: () => Promise<void>;

  updated = new BehaviorSubject(undefined);

  constructor(private http: HttpClient) {
    const [watchlist$, syncWatchlist] = syncArrayTrakt<WatchlistItem>({
      http: this.http,
      url: '/users/me/watchlist/shows',
      localStorageKey: LocalStorage.WATCHLIST,
    });
    this.watchlist$ = watchlist$;
    this.syncWatchlist = syncWatchlist;
  }

  fetchLists(userId = 'me'): Observable<List[]> {
    return this.http.get<List[]>(`${Config.traktBaseUrl}/users/${userId}/lists`);
  }

  fetchListItems(listId: string | number, userId = 'me'): Observable<ListItem[]> {
    return this.http.get<ListItem[]>(
      `${Config.traktBaseUrl}/users/${userId}/lists/${listId}/items/show`
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
