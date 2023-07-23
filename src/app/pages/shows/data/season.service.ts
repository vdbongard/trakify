import { inject, Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map, Observable } from 'rxjs';
import { ShowService } from './show.service';
import { Config } from '@shared/config';
import { ConfigService } from '@services/config.service';
import { translated } from '@helper/translation';
import type { Episode, Season, SeasonProgress, Show } from '@type/Trakt';
import { episodeFullSchema, episodeSchema, seasonSchema, ShowProgress } from '@type/Trakt';
import type { AddToHistoryResponse, RemoveFromHistoryResponse } from '@type/TraktResponse';
import { parseResponse } from '@operator/parseResponse';
import { API } from '@shared/api';
import { urlReplace } from '@helper/urlReplace';

@Injectable({
  providedIn: 'root',
})
export class SeasonService {
  showService = inject(ShowService);
  http = inject(HttpClient);
  configService = inject(ConfigService);

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

    return this.showService.showsProgress.$.pipe(
      map(
        (showsProgress) =>
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

    const language = withTranslation
      ? this.configService.config.$.value.language.substring(0, 2)
      : '';

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
