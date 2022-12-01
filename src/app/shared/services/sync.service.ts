import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { MatSnackBar } from '@angular/material/snack-bar';
import {
  BehaviorSubject,
  defaultIfEmpty,
  delay,
  finalize,
  forkJoin,
  lastValueFrom,
  map,
  Observable,
  of,
  switchMap,
  take,
} from 'rxjs';

import { TmdbService } from '../../shows/data/tmdb.service';
import { ConfigService } from './config.service';
import { ShowService } from '../../shows/data/show.service';
import { AuthService } from './auth.service';
import { ListService } from '../../lists/data/list.service';
import { EpisodeService } from '../../shows/data/episode.service';
import { TranslationService } from '../../shows/data/translation.service';
import { onError } from '@helper/error';
import { episodeId } from '@helper/episodeId';

import { LocalStorage } from '@type/enum';

import type { LastActivity } from '@type/interfaces/Trakt';
import { lastActivitySchema } from '@type/interfaces/Trakt';
import type { SyncOptions } from '@type/interfaces/Sync';
import { getQueryParameter } from '@helper/getQueryParameter';
import { parseResponse } from '@operator/parseResponse';
import { api } from '../api';
import { isAfter, subHours, subWeeks } from 'date-fns';
import { LocalStorageService } from '@services/local-storage.service';

@Injectable({
  providedIn: 'root',
})
export class SyncService {
  isSyncing = new BehaviorSubject<boolean>(false);

  remoteSyncMap: Record<string, (options?: SyncOptions) => Observable<void>> = {
    [LocalStorage.SHOWS_WATCHED]: this.showService.showsWatched.sync,
    [LocalStorage.SHOWS_HIDDEN]: this.showService.showsHidden.sync,
    [LocalStorage.WATCHLIST]: this.listService.watchlist.sync,
    [LocalStorage.LISTS]: this.listService.lists.sync,
  };

  constructor(
    private http: HttpClient,
    private tmdbService: TmdbService,
    private showService: ShowService,
    private configService: ConfigService,
    private authService: AuthService,
    private snackBar: MatSnackBar,
    private listService: ListService,
    private episodeService: EpisodeService,
    private translationService: TranslationService,
    private localStorageService: LocalStorageService
  ) {
    this.authService.isLoggedIn$
      .pipe(
        delay(100),
        switchMap((isLoggedIn) => {
          if (!isLoggedIn) {
            this.resetSubjects();
            return of(undefined);
          }

          const withoutSync = getQueryParameter('sync') === '0';
          if (withoutSync) return of(undefined);

          const lastSyncedAt = this.configService.config.$.value.lastFetchedAt.sync;
          const lastSyncedAtDate = lastSyncedAt ? new Date(lastSyncedAt) : new Date(0);
          const isSyncedLastHour = isAfter(lastSyncedAtDate, subHours(new Date(), 1));
          if (isSyncedLastHour) return of(undefined);

          return this.fetchLastActivity();
        })
      )
      .subscribe({
        next: async (lastActivity: LastActivity | undefined) => {
          if (!lastActivity) return;
          await this.sync(lastActivity);
        },
        error: (error) =>
          onError(error, this.snackBar, undefined, 'An error occurred while fetching trakt'),
      });
  }

  fetchLastActivity(): Observable<LastActivity> {
    return this.http
      .get<LastActivity>(api.syncLastActivities)
      .pipe(parseResponse(lastActivitySchema));
  }

