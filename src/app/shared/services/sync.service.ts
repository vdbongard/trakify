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
import { toObservable } from '@angular/core/rxjs-interop';

/** localStorage key holding the version of the cached sync stores. */
export const SYNC_STORE_KEY = 'syncStoreVersion';
/**
 * Bump when the persisted sync data format changes to trigger a one-time full re-sync.
 * v2: list items are keyed by the numeric Trakt list id instead of the slug, because Trakt
 * refuses some numeric list slugs (e.g. "1") with "List is private or does not exist" (403).
 */
export const SYNC_STORE_VERSION = 2;

/**
 * Sync failures split by how much they compromise the result:
 * - `blocking`: a top-level batch rejected, so the store's state is unknown and the sync has to
 *   be retried.
 * - `items`: individually isolated items failed, so only those resources are missing; the rest of
 *   the sync is valid.
 */
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

  isSyncing = signal(false);

  private upgradePending = false;

  /** Set when an upgrade migration sync is forced; cleared once that sync records the store version. */
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
            if (!isLoggedIn) {
              this.resetSubjects();
              return of(undefined);
            }

            const withoutSync = getQueryParameter('sync') === '0';
            if (withoutSync) return of(undefined);

            const forceUpgrade = this.upgradePending;
            this.upgradePending = false;

            const lastSyncedAt = this.configService.config.s().lastFetchedAt.sync;
            // The key's presence, not its length: a genuinely empty account caches an empty
            // array and must not be re-synced on every load.
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
            // Armed by a forced migration sync: completeSync records the store version unless a
            // blocking failure left the caches in an unknown state, in which case the marker
            // stays absent and the next load re-arms the migration.
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
          ...Object.values(this.remoteSyncMap).map((syncValues) =>
            syncValues({ ...optionsInternal, deferPublish: false }),
          ),
        );
        tasks.push(this.configService.config.sync({ ...optionsInternal, deferPublish: false }));
        tasks.push(this.showService.favorites.sync({ ...optionsInternal, deferPublish: false }));
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

      this.collectFailures(
        failures,
        await this.runSyncStep(
          [
            this.syncShowsProgress(),
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

      this.completeSync(lastActivity, syncAll === true, failures);

      this.isSyncing.set(false);
    } catch (error) {
      onError(error, this.snackBar);
      this.isSyncing.set(false);
    }
  }

  /** Adds one step's failures to the running total. */
  private collectFailures(total: SyncFailures, stepFailures: SyncFailures): void {
    total.blocking += stepFailures.blocking;
    total.items += stepFailures.items;
  }

  private async runSyncBatch(promises: Promise<void | number>[]): Promise<SyncFailures> {
    if (promises.length === 0) return { blocking: 0, items: 0 };

    const results = await Promise.allSettled(promises);

    const failures: SyncFailures = { blocking: 0, items: 0 };
    for (const result of results) {
      // A rejected top-level batch leaves the store's state unknown, so it is blocking: the
      // sync must be retried rather than recorded as done. Batches that isolate their
      // individual items emit the number of item-level failures they swallowed, keeping
      // the remaining items syncing (US14) and the summary count item-accurate (US15).
      if (result.status === 'rejected') {
        failures.blocking += 1;
      } else if (typeof result.value === 'number') {
        failures.items += result.value;
      }
    }
    return failures;
  }

  /** Runs one sync batch and reports step progress in the console. */
  private async runSyncStep(
    promises: Promise<void | number>[],
    stepLabel: string,
  ): Promise<SyncFailures> {
    const failures = await this.runSyncBatch(promises);
    console.debug(`Sync ${stepLabel}`);
    return failures;
  }

  /**
   * Persists the sync bookkeeping, splitting what each marker is allowed to depend on:
   *
   * - A blocking failure returns early and writes nothing. The store's state is unknown, so the
   *   next load has to sync again.
   * - The last activity is the baseline for the incremental diff, so it advances only on a
   *   completely clean sync. Withholding it on an item-level failure keeps `syncAll` true, which
   *   makes the next sync refetch with `force` — that is what retries the items that failed.
   * - The fetch timestamp and the store version are written whenever no blocking failure occurred.
   *   The staleness window and the cache format are both satisfied by a partial sync, so gating
   *   them on perfection is what turned one unavailable resource into a full forced re-sync on
   *   every single page load.
   */
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

    // The store version marks caches written in the current format. A sync that got this far
    // did write them, so the marker is recorded and the next load no longer wipes every cache.
    if (this.recordStoreVersionOnSuccess) {
      this.localStorageService.setObject(SYNC_STORE_KEY, SYNC_STORE_VERSION);
      this.recordStoreVersionOnSuccess = false;
    }
  }

  /** Resolves 0 on success and 1 on failure, isolating one item so it never blocks the rest (US14). */
  private isolateFailures(syncable: Promise<unknown>): Promise<number> {
    return syncable.then(
      () => 0,
      () => 1,
    );
  }

  /**
   * Runs a list of isolated syncables and resolves the total item-level failure count
   * once all items have settled (US15).
   */
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

  /** Removes store entries whose trakt id no longer belongs to any synced show. */
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

  async syncShowsProgress(): Promise<void> {
    await this.showService.syncShowsProgress();
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
      if (options?.deferPublish === true) {
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
      // Key by the numeric Trakt id, not the slug: Trakt resolves some numeric list
      // slugs (e.g. "1") to "List is private or does not exist" (403), while the id is
      // always resolvable (getShowSlug uses the same approach for shows).
      const lists = this.listService.lists.s();
      return await this.runIsolated(
        lists?.map((list) => this.listService.listItems.syncIds([list.ids.trakt], options)) ?? [],
      );
    } finally {
      if (options?.deferPublish === true) {
        console.debug('publish listItems', this.listService.listItems.s());
        this.listService.listItems.flush();
      }
    }
  }

  async syncShowsNextEpisodes(options?: SyncOptions): Promise<number> {
    const language = this.configService.config.s().language.substring(0, 2);

    try {
      // Per-show episode detail and TMDB season data are deliberately NOT pre-fetched here
      // (ADR 0003: bulk sync keeps the whole library to ~2 requests). Only the next
      // episode's translation is fetched, cache-skipping, so the progress list's next-episode
      // line stays translated. Each item is isolated so one failure does not block the rest.
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
      if (options?.deferPublish === true) {
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

  /**
   * The watchlist page shows the air date of a show's first episode and sorts by it, so the bulk
   * sync still pre-fetches S1E1 for watchlist shows (ADR 0003 keeps this to the watchlist only).
   *
   * A show that has not premiered has no S1E1 and Trakt answers 404, which is a permanent "no such
   * episode" rather than a sync failure. The Sync module completes 404s normally with an empty
   * placeholder, so no special-casing is needed here beyond skipping shows with no aired episodes.
   */
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
    seasonNumber: number | undefined,
    episodeNumber: number | undefined,
    language: string,
    options?: SyncOptions,
  ): Promise<void> {
    const shows = this.showService.shows();
    const tasks: Promise<void>[] = [];
    const show = shows.find((show) => show.ids.trakt === showIdTrakt);

    tasks.push(
      this.episodeService.showsEpisodes.syncIds(
        [showIdTrakt, seasonNumber, episodeNumber].filter((id) => id !== undefined),
        options,
      ),
    );

    const tmdbId = show?.ids.tmdb;
    if (tmdbId) {
      tasks.push(
        this.tmdbService.tmdbEpisodes.syncIds(
          [tmdbId, seasonNumber, episodeNumber].filter((id) => id !== undefined),
          options,
        ),
      );
    }

    if (language !== 'en') {
      tasks.push(
        this.translationService.showsEpisodesTranslations.syncIds(
          [showIdTrakt, seasonNumber, episodeNumber, language].filter((id) => id !== undefined),
          options,
        ),
      );
    }

    await Promise.all(tasks);
  }
}
