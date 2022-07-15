import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import {
  BehaviorSubject,
  catchError,
  combineLatest,
  forkJoin,
  from,
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
  RecommendedShow,
  SeasonProgress,
  SeasonWatched,
  ShowHidden,
  ShowProgress,
  ShowSearch,
  ShowWatched,
  ShowWatchedHistory,
  Stats,
  TraktShow,
  Translation,
  TrendingShow,
} from '../../types/interfaces/Trakt';
import { Filter, LocalStorage, Sort, SortOptions } from '../../types/enum';
import { setLocalStorage } from '../helper/local-storage';
import { episodeId } from '../helper/episodeId';
import { Config } from '../config';
import { EpisodeInfo, SeasonInfo, ShowInfo } from '../../types/interfaces/Show';
import { TmdbService } from './tmdb.service';
import { TmdbEpisode, TmdbShow } from '../../types/interfaces/Tmdb';
import { formatDate } from '@angular/common';
import { ConfigService } from './config.service';
import { Config as IConfig } from '../../types/interfaces/Config';
import {
  AddToHistoryResponse,
  RemoveFromHistoryResponse,
} from '../../types/interfaces/TraktResponse';
import { syncArrayTrakt, syncObjectsTrakt } from '../helper/sync';
import { HttpOptions } from '../../types/interfaces/Http';
import { ListService } from './list.service';

@Injectable({
  providedIn: 'root',
})
export class ShowService {
  showsWatched$: BehaviorSubject<ShowWatched[]>;
  syncShowsWatched: () => Promise<void>;

  showsTranslations$: BehaviorSubject<{ [showId: string]: Translation }>;
  syncShowTranslation: (showId: number | undefined, language: string) => Promise<void>;
  private readonly fetchShowTranslation: (
    showId: number | string | undefined,
    language: string
  ) => Observable<Translation>;

  showsProgress$: BehaviorSubject<{ [showId: number]: ShowProgress }>;
  syncShowProgress: (showId: number) => Promise<void>;

  showsHidden$: BehaviorSubject<ShowHidden[]>;
  syncShowsHidden: () => Promise<void>;

  showsEpisodes$: BehaviorSubject<{ [episodeId: string]: EpisodeFull }>;
  syncShowEpisode: (
    showId: number | undefined,
    seasonNumber: number | undefined,
    episodeNumber: number | undefined,
    force?: boolean
  ) => Promise<void>;
  private readonly fetchShowEpisode: (
    showId: number,
    seasonNumber: number,
    episodeNumber: number
  ) => Observable<EpisodeFull>;

  showsEpisodesTranslations$: BehaviorSubject<{ [episodeId: string]: Translation }>;
  syncShowEpisodeTranslation: (
    showId: number | undefined,
    seasonNumber: number | undefined,
    episodeNumber: number | undefined,
    language: string,
    force?: boolean
  ) => Promise<void>;
  private readonly fetchShowEpisodeTranslation: (
    showId: number,
    seasonNumber: number,
    episodeNumber: number,
    language: string
  ) => Observable<Translation>;

  favorites$: BehaviorSubject<number[]>;
  syncFavorites: () => Promise<void>;

  addedShowInfos$: BehaviorSubject<{ [showId: number]: ShowInfo }>;
  syncAddedShowInfo: (showId: number) => Promise<void>;