  async sync(lastActivity?: LastActivity, options?: SyncOptions): Promise<void> {
    try {
      if (!this.authService.isLoggedIn$.value) return;

      this.isSyncing.next(true);
      options?.showSyncingSnackbar && this.snackBar.open('Sync 0/4', undefined, { duration: 2000 });
      console.debug('Sync 0/4');

      let observables: Observable<void>[] = [];

      const localLastActivity = this.localStorageService.getObject<LastActivity>(
        LocalStorage.LAST_ACTIVITY
      );
      const forceSync = options?.force;
      const syncAll = !localLastActivity || forceSync;
      const optionsInternal: SyncOptions = { publishSingle: !syncAll, ...options };

      let isListLater = syncAll;

      if (syncAll) {
        observables.push(
          ...Object.values(this.remoteSyncMap).map((syncValues) =>
            syncValues({ ...optionsInternal, publishSingle: true })
          )
        );
        observables.push(
          this.configService.config.sync({ ...optionsInternal, publishSingle: true })
        );
        observables.push(
          this.showService.favorites.sync({ ...optionsInternal, publishSingle: true })
        );
      } else if (lastActivity) {
        const isShowWatchedLater =
          new Date(lastActivity.episodes.watched_at) >
          new Date(localLastActivity.episodes.watched_at);

        if (isShowWatchedLater) {
          observables.push(this.showService.showsWatched.sync());
        }

        const isShowHiddenLater =
          new Date(lastActivity.shows.hidden_at) > new Date(localLastActivity.shows.hidden_at);

        if (isShowHiddenLater) {
          observables.push(this.showService.showsHidden.sync());
        }

        const isWatchlistLater =
          new Date(lastActivity.watchlist.updated_at) >
          new Date(localLastActivity.watchlist.updated_at);

        if (isWatchlistLater) {
          observables.push(this.listService.watchlist.sync());
        }

        isListLater =
          new Date(lastActivity.lists.updated_at) > new Date(localLastActivity.lists.updated_at);

        if (isListLater) {
          observables.push(this.listService.lists.sync());
        }

        observables.push(...this.syncEmpty());
      }

      await Promise.all(observables.map((observable) => lastValueFrom(observable)));
      options?.showSyncingSnackbar && this.snackBar.open('Sync 1/5', undefined, { duration: 2000 });
      console.debug('Sync 1/5');

      // if (!syncAll) {
      //   observables = [this.syncNewOnceAWeek(optionsInternal)];
      //   await Promise.allSettled(observables.map((observable) => lastValueFrom(observable)));
      // }

      options?.showSyncingSnackbar && this.snackBar.open('Sync 2/5', undefined, { duration: 2000 });
      console.debug('Sync 2/5');

      observables = [
        this.syncShowsProgress(optionsInternal),
        this.syncShowsTranslations(optionsInternal),
        this.syncTmdbShows(optionsInternal),
        this.syncListItems({ ...optionsInternal, force: isListLater }),
      ];
      await Promise.allSettled(observables.map((observable) => lastValueFrom(observable)));
      options?.showSyncingSnackbar && this.snackBar.open('Sync 3/5', undefined, { duration: 2000 });
      console.debug('Sync 3/5');

      observables = [this.syncShowsNextEpisodes(optionsInternal)];
      await Promise.allSettled(observables.map((observable) => lastValueFrom(observable)));
      options?.showSyncingSnackbar && this.snackBar.open('Sync 4/5', undefined, { duration: 2000 });
      console.debug('Sync 4/5');

      this.episodeService.addMissingShowProgress();

      observables = [this.removeUnused()];
      await Promise.all(observables.map((observable) => lastValueFrom(observable)));
      options?.showSyncingSnackbar && this.snackBar.open('Sync 5/5', undefined, { duration: 2000 });
      console.debug('Sync 5/5');

      if (lastActivity)
        this.localStorageService.setObject(LocalStorage.LAST_ACTIVITY, lastActivity);

      const lastFetchedAt = this.configService.config.$.value.lastFetchedAt;
      const currentDateString = new Date().toISOString();
      lastFetchedAt.sync = currentDateString;

      if (syncAll) {
        lastFetchedAt.progress = currentDateString;
        lastFetchedAt.episodes = currentDateString;
        lastFetchedAt.tmdbShows = currentDateString;
      }

      this.configService.config.sync({ force: true });

      this.isSyncing.next(false);
    } catch (error) {
      onError(error, this.snackBar);
      this.isSyncing.next(false);
    }
  }

