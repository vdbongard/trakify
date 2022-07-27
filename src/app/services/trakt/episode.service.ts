import { Injectable } from '@angular/core';
import {
  BehaviorSubject,
  catchError,
  combineLatest,
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
  TraktShow,
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
import { TmdbEpisode } from '../../../types/interfaces/Tmdb';
import { setLocalStorage } from '../../helper/localStorage';
import { TmdbService } from '../tmdb.service';
import { ShowService } from './show.service';

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
  private readonly fetchShowEpisode: (
    showId: number,
    seasonNumber: number,
    episodeNumber: number,
    sync?: boolean
  ) => Observable<EpisodeFull | undefined>;

  constructor(
    private http: HttpClient,
    private tmdbService: TmdbService,
    private showService: ShowService
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

  fetchCalendar(days = 33, startDate = new Date()): Observable<EpisodeAiring[]> {
    const daysEach = 33;
    const formatCustomDate = (date: Date): string => formatDate(date, 'yyyy-MM-dd', 'en-US');
    const daysSinceEpoch = Math.trunc(new Date().getTime() / 1000 / 60 / 24);
    const daysOverCache = daysSinceEpoch % daysEach;
    const startDateAdjusted = new Date(startDate);
    if (daysOverCache !== 0) startDateAdjusted.setDate(startDateAdjusted.getDate() - daysOverCache);
    const daysAdjusted = days + daysOverCache;

    if (days < daysEach) {
      return this.fetchSingleCalendar(daysEach, formatCustomDate(startDateAdjusted));
    }

    const times = Math.ceil(daysAdjusted / daysEach);
    const timesArray = Array(times).fill(0);

    const dateEach = timesArray.map((_, i) => {
      const date = new Date(startDateAdjusted);
      if (i > 0) date.setDate(date.getDate() + i * daysEach);
      const dateFormatted = formatCustomDate(date);
      const singleDays = i === times - 1 ? daysAdjusted % daysEach || daysEach : daysEach;
      return this.fetchSingleCalendar(singleDays, dateFormatted);
    });

    return forkJoin(dateEach).pipe(
      map((results) => results.flat()),
      map((results) => results.filter((result) => new Date(result.first_aired) >= new Date()))
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

  getEpisodeAndTmdbEpisode$(
    ids: Ids,
    seasonNumber: number,
    episodeNumber: number
  ): Observable<[EpisodeFull, TmdbEpisode]> {
    const episode$ = this.getEpisode$(ids, seasonNumber, episodeNumber).pipe(take(1));

    const tmdbEpisode$ = this.tmdbService
      .getTmdbEpisode$(ids.tmdb, seasonNumber, episodeNumber)
      .pipe(take(1));

    return forkJoin([episode$ as Observable<EpisodeFull>, tmdbEpisode$ as Observable<TmdbEpisode>]);
  }

  getShowsAddedEpisodes$(): Observable<{ [episodeId: string]: EpisodeFull }> {
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

    return combineLatest([showsEpisodes, showsAddedEpisodes]).pipe(
      map(([showsEpisodes, showsAddedEpisodes]) => {
        return { ...showsAddedEpisodes, ...showsEpisodes };
      })
    );
  }

  getShowEpisode$(
    showId?: number,
    seasonNumber?: number,
    episodeNumber?: number,
    sync?: boolean
  ): Observable<EpisodeFull | undefined> {
    if (!showId || seasonNumber === undefined || !episodeNumber) return of(undefined);

    const showEpisode: Observable<EpisodeFull | undefined> = this.showsEpisodes$.pipe(
      map((showsEpisodes) => showsEpisodes[episodeId(showId, seasonNumber, episodeNumber)])
    );
    const showAddedEpisode = this.showService.addedShowInfos$.pipe(
      map((addedShowInfos) => addedShowInfos[showId]?.nextEpisode)
    );
    return combineLatest([showEpisode, showAddedEpisode]).pipe(
      switchMap(([showEpisode, showAddedEpisode]) => {
        const episode = showEpisode || showAddedEpisode;
        return episode
          ? of(episode)
          : this.fetchShowEpisode(showId, seasonNumber, episodeNumber, sync);
      })
    );
  }

  getNextEpisode$(
    show: TraktShow,
    seasonNumber: number,
    episodeNumber: number
  ): Observable<[EpisodeFull, TmdbEpisode]> {
    return this.getEpisodeAndTmdbEpisode$(show.ids, seasonNumber, episodeNumber + 1).pipe(
      catchError(() => {
        return this.getEpisodeAndTmdbEpisode$(show.ids, seasonNumber + 1, 1);
      }),
      take(1)
    );
  }

  setShowEpisode(showId: number, episode: EpisodeFull, withPublish = true): void {
    const showsEpisodes = this.showsEpisodes$.value;
    showsEpisodes[episodeId(showId, episode.season, episode.number)] = episode;
    setLocalStorage<{ [episodeId: number]: EpisodeFull }>(
      LocalStorage.SHOWS_EPISODES,
      showsEpisodes
    );
    if (withPublish) this.showsEpisodes$.next(showsEpisodes);
  }

  getEpisodes$(
    episodeCount?: number,
    ids?: Ids,
    seasonNumber?: number,
    sync?: boolean
  ): Observable<(EpisodeFull | undefined)[] | undefined> {
    if (!episodeCount || !ids || seasonNumber === undefined) return of(undefined);

    return this.showsEpisodes$.pipe(
      switchMap((showsEpisodes) => {
        const episodeObservables = Array(episodeCount)
          .fill(0)
          .map((_, index) => {
            const episode = showsEpisodes[episodeId(ids.trakt, seasonNumber, index + 1)];
            if (!episode) return this.fetchShowEpisode(ids.trakt, seasonNumber, index + 1, sync);
            return of(episode);
          });
        return forkJoin(episodeObservables);
      })
    );
  }

  syncSeasonEpisodes(
    episodeCount: number | undefined,
    ids: Ids | undefined,
    seasonNumber: number | undefined
  ): Observable<void> {
    if (!episodeCount || !ids || seasonNumber === undefined) return of(undefined);

    const episodeCountArray = Array(episodeCount).fill(0);

    const observables: Observable<void>[] = episodeCountArray.map((_, index) =>
      this.syncShowEpisode(ids.trakt, seasonNumber, index + 1)
    );

    return forkJoin(observables).pipe(map(() => undefined));
  }

  getEpisode$(
    ids?: Ids,
    seasonNumber?: number,
    episodeNumber?: number,
    sync?: boolean
  ): Observable<EpisodeFull | undefined> {
    if (!ids || seasonNumber === undefined || !episodeNumber) return of(undefined);
    return this.showsEpisodes$.pipe(
      switchMap((showsEpisodes) => {
        const episode = showsEpisodes[episodeId(ids.trakt, seasonNumber, episodeNumber)];
        if (!episode) return this.fetchShowEpisode(ids.trakt, seasonNumber, episodeNumber, sync);
        return of(episode);
      })
    );
  }

  syncEpisode(
    ids: Ids | undefined,
    seasonNumber: number | undefined,
    episodeNumber: number | undefined
  ): Observable<void> {
    if (!ids || seasonNumber === undefined || !episodeNumber) return of(undefined);

    const observables: Observable<void>[] = [
      this.syncShowEpisode(ids.trakt, seasonNumber, episodeNumber),
    ];

    return forkJoin(observables).pipe(map(() => undefined));
  }

  getEpisodeProgress$(
    showId?: number,
    seasonNumber?: number,
    episodeNumber?: number
  ): Observable<EpisodeProgress | undefined> {
    if (!showId || seasonNumber === undefined || !episodeNumber) return of(undefined);

    const episodeProgress: Observable<EpisodeProgress | undefined> =
      this.showService.showsProgress$.pipe(
        map(
          (showsProgress) =>
            showsProgress[showId]?.seasons.find((season) => season.number === seasonNumber)
              ?.episodes[episodeNumber - 1]
        )
      );
    const showAddedEpisodeProgress = this.showService.addedShowInfos$.pipe(
      map(
        (addedShowInfos) =>
          addedShowInfos[showId]?.showProgress?.seasons.find(
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
}
