import { inject, Injectable, Injector, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { MatSnackBar } from '@angular/material/snack-bar';
import {
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
import { TmdbService } from '../../pages/shows/data/tmdb.service';
import { ConfigService } from './config.service';
import { ShowService } from '../../pages/shows/data/show.service';
import { AuthService } from './auth.service';
import { ListService } from '../../pages/lists/data/list.service';
import { EpisodeService } from '../../pages/shows/data/episode.service';
import { TranslationService } from '../../pages/shows/data/translation.service';
import { onError } from '@helper/error';
import { LocalStorage } from '@type/Enum';
import type { LastActivity } from '@type/Trakt';
import { lastActivitySchema } from '@type/Trakt';
import type { SyncOptions } from '@type/Sync';
import { isSyncStale } from '@helper/sync';
import { getQueryParameter } from '@helper/getQueryParameter';
import { parseResponse } from '@operator/parseResponse';
import { API } from '../api';
import { LocalStorageService } from '@services/local-storage.service';
import { toObservable } from '@angular/core/rxjs-interop';

/** localStorage key holding the version of the cached sync stores. */
export const SYNC_STORE_KEY = 'syncStoreVersion';
/** Bump when the persisted sync data format changes to trigger a one-time full re-sync. */
export const SYNC_STORE_VERSION = 1;

@Injectable({
  providedIn: 'root',
})
export class SyncService {
  http = inject(HttpClient);
  tmdbService = inject(TmdbService);
  showService = inject(ShowService);
  configService = inject(ConfigService);
  authService = inject(AuthService);
  snackBar = inject(MatSnackBar);
  listService = inject(ListService);
  episodeService = inject(EpisodeService);
  translationService = inject(TranslationService);
  localStorageService = inject(LocalStorageService);
  injector = inject(Injector);

  isSyncing = signal(false);

  private upgradePending = false;

  remoteSyncMap: Record<string, (options?: SyncOptions) => Observable<void>> = {
    [LocalStorage.SHOWS_WATCHED]: this.showService.showsWatched.sync,
    [LocalStorage.SHOWS_HIDDEN]: this.showService.showsHidden.sync,
    [LocalStorage.WATCHLIST]: this.listService.watchlist.sync,
    [LocalStorage.LISTS]: this.listService.lists.sync,
  };

  constructor() {
    this.upgradePending = this.discardOutdatedStores();

    toObservable(this.authService.isLoggedIn, { injector: this.injector })
      .pipe(
        delay(100),
        switchMap(
          (isLoggedIn): Observable<{ lastActivity: LastActivity; force: boolean } | undefined> => {
            if (!isLoggedIn) {
              this.resetSubjects();
              return of(undefined);
            }

            const withoutSync = getQueryParameter('sync') === '0';
            if (withoutSync) return of(undefined);

            const forceUpgrade = this.upgradePending;
            this.upgradePending = false;

            const lastSyncedAt = this.configService.config.s().lastFetchedAt.sync;
            if (!forceUpgrade && !isSyncStale(lastSyncedAt)) return of(undefined);

            return this.fetchLastActivity().pipe(
              map((lastActivity) => ({ lastActivity, force: forceUpgrade })),
            );
          },
        ),
      )
      .subscribe({
        next: (result: { lastActivity: LastActivity; force: boolean } | undefined) => {
          if (!result) return;
          if (result.force) {
            void this.sync(result.lastActivity, { force: true, showSyncingSnackbar: true }).then(
              () => this.localStorageService.setObject(SYNC_STORE_KEY, SYNC_STORE_VERSION),
            );
          } else {
            void this.sync(result.lastActivity);
          }
        },
        error: (error) =>
          onError(error, this.snackBar, undefined, 'An error occurred while fetching trakt'),
      });

    toObservable(this.configService.config.s, { injector: this.injector }).subscribe((config) => {
      if (
        (config.language === 'en-US' &&
          this.translationService.showsTranslations.s() &&
          Object.keys(this.translationService.showsTranslations.s()).length > 0) ||
        !this.authService.isLoggedIn()
      ) {
        localStorage.removeItem(LocalStorage.SHOWS_TRANSLATIONS);
        this.translationService.showsTranslations.s.set({});
      }

      if (
        (config.language === 'en-US' &&
          this.translationService.showsEpisodesTranslations.s() &&
          Object.keys(this.translationService.showsEpisodesTranslations.s()).length > 0) ||
        !this.authService.isLoggedIn()
      ) {
        localStorage.removeItem(LocalStorage.SHOWS_EPISODES_TRANSLATIONS);
        this.translationService.showsEpisodesTranslations.s.set({});
      }
    });
  }

  fetchLastActivity(): Observable<LastActivity> {
    return this.http
      .get<LastActivity>(API.syncLastActivities)
      .pipe(parseResponse(lastActivitySchema));
  }

  async sync(lastActivity?: LastActivity, options?: SyncOptions): Promise<void> {
    try {
      if (!this.authService.isLoggedIn()) return;

      this.isSyncing.set(true);
      if (options?.showSyncingSnackbar) {
        this.snackBar.open('Sync 0/4', undefined, { duration: 2000 });
      }
      console.debug('Sync 0/4');

      let observables: Observable<void>[] = [];
      let failedSyncCount = 0;

      const localLastActivity = this.localStorageService.getObject<LastActivity>(
        LocalStorage.LAST_ACTIVITY,
      );
      const forceSync = options?.force;
      const syncAll = !localLastActivity || forceSync;
      const optionsInternal: SyncOptions = { publishSingle: !syncAll, ...options };

      let isListLater = syncAll;

      if (syncAll) {
        observables.push(
          ...Object.values(this.remoteSyncMap).map((syncValues) =>
            syncValues({ ...optionsInternal, publishSingle: true }),
          ),
        );
        observables.push(
          this.configService.config.sync({ ...optionsInternal, publishSingle: true }),
        );
        observables.push(
          this.showService.favorites.sync({ ...optionsInternal, publishSingle: true }),
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

      failedSyncCount += await this.runSyncBatch(observables);
      if (options?.showSyncingSnackbar) {
        this.snackBar.open('Sync 1/5', undefined, { duration: 2000 });
      }
      console.debug('Sync 1/5');

      // todo enable again
      // if (!syncAll) {
      //   observables = [this.syncNewOnceAWeek(optionsInternal)];
      //   failedSyncCount += await this.runSyncBatch(observables);
      // }

      if (options?.showSyncingSnackbar) {
        this.snackBar.open('Sync 2/5', undefined, { duration: 2000 });
      }
      console.debug('Sync 2/5');

      observables = [
        this.syncShowsProgress(),
        this.syncShowsTranslations(optionsInternal),
        this.syncListItems({ ...optionsInternal, force: isListLater }),
      ];
      failedSyncCount += await this.runSyncBatch(observables);
      if (options?.showSyncingSnackbar) {
        this.snackBar.open('Sync 3/5', undefined, { duration: 2000 });
      }
      console.debug('Sync 3/5');

      observables = [this.syncShowsNextEpisodes(optionsInternal)];
      failedSyncCount += await this.runSyncBatch(observables);
      if (options?.showSyncingSnackbar) {
        this.snackBar.open('Sync 4/5', undefined, { duration: 2000 });
      }
      console.debug('Sync 4/5');

      this.episodeService.addMissingShowProgress();

      observables = [this.removeUnused()];
      failedSyncCount += await this.runSyncBatch(observables);
      if (options?.showSyncingSnackbar) {
        this.snackBar.open(
          failedSyncCount > 0
            ? `Synced, ${failedSyncCount} failed - will retry next sync`
            : 'Sync complete',
          undefined,
          { duration: 2000 },
        );
      }
      console.debug(failedSyncCount > 0 ? `Synced, ${failedSyncCount} failed` : 'Sync complete');

      if (lastActivity && failedSyncCount === 0)
        this.localStorageService.setObject(LocalStorage.LAST_ACTIVITY, lastActivity);

      if (failedSyncCount === 0) {
        const lastFetchedAt = this.configService.config.s().lastFetchedAt;
        const currentDateString = new Date().toISOString();
        lastFetchedAt.sync = currentDateString;

        if (syncAll) {
          lastFetchedAt.progress = currentDateString;
          lastFetchedAt.episodes = currentDateString;
        }

        this.configService.config.sync({ force: true });
      }

      this.isSyncing.set(false);
    } catch (error) {
      onError(error, this.snackBar);
      this.isSyncing.set(false);
    }
  }

  private async runSyncBatch(observables: Observable<void>[]): Promise<number> {
    if (observables.length === 0) return 0;

    const results = await Promise.allSettled(
      observables.map((observable) => lastValueFrom(observable)),
    );

    return results.filter((result) => result.status === 'rejected').length;
  }

  removeUnused(): Observable<void> {
    const shows = this.showService.getShows();

    const removeUnusedShowTranslations = toObservable(this.translationService.showsTranslations.s, {
      injector: this.injector,
    }).pipe(
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
      take(1),
    );

    const removeUnusedShowProgress = toObservable(this.showService.showsProgress.s, {
      injector: this.injector,
    }).pipe(
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
      take(1),
    );

    return forkJoin([removeUnusedShowTranslations, removeUnusedShowProgress]).pipe(
      map(() => undefined),
    );
  }

  syncNew(options?: SyncOptions): Promise<void> {
    return new Promise((resolve) => {
      this.fetchLastActivity().subscribe((lastActivity) => {
        void this.sync(lastActivity, options);
        resolve();
      });
    });
  }

  private clearCacheKeys(): void {
    for (const key of Object.values(LocalStorage)) {
      if ([LocalStorage.CONFIG, LocalStorage.FAVORITES].includes(key)) continue;
      localStorage.removeItem(key);
    }
  }

  discardOutdatedStores(): boolean {
    if (this.localStorageService.getObject<number>(SYNC_STORE_KEY) === SYNC_STORE_VERSION) {
      return false;
    }

    this.clearCacheKeys();
    this.resetSubjects();
    return true;
  }

  syncAll(options?: SyncOptions): Promise<void> {
    this.clearCacheKeys();

    this.resetSubjects();

    return new Promise((resolve) => {
      this.fetchLastActivity().subscribe((lastActivity) => {
        void this.sync(lastActivity, { ...options, force: true });
        resolve();
      });
    });
  }

  resetSubjects(): void {
    this.showService.showsWatched.s.set([]);
    this.translationService.showsTranslations.s.set({});
    this.showService.showsProgress.s.set({});
    this.showService.showsProgressOverview.s.set({});
    this.showService.showsHidden.s.set([]);
    this.episodeService.showsEpisodes.s.set({});
    this.translationService.showsEpisodesTranslations.s.set({});
    this.tmdbService.tmdbSeasons.s.set({});
    this.tmdbService.tmdbEpisodes.s.set({});
    this.listService.watchlist.s.set([]);
    this.listService.lists.s.set([]);
    this.listService.listItems.s.set({});
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

  syncShowsProgress(): Observable<void> {
    return this.showService.showsProgressOverview.sync();
  }

  syncShowsTranslations(options?: SyncOptions): Observable<void> {
    const language = this.configService.config.s().language.substring(0, 2);
    return this.showService.getShows$().pipe(
      switchMap((shows) => {
        const observables: Observable<void>[] = [];

        if (language !== 'en') {
          observables.push(
            ...shows.map((show) => this.syncShowTranslation(show.ids.trakt, language, options)),
          );
        }

        return forkJoin(observables).pipe(defaultIfEmpty(null));
      }),
      map(() => undefined),
      take(1),
      finalize(() => {
        if (options && !options.publishSingle) {
          console.debug('publish showsTranslations', this.translationService.showsTranslations.s());
          this.translationService.showsTranslations.s.set({
            ...this.translationService.showsTranslations.s(),
          });
        }
      }),
    );
  }

  syncShowTranslation(showId: number, language: string, options?: SyncOptions): Observable<void> {
    return language !== 'en'
      ? this.translationService.showsTranslations.sync(showId, language, options)
      : of(undefined);
  }

  syncListItems(options?: SyncOptions): Observable<void> {
    return toObservable(this.listService.lists.s, { injector: this.injector }).pipe(
      switchMap((lists) => {
        const observables =
          lists?.map((list) => this.listService.listItems.sync(list.ids.slug, options)) ?? [];

        return forkJoin(observables).pipe(defaultIfEmpty(null));
      }),
      map(() => undefined),
      take(1),
      finalize(() => {
        if (options && !options.publishSingle) {
          console.debug('publish listItems', this.listService.listItems.s());
          this.listService.listItems.s.set({ ...this.listService.listItems.s() });
        }
      }),
    );
  }

  syncShowsNextEpisodes(options?: SyncOptions): Observable<void> {
    const language = this.configService.config.s().language.substring(0, 2);
    const episodes$ = forkJoin([
      toObservable(this.showService.showsProgressOverview.s, { injector: this.injector }).pipe(
        take(1),
      ),
      this.showService.getShows$().pipe(take(1)),
    ]).pipe(
      switchMap(([showsProgressOverview, shows]) => {
        const observables = Object.entries(showsProgressOverview).map(
          ([traktShowId, showProgress]) => {
            if (!showProgress?.next_episode) return of(undefined);

            const observables: Observable<void>[] = [
              this.syncEpisode(
                parseInt(traktShowId),
                showProgress?.next_episode.season,
                showProgress?.next_episode.number,
                language,
                { ...options, deleteOld: true },
              ),
            ];

            const show = shows.find((show) => show.ids.trakt === parseInt(traktShowId));
            if (show) {
              observables.push(
                this.tmdbService.tmdbSeasons.sync(
                  show.ids.tmdb,
                  showProgress?.next_episode.season,
                  {
                    ...options,
                    deleteOld: true,
                  },
                ),
              );
            }

            return forkJoin(observables).pipe(
              defaultIfEmpty(null),
              map(() => undefined),
            );
          },
        );
        return forkJoin(observables).pipe(
          defaultIfEmpty(null),
          map(() => undefined),
        );
      }),
      take(1),
    );

    const watchlistEpisodes$ = toObservable(this.listService.watchlist.s, {
      injector: this.injector,
    }).pipe(
      switchMap((watchlistItems) => {
        const observables =
          watchlistItems?.map((watchlistItem) => {
            return this.syncEpisode(watchlistItem.show.ids.trakt, 1, 1, language, options);
          }) ?? [];
        return forkJoin(observables).pipe(defaultIfEmpty(null));
      }),
      take(1),
    );

    return forkJoin([episodes$, watchlistEpisodes$]).pipe(
      map(() => undefined),
      finalize(() => {
        if (options && !options.publishSingle) {
          console.debug(
            'publish showsNextEpisodes',
            this.episodeService.showsEpisodes.s(),
            this.tmdbService.tmdbEpisodes.s(),
            this.translationService.showsEpisodesTranslations.s(),
          );
          this.episodeService.showsEpisodes.s.set({ ...this.episodeService.showsEpisodes.s() });
          this.tmdbService.tmdbEpisodes.s.set({ ...this.tmdbService.tmdbEpisodes.s() });
          this.translationService.showsEpisodesTranslations.s.set({
            ...this.translationService.showsEpisodesTranslations.s(),
          });
        }
      }),
    );
  }

  // todo enable again
  // syncNewOnceAWeek(options?: SyncOptions): Observable<void> {
  //   let configChanged = false;
  //   return this.configService.config.s.pipe(
  //     switchMap((config) => {
  //       const lastFetchedAt = config.lastFetchedAt;
  //       const observables: Observable<void>[] = [];
  //       const currentDate = new Date();
  //       const oneWeekOld = subWeeks(currentDate, 1);
  //       const oldestDay = new Date(0);
  //       const progressFetchedAt = lastFetchedAt.progress
  //         ? new Date(lastFetchedAt.progress)
  //         : oldestDay;
  //
  //       if (progressFetchedAt <= oneWeekOld) {
  //         observables.push(
  //           this.syncShowsProgress({ ...options, force: true, publishSingle: false }),
  //         );
  //         config.lastFetchedAt = {
  //           ...config.lastFetchedAt,
  //           progress: currentDate.toISOString(),
  //         };
  //         configChanged = true;
  //       }
  //
  //       const episodesFetchedAt = lastFetchedAt.episodes
  //         ? new Date(lastFetchedAt.episodes)
  //         : oldestDay;
  //
  //       if (episodesFetchedAt <= oneWeekOld) {
  //         observables.push(
  //           this.syncShowsEpisodes({ ...options, force: true, publishSingle: false }),
  //         );
  //         config.lastFetchedAt = {
  //           ...config.lastFetchedAt,
  //           episodes: currentDate.toISOString(),
  //         };
  //         configChanged = true;
  //       }
  //
  //       const tmdbShowsFetchedAt = lastFetchedAt.tmdbShows
  //         ? new Date(lastFetchedAt.tmdbShows)
  //         : oldestDay;
  //
  //       if (tmdbShowsFetchedAt <= oneWeekOld) {
  //         observables.push(this.syncTmdbShows({ ...options, force: true, publishSingle: false }));
  //         config.lastFetchedAt = {
  //           ...config.lastFetchedAt,
  //           tmdbShows: currentDate.toISOString(),
  //         };
  //         configChanged = true;
  //       }
  //
  //       return forkJoin(observables).pipe(
  //         defaultIfEmpty(null),
  //         map(() => undefined),
  //       );
  //     }),
  //     take(1),
  //     finalize(() => {
  //       if (configChanged) this.configService.config.sync({ force: true });
  //     }),
  //   );
  // }
  //
  // private syncShowsEpisodes(options?: SyncOptions): Observable<void> {
  //   return this.showService.showsWatched.s.pipe(
  //     switchMap((showsWatched) => {
  //       const observables: Observable<void>[] =
  //         showsWatched?.map((showsWatched) => {
  //           return this.syncShowEpisodes(showsWatched.show.ids.trakt, options);
  //         }) ?? [];
  //
  //       return forkJoin(observables).pipe(defaultIfEmpty(null));
  //     }),
  //     map(() => undefined),
  //     take(1),
  //     finalize(() => {
  //       if (options && !options.publishSingle) {
  //         this.episodeService.showsEpisodes.s.set(this.episodeService.showsEpisodes.s());
  //         this.tmdbService.tmdbEpisodes.s.set(this.tmdbService.tmdbEpisodes.s());
  //         this.translationService.showsEpisodesTranslations.s.set(
  //           this.translationService.showsEpisodesTranslations.s(),
  //         );
  //       }
  //     }),
  //   );
  // }
  //
  // private syncShowEpisodes(showId: number, options?: SyncOptions): Observable<void> {
  //   const observables: Observable<void>[] = [];
  //
  //   const language = this.configService.config.s().language.substring(0, 2);
  //
  //   const episodes = Object.entries(this.episodeService.showsEpisodes.s())
  //     .filter(([episodeId]) => episodeId.startsWith(`${showId}-`))
  //     .map((entry) => entry[1]);
  //
  //   observables.push(
  //     ...episodes.map((episode) => {
  //       return this.syncEpisode(showId, episode?.season, episode?.number, language, {
  //         force: true,
  //         ...options,
  //       });
  //     }),
  //   );
  //
  //   return forkJoin(observables).pipe(
  //     defaultIfEmpty(null),
  //     map(() => undefined),
  //   );
  // }

  syncEpisode(
    showIdTrakt: number,
    seasonNumber: number | undefined,
    episodeNumber: number | undefined,
    language: string,
    options?: SyncOptions,
  ): Observable<void> {
    return this.showService.getShows$().pipe(
      take(1),
      switchMap((shows) => {
        const observables: Observable<void>[] = [];
        const show = shows.find((show) => show.ids.trakt === showIdTrakt);

        observables.push(
          this.episodeService.showsEpisodes.sync(showIdTrakt, seasonNumber, episodeNumber, options),
        );

        const tmdbId = show?.ids.tmdb;
        if (tmdbId) {
          observables.push(
            this.tmdbService.tmdbEpisodes.sync(tmdbId, seasonNumber, episodeNumber, options),
          );
        }

        if (language !== 'en') {
          observables.push(
            this.translationService.showsEpisodesTranslations.sync(
              showIdTrakt,
              seasonNumber,
              episodeNumber,
              language,
              options,
            ),
          );
        }

        return forkJoin(observables).pipe(
          defaultIfEmpty(null),
          map(() => undefined),
        );
      }),
      take(1),
    );
  }
}
