import { Injectable } from '@angular/core';
import {
  BehaviorSubject,
  catchError,
  combineLatest,
  concat,
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
  ShowProgress,
} from '../../../types/interfaces/Trakt';
import { syncObjectsTrakt } from '../../helper/sync';
import { LocalStorage } from '../../../types/enum';
import { episodeId } from '../../helper/episodeId';
import { HttpClient } from '@angular/common/http';
import { Config } from '../../config';
import { formatDate } from '@angular/common';
import {
  AddToHistoryResponse,
  RemoveFromHistoryResponse,
} from '../../../types/interfaces/TraktResponse';
import { TmdbService } from '../tmdb.service';
import { ShowService } from './show.service';
import { TranslationService } from './translation.service';
import { ShowInfo } from '../../../types/interfaces/Show';

@Injectable({
  providedIn: 'root',
})
export class EpisodeService {
  showsEpisodes$: BehaviorSubject<{ [episodeId: string]: EpisodeFull }>;
  syncShowEpisode: (
    showId: number | undefined,
    seasonNumber: number | undefined,
    episodeNumber: number | undefined,
    force?: boolean
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
    const showAddedEpisode = this.showService.addedShowInfos$.pipe(
      map((addedShowInfos) => addedShowInfos[ids.trakt]?.nextEpisode)
    );
    const episodeTranslation = this.translationService.getEpisodeTranslation$(
      ids,
      seasonNumber,
      episodeNumber,
      sync,
      fetch
    );
    return combineLatest([showEpisode, showAddedEpisode, episodeTranslation]).pipe(
      switchMap(([showEpisode, showAddedEpisode, episodeTranslation]) => {
        const episode: EpisodeFull | null | undefined = showEpisode || showAddedEpisode;

        if (fetch && !episode) {
          return this.fetchShowEpisode(ids.trakt, seasonNumber, episodeNumber, sync).pipe(
            map((episode) => {
              if (!episode) return episode;
              episode.title = episodeTranslation?.title || episode.title;
              episode.overview = episodeTranslation?.overview || episode.overview;
              return episode;
            })
          );
        }

        if (episode) {
          episode.title = episodeTranslation?.title || episode.title;
          episode.overview = episodeTranslation?.overview || episode.overview;
        }

        return of(episode);
      })
    );
  }

  getEpisodeProgress$(
    ids?: Ids,
    seasonNumber?: number,
    episodeNumber?: number
  ): Observable<EpisodeProgress | undefined> {
    if (!ids || seasonNumber === undefined || !episodeNumber) throw Error('Argument is empty');

    const episodeProgress: Observable<EpisodeProgress | undefined> =
      this.showService.showsProgress$.pipe(
        map(
          (showsProgress) =>
            showsProgress[ids.trakt]?.seasons.find((season) => season.number === seasonNumber)
              ?.episodes[episodeNumber - 1]
        )
      );
    const showAddedEpisodeProgress = this.showService.addedShowInfos$.pipe(
      map(
        (addedShowInfos) =>
          addedShowInfos[ids.trakt]?.showProgress?.seasons.find(
            (season) => season.number === seasonNumber
          )?.episodes[episodeNumber - 1]
      )
    );
    return combineLatest([episodeProgress, showAddedEpisodeProgress]).pipe(
      map(
        ([episodeProgress, showAddedEpisodeProgress]) => episodeProgress || showAddedEpisodeProgress
      )
    );
  }

  getEpisodes$(): Observable<{ [episodeId: string]: EpisodeFull }> {
    const showsEpisodes = this.showsEpisodes$.asObservable();

    const showsAddedEpisodes = this.showService.addedShowInfos$.pipe(
      map((addedShowInfos) => {
        const array = Object.entries(addedShowInfos)
          .map(([showId, addedShowInfo]) => {
            if (!addedShowInfo.nextEpisode) return;
            return [showId, addedShowInfo.nextEpisode];
          })
          .filter(Boolean) as [string, EpisodeFull][];

        return Object.fromEntries(array);
      })
    );

    const episodesTranslations = this.translationService.showsEpisodesTranslations$;

    return combineLatest([showsEpisodes, showsAddedEpisodes, episodesTranslations]).pipe(
      map(([showsEpisodes, showsAddedEpisodes, episodesTranslations]) => {
        const episodes: { [episodeId: string]: EpisodeFull } = {
          ...showsAddedEpisodes,
          ...showsEpisodes,
        };
        Object.entries(episodes).forEach(([episodeId, episode]) => {
          episode.title = episodesTranslations[episodeId]?.title || episode.title;
          episode.overview = episodesTranslations[episodeId]?.overview || episode.overview;
        });
        return episodes;
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

        return forkJoin([of(episodesAiring), showsTranslations, episodesTranslations]);
      }),
      switchMap(([episodesAiring, showsTranslations, episodesTranslations]) => {
        episodesAiring.forEach((episodesAiring, i) => {
          episodesAiring.show.title = showsTranslations[i]?.title || episodesAiring.show.title;
          episodesAiring.episode.title =
            episodesTranslations[i]?.title || episodesAiring.episode.title;
        });
        return of(episodesAiring);
      })
    );
  }

  addToHistory(episode: Episode): Observable<AddToHistoryResponse> {
    return this.http.post<AddToHistoryResponse>(`${Config.traktBaseUrl}/sync/history`, {
      episodes: [episode],
    });
  }

  removeFromHistory(episode: Episode): Observable<RemoveFromHistoryResponse> {
    return this.http.post<RemoveFromHistoryResponse>(`${Config.traktBaseUrl}/sync/history/remove`, {
      episodes: [episode],
    });
  }

  setNextEpisode(showInfo: ShowInfo, sync?: boolean, fetch?: boolean): void {
    if (!showInfo.show) throw Error('Show is missing');

    const episode = showInfo.nextEpisode;
    if (episode) {
      this.setNextEpisodeProgress(showInfo.show?.ids.trakt, undefined);
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
    nextEpisode: Episode | null | undefined
  ): void {
    if (!showId) return;
    const showsProgress = this.showService.showsProgress$.value;
    const showProgress = showsProgress[showId];

    if (showProgress) {
      showProgress.next_episode = nextEpisode;
    } else {
      showsProgress[showId] = this.getFakeShowProgressForNewShow(nextEpisode);
    }

    this.showService.showsProgress$.next(showsProgress);
  }

  private getFakeShowProgressForNewShow(nextEpisode: Episode | null | undefined): ShowProgress {
    return {
      aired: Infinity,
      completed: 1,
      // eslint-disable-next-line @typescript-eslint/naming-convention
      last_episode: null,
      // eslint-disable-next-line @typescript-eslint/naming-convention
      last_watched_at: new Date().toISOString(),
      // eslint-disable-next-line @typescript-eslint/naming-convention
      next_episode: nextEpisode,
      // eslint-disable-next-line @typescript-eslint/naming-convention
      reset_at: null,
      seasons: [],
    };
  }
}
