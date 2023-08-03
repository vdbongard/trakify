import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { formatDate } from '@angular/common';
import {
  buffer,
  catchError,
  combineLatest,
  concat,
  concatMap,
  debounceTime,
  defaultIfEmpty,
  distinctUntilChanged,
  forkJoin,
  map,
  merge,
  Observable,
  of,
  shareReplay,
  Subject,
  switchMap,
  take,
} from 'rxjs';
import { TmdbService } from './tmdb.service';
import { ShowService } from './show.service';
import { TranslationService } from './translation.service';
import { episodeId } from '@helper/episodeId';
import { translated, translatedOrUndefined } from '@helper/translation';
import { LocalStorage } from '@type/Enum';
import type {
  Episode,
  EpisodeAiring,
  EpisodeFull,
  EpisodeProgress,
  SeasonProgress,
  Show,
} from '@type/Trakt';
import { episodeAiringSchema, episodeFullSchema } from '@type/Trakt';
import type { AddToHistoryResponse, RemoveFromHistoryResponse } from '@type/TraktResponse';
import type { ShowInfo } from '@type/Show';
import type { FetchOptions } from '@type/Sync';
import { parseResponse } from '@operator/parseResponse';
import { API } from '@shared/api';
import { urlReplace } from '@helper/urlReplace';
import { LocalStorageService } from '@services/local-storage.service';
import { SyncDataService } from '@services/sync-data.service';
import { pick } from '@helper/pick';
import { isFuture } from 'date-fns';
import { sum } from '@helper/sum';
import { distinctUntilChangedDeep } from '@operator/distinctUntilChangedDeep';
import { SeasonService } from './season.service';
import { TmdbShow } from '@type/Tmdb';

@Injectable({
  providedIn: 'root',
})
export class EpisodeService {
  http = inject(HttpClient);
  tmdbService = inject(TmdbService);
  showService = inject(ShowService);
  translationService = inject(TranslationService);
  localStorageService = inject(LocalStorageService);
  syncDataService = inject(SyncDataService);
  seasonService = inject(SeasonService);

  showsEpisodes = this.syncDataService.syncObjects<EpisodeFull>({
    url: API.episode,
    localStorageKey: LocalStorage.SHOWS_EPISODES,
    schema: episodeFullSchema,
    idFormatter: episodeId as (...args: unknown[]) => string,
    mapFunction: (episode: EpisodeFull) =>
      pick<EpisodeFull>(
        episode,
        'first_aired',
        'ids',
        'number',
        'overview',
        'season',
        'title',
        'translations',
      ),
  });

  constructor() {
    this.addMissingShowProgress();
  }

  addMissingShowProgress(): void {
    let isChanged = false;

    const showProgressEntries = Object.entries(this.showService.showsProgress.$.value).map(
      ([showId, showProgress]) => {
        const nextEpisode = Object.entries(this.showsEpisodes.$.value).find(([episodeId]) =>
          episodeId.startsWith(showId + '-'),
        );

        if (
          !showProgress ||
          !nextEpisode?.[1]?.first_aired ||
          isFuture(new Date(nextEpisode[1].first_aired))
        )
          return [showId, showProgress];

        // check if show progress is already existing
        const seasonProgress = showProgress.seasons.find(
          (season) => season.number === nextEpisode[1]!.season,
        );
        const episodeProgress = seasonProgress?.episodes.find(
          (episode) => episode.number === nextEpisode[1]!.number,
        );
        if (episodeProgress) return [showId, showProgress];

        // otherwise push new one and update aired values for season and show
        const episodeProgressNew: EpisodeProgress = {
          number: nextEpisode[1]!.number,
          completed: false,
          last_watched_at: null,
        };

        if (!seasonProgress) {
          const seasonProgressNew: SeasonProgress = {
            aired: 1,
            completed: 0,
            episodes: [episodeProgressNew],
            number: nextEpisode[1]?.season,
            title: null,
          };
          showProgress.seasons.push(seasonProgressNew);
        } else {
          seasonProgress.episodes.push(episodeProgressNew);
          seasonProgress.aired = seasonProgress.episodes.length;
        }

        showProgress.aired = sum(
          showProgress.seasons
            .filter((season) => season.number !== 0)
            .map((season) => season.aired),
        );

        isChanged = true;

        return [showId, showProgress];
      },
    );

    if (isChanged) {
      this.showService.updateShowsProgress(Object.fromEntries(showProgressEntries));
    }
  }

  private fetchSingleCalendar(days = 33, date: string): Observable<EpisodeAiring[]> {
    return this.http
      .get<EpisodeAiring[]>(urlReplace(API.calendar, [date, days]))
      .pipe(parseResponse(episodeAiringSchema.array()));
  }