  removeUnused(): Observable<void> {
    const shows = this.showService.getShows();

    const removeUnusedTmdbShows = this.tmdbService.tmdbShows.$.pipe(
      map((tmdbShows) => {
        const showsTmdbIds = shows.map((show) => show.ids.tmdb);

        Object.values(tmdbShows).forEach((tmdbShow) => {
          if (!tmdbShow) return;
          if (!showsTmdbIds.includes(tmdbShow.id)) {
            this.tmdbService.removeShow(tmdbShow.id);
          }
        });
      }),
      take(1)
    );

    const removeUnusedShowTranslations = this.translationService.showsTranslations.$.pipe(
      map((showsTranslations) => {
        const showsTraktIds = shows.map((show) => show.ids.trakt);

        Object.entries(showsTranslations).forEach(([showIdString, showsTranslation]) => {
          if (!showsTranslation) return;
          const showIdTrakt = parseInt(showIdString);
          if (!showsTraktIds.includes(showIdTrakt)) {
            this.translationService.removeShowTranslation(showIdTrakt);
          }
        });
      }),
      take(1)
    );

    const removeUnusedShowProgress = this.showService.showsProgress.$.pipe(
      map((showsProgress) => {
        const showsTraktIds = shows.map((show) => show.ids.trakt);

        Object.entries(showsProgress).forEach(([showIdString, showProgress]) => {
          if (!showProgress) return;
          const showIdTrakt = parseInt(showIdString);
          if (!showsTraktIds.includes(showIdTrakt)) {
            this.showService.removeShowProgress(showIdTrakt);
          }
        });
      }),
      take(1)
    );

    return forkJoin([
      removeUnusedTmdbShows,
      removeUnusedShowTranslations,
      removeUnusedShowProgress,
    ]).pipe(map(() => undefined));
  }

  syncNew(options?: SyncOptions): Promise<void> {
    return new Promise((resolve) => {
      this.fetchLastActivity().subscribe(async (lastActivity) => {
        await this.sync(lastActivity, options);
        resolve();
      });
    });
  }

  syncAll(options?: SyncOptions): Promise<void> {
    for (const key of Object.values(LocalStorage)) {
      if ([LocalStorage.CONFIG, LocalStorage.FAVORITES].includes(key)) continue;
      localStorage.removeItem(key);
    }

    this.resetSubjects();

    return new Promise((resolve) => {
      this.fetchLastActivity().subscribe(async (lastActivity) => {
        await this.sync(lastActivity, { ...options, force: true });
        resolve();
      });
    });
  }

  resetSubjects(): void {
    this.showService.showsWatched.$.next([]);
    this.translationService.showsTranslations.$.next({});
    this.showService.showsProgress.$.next({});
    this.showService.showsHidden.$.next([]);
    this.episodeService.showsEpisodes.$.next({});
    this.translationService.showsEpisodesTranslations.$.next({});
    this.tmdbService.tmdbShows.$.next({});
    this.tmdbService.tmdbSeasons.$.next({});
    this.tmdbService.tmdbEpisodes.$.next({});
    this.listService.watchlist.$.next([]);
    this.listService.lists.$.next([]);
    this.listService.listItems.$.next({});
  }

  syncEmpty(): Observable<void>[] {
    return Object.entries(this.remoteSyncMap).map(([localStorageKey, syncValues]) => {
      const stored = this.localStorageService.getObject(localStorageKey);

      if (!stored) {
        return syncValues();
      }

      return of(undefined);
    });
  }

