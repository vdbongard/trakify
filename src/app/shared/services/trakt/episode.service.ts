import { Injectable } from '@angular/core';
import {
  BehaviorSubject,
  catchError,
  combineLatest,
  concat,
  defaultIfEmpty,
  forkJoin,
  map,
  Observable,
  of,
  switchMap,
  take,
} from 'rxjs';
import {
  Episode,
  EpisodeAiring,
  EpisodeFull,
  EpisodeProgress,
  Ids,
  SeasonProgress,
  ShowProgress,
} from '../../../../types/interfaces/Trakt';
import { syncObjectsTrakt } from '../../helper/sync';
import { LocalStorage } from '../../../../types/enum';
import { episodeId } from '../../helper/episodeId';
import { HttpClient } from '@angular/common/http';
import { Config } from '../../../config';
import { formatDate } from '@angular/common';
import {
  AddToHistoryResponse,
  RemoveFromHistoryResponse,
} from '../../../../types/interfaces/TraktResponse';
import { TmdbService } from '../tmdb.service';
import { ShowService } from './show.service';
import { TranslationService } from './translation.service';
import { ShowInfo } from '../../../../types/interfaces/Show';
import { SyncOptions } from '../../../../types/interfaces/Sync';

@Injectable({
  providedIn: 'root',
})
export class EpisodeService {
  showsEpisodes$: BehaviorSubject<{ [episodeId: string]: EpisodeFull | undefined }>;
  syncShowEpisode: (
    showId: number | undefined,
    seasonNumber: number | undefined,
    episodeNumber: number | undefined,
    options?: SyncOptions
  ) => Observable<void>;
  fetchShowEpisode: (
    showId: number,
    seasonNumber: number,
    episodeNumber: number,
    sync?: boolean
  ) => Observable<EpisodeFull>;

  constructor(
    private http: HttpClient,
    private tmdbService: TmdbService,
    private showService: ShowService,
    private translationService: TranslationService
  ) {
    const [showsEpisodes$, syncShowEpisode, fetchShowEpisode] = syncObjectsTrakt<EpisodeFull>({
      http: this.http,
      url: '/shows/%/seasons/%/episodes/%?extended=full',
      localStorageKey: LocalStorage.SHOWS_EPISODES,
      idFormatter: episodeId as (...args: unknown[]) => string,
    });
    this.showsEpisodes$ = showsEpisodes$;
    this.syncShowEpisode = syncShowEpisode;
    this.fetchShowEpisode = fetchShowEpisode;
  }

  private fetchSingleCalendar(days = 33, date: string): Observable<EpisodeAiring[]> {
    return this.http.get<EpisodeAiring[]>(
      `${Config.traktBaseUrl}/calendars/my/shows/${date}/${days}`
    );
  }

  private fetchCalendar(days = 33, startDate = new Date()): Observable<EpisodeAiring[]> {
    const daysEach = 33;
    const formatCustomDate = (date: Date): string => formatDate(date, 'yyyy-MM-dd', 'en-US');
    const daysSinceEpoch = Math.trunc(new Date().getTime() / 1000 / 60 / 60 / 24);
    const daysOverCache = daysSinceEpoch % daysEach;
    const startDateAdjusted = new Date(startDate);
    if (daysOverCache !== 0) startDateAdjusted.setDate(startDateAdjusted.getDate() - daysOverCache);
    const daysAdjusted = days + daysOverCache;
    const times = Math.ceil(daysAdjusted / daysEach);
    const timesArray = Array(times).fill(0);

    const dateEach = timesArray.map((_, i) => {
      const date = new Date(startDateAdjusted);
      if (i > 0) date.setDate(date.getDate() + i * daysEach);
      return this.fetchSingleCalendar(daysEach, formatCustomDate(date));
    });

    const currentDate = new Date();

    return concat(...dateEach).pipe(
      map((results) => results.filter((result) => new Date(result.first_aired) >= currentDate))
    );
  }

