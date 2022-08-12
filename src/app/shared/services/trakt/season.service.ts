import { Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
import { EpisodeFull, Ids, SeasonProgress } from '../../../../types/interfaces/Trakt';
import { ShowService } from './show.service';
import { Config } from '../../../config';
import { HttpClient } from '@angular/common/http';
import { TranslationService } from './translation.service';
import { ConfigService } from '../config.service';

@Injectable({
  providedIn: 'root',
})
export class SeasonService {
  constructor(
    private showService: ShowService,
    private http: HttpClient,
    private translationService: TranslationService,
    private configService: ConfigService
  ) {}

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
}
