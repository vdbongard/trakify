import { Injectable } from '@angular/core';
import { BehaviorSubject, map, Observable } from 'rxjs';
import { EpisodeFull, Ids, Season, SeasonProgress } from '../../../../types/interfaces/Trakt';
import { ShowService } from './show.service';
import { Config } from '../../../config';
import { HttpClient } from '@angular/common/http';
import { TranslationService } from './translation.service';
import { ConfigService } from '../config.service';
import {
  AddToHistoryResponse,
  RemoveFromHistoryResponse,
} from '../../../../types/interfaces/TraktResponse';

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
    language?: string
  ): Observable<EpisodeFull[]> {
    return this.http.get<EpisodeFull[]>(
      `${Config.traktBaseUrl}/shows/${showId}/seasons/${seasonNumber}?extended=full${
        language ? `&translations=${language}` : ''
      }`
    );
  }

  getSeasonProgress$(ids?: Ids, seasonNumber?: number): Observable<SeasonProgress | undefined> {
    if (ids === undefined || seasonNumber === undefined) throw Error('Argument is empty');

    return this.showService.showsProgress$.pipe(
      map((showsProgress) =>
        showsProgress[ids.trakt]?.seasons.find((season) => season.number === seasonNumber)
      )
    );
  }

  getSeasonEpisodes$(ids?: Ids, seasonNumber?: number): Observable<EpisodeFull[]> {
    if (!ids || seasonNumber === undefined) throw Error('Argument is empty');

    const language = this.configService.config$.value.language.substring(0, 2);

    return this.fetchSeasonEpisodes$(ids.trakt, seasonNumber, language).pipe(
      map((res) => {
        return res.map((episode) => {
          const episodeClone = { ...episode };
          if (!episodeClone.translations?.length) return episodeClone;
          episodeClone.title = episodeClone.translations[0].title ?? episodeClone.title;
          episodeClone.overview = episodeClone.translations[0].overview ?? episodeClone.overview;
          return episodeClone;
        });
      })
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
}