  syncShowsProgress(options?: SyncOptions): Observable<void> {
    let configChanged = false;

    return forkJoin([
      this.showService.getShowsWatched$().pipe(take(1)),
      this.episodeService.getEpisodes$().pipe(take(1)),
      this.configService.config.$.pipe(take(1)),
    ]).pipe(
      switchMap(([showsWatched, showsEpisodes, config]) => {
        const localLastActivity = this.localStorageService.getObject<LastActivity>(
          LocalStorage.LAST_ACTIVITY
        );
        const syncAll = !localLastActivity || options?.force;
        const showsProgress = this.showService.showsProgress.$.value;

        const observables = showsWatched.map((showWatched) => {
          const showId = showWatched.show.ids.trakt;

          if (syncAll || Object.keys(showsProgress).length === 0) {
            return this.showService.showsProgress.sync(showId, options);
          }

          const showProgress = showsProgress[showId];

          const isShowWatchedLater =
            showWatched.last_watched_at &&
            localLastActivity &&
            new Date(showWatched.last_watched_at) > new Date(localLastActivity.episodes.watched_at);

          const isProgressLater =
            showWatched.last_watched_at &&
            showProgress?.last_watched_at &&
            new Date(showProgress.last_watched_at) > new Date(showWatched.last_watched_at);

          if (showProgress?.next_episode) {
            const nextEpisodeSeasonNumber = showProgress.next_episode.season;
            const nextEpisodeEpisodeNumber = showProgress.next_episode.number;
            const episode =
              showsEpisodes[episodeId(showId, nextEpisodeSeasonNumber, nextEpisodeEpisodeNumber)];
            const currentDate = new Date();
            const oneWeekOld = subWeeks(currentDate, 1);
            const lastFetchedAt = config.lastFetchedAt.showProgress[showId];

            const isLastWeek = episode?.first_aired
              ? new Date(episode.first_aired) < currentDate &&
                new Date(episode.first_aired) > oneWeekOld
              : false;

            const isFetchedLastWeek = lastFetchedAt ? new Date(lastFetchedAt) > oneWeekOld : false;

            if (isLastWeek && !isFetchedLastWeek) {
              config.lastFetchedAt = {
                ...config.lastFetchedAt,
                showProgress: {
                  ...config.lastFetchedAt.showProgress,
                  [showId]: currentDate.toISOString(),
                },
              };
              configChanged = true;
              return this.showService.showsProgress.sync(showId, { ...options, force: true });
            }
          }

          if (!isShowWatchedLater && !isProgressLater) {
            return of(undefined);
          }

          return this.showService.showsProgress.sync(showId, options);
        });

        const showsProgressArray = Object.entries(showsProgress);
        if (showsWatched.length < showsProgressArray.length) {
          const showsWatchedIds = showsWatched.map((showWatched) => showWatched.show.ids.trakt);
          showsProgressArray.forEach((showProgressEntry) => {
            if (showsWatchedIds.includes(parseInt(showProgressEntry[0]))) return;

            observables.push(
              new Observable((subscriber) => {
                delete showsProgress[showProgressEntry[0]];
                if (options?.publishSingle) {
                  this.showService.showsProgress.$.next(this.showService.showsProgress.$.value);
                }
                subscriber.complete();
              })
            );
          });
        }

        return forkJoin(observables).pipe(defaultIfEmpty(null));
      }),
      map(() => undefined),
      take(1),
      finalize(() => {
        if (options && !options.publishSingle) {
          console.debug('publish showsProgress', this.showService.showsProgress.$.value);
          this.showService.showsProgress.$.next(this.showService.showsProgress.$.value);
        }
        if (configChanged) this.configService.config.sync({ force: true });
      })
    );
  }

  syncShowsTranslations(options?: SyncOptions): Observable<void> {
    const language = this.configService.config.$.value.language.substring(0, 2);
    return this.showService.getShows$().pipe(
      switchMap((shows) => {
        const observables: Observable<void>[] = [];

        if (language !== 'en') {
          observables.push(
            ...shows.map((show) => this.syncShowTranslation(show.ids.trakt, language, options))
          );
        }

        return forkJoin(observables).pipe(defaultIfEmpty(null));
      }),
      map(() => undefined),
      take(1),
      finalize(() => {
        if (options && !options.publishSingle) {
          console.debug(
            'publish showsTranslations',
            this.translationService.showsTranslations.$.value
          );
          this.translationService.showsTranslations.$.next(
            this.translationService.showsTranslations.$.value
          );
        }
      })
    );
  }

  syncShowTranslation(showId: number, language: string, options?: SyncOptions): Observable<void> {
    return language !== 'en'
      ? this.translationService.showsTranslations.sync(showId, language, options)
      : of(undefined);
  }

