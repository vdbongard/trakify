import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { urlReplace } from '@helper/urlReplace';
import { parseResponse } from '@operator/parseResponse';
import { API } from '@shared/api';
import { type Stats, statsSchema } from '@type/Trakt';
import type { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class StatsApiService {
  http = inject(HttpClient);

  fetchStats(userId = 'me'): Observable<Stats> {
    return this.http.get<Stats>(urlReplace(API.stats, [userId])).pipe(parseResponse(statsSchema));
  }
}
