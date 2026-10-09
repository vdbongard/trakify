import { inject, Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { fetchParsed } from '@helper/fetchParsed';
import { Config } from '@shared/config';
import { ConfigService } from '@services/config.service';
import { translated } from '@helper/translation';
import type { Episode, Season, SeasonProgress, Show } from '@type/Trakt';
import { episodeFullSchema, episodeSchema, seasonSchema, ShowProgress } from '@type/Trakt';
import type { AddToHistoryResponse, RemoveFromHistoryResponse } from '@type/TraktResponse';
import { API } from '@shared/api';
import { toUrl } from '@helper/toUrl';

@Injectable({
  providedIn: 'root',
})
export class SeasonService {
  http = inject(HttpClient);
  configService = inject(ConfigService);

  activeSeason = signal<Season | undefined>(undefined);

  fetchSeasons(show: Show): Promise<Season[]> {
    return fetchParsed(
      this.http.get<Season[]>(toUrl(API.seasons, [show.ids.trakt])),
      seasonSchema.array(),
    );
  }

  fetchSeasonEpisodes<T extends Episode>(
    showId: number | string,
    seasonNumber: number,
    language?: string,
    extended = true,
  ): Promise<T[]> {
    const params: { extended?: string; translations?: string } = {};
    if (extended) params.extended = 'full';
    if (language && language !== 'en') params.translations = language;

    return fetchParsed(
      this.http.get<T[]>(toUrl(API.seasonEpisodes, [showId, seasonNumber]), { params }),
      (extended ? episodeFullSchema : episodeSchema).array(),
    );
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

  async getSeasonEpisodes<T extends Episode>(
    show?: Show,
    seasonNumber?: number,
    extended = true,
    withTranslation = true,
  ): Promise<T[]> {
    if (!show || seasonNumber === undefined) throw Error('Argument is empty (getSeasonEpisodes)');

    const language = withTranslation ? this.configService.config.s().language.substring(0, 2) : '';

    const res = await this.fetchSeasonEpisodes<T>(show.ids.trakt, seasonNumber, language, extended);
    return res.map((episode) => {
      if (!withTranslation || !episode?.translations?.length) return episode;
      return translated(episode, episode.translations?.[0]);
    });
  }

  getSeasonProgress(showProgress: ShowProgress, seasonNumber: number): SeasonProgress | undefined {
    return showProgress.seasons?.find((season) => season.number === seasonNumber);
  }

  async getSeasonFromNumber(seasonNumber: number, show: Show): Promise<Season | undefined> {
    const seasons = await this.fetchSeasons(show);
    return seasons?.find((season) => season.number === seasonNumber);
  }
}