  constructor(
    private http: HttpClient,
    private tmdbService: TmdbService,
    private configService: ConfigService,
    private listService: ListService
  ) {
    const [showsWatched$, syncShowsWatched] = syncArrayTrakt<ShowWatched>({
      http: this.http,
      url: '/sync/watched/shows?extended=noseasons',
      localStorageKey: LocalStorage.SHOWS_WATCHED,
    });
    this.showsWatched$ = showsWatched$;
    this.syncShowsWatched = syncShowsWatched;

    const [showsTranslations$, syncShowTranslation, fetchShowTranslation] =
      syncObjectsTrakt<Translation>({
        http: this.http,
        url: '/shows/%/translations/%',
        localStorageKey: LocalStorage.SHOWS_TRANSLATIONS,
      });
    this.showsTranslations$ = showsTranslations$;
    this.syncShowTranslation = syncShowTranslation;
    this.fetchShowTranslation = fetchShowTranslation;

    const [showsProgress$, syncShowProgress] = syncObjectsTrakt<ShowProgress>({
      http: this.http,
      url: '/shows/%/progress/watched',
      localStorageKey: LocalStorage.SHOWS_PROGRESS,
      ignoreExisting: true,
    });
    this.showsProgress$ = showsProgress$;
    this.syncShowProgress = syncShowProgress;

    const [showsHidden$, syncShowsHidden] = syncArrayTrakt<ShowHidden>({
      http: this.http,
      url: '/users/hidden/progress_watched?type=show',
      localStorageKey: LocalStorage.SHOWS_HIDDEN,
    });
    this.showsHidden$ = showsHidden$;
    this.syncShowsHidden = syncShowsHidden;

    const [showsEpisodes$, syncShowEpisode, fetchShowEpisode] = syncObjectsTrakt<EpisodeFull>({
      http: this.http,
      url: '/shows/%/seasons/%/episodes/%?extended=full',
      localStorageKey: LocalStorage.SHOWS_EPISODES,
      idFormatter: episodeId as (...args: unknown[]) => string,
    });
    this.showsEpisodes$ = showsEpisodes$;
    this.syncShowEpisode = syncShowEpisode;
    this.fetchShowEpisode = fetchShowEpisode;

    const [showsEpisodesTranslations$, syncShowEpisodeTranslation, fetchShowEpisodeTranslation] =
      syncObjectsTrakt<Translation>({
        http: this.http,
        url: '/shows/%/seasons/%/episodes/%/translations/%',
        localStorageKey: LocalStorage.SHOWS_EPISODES_TRANSLATIONS,
        idFormatter: episodeId as (...args: unknown[]) => string,
      });
    this.showsEpisodesTranslations$ = showsEpisodesTranslations$;
    this.syncShowEpisodeTranslation = syncShowEpisodeTranslation;
    this.fetchShowEpisodeTranslation = fetchShowEpisodeTranslation;

    const [favorites$, syncFavorites] = syncArrayTrakt<number>({
      localStorageKey: LocalStorage.FAVORITES,
    });
    this.favorites$ = favorites$;
    this.syncFavorites = syncFavorites;

    const [addedShowInfos$, syncAddedShowInfo] = syncObjectsTrakt<ShowInfo>({
      localStorageKey: LocalStorage.ADDED_SHOW_INFO,
    });
    this.addedShowInfos$ = addedShowInfos$;
    this.syncAddedShowInfo = syncAddedShowInfo;

    this.configService.config$.subscribe((config) => {
      if (config.language === 'en-US') {
        if (
          this.showsTranslations$.value &&
          Object.keys(this.showsTranslations$.value).length > 0
        ) {
          this.showsTranslations$.next({});
          localStorage.removeItem(LocalStorage.SHOWS_TRANSLATIONS);
        }
        if (
          this.showsEpisodesTranslations$.value &&
          Object.keys(this.showsEpisodesTranslations$.value).length > 0
        ) {
          localStorage.removeItem(LocalStorage.SHOWS_EPISODES_TRANSLATIONS);
          this.showsEpisodesTranslations$.next({});
        }
      }
    });
  }

  fetchShowsWatchedHistory(startAt?: string): Observable<ShowWatchedHistory[]> {
    const options: HttpOptions = {};

    if (startAt) {
      // eslint-disable-next-line @typescript-eslint/naming-convention
      options.params = { start_at: startAt };
    }

    return this.http.get<ShowWatchedHistory[]>(
      `${Config.traktBaseUrl}/sync/history/shows`,
      options
    );
  }

  fetchShow(showId: number | string): Observable<TraktShow> {
    return this.http.get<TraktShow>(`${Config.traktBaseUrl}/shows/${showId}`);
  }

  fetchSearchForShows(query: string): Observable<ShowSearch[]> {
    return this.http.get<ShowSearch[]>(`${Config.traktBaseUrl}/search/show?query=${query}`);
  }

  fetchTrendingShows(): Observable<TrendingShow[]> {
    return this.http.get<TrendingShow[]>(`${Config.traktBaseUrl}/shows/trending`);
  }

  fetchPopularShows(): Observable<TraktShow[]> {
    return this.http.get<TraktShow[]>(`${Config.traktBaseUrl}/shows/popular`);
  }

  fetchRecommendedShows(): Observable<RecommendedShow[]> {
    return this.http.get<RecommendedShow[]>(`${Config.traktBaseUrl}/shows/recommended`);
  }

  private fetchSingleCalendar(days = 33, date: string): Observable<EpisodeAiring[]> {
    return this.http.get<EpisodeAiring[]>(
      `${Config.traktBaseUrl}/calendars/my/shows/${date}/${days}`
    );
  }

  fetchCalendar(days = 33, startDate = new Date()): Observable<EpisodeAiring[]> {
    const daysEach = 33;
    const formatCustomDate = (date: Date): string => formatDate(date, 'yyyy-MM-dd', 'en-US');

    if (days < daysEach) {
      return this.fetchSingleCalendar(days, formatCustomDate(startDate));
    }

    const times = Math.ceil(days / daysEach);
    const timesArray = Array(times).fill(0);

    const dateEach = timesArray.map((_, i) => {
      const date = new Date(startDate);
      if (i > 0) date.setDate(date.getDate() + i * daysEach);
      const dateFormatted = formatCustomDate(date);
      const singleDays = i === times - 1 ? days % daysEach || daysEach : daysEach;
      return this.fetchSingleCalendar(singleDays, dateFormatted);
    });

    return forkJoin(dateEach).pipe(map((results) => results.flat()));
  }

