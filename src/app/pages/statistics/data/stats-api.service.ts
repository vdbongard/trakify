import { inject, Injectable } from '@angular/core';
import type { Observable } from 'rxjs';
import { type Stats, statsSchema } from '@type/Trakt';
import { urlReplace } from '@helper/urlReplace';
import { API } from '@shared/api';
import { parseResponse } from '@operator/parseResponse';
import { HttpClient } from '@angular/common/http';

@Injectable({
  providedIn: 'root',
})
export class StatsApiService {
  http = inject(HttpClient);

  fetchStats(userId = 'me'): Observable<Stats> {
    return this.http.get<Stats>(urlReplace(API.stats, [userId])).pipe(parseResponse(statsSchema));
  }
}