  getEpisode$(
    ids?: Ids,
    seasonNumber?: number,
    episodeNumber?: number,
    sync?: boolean,
    fetch?: boolean
  ): Observable<EpisodeFull | undefined | null> {
    if (!ids || seasonNumber === undefined || !episodeNumber) throw Error('Argument is empty');

    const showEpisode: Observable<EpisodeFull | undefined> = this.showsEpisodes$.pipe(
      map((showsEpisodes) => showsEpisodes[episodeId(ids.trakt, seasonNumber, episodeNumber)])
    );
    const episodeTranslation = this.translationService.getEpisodeTranslation$(
      ids,
      seasonNumber,
      episodeNumber,
      sync,
      fetch
    );
    return combineLatest([showEpisode, episodeTranslation]).pipe(
      switchMap(([showEpisode, episodeTranslation]) => {
        if (fetch && !showEpisode) {
          return this.fetchShowEpisode(ids.trakt, seasonNumber, episodeNumber, sync).pipe(
            map((episode) => {
              if (!episode) return episode;
              const episodeClone = { ...episode };
              episodeClone.title = episodeTranslation?.title ?? episode.title;
              episodeClone.overview = episodeTranslation?.overview ?? episode.overview;
              return episodeClone;
            })
          );
        }

        const episodeClone =
          showEpisode && Object.keys(showEpisode).length > 0
            ? { ...(showEpisode as EpisodeFull) }
            : undefined;

        if (episodeClone) {
          episodeClone.title = episodeTranslation?.title ?? episodeClone.title;
          episodeClone.overview = episodeTranslation?.overview ?? episodeClone.overview;
        }

        return of(episodeClone);
      })
    );
  }

  getEpisodeProgress$(
    ids?: Ids,
    seasonNumber?: number,
    episodeNumber?: number
  ): Observable<EpisodeProgress | undefined> {
    if (!ids || seasonNumber === undefined || !episodeNumber) throw Error('Argument is empty');

    return this.showService.showsProgress$.pipe(
      map(
        (showsProgress) =>
          showsProgress[ids.trakt]?.seasons.find((season) => season.number === seasonNumber)
            ?.episodes[episodeNumber - 1]
      )
    );
  }

  getEpisodes$(): Observable<{ [episodeId: string]: EpisodeFull | undefined }> {
    return combineLatest([
      this.showsEpisodes$,
      this.translationService.showsEpisodesTranslations$,
    ]).pipe(
      map(([showsEpisodes, episodesTranslations]) => {
        const episodesClonesEntries = Object.entries(showsEpisodes).map(([episodeId, episode]) => {
          if (!episode) return [episodeId, episode];
          const episodeClone = { ...episode };
          episodeClone.title = episodesTranslations[episodeId]?.title ?? episode.title;
          episodeClone.overview = episodesTranslations[episodeId]?.overview ?? episode.overview;
          return [episodeId, episodeClone];
        });

        return Object.fromEntries(episodesClonesEntries);
      })
    );
  }

  getUpcomingEpisodes(days = 33, startDate = new Date()): Observable<EpisodeAiring[]> {
    return this.fetchCalendar(days, startDate).pipe(
      switchMap((episodesAiring) => {
        const showsTranslations = combineLatest(
          episodesAiring.map((episodeAiring) => {
            return this.translationService.getShowTranslation$(episodeAiring.show.ids.trakt, true);
          })
        ).pipe(take(1));

        const episodesTranslations = combineLatest(
          episodesAiring.map((episodeAiring) => {
            return this.translationService.getEpisodeTranslation$(
              episodeAiring.show.ids,
              episodeAiring.episode.season,
              episodeAiring.episode.number,
              true
            );
          })
        ).pipe(take(1));

        return forkJoin([of(episodesAiring), showsTranslations, episodesTranslations]).pipe(
          defaultIfEmpty([[], [], []])
        );
      }),
      switchMap(([episodesAiring, showsTranslations, episodesTranslations]) => {
        const episodesAiringClone = episodesAiring.map((episodesAiring, i) => {
          const episodesAiringClone = { ...episodesAiring };
          episodesAiringClone.show.title = showsTranslations[i]?.title ?? episodesAiring.show.title;
          episodesAiringClone.episode.title =
            episodesTranslations[i]?.title ?? episodesAiring.episode.title;
          return episodesAiringClone;
        });
        return of(episodesAiringClone);
      })
    );
  }

