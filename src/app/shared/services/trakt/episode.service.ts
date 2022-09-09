import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { formatDate } from '@angular/common';
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

import { Config } from '../../../config';
import { TmdbService } from '../tmdb.service';
import { ShowService } from './show.service';
import { TranslationService } from './translation.service';
import { syncObjectsTrakt } from '@helper/sync';
import { episodeId } from '@helper/episodeId';
import { setLocalStorage } from '@helper/localStorage';
import { translated, translatedOrUndefined } from '@helper/translation';

import { LoadingState, LocalStorage } from '@type/enum';

import type {
  Episode,
  EpisodeAiring,
  EpisodeFull,
  EpisodeProgress,
  Ids,
  SeasonProgress,
  Show,
  ShowProgress,
} from '@type/interfaces/Trakt';
import type {
  AddToHistoryResponse,
  RemoveFromHistoryResponse,
} from '@type/interfaces/TraktResponse';
import type { ShowInfo } from '@type/interfaces/Show';
import type { FetchOptions } from '@type/interfaces/Sync';
import { TmdbShow } from '@type/interfaces/Tmdb';

@Injectable({
  providedIn: 'root',
})
export class EpisodeService {
  showsEpisodes = syncObjectsTrakt<EpisodeFull>({
    http: this.http,
    url: '/shows/%/seasons/%/episodes/%?extended=full',
    localStorageKey: LocalStorage.SHOWS_EPISODES,
    idFormatter: episodeId as (...args: unknown[]) => string,
  });

  constructor(
    private http: HttpClient,
    private tmdbService: TmdbService,
    private showService: ShowService,
    private translationService: TranslationService
  ) {}

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

  addEpisode(episode: Episode, watchedAt = new Date()): Observable<AddToHistoryResponse> {
    return this.http.post<AddToHistoryResponse>(`${Config.traktBaseUrl}/sync/history`, {
      episodes: [episode],
      // eslint-disable-next-line @typescript-eslint/naming-convention
      watched_at: watchedAt.toISOString(),
    });
  }

  removeEpisode(episode: Episode): Observable<RemoveFromHistoryResponse> {
    return this.http.post<RemoveFromHistoryResponse>(`${Config.traktBaseUrl}/sync/history/remove`, {
      episodes: [episode],
    });
  }

  getEpisode$(
    ids?: Ids,
    seasonNumber?: number,
    episodeNumber?: number,
    options?: FetchOptions
  ): Observable<EpisodeFull | undefined | null> {
    if (!ids || seasonNumber === undefined || !episodeNumber) throw Error('Argument is empty');

    const showEpisode: Observable<EpisodeFull | undefined> = this.showsEpisodes.$.pipe(
      map((showsEpisodes) => showsEpisodes[episodeId(ids.trakt, seasonNumber, episodeNumber)])
    );
    const episodeTranslation = this.translationService.getEpisodeTranslation$(
      ids,
      seasonNumber,
      episodeNumber,
      options
    );
    return combineLatest([showEpisode, episodeTranslation]).pipe(
      switchMap(([showEpisode, episodeTranslation]) => {
        if (options?.fetchAlways || (options?.fetch && !showEpisode)) {
          let showEpisodeObservable = this.showsEpisodes.fetch(
            ids.trakt,
            seasonNumber,
            episodeNumber,
            options.sync || !!showEpisode
          );
          if (showEpisode) showEpisodeObservable = concat(of(showEpisode), showEpisodeObservable);
          return showEpisodeObservable.pipe(
            map((episode) => translatedOrUndefined(episode, episodeTranslation))
          );
        }

        return of(translatedOrUndefined(showEpisode, episodeTranslation));
      })
    );
  }

  getEpisodeProgress$(
    ids?: Ids,
    seasonNumber?: number,
    episodeNumber?: number
  ): Observable<EpisodeProgress | undefined> {
    if (!ids || seasonNumber === undefined || !episodeNumber) throw Error('Argument is empty');

    return this.showService.showsProgress.$.pipe(
      map(
        (showsProgress) =>
          showsProgress[ids.trakt]?.seasons.find((season) => season.number === seasonNumber)
            ?.episodes[episodeNumber - 1]
      )
    );
  }

  getEpisodes$(): Observable<{ [episodeId: string]: EpisodeFull | undefined }> {
    return combineLatest([
      this.showsEpisodes.$,
      this.translationService.showsEpisodesTranslations.$,
    ]).pipe(
      map(([showsEpisodes, episodesTranslations]) => {
        return Object.fromEntries(
          Object.entries(showsEpisodes).map(([episodeId, episode]) => [
            episodeId,
            translatedOrUndefined(episode, episodesTranslations[episodeId]),
          ])
        );
      })
    );
  }