  fetchStats(userId = 'me'): Observable<Stats> {
    return this.http.get<Stats>(`${Config.traktBaseUrl}/users/${userId}/stats`);
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

  getShowWatched(showId?: number): ShowWatched | undefined {
    if (!showId) return;
    return (
      this.showsWatched$.value.find((show) => show.show.ids.trakt === showId) ||
      this.addedShowInfos$.value[showId]?.showWatched
    );
  }

  getShowWatched$(showId?: number): Observable<ShowWatched | undefined> {
    if (!showId) return of(undefined);

    const showWatched = this.showsWatched$.pipe(
      map((showsWatched) => {
        return showsWatched.find((showWatched) => showWatched.show.ids.trakt === showId);
      })
    );

    const showAdded = this.addedShowInfos$.pipe(
      map((addedShowInfos) => {
        return addedShowInfos[showId]?.showWatched;
      })
    );

    return combineLatest([showWatched, showAdded]).pipe(
      map(([showWatched, showAdded]) => showWatched || showAdded)
    );
  }

  getShow(showId?: number): TraktShow | undefined {
    if (!showId) return;
    const shows = this.getShows();
    return shows.find((show) => show.ids.trakt === showId);
  }

  getShowTranslation(showId?: number): Translation | undefined {
    if (!showId) return;
    return this.showsTranslations$.value[showId];
  }

  getShowProgress(showId?: number): ShowProgress | undefined {
    if (!showId) return;
    return this.showsProgress$.value[showId] || this.addedShowInfos$.value[showId]?.showProgress;
  }

  getSeasonProgress(showId: number, seasonNumber: number): SeasonProgress | undefined {
    return this.getShowProgress(showId)?.seasons?.[seasonNumber - 1];
  }

  getEpisodeProgress(
    showId: number,
    seasonNumber: number,
    episodeNumber: number
  ): EpisodeProgress | undefined {
    return this.getSeasonProgress(showId, seasonNumber)?.episodes?.[episodeNumber - 1];
  }

  getEpisode(showId: number, seasonNumber: number, episodeNumber: number): EpisodeFull | undefined {
    return this.showsEpisodes$.value[episodeId(showId, seasonNumber, episodeNumber)];
  }

  getEpisodeTranslation(
    showId: number,
    seasonNumber: number,
    episodeNumber: number
  ): Translation | undefined {
    return this.showsEpisodesTranslations$.value[episodeId(showId, seasonNumber, episodeNumber)];
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

    return forkJoin([episode$, tmdbEpisode$]);
  }

  getIdsBySlug$(slug?: string): Observable<Ids | undefined> {
    if (!slug) return of(undefined);
    return this.getShows$().pipe(
      switchMap((shows) => {
        const ids = shows.find((show) => show?.ids.slug === slug)?.ids;
        if (!ids) return this.fetchShow(slug).pipe(map((show) => show.ids));
        return of(ids);
      })
    );
  }

  getIdsByTraktId(traktId?: number): Ids | undefined {
    if (!traktId) return;
    return this.getShows().find((show) => show?.ids.trakt === traktId)?.ids;
  }

  getIdsByTraktId$(traktId?: number): Observable<Ids | undefined> {
    if (!traktId) return of(undefined);
    return this.getShows$().pipe(
      map((shows) => {
        return shows.find((show) => show?.ids.trakt === traktId)?.ids;
      })
    );
  }

  addFavorite(showId: number): void {
    const favorites = this.favorites$.value;
    if (favorites.includes(showId)) return;

    favorites.push(showId);
    setLocalStorage<{ shows: number[] }>(LocalStorage.FAVORITES, { shows: favorites });
    this.favorites$.next(favorites);
  }

  removeFavorite(showId: number): void {
    let favorites = this.favorites$.value;
    if (!favorites.includes(showId)) return;

    favorites = favorites.filter((favorite) => favorite !== showId);
    setLocalStorage<{ shows: number[] }>(LocalStorage.FAVORITES, { shows: favorites });
    this.favorites$.next(favorites);
  }

  searchForAddedShows$(query: string): Observable<TraktShow[]> {
    return this.getShowsWatchedWatchlistedAndAdded$().pipe(
      switchMap((shows) => {
        const showsTranslations = this.showsTranslations$.pipe(
          map((showsTranslations) => shows.map((show) => showsTranslations[show.ids.trakt]))
        );
        return combineLatest([of(shows), showsTranslations]);
      }),
      switchMap(([shows, showsTranslations]) => {
        const showsTranslated: TraktShow[] = shows.map((show, i) => {
          return { ...show, title: showsTranslations[i]?.title || show.title };
        });
        const queryLowerCase = query.toLowerCase();
        const showsSearched: TraktShow[] = showsTranslated.filter((show) =>
          show.title.toLowerCase().includes(queryLowerCase)
        );
        showsSearched.sort((a, b) =>
          a.title.toLowerCase().startsWith(queryLowerCase) &&
          !b.title.toLowerCase().startsWith(queryLowerCase)
            ? -1
            : 1
        );
        return of(showsSearched);
      }),
      take(1)
    );
  }

  addNewShow(ids: Ids, episode?: Episode): void {
    if (episode && !(episode.season === 1 && episode.number === 1)) return;

    const showInfos = this.addedShowInfos$.value;

    forkJoin([
      this.fetchShow(ids.trakt),
      this.tmdbService.getTmdbShow$(ids.tmdb).pipe(take(1)),
      this.fetchShowEpisode(ids.trakt, 1, 1),
    ]).subscribe(([show, tmdbShow, nextEpisode]) => {
      const showInfo = this.getShowInfoForNewShow(show, tmdbShow, nextEpisode);
      if (!showInfo) return;
      showInfos[show.ids.trakt] = showInfo;
      setLocalStorage<{ [showId: number]: ShowInfo }>(LocalStorage.ADDED_SHOW_INFO, showInfos);
      this.addedShowInfos$.next(showInfos);
    });
  }

  removeNewShow(showId: number): void {
    const addedShow = this.addedShowInfos$.value[showId];
    if (!addedShow) return;

    delete this.addedShowInfos$.value[showId];
    setLocalStorage<{ [showId: number]: ShowInfo }>(
      LocalStorage.ADDED_SHOW_INFO,
      this.addedShowInfos$.value
    );
    this.addedShowInfos$.next(this.addedShowInfos$.value);
    this.removeFavorite(showId);
  }

  getShowInfoForNewShow(
    show: TraktShow,
    tmdbShow: TmdbShow | undefined,
    nextEpisode: EpisodeFull
  ): ShowInfo | undefined {
    if (!tmdbShow) return;
    return {
      show,
      nextEpisode,
      showProgress: {
        aired: tmdbShow.number_of_episodes,
        completed: 0,
        // eslint-disable-next-line @typescript-eslint/naming-convention
        last_episode: null,
        // eslint-disable-next-line @typescript-eslint/naming-convention
        last_watched_at: null,
        // eslint-disable-next-line @typescript-eslint/naming-convention
        next_episode: {
          ids: {
            imdb: '',
            slug: '',
            tmdb: 0,
            trakt: 0,
            tvdb: 0,
            tvrage: 0,
          },
          number: 1,
          season: 1,
          title: nextEpisode.title,
        },
        // eslint-disable-next-line @typescript-eslint/naming-convention
        reset_at: null,
        seasons: tmdbShow.seasons
          .map((tmdbSeason) => {
            if (tmdbSeason.season_number === 0) return;
            return {
              aired: tmdbSeason.episode_count,
              completed: 0,
              episodes: Array(tmdbSeason.episode_count)
                .fill(0)
                .map((_, index) => {
                  return {
                    completed: false,
                    // eslint-disable-next-line @typescript-eslint/naming-convention
                    last_watched_at: null,
                    number: index + 1,
                  };
                }),
              number: tmdbSeason.season_number,
              title: tmdbSeason.name,
            };
          })
          .filter(Boolean) as SeasonProgress[],
      },
      showWatched: {
        // eslint-disable-next-line @typescript-eslint/naming-convention
        last_updated_at: null,
        // eslint-disable-next-line @typescript-eslint/naming-convention
        last_watched_at: null,
        plays: 0,
        // eslint-disable-next-line @typescript-eslint/naming-convention
        reset_at: null,
        seasons: tmdbShow.seasons
          .map((tmdbSeason) => {
            if (tmdbSeason.season_number === 0) return;
            return {
              number: tmdbSeason.season_number,
              episodes: Array(tmdbSeason.episode_count)
                .fill(0)
                .map((_, index) => {
                  return {
                    // eslint-disable-next-line @typescript-eslint/naming-convention
                    last_watched_at: null,
                    number: index + 1,
                    plays: 0,
                  };
                }),
            };
          })
          .filter(Boolean) as SeasonWatched[],
        show,
      },
    };
  }

  getShowsAdded$(): Observable<TraktShow[]> {
    const showsWatched = this.showsWatched$.pipe(
      map((showsWatched) => showsWatched.map((showWatched) => showWatched.show))
    );
    const showsAdded = this.addedShowInfos$.pipe(
      map(
        (addedShowInfos) =>
          Object.values(addedShowInfos)
            .map((addedShowInfo) => addedShowInfo.show)
            .filter(Boolean) as TraktShow[]
      )
    );
    return combineLatest([showsWatched, showsAdded]).pipe(
      map(([showsWatched, showsAdded]) => [...showsWatched, ...showsAdded])
    );
  }

  getShowProgress$(showId?: number): Observable<ShowProgress | undefined> {
    if (!showId) return of(undefined);

    const showProgress: Observable<ShowProgress | undefined> = this.showsProgress$.pipe(
      map((showsProgress) => showsProgress[showId])
    );
    const showAddedProgress = this.addedShowInfos$.pipe(
      map((addedShowInfos) => addedShowInfos[showId]?.showProgress)
    );
    return combineLatest([showProgress, showAddedProgress]).pipe(
      map(([showProgress, showAddedProgress]) => showProgress || showAddedProgress)
    );
  }

  getShowTranslation$(showId?: number): Observable<Translation | undefined> {
    if (!showId) return of(undefined);

    return this.showsTranslations$.pipe(
      switchMap((showsTranslations) => {
        const showTranslation = showsTranslations[showId];
        if (!showTranslation) {
          const language = this.configService.config$.value.language.substring(0, 2);
          return this.fetchShowTranslation(showId, language);
        }
        return of(showTranslation);
      })
    );
  }

  getShowEpisode$(
    showId?: number,
    seasonNumber?: number,
    episodeNumber?: number
  ): Observable<EpisodeFull | undefined> {
    if (!showId || !seasonNumber || !episodeNumber) return of(undefined);

    const showEpisode: Observable<EpisodeFull | undefined> = this.showsEpisodes$.pipe(
      map((showsEpisodes) => showsEpisodes[episodeId(showId, seasonNumber, episodeNumber)])
    );
    const showAddedEpisode = this.addedShowInfos$.pipe(
      map((addedShowInfos) => addedShowInfos[showId]?.nextEpisode)
    );
    return combineLatest([showEpisode, showAddedEpisode]).pipe(
      switchMap(([showEpisode, showAddedEpisode]) => {
        const episode = showEpisode || showAddedEpisode;
        return episode ? of(episode) : this.fetchShowEpisode(showId, seasonNumber, episodeNumber);
      })
    );
  }

  getShowEpisodeTranslation$(
    showId?: number,
    seasonNumber?: number,
    episodeNumber?: number
  ): Observable<Translation | undefined> {
    if (!showId || !seasonNumber || !episodeNumber) return of(undefined);

    const showEpisodeTranslation: Observable<Translation | undefined> =
      this.showsEpisodesTranslations$.pipe(
        map((showsEpisodes) => showsEpisodes[episodeId(showId, seasonNumber, episodeNumber)])
      );
    const showAddedEpisodeTranslation = this.addedShowInfos$.pipe(
      map((addedShowInfos) => addedShowInfos[showId]?.nextEpisodeTranslation)
    );
    const language = this.configService.config$.value.language.substring(0, 2);
    return combineLatest([showEpisodeTranslation, showAddedEpisodeTranslation]).pipe(
      switchMap(([showEpisodeTranslation, showAddedEpisodeTranslation]) => {
        const translation = showEpisodeTranslation || showAddedEpisodeTranslation;
        return translation || language === 'en'
          ? of(translation)
          : this.fetchShowEpisodeTranslation(showId, seasonNumber, episodeNumber, language);
      })
    );
  }

  getShowsFilteredAndSorted$(): Observable<ShowInfo[]> {
    return combineLatest([
      this.tmdbService.tmdbShows$,
      this.getShowsAdded$(),
      this.showsProgress$,
      this.showsHidden$,
      this.showsEpisodes$,
      this.showsEpisodesTranslations$,
      this.favorites$,
      this.addedShowInfos$,
      this.configService.config$,
    ]).pipe(
      map(
        ([
          tmdbShows,
          showsAdded,
          showsProgress,
          showsHidden,
          showsEpisodes,
          showsEpisodesTranslation,
          favorites,
          addedShowInfos,
          config,
        ]) => {
          const tmdbShowsArray = Object.values(tmdbShows);

          Object.entries(addedShowInfos).forEach(([id, showInfo]) => {
            const showId = parseInt(id);
            showsProgress[showId] = showInfo.showProgress as ShowProgress;
            showsEpisodes[
              episodeId(
                showId,
                (showInfo.showProgress as ShowProgress).next_episode.season,
                (showInfo.showProgress as ShowProgress).next_episode.number
              )
            ] = showInfo.nextEpisode as EpisodeFull;
          });

          if (this.isMissing(showsAdded, tmdbShowsArray, showsProgress, showsEpisodes)) return [];

          const shows: ShowInfo[] = [];

          showsAdded.forEach((show) => {
            const showProgress = showsProgress[show.ids.trakt];
            const tmdbShow = tmdbShowsArray.find((tmdbShow) => tmdbShow?.id === show.ids.tmdb);

            if (this.filter(config, showProgress, tmdbShow, showsHidden, show)) return;

            const episodeIdentifier = episodeId(
              show.ids.trakt,
              showProgress.next_episode.season,
              showProgress.next_episode.number
            );

            shows.push({
              show,
              showProgress,
              tmdbShow,
              isFavorite: favorites.includes(show.ids.trakt),
              showWatched: this.getShowWatched(show.ids.trakt),
              nextEpisode: showsEpisodes[episodeIdentifier],
              nextEpisodeTranslation:
                config.language !== 'en-US'
                  ? showsEpisodesTranslation[episodeIdentifier]
                  : undefined,
            });
          });

          this.sortShows(config, shows, showsEpisodes);

          return shows;
        }
      )
    );
  }

  private filter(
    config: IConfig,
    showProgress: ShowProgress,
    tmdbShow: TmdbShow | undefined,
    showsHidden: ShowHidden[],
    show: TraktShow
  ): boolean {
    for (const filter of config.filters.filter((filter) => filter.value)) {
      switch (filter.name) {
        case Filter.NO_NEW_EPISODES:
          if (this.hideNoNewEpisodes(showProgress)) return true;
          break;
        case Filter.COMPLETED:
          if (this.hideCompleted(showProgress, tmdbShow)) return true;
          break;
        case Filter.HIDDEN:
          if (this.hideHidden(showsHidden, show.ids.trakt)) return true;
          break;
      }
    }
    return false;
  }

  private sortShows(
    config: IConfig,
    shows: ShowInfo[],
    showsEpisodes: { [episodeId: string]: EpisodeFull }
  ): void {
    switch (config.sort.by) {
      case Sort.NEWEST_EPISODE:
        shows.sort((a, b) => this.sortByNewestEpisode(a, b, showsEpisodes));
        break;
      case Sort.LAST_WATCHED:
        break;
    }

    switch (config.sortOptions.find((sortOption) => sortOption.value)?.name) {
      case SortOptions.FAVORITES_FIRST:
        shows.sort((a, b) => this.sortFavoritesFirst(a, b));
        break;
    }
  }

  private isMissing(
    showsAll: TraktShow[],
    tmdbShows: (TmdbShow | undefined)[],
    showsProgress: { [showId: number]: ShowProgress },
    showsEpisodes: { [episodeId: string]: EpisodeFull }
  ): boolean {
    for (const show of showsAll) {
      if (!tmdbShows.find((tmdbShow) => tmdbShow?.id === show.ids.tmdb)) return true;
      const showProgress = showsProgress[show.ids.trakt];
      if (!showProgress) return true;
      if (
        showProgress.next_episode &&
        !showsEpisodes[
          episodeId(
            show.ids.trakt,
            showProgress.next_episode.season,
            showProgress.next_episode.number
          )
        ]
      )
        return true;
    }
    return false;
  }

  private hideHidden(showsHidden: ShowHidden[], showId: number): boolean {
    return !!showsHidden.find((show) => show.show.ids.trakt === showId);
  }

  private hideNoNewEpisodes(showProgress: ShowProgress | undefined): boolean {
    return !!showProgress && showProgress.aired === showProgress.completed;
  }

  private hideCompleted(
    showProgress: ShowProgress | undefined,
    tmdbShow: TmdbShow | undefined
  ): boolean {
    return (
      !!showProgress &&
      !!tmdbShow &&
      ['Ended', 'Canceled'].includes(tmdbShow.status) &&
      showProgress.aired === showProgress.completed
    );
  }

  private sortByNewestEpisode(
    a: ShowInfo,
    b: ShowInfo,
    showsEpisodes: { [episodeId: string]: EpisodeFull }
  ): number {
    const nextEpisodeA =
      a.showProgress?.next_episode &&
      showsEpisodes[
        episodeId(
          a.show?.ids.trakt,
          a.showProgress.next_episode.season,
          a.showProgress.next_episode.number
        )
      ];
    const nextEpisodeB =
      b.showProgress?.next_episode &&
      showsEpisodes[
        episodeId(
          b.show?.ids.trakt,
          b.showProgress.next_episode.season,
          b.showProgress.next_episode.number
        )
      ];
    if (!nextEpisodeA) return 1;
    if (!nextEpisodeB) return -1;
    return (
      new Date(nextEpisodeB.first_aired).getTime() - new Date(nextEpisodeA.first_aired).getTime()
    );
  }

  private sortFavoritesFirst(a: ShowInfo, b: ShowInfo): number {
    if (a.isFavorite && !b.isFavorite) return -1;
    return 1;
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

  getShowsWatchedWatchlistedAndAdded$(): Observable<TraktShow[]> {
    const showsWatched = this.showsWatched$.pipe(
      map((showsWatched) => showsWatched.map((showWatched) => showWatched.show))
    );
    const watchlist = this.listService.watchlist$.pipe(
      map((watchlistItems) => watchlistItems.map((watchlistItem) => watchlistItem.show))
    );
    const showsAdded = this.addedShowInfos$.pipe(
      map(
        (addedShowInfos) =>
          Object.values(addedShowInfos)
            .map((addedShowInfo) => addedShowInfo.show)
            .filter(Boolean) as TraktShow[]
      )
    );
    return combineLatest([showsWatched, watchlist, showsAdded]).pipe(
      map(([showsWatched, watchlist, showsAdded]) => [...showsWatched, ...watchlist, ...showsAdded])
    );
  }

  getShows(): TraktShow[] {
    return [
      ...this.showsWatched$.value.map((showWatched) => showWatched.show),
      ...this.listService.watchlist$.value.map((watchlistItem) => watchlistItem.show),
      ...Object.values(this.addedShowInfos$.value).map((showInfo) => showInfo.show),
    ].filter(Boolean) as TraktShow[];
  }

  getShowInfo$(slug?: string): Observable<ShowInfo | undefined> {
    if (!slug) return of(undefined);

    return this.getShow$(slug).pipe(
      switchMap((show) => {
        if (!show) return of([]);
        return combineLatest([
          this.getShowWatched$(show.ids.trakt),
          this.getShowProgress$(show.ids.trakt),
          this.getShowTranslation$(show.ids.trakt),
          this.tmdbService.getTmdbShow$(show.ids.tmdb),
          of(show),
        ]);
      }),
      switchMap(([showWatched, showProgress, showTranslation, tmdbShow, show]) => {
        const showInfo: ShowInfo = {
          show,
          showWatched,
          showProgress,
          showTranslation,
          tmdbShow,
        };

        const seasonNumber = showProgress ? showProgress.next_episode?.season : 1;
        const episodeNumber = showProgress ? showProgress.next_episode?.number : 1;

        return combineLatest([
          this.getShowEpisode$(show.ids.trakt, seasonNumber, episodeNumber),
          this.getShowEpisodeTranslation$(show.ids.trakt, seasonNumber, episodeNumber),
          this.tmdbService.getTmdbEpisode$(show.ids.tmdb, seasonNumber, episodeNumber),
          of(showInfo),
        ]);
      }),
      switchMap(([nextEpisode, nextEpisodeTranslation, tmdbNextEpisode, showInfo]) => {
        showInfo.nextEpisode = nextEpisode;
        showInfo.nextEpisodeTranslation = nextEpisodeTranslation;
        showInfo.tmdbNextEpisode = tmdbNextEpisode;
        return of(showInfo);
      })
    );
  }

  getSeasonProgress$(
    showId?: number,
    seasonNumber?: number
  ): Observable<SeasonProgress | undefined> {
    if (!showId || !seasonNumber) return of(undefined);

    const seasonProgress: Observable<SeasonProgress | undefined> = this.showsProgress$.pipe(
      map((showsProgress) => showsProgress[showId]?.seasons[seasonNumber - 1])
    );
    const showAddedSeasonProgress = this.addedShowInfos$.pipe(
      map((addedShowInfos) => addedShowInfos[showId]?.showProgress?.seasons[seasonNumber - 1])
    );
    return combineLatest([seasonProgress, showAddedSeasonProgress]).pipe(
      map(([seasonProgress, showAddedSeasonProgress]) => seasonProgress || showAddedSeasonProgress)
    );
  }

  getEpisodes$(
    episodeCount?: number,
    ids?: Ids,
    seasonNumber?: number
  ): Observable<EpisodeFull[] | undefined> {
    if (!episodeCount || !ids || !seasonNumber) return of(undefined);

    return this.showsEpisodes$.pipe(
      switchMap((showsEpisodes) => {
        const episodeObservables = Array(episodeCount)
          .fill(0)
          .map((_, index) => {
            const episode = showsEpisodes[episodeId(ids.trakt, seasonNumber, index + 1)];
            if (!episode) return this.fetchShowEpisode(ids.trakt, seasonNumber, index + 1);
            return of(episode);
          });
        return forkJoin(episodeObservables);
      })
    );
  }

  getEpisodesTranslation$(
    episodeCount?: number,
    ids?: Ids,
    seasonNumber?: number
  ): Observable<Translation[] | undefined> {
    if (!episodeCount || !ids || !seasonNumber) return of(undefined);

    return this.showsEpisodesTranslations$.pipe(
      switchMap((showsEpisodesTranslations) => {
        const episodeTranslationObservables = Array(episodeCount)
          .fill(0)
          .map((_, index) => {
            const episodeTranslation =
              showsEpisodesTranslations[episodeId(ids.trakt, seasonNumber, index + 1)];
            if (!episodeTranslation) {
              const language = this.configService.config$.value.language.substring(0, 2);
              return this.fetchShowEpisodeTranslation(ids.trakt, seasonNumber, index + 1, language);
            }
            return of(episodeTranslation);
          });
        return forkJoin(episodeTranslationObservables);
      })
    );
  }

  getShows$(): Observable<TraktShow[]> {
    const showsWatched = this.showsWatched$.pipe(
      map((showsWatched) => showsWatched.map((showWatched) => showWatched.show))
    );
    const showsWatchlisted = this.listService.watchlist$.pipe(
      map((watchlistItems) => watchlistItems.map((watchlistItem) => watchlistItem.show))
    );
    const showsAdded = this.addedShowInfos$.pipe(
      map((addedShowInfos) => {
        return Object.values(addedShowInfos)
          .map((addedShowInfo) => addedShowInfo.show)
          .filter(Boolean) as TraktShow[];
      })
    );

    return combineLatest([showsWatched, showsWatchlisted, showsAdded]).pipe(
      map(([showsWatched, showsWatchlisted, showsAdded]) => [
        ...showsWatched,
        ...showsWatchlisted,
        ...showsAdded,
      ])
    );
  }

  getShow$(showId?: number | string): Observable<TraktShow | undefined> {
    if (!showId) return of(undefined);

    return this.getShows$().pipe(
      switchMap((shows) => {
        const show = shows.find((show) => show.ids.trakt === showId);
        if (!show) return this.fetchShow(showId);
        return of(show);
      })
    );
  }

  getSeasonInfo$(slug?: string, seasonNumber?: number): Observable<SeasonInfo | undefined> {
    if (!slug || !seasonNumber) return of(undefined);

    return this.getIdsBySlug$(slug).pipe(
      switchMap((ids) => {
        if (!ids) return of([]);
        return combineLatest([
          this.getSeasonProgress$(ids.trakt, seasonNumber),
          this.getShow$(ids.trakt),
          this.getShowTranslation$(ids.trakt),
          this.tmdbService.getTmdbShow$(ids.tmdb),
          of(ids),
        ]);
      }),
      switchMap(([seasonProgress, show, showTranslation, tmdbShow, ids]) => {
        const seasonInfo: SeasonInfo = {
          seasonProgress,
          seasonNumber,
          show,
          showTranslation,
        };

        const episodeCount = seasonProgress
          ? seasonProgress.episodes.length
          : tmdbShow?.seasons.find((season) => season.season_number === seasonNumber)
              ?.episode_count;

        return combineLatest([
          of(seasonInfo),
          this.getEpisodes$(episodeCount, ids, seasonNumber),
          this.getEpisodesTranslation$(episodeCount, ids, seasonNumber),
          seasonProgress
            ? from(this.syncSeasonEpisodes(episodeCount, ids, seasonNumber))
            : of(undefined),
        ]);
      }),
      switchMap(([seasonInfo, episodes, episodesTranslation]) => {
        seasonInfo.episodes = episodes;
        seasonInfo.episodesTranslations = episodesTranslation;

        return of(seasonInfo);
      })
    );
  }

  async syncSeasonEpisodes(
    episodeCount: number | undefined,
    ids: Ids | undefined,
    seasonNumber: number | undefined
  ): Promise<void> {
    if (!episodeCount || !ids || !seasonNumber) return;

    const episodeCountArray = Array(episodeCount).fill(0);

    const promises: Promise<void>[] = episodeCountArray.map((_, index) =>
      this.syncShowEpisode(ids.trakt, seasonNumber, index + 1)
    );

    const language = this.configService.config$.value.language.substring(0, 2);

    if (language !== 'en') {
      promises.push(
        ...episodeCountArray.map((_, index) =>
          this.syncShowEpisodeTranslation(ids.trakt, seasonNumber, index + 1, language)
        )
      );
    }

    await Promise.all(promises);
  }

  getEpisodeInfo$(
    slug?: string,
    seasonNumber?: number,
    episodeNumber?: number
  ): Observable<EpisodeInfo | undefined> {
    if (!slug || !seasonNumber || !episodeNumber) return of(undefined);

    return this.getIdsBySlug$(slug).pipe(
      switchMap((ids) => {
        if (!ids) return of([]);
        return combineLatest([
          this.getEpisodeProgress$(ids.trakt, seasonNumber, episodeNumber),
          this.getShow$(ids.trakt),
          this.getShowTranslation$(ids.trakt),
          of(ids),
        ]);
      }),
      switchMap(([episodeProgress, show, showTranslation, ids]) => {
        const episodeInfo: EpisodeInfo = {
          episodeProgress,
          show,
          showTranslation,
        };

        return combineLatest([
          of(episodeInfo),
          this.getEpisode$(ids, seasonNumber, episodeNumber),
          this.getEpisodeTranslation$(ids, seasonNumber, episodeNumber),
          this.tmdbService.getTmdbEpisode$(ids.tmdb, seasonNumber, episodeNumber),
          episodeProgress
            ? from(this.tmdbService.syncTmdbEpisode(ids.tmdb, seasonNumber, episodeNumber))
            : of(undefined),
          episodeProgress
            ? from(this.syncEpisode(ids, seasonNumber, episodeNumber))
            : of(undefined),
        ]);
      }),
      switchMap(([episodeInfo, episode, episodeTranslation, tmdbEpisode]) => {
        episodeInfo.episode = episode;
        episodeInfo.episodeTranslation = episodeTranslation;
        episodeInfo.tmdbEpisode = tmdbEpisode;

        return of(episodeInfo);
      })
    );
  }

  getEpisodeProgress$(
    showId?: number,
    seasonNumber?: number,
    episodeNumber?: number
  ): Observable<EpisodeProgress | undefined> {
    if (!showId || !seasonNumber || !episodeNumber) return of(undefined);

    const episodeProgress: Observable<EpisodeProgress | undefined> = this.showsProgress$.pipe(
      map(
        (showsProgress) =>
          showsProgress[showId]?.seasons[seasonNumber - 1].episodes[episodeNumber - 1]
      )
    );
    const showAddedEpisodeProgress = this.addedShowInfos$.pipe(
      map(
        (addedShowInfos) =>
          addedShowInfos[showId]?.showProgress?.seasons[seasonNumber - 1].episodes[
            episodeNumber - 1
          ]
      )
    );
    return combineLatest([episodeProgress, showAddedEpisodeProgress]).pipe(
      map(
        ([episodeProgress, showAddedEpisodeProgress]) => episodeProgress || showAddedEpisodeProgress
      )
    );
  }

  getEpisode$(ids: Ids, seasonNumber: number, episodeNumber: number): Observable<EpisodeFull> {
    return this.showsEpisodes$.pipe(
      switchMap((showsEpisodes) => {
        const episode = showsEpisodes[episodeId(ids.trakt, seasonNumber, episodeNumber)];
        if (!episode) return this.fetchShowEpisode(ids.trakt, seasonNumber, episodeNumber);
        return of(episode);
      })
    );
  }

  getEpisodeTranslation$(
    ids?: Ids,
    seasonNumber?: number,
    episodeNumber?: number
  ): Observable<Translation | undefined> {
    if (!ids || !seasonNumber || !episodeNumber) return of(undefined);

    return this.showsEpisodesTranslations$.pipe(
      switchMap((showsEpisodesTranslations) => {
        const episodeTranslation =
          showsEpisodesTranslations[episodeId(ids.trakt, seasonNumber, episodeNumber)];
        if (!episodeTranslation) {
          const language = this.configService.config$.value.language.substring(0, 2);
          return this.fetchShowEpisodeTranslation(ids.trakt, seasonNumber, episodeNumber, language);
        }
        return of(episodeTranslation);
      })
    );
  }

  async syncEpisode(
    ids: Ids | undefined,
    seasonNumber: number | undefined,
    episodeNumber: number | undefined
  ): Promise<void> {
    if (!ids || !seasonNumber || !episodeNumber) return;

    const promises: Promise<void>[] = [
      this.syncShowEpisode(ids.trakt, seasonNumber, episodeNumber),
    ];

    const language = this.configService.config$.value.language.substring(0, 2);

    if (language !== 'en') {
      promises.push(
        this.syncShowEpisodeTranslation(ids.trakt, seasonNumber, episodeNumber, language)
      );
    }

    await Promise.all(promises);
  }
}