  addEpisode(episode: Episode): Observable<AddToHistoryResponse> {
    return this.http.post<AddToHistoryResponse>(`${Config.traktBaseUrl}/sync/history`, {
      episodes: [episode],
    });
  }

  removeEpisode(episode: Episode): Observable<RemoveFromHistoryResponse> {
    return this.http.post<RemoveFromHistoryResponse>(`${Config.traktBaseUrl}/sync/history/remove`, {
      episodes: [episode],
    });
  }

  setNextEpisode(showInfo: ShowInfo, sync?: boolean, fetch?: boolean): void {
    if (!showInfo.show) throw Error('Show is missing');

    const episode = showInfo.nextEpisode;
    if (episode) {
      this.setNextEpisodeProgress(showInfo.show?.ids.trakt, undefined, episode, showInfo);
      this.getEpisode$(showInfo.show.ids, episode.season, episode.number + 1, sync, fetch)
        .pipe(
          catchError(() => {
            if (!showInfo.show) return of(undefined);
            return this.getEpisode$(showInfo.show.ids, episode.season + 1, 1, sync, fetch);
          }),
          take(1)
        )
        .subscribe({
          next: (nextEpisode) => this.setNextEpisodeProgress(showInfo.show?.ids.trakt, nextEpisode),
          error: () => this.setNextEpisodeProgress(showInfo.show?.ids.trakt, null),
        });
    } else {
      this.setNextEpisodeProgress(showInfo.show.ids.trakt, null);
    }
  }

  private setNextEpisodeProgress(
    showId: number | undefined,
    nextEpisode: Episode | null | undefined,
    lastEpisode?: Episode | null | undefined,
    showInfo?: ShowInfo
  ): void {
    if (!showId) return;
    const showsProgress = this.showService.showsProgress$.value;
    const showProgress = showsProgress[showId];

    if (showProgress) {
      showProgress.next_episode = nextEpisode;

      if (lastEpisode) {
        showProgress.completed = showProgress.completed + 1;

        const seasonProgress = showProgress.seasons.find(
          (season) => season.number === lastEpisode.season
        );
        if (seasonProgress) seasonProgress.completed = seasonProgress.completed + 1;

        const lastEpisodeProgress = seasonProgress?.episodes.find(
          (episode) => episode.number === lastEpisode.number
        );
        if (lastEpisodeProgress) lastEpisodeProgress.completed = true;
      }
    } else {
      showsProgress[showId] = this.getFakeShowProgressForNewShow(nextEpisode, showInfo);
    }

    this.showService.showsProgress$.next(showsProgress);
  }

  private getFakeShowProgressForNewShow(
    nextEpisode: Episode | null | undefined,
    showInfo: ShowInfo | undefined
  ): ShowProgress {
    const tmdbShow = showInfo!.tmdbShow!;
    return {
      aired: tmdbShow.number_of_episodes,
      completed: 1,
      // eslint-disable-next-line @typescript-eslint/naming-convention
      last_episode: null,
      // eslint-disable-next-line @typescript-eslint/naming-convention
      last_watched_at: new Date().toISOString(),
      // eslint-disable-next-line @typescript-eslint/naming-convention
      next_episode: nextEpisode,
      // eslint-disable-next-line @typescript-eslint/naming-convention
      reset_at: null,
      seasons: Array(tmdbShow.number_of_seasons)
        .fill(0)
        .map((seasonNumber): SeasonProgress => {
          return {
            aired: tmdbShow.seasons.find((season) => season.season_number === seasonNumber + 1)!
              .episode_count,
            completed: seasonNumber === 1 ? 1 : 0,
            title: '',
            number: seasonNumber + 1,
            episodes: Array(
              tmdbShow.seasons.find((season) => season.season_number === seasonNumber + 1)!
                .episode_count
            )
              .fill(0)
              .map((episodeNumber) => {
                return {
                  number: episodeNumber + 1,
                  completed: episodeNumber + 1 === 1,
                  // eslint-disable-next-line @typescript-eslint/naming-convention
                  last_watched_at: null,
                };
              }),
          };
        }),
    };
  }
}