  private getUpcomingEpisodes$(days = 33, startDate = new Date()): Observable<EpisodeAiring[]> {
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
              { sync: true }
            );
          })
        ).pipe(take(1));

        return forkJoin([of(episodesAiring), showsTranslations, episodesTranslations]).pipe(
          defaultIfEmpty([[], [], []])
        );
      }),
      switchMap(([episodesAiring, showsTranslations, episodesTranslations]) =>
        of(
          episodesAiring.map((episodesAiring, i) => ({
            ...episodesAiring,
            show: translated(episodesAiring.show, showsTranslations[i]),
            episode: translated(episodesAiring.episode, episodesTranslations[i]),
          }))
        )
      )
    );
  }

  getUpcomingEpisodeInfos$(days = 33, startDate = new Date()): Observable<ShowInfo[]> {
    return this.getUpcomingEpisodes$(days, startDate).pipe(
      switchMap((episodesAiring) =>
        combineLatest([
          of(episodesAiring),
          combineLatest(
            episodesAiring.map((episodeAiring) =>
              this.tmdbService.getTmdbShow$(episodeAiring.show.ids)
            )
          ).pipe(defaultIfEmpty([])),
        ])
      ),
      map(([episodesAiring, tmdbShows]) => {
        return episodesAiring.map((episodeAiring, i): ShowInfo => {
          const episodeFull: Partial<EpisodeFull> = episodeAiring.episode;
          episodeFull.first_aired = episodeAiring.first_aired;
          return {
            show: episodeAiring.show,
            nextEpisode: episodeFull as EpisodeFull,
            tmdbShow: tmdbShows[i],
          };
        });
      })
    );
  }

  setNextEpisode(
    episode: Episode,
    show: Show,
    options?: FetchOptions,
    state?: BehaviorSubject<LoadingState>,
    tmdbShow?: TmdbShow
  ): void {
    if (!show) throw Error('Show is missing');
    state?.next(LoadingState.LOADING);

    if (episode) {
      this.setNextEpisodeProgress(show.ids.trakt, undefined, episode, tmdbShow);
      this.getEpisode$(show.ids, episode.season, episode.number + 1, options)
        .pipe(
          catchError(() => this.getEpisode$(show.ids, episode.season + 1, 1, options)),
          take(1)
        )
        .subscribe({
          next: (nextEpisode) => {
            this.setNextEpisodeProgress(show.ids.trakt, nextEpisode);
            state?.next(LoadingState.SUCCESS);
          },
          error: () => this.setNextEpisodeProgress(show.ids.trakt, null),
        });
    } else {
      this.setNextEpisodeProgress(show.ids.trakt, null);
      state?.next(LoadingState.SUCCESS);
    }
  }

  private setNextEpisodeProgress(
    showId: number | undefined,
    nextEpisode: Episode | null | undefined,
    lastEpisode?: Episode | null | undefined,
    tmdbShow?: TmdbShow
  ): void {
    if (!showId) return;
    const showsProgress = this.showService.showsProgress.$.value;
    const showProgress = showsProgress[showId];

    if (showProgress) {
      showProgress.next_episode = nextEpisode;

      if (lastEpisode) {
        showProgress.completed = showProgress.completed + 1;

        const seasonProgress = showProgress.seasons.find(
          (season) => season.number === lastEpisode.season
        );
        if (seasonProgress) seasonProgress.completed = seasonProgress.completed + 1;
      }
    } else {
      showsProgress[showId] = this.getFakeShowProgressForNewShow(nextEpisode, tmdbShow);
    }

    this.showService.showsProgress.$.next(showsProgress);
  }

  private getFakeShowProgressForNewShow(
    nextEpisode: Episode | null | undefined,
    tmdbShow: TmdbShow | undefined
  ): ShowProgress {
    return {
      aired: tmdbShow?.number_of_episodes ?? 0,
      completed: 1,
      // eslint-disable-next-line @typescript-eslint/naming-convention
      last_episode: null,
      // eslint-disable-next-line @typescript-eslint/naming-convention
      last_watched_at: new Date().toISOString(),
      // eslint-disable-next-line @typescript-eslint/naming-convention
      next_episode: nextEpisode,
      // eslint-disable-next-line @typescript-eslint/naming-convention
      reset_at: null,
      seasons: Array(tmdbShow?.number_of_seasons)
        .fill(0)
        .map((seasonNumber): SeasonProgress => {
          return {
            aired:
              tmdbShow?.seasons.find((season) => season.season_number === seasonNumber + 1)
                ?.episode_count ?? 0,
            completed: seasonNumber === 1 ? 1 : 0,
            title: '',
            number: seasonNumber + 1,
            episodes: Array(
              tmdbShow?.seasons.find((season) => season.season_number === seasonNumber + 1)
                ?.episode_count
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

  removeShowsEpisodes(show: Show): void {
    const showsEpisodes = Object.fromEntries(
      Object.entries(this.showsEpisodes.$.value).filter(
        ([episodeId]) => !episodeId.startsWith(`${show.ids.trakt}-`)
      )
    );
    this.showsEpisodes.$.next(showsEpisodes);
    setLocalStorage(LocalStorage.SHOWS_EPISODES, showsEpisodes);
  }
}