  fetchCalendarAll(days = 2, date = new Date()): Observable<EpisodeAiring[]> {
    const formatCustomDate = (date: Date): string => formatDate(date, 'yyyy-MM-dd', 'en-US');
    const dayString = formatCustomDate(date);
    return this.http.get<EpisodeAiring[]>(urlReplace(API.calendarAll, [dayString, days])).pipe(
      parseResponse(episodeAiringSchema.array()),
      map((episodes) => {
        return episodes.filter((episode) => isFuture(new Date(episode.first_aired))).slice(0, 40);
      }),
    );
  }

  episodeToAdd = new Subject<CustomEpisode>();
  episodesToAdd$ = this.episodeToAdd.pipe(
    buffer(this.episodeToAdd.pipe(debounceTime(1000))),
    switchMap((episodes: CustomEpisode[]) => {
      const watchedAt = episodes[episodes.length - 1].watchedAt?.toISOString();
      if (!watchedAt) throw new Error('watchedAt is undefined');
      const episodeIds = episodes.map((episode: CustomEpisode) => ({ ids: episode.episode.ids }));
      return this.http.post<AddToHistoryResponse>(API.syncHistory, {
        episodes: episodeIds,
        watched_at: watchedAt,
      });
    }),
    shareReplay({ bufferSize: 1, refCount: true }),
  );

  addEpisode(episode: Episode, watchedAt = new Date()): Observable<AddToHistoryResponse> {
    // wait a tick to make sure the episode is added to the subject before subscribing to it
    setTimeout(() => {
      this.episodeToAdd.next({ episode, watchedAt });
    });
    return this.episodesToAdd$;
  }

  episodeToRemove = new Subject<CustomEpisode>();
  episodesToRemove$ = this.episodeToRemove.pipe(
    buffer(this.episodeToRemove.pipe(debounceTime(1000))),
    switchMap((episodes: CustomEpisode[]) => {
      const episodeIds = episodes.map((episode: CustomEpisode) => ({ ids: episode.episode.ids }));
      return this.http.post<RemoveFromHistoryResponse>(API.syncHistoryRemove, {
        episodes: episodeIds,
      });
    }),
    shareReplay({ bufferSize: 1, refCount: true }),
  );

  removeEpisode(episode: Episode): Observable<RemoveFromHistoryResponse> {
    // wait a tick to make sure the episode is added to the subject before subscribing to it
    setTimeout(() => {
      this.episodeToRemove.next({ episode });
    });
    return this.episodesToRemove$;
  }