  syncTmdbShows(options?: SyncOptions): Observable<void> {
    return this.showService.getShows$().pipe(
      switchMap((shows) => {
        const observables: Observable<void>[] = [];

        observables.push(
          ...shows.map((show) => {
            return this.tmdbService.tmdbShows.sync(
              show.ids.tmdb,
              TmdbService.tmdbShowExtendedString,
              options
            );
          })
        );

        return forkJoin(observables).pipe(defaultIfEmpty(null));
      }),
      map(() => undefined),
      take(1),
      finalize(() => {
        if (options && !options.publishSingle) {
          console.debug('publish tmdbShows', this.tmdbService.tmdbShows.$.value);
          this.tmdbService.tmdbShows.$.next(this.tmdbService.tmdbShows.$.value);
        }
      })
    );
  }

  syncListItems(options?: SyncOptions): Observable<void> {
    return this.listService.lists.$.pipe(
      switchMap((lists) => {
        const observables =
          lists?.map((list) => this.listService.listItems.sync(list.ids.slug, options)) ?? [];

        return forkJoin(observables).pipe(defaultIfEmpty(null));
      }),
      map(() => undefined),
      take(1),
      finalize(() => {
        if (options && !options.publishSingle) {
          console.debug('publish listItems', this.listService.listItems.$.value);
          this.listService.listItems.$.next(this.listService.listItems.$.value);
        }
      })
    );
  }

  syncShowsNextEpisodes(options?: SyncOptions): Observable<void> {
    const language = this.configService.config.$.value.language.substring(0, 2);
    const episodes$ = forkJoin([
      this.showService.showsProgress.$.pipe(take(1)),
      this.showService.getShows$().pipe(take(1)),
    ]).pipe(
      switchMap(([showsProgress, shows]) => {
        const observables = Object.entries(showsProgress).map(([traktShowId, showProgress]) => {
          if (!showProgress?.next_episode) return of(undefined);

          const observables: Observable<void>[] = [
            this.syncEpisode(
              parseInt(traktShowId),
              showProgress?.next_episode.season,
              showProgress?.next_episode.number,
              language,
              { ...options, deleteOld: true }
            ),
          ];

          const show = shows.find((show) => show.ids.trakt === parseInt(traktShowId));
          if (show) {
            observables.push(
              this.tmdbService.tmdbSeasons.sync(show.ids.tmdb, showProgress?.next_episode.season, {
                ...options,
                deleteOld: true,
              })
            );
          }

          return forkJoin(observables).pipe(
            defaultIfEmpty(null),
            map(() => undefined)
          );
        });
        return forkJoin(observables).pipe(
          defaultIfEmpty(null),
          map(() => undefined)
        );
      }),
      take(1)
    );

    const watchlistEpisodes$ = this.listService.watchlist.$.pipe(
      switchMap((watchlistItems) => {
        const observables =
          watchlistItems?.map((watchlistItem) => {
            return this.syncEpisode(watchlistItem.show.ids.trakt, 1, 1, language, options);
          }) ?? [];
        return forkJoin(observables).pipe(defaultIfEmpty(null));
      }),
      take(1)
    );

    return forkJoin([episodes$, watchlistEpisodes$]).pipe(
      map(() => undefined),
      finalize(() => {
        if (options && !options.publishSingle) {
          console.debug(
            'publish showsNextEpisodes',
            this.episodeService.showsEpisodes.$.value,
            this.tmdbService.tmdbEpisodes.$.value,
            this.translationService.showsEpisodesTranslations.$.value
          );
          this.episodeService.showsEpisodes.$.next(this.episodeService.showsEpisodes.$.value);
          this.tmdbService.tmdbEpisodes.$.next(this.tmdbService.tmdbEpisodes.$.value);
          this.translationService.showsEpisodesTranslations.$.next(
            this.translationService.showsEpisodesTranslations.$.value
          );
        }
      })
    );
  }

