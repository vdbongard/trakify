import { HttpClient } from '@angular/common/http';
import { Injectable, Injector, inject, signal } from '@angular/core';
import { toObservable } from '@angular/core/rxjs-interop';
import { translated } from '@helper/translation';
import { urlReplace } from '@helper/urlReplace';
import { parseResponse } from '@operator/parseResponse';
import { ConfigService } from '@services/config.service';
import { API } from '@shared/api';
import { Config } from '@shared/config';
import type { Episode, Season, SeasonProgress, Show } from '@type/Trakt';
import { type ShowProgress, episodeFullSchema, episodeSchema, seasonSchema } from '@type/Trakt';
import type { AddToHistoryResponse, RemoveFromHistoryResponse } from '@type/TraktResponse';
import { type Observable, map } from 'rxjs';
import { ShowService } from './show.service';

@Injectable({
  providedIn: 'root',
})
export class SeasonService {
  showService = inject(ShowService);
  http = inject(HttpClient);
  configService = inject(ConfigService);
  injector = inject(Injector);

  activeSeason = signal<Season | undefined>(undefined);

  fetchSeasons(show: Show): Observable<Season[]> {
    return this.http
      .get<Season[]>(urlReplace(API.seasons, [show.ids.trakt]))
      .pipe(parseResponse(seasonSchema.array()));
  }

  fetchSeasonEpisodes<T extends Episode>(
    showId: number | string,
    seasonNumber: number,
    language?: string,
    extended = true,
  ): Observable<T[]> {
    const params: { extended?: string; translations?: string } = {};
    if (extended) params.extended = 'full';
    if (language && language !== 'en') params.translations = language;

    return this.http
      .get<T[]>(urlReplace(API.seasonEpisodes, [showId, seasonNumber]), { params })
      .pipe(parseResponse((extended ? episodeFullSchema : episodeSchema).array()));
  }

  addSeason(season: Season): Observable<AddToHistoryResponse> {
    return this.http.post<AddToHistoryResponse>(`${Config.traktBaseUrl}/sync/history`, {
      seasons: [season],
    });
  }

  removeSeason(season: Season): Observable<RemoveFromHistoryResponse> {
    return this.http.post<RemoveFromHistoryResponse>(API.syncHistoryRemove, {
      seasons: [season],
    });
  }

  getSeasonProgress$(show?: Show, seasonNumber?: number): Observable<SeasonProgress | undefined> {
    if (show === undefined || seasonNumber === undefined)
      throw Error('Argument is empty (getSeasonProgress$)');

    return toObservable(this.showService.showsProgress.s, { injector: this.injector }).pipe(
      map((showsProgress) =>
        showsProgress[show.ids.trakt]?.seasons.find((season) => season.number === seasonNumber),
      ),
    );
  }

  getSeasonEpisodes$<T extends Episode>(
    show?: Show,
    seasonNumber?: number,
    extended = true,
    withTranslation = true,
  ): Observable<T[]> {
    if (!show || seasonNumber === undefined) throw Error('Argument is empty (getSeasonEpisodes$)');

    const language = withTranslation ? this.configService.config.s().language.substring(0, 2) : '';

    return this.fetchSeasonEpisodes<T>(show.ids.trakt, seasonNumber, language, extended).pipe(
      map((res) =>
        res.map((episode) => {
          if (!withTranslation || !episode?.translations?.length) return episode;
          return translated(episode, episode.translations?.[0]);
        }),
      ),
    );
  }

  getSeasonProgress(showProgress: ShowProgress, seasonNumber: number): SeasonProgress | undefined {
    return showProgress.seasons.find((season) => season.number === seasonNumber);
  }

  getSeasonFromNumber$(seasonNumber: number, show: Show): Observable<Season | undefined> {
    return this.fetchSeasons(show).pipe(
      map((seasons) => seasons?.find((season) => season.number === seasonNumber)),
    );
  }
}
