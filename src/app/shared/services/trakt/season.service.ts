import { Injectable } from '@angular/core';
import { BehaviorSubject, map, Observable } from 'rxjs';
import {
  Episode,
  EpisodeFull,
  Ids,
  Season,
  SeasonProgress,
} from '../../../../types/interfaces/Trakt';
import { ShowService } from './show.service';
import { Config } from '../../../config';
import { HttpClient } from '@angular/common/http';
import { TranslationService } from './translation.service';
import { ConfigService } from '../config.service';
import {
  AddToHistoryResponse,
  RemoveFromHistoryResponse,
} from '../../../../types/interfaces/TraktResponse';
import { translated } from '../../helper/translation';

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

  fetchSeasons$(showId: number | string): Observable<Season[]> {
    return this.http.get<EpisodeFull[]>(`${Config.traktBaseUrl}/shows/${showId}/seasons`);
  }

  fetchSeasonEpisodes$(
    showId: number | string,
    seasonNumber: number,
    language?: string,
    extended = true
  ): Observable<(Episode | EpisodeFull)[]> {
    return this.http.get<EpisodeFull[]>(
      `${Config.traktBaseUrl}/shows/${showId}/seasons/${seasonNumber}`,
      {
        params: {
          extended: extended ? 'full' : '',
          translations: language ?? '',
        },
      }
    );
  }

  addSeason(season: Season): Observable<AddToHistoryResponse> {
    return this.http.post<AddToHistoryResponse>(`${Config.traktBaseUrl}/sync/history`, {
      seasons: [season],
    });
  }

  removeSeason(season: Season): Observable<RemoveFromHistoryResponse> {
    return this.http.post<RemoveFromHistoryResponse>(`${Config.traktBaseUrl}/sync/history/remove`, {
      seasons: [season],
    });
  }

  getSeasonProgress$(ids?: Ids, seasonNumber?: number): Observable<SeasonProgress | undefined> {
    if (ids === undefined || seasonNumber === undefined) throw Error('Argument is empty');

    return this.showService.showsProgress.$.pipe(
      map((showsProgress) =>
        showsProgress[ids.trakt]?.seasons.find((season) => season.number === seasonNumber)
      )
    );
  }

  getSeasonEpisodes$(
    ids?: Ids,
    seasonNumber?: number,
    extended = true,
    withTranslation = true
  ): Observable<(Episode | EpisodeFull)[]> {
    if (!ids || seasonNumber === undefined) throw Error('Argument is empty');

    const language = withTranslation
      ? this.configService.config.$.value.language.substring(0, 2)
      : '';

    return this.fetchSeasonEpisodes$(ids.trakt, seasonNumber, language, extended).pipe(
      map((res) =>
        res.map((episode) => {
          if (!withTranslation || !(episode as EpisodeFull)?.translations?.length) return episode;
          return translated(episode, (episode as EpisodeFull).translations?.[0]);
        })
      )
    );
  }

  getSeasonTitle(seasonTitleOrNumber: string | null): string {
    if (seasonTitleOrNumber === 'Season 0') return 'Specials';
    if (!seasonTitleOrNumber) return '';
    return seasonTitleOrNumber;
  }
}