  syncNewOnceAWeek(options?: SyncOptions): Observable<void> {
    let configChanged = false;
    return this.configService.config.$.pipe(
      switchMap((config) => {
        const lastFetchedAt = config.lastFetchedAt;
        const observables: Observable<void>[] = [];
        const currentDate = new Date();
        const oneWeekOld = subWeeks(currentDate, 1);
        const oldestDay = new Date(0);
        const progressFetchedAt = lastFetchedAt.progress
          ? new Date(lastFetchedAt.progress)
          : oldestDay;

        if (progressFetchedAt <= oneWeekOld) {
          observables.push(
            this.syncShowsProgress({ ...options, force: true, publishSingle: false })
          );
          config.lastFetchedAt = {
            ...config.lastFetchedAt,
            progress: currentDate.toISOString(),
          };
          configChanged = true;
        }

        const episodesFetchedAt = lastFetchedAt.episodes
          ? new Date(lastFetchedAt.episodes)
          : oldestDay;

        if (episodesFetchedAt <= oneWeekOld) {
          observables.push(
            this.syncShowsEpisodes({ ...options, force: true, publishSingle: false })
          );
          config.lastFetchedAt = {
            ...config.lastFetchedAt,
            episodes: currentDate.toISOString(),
          };
          configChanged = true;
        }

        const tmdbShowsFetchedAt = lastFetchedAt.tmdbShows
          ? new Date(lastFetchedAt.tmdbShows)
          : oldestDay;

        if (tmdbShowsFetchedAt <= oneWeekOld) {
          observables.push(this.syncTmdbShows({ ...options, force: true, publishSingle: false }));
          config.lastFetchedAt = {
            ...config.lastFetchedAt,
            tmdbShows: currentDate.toISOString(),
          };
          configChanged = true;
        }

        return forkJoin(observables).pipe(
          defaultIfEmpty(null),
          map(() => undefined)
        );
      }),
      take(1),
      finalize(() => {
        if (configChanged) this.configService.config.sync({ force: true });
      })
    );
  }

  private syncShowsEpisodes(options?: SyncOptions): Observable<void> {
    return this.showService.showsWatched.$.pipe(
      switchMap((showsWatched) => {
        const observables: Observable<void>[] =
          showsWatched?.map((showsWatched) => {
            return this.syncShowEpisodes(showsWatched.show.ids.trakt, options);
          }) ?? [];

        return forkJoin(observables).pipe(defaultIfEmpty(null));
      }),
      map(() => undefined),
      take(1),
      finalize(() => {
        if (options && !options.publishSingle) {
          this.episodeService.showsEpisodes.$.next(this.episodeService.showsEpisodes.$.value);
          this.tmdbService.tmdbEpisodes.$.next(this.tmdbService.tmdbEpisodes.$.value);
          this.translationService.showsEpisodesTranslations.$.next(
            this.translationService.showsEpisodesTranslations.$.value
          );
        }
      })
    );
  }

  private syncShowEpisodes(showId: number, options?: SyncOptions): Observable<void> {
    const observables: Observable<void>[] = [];

    const language = this.configService.config.$.value.language.substring(0, 2);

    const episodes = Object.entries(this.episodeService.showsEpisodes.$.value)
      .filter(([episodeId]) => episodeId.startsWith(`${showId}-`))
      .map((entry) => entry[1]);

    observables.push(
      ...episodes.map((episode) => {
        return this.syncEpisode(showId, episode?.season, episode?.number, language, {
          force: true,
          ...options,
        });
      })
    );

    return forkJoin(observables).pipe(
      defaultIfEmpty(null),
      map(() => undefined)
    );
  }

  syncEpisode(
    showIdTrakt: number,
    seasonNumber: number | undefined,
    episodeNumber: number | undefined,
    language: string,
    options?: SyncOptions
  ): Observable<void> {
    return this.showService.getShows$().pipe(
      switchMap((shows) => {
        const observables: Observable<void>[] = [];
        const show = shows.find((show) => show.ids.trakt === showIdTrakt);

        observables.push(
          this.episodeService.showsEpisodes.sync(showIdTrakt, seasonNumber, episodeNumber, options)
        );

        const tmdbId = show?.ids.tmdb;
        if (tmdbId) {
          observables.push(
            this.tmdbService.tmdbEpisodes.sync(tmdbId, seasonNumber, episodeNumber, options)
          );
        }

        if (language !== 'en') {
          observables.push(
            this.translationService.showsEpisodesTranslations.sync(
              showIdTrakt,
              seasonNumber,
              episodeNumber,
              language,
              options
            )
          );
        }

        return forkJoin(observables).pipe(
          defaultIfEmpty(null),
          map(() => undefined)
        );
      }),
      take(1)
    );
  }
}