  private getCalendar(days = 33, startDate = new Date()): Observable<EpisodeAiring[]> {
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
      map((results) => results.filter((result) => new Date(result.first_aired) >= currentDate)),
    );
  }

  getEpisode$(
    show?: Show,
    seasonNumber?: number,
    episodeNumber?: number,
    options?: FetchOptions,
  ): Observable<EpisodeFull | undefined | null> {
    if (!show || seasonNumber === undefined || !episodeNumber)
      throw Error('Argument is empty (getEpisode$)');

    const episode$ = this.showsEpisodes.$.pipe(
      take(1),
      switchMap((showsEpisodes) => {
        const episode = showsEpisodes[episodeId(show.ids.trakt, seasonNumber, episodeNumber)];

        if (options?.fetchAlways || (options?.fetch && !episode)) {
          let showEpisode$ = merge(
            // history.state.showInfo ? of((history.state.showInfo as ShowInfo).nextEpisode) : EMPTY, // todo fix mark as seen
            combineLatest([
              this.showsEpisodes.fetch(
                show.ids.trakt,
                seasonNumber,
                episodeNumber,
                options.sync || !!episode,
              ),
              this.translationService.getEpisodeTranslation$(show, seasonNumber, episodeNumber, {
                fetch: true,
              }),
            ]).pipe(map(([show, translation]) => translated(show, translation))),
          ).pipe(distinctUntilChangedDeep());

          if (episode)
            showEpisode$ = concat(of(episode), showEpisode$).pipe(
              distinctUntilChanged(
                (a, b) =>
                  JSON.stringify({ ...a, updated_at: '' }) ===
                  JSON.stringify({ ...b, updated_at: '' }),
              ),
            );
          return showEpisode$;
        }

        if (episode && !Object.keys(episode).length) throw Error('Episode is empty (getEpisode$)');

        return of(episode);
      }),
    );

    const episodeTranslation$ = this.translationService.getEpisodeTranslation$(
      show,
      seasonNumber,
      episodeNumber,
      options,
    );

    return combineLatest([episode$, episodeTranslation$]).pipe(
      map(([episode, episodeTranslation]) => translatedOrUndefined(episode, episodeTranslation)),
      distinctUntilChanged(
        (a, b) =>
          JSON.stringify({ ...a, updated_at: '' }) === JSON.stringify({ ...b, updated_at: '' }),
      ),
    );
  }

  getEpisodeProgress$(
    show?: Show,
    seasonNumber?: number,
    episodeNumber?: number,
  ): Observable<EpisodeProgress | undefined> {
    if (!show || seasonNumber === undefined || !episodeNumber)
      throw Error('Argument is empty (getEpisodeProgress$)');

    return this.showService.showsProgress.$.pipe(
      map(
        (showsProgress) =>
          showsProgress[show.ids.trakt]?.seasons.find((season) => season.number === seasonNumber)
            ?.episodes[episodeNumber - 1],
      ),
    );
  }

  getEpisodes$(): Observable<Record<string, EpisodeFull | undefined>> {
    return combineLatest([
      this.showsEpisodes.$,
      this.translationService.showsEpisodesTranslations.$,
    ]).pipe(
      map(([showsEpisodes, episodesTranslations]) => {
        return Object.fromEntries(
          Object.entries(showsEpisodes).map(([episodeId, episode]) => [
            episodeId,
            translatedOrUndefined(episode, episodesTranslations[episodeId]),
          ]),
        );
      }),
    );
  }

  private getUpcomingEpisodes$(days = 33, startDate = new Date()): Observable<EpisodeAiring[]> {
    return this.getCalendar(days, startDate).pipe(
      concatMap((episodesAiring) => {
        const showsTranslations = combineLatest(
          episodesAiring.map((episodeAiring) =>
            this.translationService.getShowTranslation$(episodeAiring.show, { sync: true }),
          ),
        ).pipe(take(1));

        const episodesTranslations = combineLatest(
          episodesAiring.map((episodeAiring) => {
            return this.translationService.getEpisodeTranslation$(
              episodeAiring.show,
              episodeAiring.episode.season,
              episodeAiring.episode.number,
              { sync: true, fetch: true },
            );
          }),
        ).pipe(take(1));

        return forkJoin([of(episodesAiring), showsTranslations, episodesTranslations]).pipe(
          defaultIfEmpty([[], [], []]),
        );
      }),
      switchMap(([episodesAiring, showsTranslations, episodesTranslations]) =>
        of(
          episodesAiring.map((episodesAiring, i) => ({
            ...episodesAiring,
            show: translated(episodesAiring.show, showsTranslations[i]),
            episode: translated(episodesAiring.episode, episodesTranslations[i]),
          })),
        ),
      ),
    );
  }

  getUpcomingEpisodeInfos$(days = 33, startDate = new Date()): Observable<ShowInfo[]> {
    return this.getUpcomingEpisodes$(days, startDate).pipe(
      switchMap((episodesAiring) =>
        combineLatest([
          of(episodesAiring),
          combineLatest(
            episodesAiring.map((episodeAiring) =>
              this.tmdbService.getTmdbShow$(episodeAiring.show),
            ),
          ).pipe(defaultIfEmpty([])),
        ]),
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
      }),
    );
  }

  removeShowsEpisodes(show: Show): void {
    let isChanged = false;
    const showsEpisodes = Object.fromEntries(
      Object.entries(this.showsEpisodes.$.value).filter(([episodeId]) => {
        const filter = !episodeId.startsWith(`${show.ids.trakt}-`);
        if (!filter) isChanged = true;
        return filter;
      }),
    );
    if (!isChanged) return;

    this.showsEpisodes.$.next(showsEpisodes);
    this.localStorageService.setObject(LocalStorage.SHOWS_EPISODES, showsEpisodes);
  }

  getEpisodeProgress(
    seasonProgress: SeasonProgress,
    episodeNumber: number,
  ): EpisodeProgress | undefined {
    return seasonProgress.episodes.find((e) => e.number === episodeNumber);
  }

  getEpisodeFromEpisodeFull(episode: EpisodeFull | null | undefined): Episode | null | undefined {
    if (!episode) return episode;
    return {
      ids: episode.ids,
      number: episode.number,
      season: episode.season,
      title: episode.title,
    };
  }

  fetchEpisodesFromShow(
    tmdbShow: TmdbShow | undefined,
    show: Show,
  ): Observable<Record<string, EpisodeFull[] | undefined>> {
    if (!tmdbShow) return of({});
    return forkJoin([
      ...tmdbShow.seasons.map((season) =>
        forkJoin([
          of(season.season_number),
          this.seasonService.getSeasonEpisodes$<EpisodeFull>(show, season.season_number),
        ]).pipe(catchError(() => of([season.season_number, [] as EpisodeFull[]]))),
      ),
    ]).pipe(map((seasons) => Object.fromEntries(seasons)));
  }
}

interface CustomEpisode {
  episode: Episode;
  watchedAt?: Date;
}
