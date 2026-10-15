import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { z } from 'zod';
import { API } from '@shared/api';
import { HISTORY_PAGE_SIZE } from '@constants';
import { fetchParsed } from '@helper/fetchParsed';
import { toUrl } from '@helper/toUrl';
import { historyPlaySchema, HistoryPlay } from '@type/Trakt';

/**
 * Reads the User's Trakt History on demand. History is deliberately not a mirrored store: it is
 * unbounded (one entry per Play) and only ever rendered one screen at a time, so the component
 * pages through it instead of syncing it into local storage.
 */
@Injectable({
  providedIn: 'root',
})
export class HistoryService {
  http = inject(HttpClient);

  fetchPlays(page: number): Promise<HistoryPlay[]> {
    return fetchParsed(
      this.http.get<HistoryPlay[]>(toUrl(API.historyEpisodes, [page, HISTORY_PAGE_SIZE])),
      z.array(historyPlaySchema),
    );
  }
}
