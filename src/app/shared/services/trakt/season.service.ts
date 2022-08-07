import { Injectable } from '@angular/core';
import { catchError, combineLatest, map, Observable, of, switchMap } from 'rxjs';
import { EpisodeFull, Ids, SeasonProgress, Translation } from '../../../../types/interfaces/Trakt';
import { ShowService } from './show.service';
import { Config } from '../../../config';
import { HttpClient } from '@angular/common/http';
import { episodeId } from '../../helper/episodeId';
import { TranslationService } from './translation.service';
import { EpisodeService } from './episode.service';

@Injectable({
  providedIn: 'root',
})
export class SeasonService {
  constructor(
    private showService: ShowService,
    private http: HttpClient,
    private translationService: TranslationService,
    private episodeService: EpisodeService
  ) {}

  fetchSeasonEpisodes$(showId: number | string, seasonNumber: number): Observable<EpisodeFull[]> {
    return this.http.get<EpisodeFull[]>(
      `${Config.traktBaseUrl}/shows/${showId}/seasons/${seasonNumber}?extended=full`
    );
  }

  getSeasonProgress$(ids?: Ids, seasonNumber?: number): Observable<SeasonProgress | undefined> {
    if (ids === undefined || seasonNumber === undefined) throw Error('Argument is empty');

    const seasonProgress: Observable<SeasonProgress | undefined> =
      this.showService.showsProgress$.pipe(
        map((showsProgress) =>
          showsProgress[ids.trakt]?.seasons.find((season) => season.number === seasonNumber)
        )
      );
    const showAddedSeasonProgress = this.showService.addedShowInfos$.pipe(
      map((addedShowInfos) =>
        addedShowInfos[ids.trakt]?.showProgress?.seasons.find(
          (season) => season.number === seasonNumber
        )
      )
    );
    return combineLatest([seasonProgress, showAddedSeasonProgress]).pipe(
      map(([seasonProgress, showAddedSeasonProgress]) => seasonProgress ?? showAddedSeasonProgress)
    );
  }

  getSeasonEpisodes$(
    ids?: Ids,
    seasonNumber?: number,
    episodeCount?: number,
    sync?: boolean,
    fetch?: boolean
  ): Observable<EpisodeFull[]> {
    if (!ids || seasonNumber === undefined) throw Error('Argument is empty');

    const episodesTranslations = this.translationService.showsEpisodesTranslations$;

    return combineLatest([this.episodeService.showsEpisodes$, episodesTranslations]).pipe(
      switchMap(([showsEpisodes, episodesTranslations]) => {
        const episodeObservables = Array(episodeCount)
          .fill(0)
          .map((_, index) => {
            const episode: EpisodeFull =
              showsEpisodes[episodeId(ids.trakt, seasonNumber, index + 1)];

            if (fetch && !episode) {
              const episodeObservable = this.episodeService.fetchShowEpisode(
                ids.trakt,
                seasonNumber,
                index + 1,
                sync
              );
              const episodeTranslationObservable: Observable<Translation | undefined> =
                this.translationService
                  .getEpisodeTranslation$(ids, seasonNumber, index + 1, sync, fetch)
                  .pipe(catchError(() => of(undefined)));
              return combineLatest([episodeObservable, episodeTranslationObservable]).pipe(
                switchMap(([episode, episodeTranslation]) => {
                  const episodeClone = { ...episode };
                  episodeClone.title = episodeTranslation?.title ?? episode.title;
                  episodeClone.overview = episodeTranslation?.overview ?? episode.overview;
                  return of(episodeClone);
                })
              );
            }

            const episodeTranslation =
              episodesTranslations[episodeId(ids.trakt, seasonNumber, index + 1)];
            const episodeClone = { ...episode };
            episodeClone.title = episodeTranslation?.title ?? episode.title;
            episodeClone.overview = episodeTranslation?.overview ?? episode.overview;
            return of(episodeClone);
          });
        return combineLatest(episodeObservables);
      })
    );
  }
}
