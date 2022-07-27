import { Injectable } from '@angular/core';
import { BehaviorSubject, combineLatest, forkJoin, map, Observable, of, switchMap } from 'rxjs';
import {
  Episode,
  EpisodeAiring,
  EpisodeFull,
  EpisodeProgress,
  Ids,
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

  fetchCalendar(days = 33, startDate = new Date()): Observable<EpisodeAiring[]> {
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
          episode.title = episodesTranslations[episodeId].title || episode.title;
          episode.overview = episodesTranslations[episodeId].overview || episode.overview;
        });
        return episodes;
      })
    );
  }

  getSeasonEpisodes$(
    ids?: Ids,
    seasonNumber?: number,
    episodeCount?: number,
    sync?: boolean,
    fetch?: boolean
  ): Observable<(EpisodeFull | undefined)[] | undefined> {
    if (!episodeCount || !ids || seasonNumber === undefined) return of(undefined);

    const episodesTranslations = this.translationService.showsEpisodesTranslations$;

    return combineLatest([this.showsEpisodes$, episodesTranslations]).pipe(
      switchMap(([showsEpisodes, episodesTranslations]) => {
        const episodeObservables = Array(episodeCount)
          .fill(0)
          .map((_, index) => {
            const episode = showsEpisodes[episodeId(ids.trakt, seasonNumber, index + 1)];

            if (fetch && !episode) {
              const episodeObservable = this.fetchShowEpisode(
                ids.trakt,
                seasonNumber,
                index + 1,
                sync
              );
              const episodeTranslationObservable = this.translationService.getEpisodeTranslation$(
                ids,
                seasonNumber,
                index + 1,
                sync
              );
              return combineLatest([episodeObservable, episodeTranslationObservable]).pipe(
                switchMap(([episode, episodeTranslation]) => {
                  if (!episode) return of(undefined);
                  episode.title = episodeTranslation?.title || episode.title;
                  episode.overview = episodeTranslation?.overview || episode.overview;
                  return of(episode);
                })
              );
            }

            const episodeTranslation =
              episodesTranslations[episodeId(ids.trakt, seasonNumber, index + 1)];
            episode.title = episodeTranslation.title || episode.title;
            episode.overview = episodeTranslation.overview || episode.overview;
            return of(episode);
          });
        return combineLatest(episodeObservables);
      })
    );
  }

  getEpisode$(
    ids?: Ids,
    seasonNumber?: number,
    episodeNumber?: number,
    sync?: boolean,
    fetch?: boolean
  ): Observable<EpisodeFull | undefined> {
    if (!ids || seasonNumber === undefined || !episodeNumber) return of(undefined);

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
      sync
    );
    return combineLatest([showEpisode, showAddedEpisode, episodeTranslation]).pipe(
      switchMap(([showEpisode, showAddedEpisode, episodeTranslation]) => {
        const episode = showEpisode || showAddedEpisode;

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
    if (!ids || seasonNumber === undefined || !episodeNumber) return of(undefined);

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

  getUpcomingEpisodes(days = 33, startDate = new Date()): Observable<EpisodeAiring[]> {
    return this.fetchCalendar(days, startDate).pipe(
      switchMap((episodesAiring) => {
        const showsTranslations = combineLatest(
          episodesAiring.map((episodeAiring) => {
            return this.translationService.getShowTranslation$(episodeAiring.show.ids.trakt, true);
          })
        );

        const episodesTranslations = combineLatest(
          episodesAiring.map((episodeAiring) => {
            return this.translationService.getEpisodeTranslation$(
              episodeAiring.show.ids,
              episodeAiring.episode.season,
              episodeAiring.episode.number,
              true
            );
          })
        );

        return combineLatest([of(episodesAiring), showsTranslations, episodesTranslations]);
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

  syncSeasonEpisodes(
    ids: Ids | undefined,
    seasonNumber: number | undefined,
    episodeCount: number | undefined
  ): Observable<void> {
    if (!episodeCount || !ids || seasonNumber === undefined) return of(undefined);

    const episodeCountArray = Array(episodeCount).fill(0);

    const observables: Observable<void>[] = episodeCountArray.map((_, index) =>
      this.syncShowEpisode(ids.trakt, seasonNumber, index + 1)
    );

    return forkJoin(observables).pipe(map(() => undefined));
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
}
