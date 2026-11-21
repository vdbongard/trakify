import { inject, Injectable, Injector, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { MatSnackBar } from '@angular/material/snack-bar';
import { delay, from, map, Observable, of, switchMap } from 'rxjs';
import { fetchParsed } from '@helper/fetchParsed';
import { sum } from '@helper/sum';
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
import type { WatchlistItem } from '@type/TraktList';
import type { SyncOptions } from '@type/Sync';
import { shouldSyncOnLogin } from '@helper/sync';
import { getQueryParameter } from '@helper/getQueryParameter';
import { API } from '../api';
import { LocalStorageService } from '@services/local-storage.service';
import { SyncDataService } from '@services/sync-data.service';
import { toObservable } from '@angular/core/rxjs-interop';

export const SYNC_STORE_KEY = 'syncStoreVersion';
export const SYNC_STORE_VERSION = 2;

interface SyncFailures {
  blocking: number;
  items: number;
}

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
  syncDataService = inject(SyncDataService);

  isSyncing = signal(false);

  private previousLoggedIn: boolean | undefined;

  private upgradePending = false;

  private recordStoreVersionOnSuccess = false;

  remoteSyncMap: Record<string, (options?: SyncOptions) => Promise<void>> = {
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
            const wasLoggedIn = this.previousLoggedIn ?? isLoggedIn;
            this.previousLoggedIn = isLoggedIn;

            if (!isLoggedIn) {
              if (wasLoggedIn) this.resetSubjects();
              return of(undefined);
            }

            const withoutSync = getQueryParameter('sync') === '0';
            if (withoutSync) return of(undefined);

            const forceUpgrade = this.upgradePending;
            this.upgradePending = false;

            const lastSyncedAt = this.configService.config.s().lastFetchedAt.sync;
            const hasCachedData = localStorage.getItem(LocalStorage.SHOWS_WATCHED) !== null;
            if (!forceUpgrade && !shouldSyncOnLogin(lastSyncedAt, hasCachedData)) {
              return of(undefined);
            }

            return from(this.fetchLastActivity()).pipe(
              map((lastActivity) => ({ lastActivity, force: forceUpgrade })),
            );
          },
        ),
      )
      .subscribe({
        next: (result: { lastActivity: LastActivity; force: boolean } | undefined) => {
          if (!result) return;
          if (result.force) {
            this.recordStoreVersionOnSuccess = true;
            void this.sync(result.lastActivity, { force: true, showSyncingSnackbar: true });
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

  fetchLastActivity(): Promise<LastActivity> {
    return fetchParsed(this.http.get<LastActivity>(API.syncLastActivities), lastActivitySchema);
  }

  async sync(lastActivity?: LastActivity, options?: SyncOptions): Promise<void> {
    try {
      if (!this.authService.isLoggedIn()) return;

      this.isSyncing.set(true);
      if (options?.showSyncingSnackbar) {
        this.snackBar.open('Sync started', undefined, { duration: 2000 });
      }
      console.debug('Sync started');
      this.syncDataService.beginBatch();

      const tasks: Promise<void | number>[] = [];
      const failures: SyncFailures = { blocking: 0, items: 0 };

      const localLastActivity = this.localStorageService.getObject<LastActivity>(
        LocalStorage.LAST_ACTIVITY,
      );
      const forceSync = options?.force;
      const syncAll = !localLastActivity || forceSync;
      const optionsInternal: SyncOptions = { deferPublish: syncAll, ...options };

      let isListLater = syncAll;

      if (syncAll) {
        tasks.push(
          ...Object.values(this.remoteSyncMap).map((syncValues) => syncValues(optionsInternal)),
        );
        tasks.push(this.configService.config.sync(optionsInternal));
        tasks.push(this.showService.favorites.sync(optionsInternal));
      } else if (lastActivity) {
        const isShowWatchedLater =
          new Date(lastActivity.episodes.watched_at) >
          new Date(localLastActivity.episodes.watched_at);

        if (isShowWatchedLater) {
          tasks.push(this.showService.showsWatched.sync());
        }

        const isShowHiddenLater =
          new Date(lastActivity.shows.hidden_at) > new Date(localLastActivity.shows.hidden_at);

        if (isShowHiddenLater) {
          tasks.push(this.showService.showsHidden.sync());
        }

        const isWatchlistLater =
          new Date(lastActivity.watchlist.updated_at) >
          new Date(localLastActivity.watchlist.updated_at);

        if (isWatchlistLater) {
          tasks.push(this.listService.watchlist.sync());
        }

        isListLater =
          new Date(lastActivity.lists.updated_at) > new Date(localLastActivity.lists.updated_at);

        if (isListLater) {
          tasks.push(this.listService.lists.sync());
        }

        tasks.push(...this.syncEmpty());
      }

      this.collectFailures(failures, await this.runSyncStep(tasks, '1/5'));

      this.flushSyncedStores();
      this.syncDataService.endBatch();

      this.syncDataService.beginBatch();

      this.collectFailures(
        failures,
        await this.runSyncStep(
          [
            this.syncShowsProgress(optionsInternal),
            this.syncShowsTranslations(optionsInternal),
            this.syncListItems({ ...optionsInternal, force: isListLater }),
          ],
          '2/5',
        ),
      );

      this.collectFailures(
        failures,
        await this.runSyncStep([this.syncShowsNextEpisodes(optionsInternal)], '3/5'),
      );

      this.episodeService.addMissingShowProgress();

      this.collectFailures(failures, await this.runSyncStep([this.removeUnused()], '4/5'));

      this.completeSync(lastActivity, syncAll === true, failures);

      this.flushSyncedStores();
      this.syncDataService.endBatch();

      const failedSyncCount = failures.blocking + failures.items;
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

      this.isSyncing.set(false);
    } catch (error) {
      this.syncDataService.endBatch();
      onError(error, this.snackBar);
      this.isSyncing.set(false);
    }
  }

  private flushSyncedStores(): void {
    this.showService.showsWatched.flush();
    this.showService.showsHidden.flush();
    this.listService.watchlist.flush();
    this.listService.lists.flush();
    this.showService.favorites.flush();
    this.configService.config.flush();
    this.showService.showsProgress.flush();
  }

  private collectFailures(total: SyncFailures, stepFailures: SyncFailures): void {
    total.blocking += stepFailures.blocking;
    total.items += stepFailures.items;
  }

  private async runSyncBatch(promises: Promise<void | number>[]): Promise<SyncFailures> {
    if (promises.length === 0) return { blocking: 0, items: 0 };

    const results = await Promise.allSettled(promises);

    const failures: SyncFailures = { blocking: 0, items: 0 };
    for (const result of results) {
      if (result.status === 'rejected') {
        failures.blocking += 1;
      } else if (typeof result.value === 'number') {
        failures.items += result.value;
      }
    }
    return failures;
  }

  private async runSyncStep(
    promises: Promise<void | number>[],
    stepLabel: string,
  ): Promise<SyncFailures> {
    const failures = await this.runSyncBatch(promises);
    console.debug(`Sync ${stepLabel}`);
    return failures;
  }

  private completeSync(
    lastActivity: LastActivity | undefined,
    syncAll: boolean,
    failures: SyncFailures,
  ): void {
    if (failures.blocking > 0) return;

    if (lastActivity && failures.items === 0) {
      this.localStorageService.setObject(LocalStorage.LAST_ACTIVITY, lastActivity);
    }

    const lastFetchedAt = this.configService.config.s().lastFetchedAt;
    const currentDateString = new Date().toISOString();
    lastFetchedAt.sync = currentDateString;

    if (syncAll) {
      lastFetchedAt.progress = currentDateString;
      lastFetchedAt.episodes = currentDateString;
    }

    this.configService.config.sync({ force: true });

    if (this.recordStoreVersionOnSuccess) {
      this.localStorageService.setObject(SYNC_STORE_KEY, SYNC_STORE_VERSION);
      this.recordStoreVersionOnSuccess = false;
    }
  }

  private isolateFailures(syncable: Promise<unknown>): Promise<number> {
    return syncable.then(
      () => 0,
      () => 1,
    );
  }

  private runIsolated(promises: Promise<unknown>[]): Promise<number> {
    return Promise.all(promises.map((promise) => this.isolateFailures(promise))).then((counts) =>
      sum(counts),
    );
  }

  removeUnused(): Promise<void> {
    const shows = this.showService.shows();
    const showsTraktIds = shows.map((show) => show.ids.trakt);

    this.removeOrphaned(
      this.translationService.showsTranslations.s(),
      showsTraktIds,
      (showIdTrakt) => this.translationService.removeShowTranslation(showIdTrakt),
    );
    this.removeOrphaned(this.showService.showsProgress.s(), showsTraktIds, (showIdTrakt) =>
      this.showService.removeShowProgress(showIdTrakt),
    );
    return Promise.resolve();
  }

  private removeOrphaned(
    record: Record<string, unknown>,
    showsTraktIds: number[],
    remove: (showIdTrakt: number) => void,
  ): void {
    Object.entries(record).forEach(([showIdString, value]) => {
      if (!value) return;
      const showIdTrakt = parseInt(showIdString);
      if (!showsTraktIds.includes(showIdTrakt)) remove(showIdTrakt);
    });
  }

  syncNew(options?: SyncOptions): Promise<void> {
    return this.fetchLastActivity().then((lastActivity) => {
      void this.sync(lastActivity, options);
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

    return this.fetchLastActivity().then((lastActivity) => {
      void this.sync(lastActivity, { ...options, force: true });
    });
  }

  resetSubjects(): void {
    this.showService.showsWatched.s.set([]);
    this.translationService.showsTranslations.s.set({});
    this.showService.showsProgress.s.set({});
    this.showService.showsHidden.s.set([]);
    this.episodeService.showsEpisodes.s.set({});
    this.translationService.showsEpisodesTranslations.s.set({});
    this.tmdbService.tmdbSeasons.s.set({});
    this.tmdbService.tmdbEpisodes.s.set({});
    this.listService.watchlist.s.set([]);
    this.listService.lists.s.set([]);
    this.listService.listItems.s.set({});
  }

  syncEmpty(): Promise<void>[] {
    return Object.entries(this.remoteSyncMap).map(([localStorageKey, syncValues]) => {
      const stored = this.localStorageService.getObject(localStorageKey);

      if (!stored) {
        return syncValues();
      }

      return Promise.resolve();
    });
  }

  async syncShowsProgress(options?: SyncOptions): Promise<void> {
    await this.showService.syncShowsProgress(options);
  }

  private shouldFlush(options?: SyncOptions): boolean {
    return this.syncDataService.shouldDefer(options);
  }

  async syncShowsTranslations(options?: SyncOptions): Promise<number> {
    const language = this.configService.config.s().language.substring(0, 2);
    try {
      if (language === 'en') return 0;
      const shows = this.showService.shows();
      return await this.runIsolated(
        shows.map((show) => this.syncShowTranslation(show.ids.trakt, language, options)),
      );
    } finally {
      if (this.shouldFlush(options)) {
        console.debug('publish showsTranslations', this.translationService.showsTranslations.s());
        this.translationService.showsTranslations.flush();
      }
    }
  }

  syncShowTranslation(showId: number, language: string, options?: SyncOptions): Promise<void> {
    return language !== 'en'
      ? this.translationService.showsTranslations.syncIds([showId, language], options)
      : Promise.resolve();
  }

  async syncListItems(options?: SyncOptions): Promise<number> {
    try {
      const lists = this.listService.lists.s();
      return await this.runIsolated(
        lists?.map((list) => this.listService.listItems.syncIds([list.ids.trakt], options)) ?? [],
      );
    } finally {
      if (this.shouldFlush(options)) {
        console.debug('publish listItems', this.listService.listItems.s());
        this.listService.listItems.flush();
      }
    }
  }

  async syncShowsNextEpisodes(options?: SyncOptions): Promise<number> {
    const language = this.configService.config.s().language.substring(0, 2);

    try {
      const showsProgress = this.showService.showsProgress.s();
      const nextEpisodes =
        language === 'en'
          ? []
          : Object.entries(showsProgress).flatMap(([traktShowId, showProgress]) => {
              const nextEpisode = showProgress?.next_episode;
              if (!nextEpisode) return [];
              const showId = parseInt(traktShowId);
              const currentId = `${showId}-${nextEpisode.season}-${nextEpisode.number}`;
              this.translationService.showsEpisodesTranslations.evictWhere(
                (key) => key.startsWith(`${showId}-`) && key !== currentId,
              );
              return [
                this.translationService.showsEpisodesTranslations.syncIds(
                  [showId, nextEpisode.season, nextEpisode.number, language],
                  options,
                ),
              ];
            });

      const watchlistItems = this.listService.watchlist.s();
      const watchlistEpisodes =
        watchlistItems?.map((watchlistItem) =>
          this.syncWatchlistEpisode(watchlistItem.show, language, options),
        ) ?? [];

      const [nextEpisodesFailed, watchlistEpisodesFailed] = await Promise.all([
        this.runIsolated(nextEpisodes),
        this.runIsolated(watchlistEpisodes),
      ]);
      return nextEpisodesFailed + watchlistEpisodesFailed;
    } finally {
      if (this.shouldFlush(options)) {
        console.debug(
          'publish showsNextEpisodes',
          this.episodeService.showsEpisodes.s(),
          this.tmdbService.tmdbEpisodes.s(),
          this.translationService.showsEpisodesTranslations.s(),
        );
        this.episodeService.showsEpisodes.flush();
        this.tmdbService.tmdbEpisodes.flush();
        this.translationService.showsEpisodesTranslations.flush();
      }
    }
  }

  syncWatchlistEpisode(
    show: WatchlistItem['show'],
    language: string,
    options?: SyncOptions,
  ): Promise<void> {
    if (show.aired_episodes === 0) return Promise.resolve();

    return this.syncEpisode(show.ids.trakt, 1, 1, language, options);
  }

  async syncEpisode(
    showIdTrakt: number,
    seasonNumber: number,
    episodeNumber: number,
    language: string,
    options?: SyncOptions,
  ): Promise<void> {
    const shows = this.showService.shows();
    const tasks: Promise<void>[] = [];
    const show = shows.find((show) => show.ids.trakt === showIdTrakt);

    tasks.push(
      this.episodeService.showsEpisodes.syncIds(
        [showIdTrakt, seasonNumber, episodeNumber],
        options,
      ),
    );

    const tmdbId = show?.ids.tmdb;
    if (tmdbId) {
      tasks.push(
        this.tmdbService.tmdbEpisodes.syncIds([tmdbId, seasonNumber, episodeNumber], options),
      );
    }

    if (language !== 'en') {
      tasks.push(
        this.translationService.showsEpisodesTranslations.syncIds(
          [showIdTrakt, seasonNumber, episodeNumber, language],
          options,
        ),
      );
    }

    await Promise.all(tasks);
  }
}
