import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, map, Observable } from 'rxjs';

import { ShowService } from './show.service';
import { Config } from '../../config';
import { TranslationService } from './translation.service';
import { ConfigService } from '../config.service';
import { translated } from '@helper/translation';

import type { Episode, EpisodeFull, Season, SeasonProgress, Show } from '@type/interfaces/Trakt';
import { episodeFullSchema, episodeSchema, seasonSchema } from '@type/interfaces/Trakt';
import type {
  AddToHistoryResponse,
  RemoveFromHistoryResponse,
} from '@type/interfaces/TraktResponse';
import { parseResponse } from '@helper/parseResponse.operator';
import { api } from '../../api';
import { urlReplace } from '@helper/urlReplace';

@Injectable({
  providedIn: 'root',
})
export class SeasonService {
  activeSeason = new BehaviorSubject<Season | undefined>(undefined);

  constructor(
    private showService: ShowService,
    private http: HttpClient,
    private translationService: TranslationService,
    private configService: ConfigService
  ) {}

  fetchSeasons(showSlug: string): Observable<Season[]> {
    return this.http
      .get<Season[]>(urlReplace(api.seasons, [showSlug]))
      .pipe(parseResponse(seasonSchema.array()));
  }

  fetchSeasonEpisodes(
    showSlug: string,
    seasonNumber: number,
    language?: string,
    extended = true
  ): Observable<(Episode | EpisodeFull)[]> {
    return this.http
      .get<EpisodeFull[]>(urlReplace(api.seasonEpisodes, [showSlug, seasonNumber]), {
        params: {
          extended: extended ? 'full' : '',
          translations: language ?? '',
        },
      })
      .pipe(parseResponse((extended ? episodeFullSchema : episodeSchema).array()));
  }

  addSeason(season: Season): Observable<AddToHistoryResponse> {
    return this.http.post<AddToHistoryResponse>(`${Config.traktBaseUrl}/sync/history`, {
      seasons: [season],
    });
  }

  removeSeason(season: Season): Observable<RemoveFromHistoryResponse> {
    return this.http.post<RemoveFromHistoryResponse>(api.seasonAdd, {
      seasons: [season],
    });
  }

  getSeasonProgress$(show?: Show, seasonNumber?: number): Observable<SeasonProgress | undefined> {
    if (show === undefined || seasonNumber === undefined)
      throw Error('Argument is empty (getSeasonProgress$)');

    return this.showService.showsProgress.$.pipe(
      map((showsProgress) =>
        showsProgress[show.ids.slug]?.seasons.find((season) => season.number === seasonNumber)
      )
    );
  }

  getSeasonEpisodes$(
    show?: Show,
    seasonNumber?: number,
    extended = true,
    withTranslation = true
  ): Observable<(Episode | EpisodeFull)[]> {
    if (!show || seasonNumber === undefined) throw Error('Argument is empty (getSeasonEpisodes$)');

    const language = withTranslation
      ? this.configService.config.$.value.language.substring(0, 2)
      : '';

    return this.fetchSeasonEpisodes(show.ids.slug, seasonNumber, language, extended).pipe(
      map((res) =>
        res.map((episode) => {
          if (!withTranslation || !(episode as EpisodeFull)?.translations?.length) return episode;
          return translated(episode, (episode as EpisodeFull).translations?.[0]);
        })
      )
    );
  }
}
