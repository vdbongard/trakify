import { inject, Injectable } from '@angular/core';
import { fetchParsed } from '@helper/fetchParsed';
import { type Stats, statsSchema } from '@type/Trakt';
import { toUrl } from '@helper/toUrl';
import { API } from '@shared/api';
import { HttpClient } from '@angular/common/http';

@Injectable({
  providedIn: 'root',
})
export class StatsApiService {
  http = inject(HttpClient);

  fetchStats(userId = 'me'): Promise<Stats> {
    return fetchParsed(this.http.get<Stats>(toUrl(API.stats, [userId])), statsSchema);
  }
}
