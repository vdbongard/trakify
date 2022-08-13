import { Injectable } from '@angular/core';
import {
  BehaviorSubject,
  defaultIfEmpty,
  finalize,
  firstValueFrom,
  forkJoin,
  map,
  Observable,
  of,
  switchMap,
  take,
} from 'rxjs';
import {
  Episode,
  Ids,
  LastActivity,
  ShowUpdated,
  TraktShow,
} from '../../../types/interfaces/Trakt';
import { TmdbService } from './tmdb.service';
import { OAuthService } from 'angular-oauth2-oidc';
import { ConfigService } from './config.service';
import { ShowService } from './trakt/show.service';
import { HttpClient } from '@angular/common/http';
import { Config } from '../../config';
import { AuthService } from './auth.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { getLocalStorage, setLocalStorage } from '../helper/localStorage';
import { LocalStorage } from '../../../types/enum';
import { ListService } from './trakt/list.service';
import { EpisodeService } from './trakt/episode.service';
import { InfoService } from './info.service';
import { TranslationService } from './trakt/translation.service';
import { onError } from '../helper/error';
import { SyncOptions } from '../../../types/interfaces/Sync';

@Injectable({
  providedIn: 'root',
})
export class SyncService {
  isSyncing = new BehaviorSubject<boolean>(false);

  remoteSyncMap: Record<string, (options?: SyncOptions) => Observable<void>> = {
    [LocalStorage.SHOWS_WATCHED]: this.showService.syncShowsWatched,
    [LocalStorage.SHOWS_HIDDEN]: this.showService.syncShowsHidden,
    [LocalStorage.WATCHLIST]: this.listService.syncWatchlist,
    [LocalStorage.LISTS]: this.listService.syncLists,
    [LocalStorage.TMDB_CONFIG]: this.tmdbService.syncTmdbConfig,
  };

  showsUpdated: ShowUpdated[] = [];

  constructor(
    private http: HttpClient,
    private tmdbService: TmdbService,
    private oauthService: OAuthService,
    private showService: ShowService,
    private configService: ConfigService,
    private authService: AuthService,
    private snackBar: MatSnackBar,
    private listService: ListService,
    private episodeService: EpisodeService,
    private infoService: InfoService,
    private translationService: TranslationService
  ) {
    this.authService.isLoggedIn$
      .pipe(switchMap((isLoggedIn) => (isLoggedIn ? this.fetchLastActivity() : of(undefined))))
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
    return this.http.get<LastActivity>(`${Config.traktBaseUrl}/sync/last_activities`);
  }

  async sync(lastActivity?: LastActivity, options?: SyncOptions): Promise<void> {
    this.isSyncing.next(true);
    options?.showSnackbar && this.snackBar.open('Sync 0/4', undefined, { duration: 2000 });
    console.debug('Sync 0/4');

    let observables: Observable<void>[] = [];

    const localLastActivity = getLocalStorage<LastActivity>(LocalStorage.LAST_ACTIVITY);
    const forceSync = options?.force;
    const syncAll = !localLastActivity || forceSync;
    const optionsInternal: SyncOptions = { publishSingle: !syncAll, ...options };

    if (syncAll) {
      observables.push(
        ...Object.values(this.remoteSyncMap).map((syncValues) =>
          syncValues({ ...optionsInternal, publishSingle: true })
        )
      );
      observables.push(this.configService.syncConfig({ ...optionsInternal, publishSingle: true }));
      observables.push(this.showService.syncFavorites({ ...optionsInternal, publishSingle: true }));
    } else if (lastActivity) {
      const isShowWatchedLater =
        new Date(lastActivity.episodes.watched_at) >
        new Date(localLastActivity.episodes.watched_at);

      if (isShowWatchedLater) {
        observables.push(this.showService.syncShowsWatched());
      }

      const isShowHiddenLater =
        new Date(lastActivity.shows.hidden_at) > new Date(localLastActivity.shows.hidden_at);

      if (isShowHiddenLater) {
        observables.push(this.showService.syncShowsHidden());
      }

      const isWatchlistLater =
        new Date(lastActivity.watchlist.updated_at) >
        new Date(localLastActivity.watchlist.updated_at);

      if (isWatchlistLater) {
        observables.push(this.listService.syncWatchlist());
      }

      const isListLater =
        new Date(lastActivity.lists.updated_at) > new Date(localLastActivity.lists.updated_at);

      if (isListLater) {
        observables.push(this.listService.syncLists());
      }

      observables.push(...this.syncEmpty());
    }

    await Promise.all(observables.map((observable) => firstValueFrom(observable)));
    options?.showSnackbar && this.snackBar.open('Sync 1/4', undefined, { duration: 2000 });
    console.debug('Sync 1/4');

    if (!syncAll) {
      observables = [this.syncNewOnceADay(optionsInternal)];
      await Promise.allSettled(observables.map((observable) => firstValueFrom(observable)));
    }

    options?.showSnackbar && this.snackBar.open('Sync 2/4', undefined, { duration: 2000 });
    console.debug('Sync 2/4');

    observables = [
      this.syncShowsProgress(optionsInternal),
      this.syncShowsTranslations(optionsInternal),
      this.syncTmdbShows(optionsInternal),
      this.syncListItems(optionsInternal),
    ];
    await Promise.allSettled(observables.map((observable) => firstValueFrom(observable)));
    options?.showSnackbar && this.snackBar.open('Sync 3/4', undefined, { duration: 2000 });
    console.debug('Sync 3/4');

    observables = [this.syncShowsNextEpisodes(optionsInternal)];
    await Promise.allSettled(observables.map((observable) => firstValueFrom(observable)));
    options?.showSnackbar && this.snackBar.open('Sync 4/4', undefined, { duration: 2000 });
    console.debug('Sync 4/4');

    if (lastActivity) setLocalStorage(LocalStorage.LAST_ACTIVITY, lastActivity);
    this.isSyncing.next(false);
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
    setLocalStorage(LocalStorage.LAST_ACTIVITY, {});

    return new Promise((resolve) => {
      this.fetchLastActivity().subscribe(async (lastActivity) => {
        await this.sync(lastActivity, options);
        resolve();
      });
    });
  }

  syncAllForce(options?: SyncOptions): Promise<void> {
    setLocalStorage(LocalStorage.LAST_ACTIVITY, {});

    return new Promise((resolve) => {
      this.fetchLastActivity().subscribe(async (lastActivity) => {
        await this.sync(lastActivity, { ...options, force: true });
        resolve();
      });
    });
  }

  syncEmpty(): Observable<void>[] {
    return Object.entries(this.remoteSyncMap).map(([localStorageKey, syncValues]) => {
      const stored = getLocalStorage(localStorageKey);

      if (!stored) {
        return syncValues();
      }

      return of(undefined);
    });
  }

  syncShowsProgress(options?: SyncOptions): Observable<void> {
    return this.showService.showsWatched$.pipe(
      switchMap((showsWatched) => {
        const localLastActivity = getLocalStorage<LastActivity>(LocalStorage.LAST_ACTIVITY);
        const syncAll = !localLastActivity || options?.force;
        const showsProgress = this.showService.showsProgress$.value;

        const observables = showsWatched.map((showWatched) => {
          const showId = showWatched.show.ids.trakt;

          if (syncAll || Object.keys(showsProgress).length === 0) {
            return this.showService.syncShowProgress(showId, options);
          }

          const localShowWatched = this.showService.getShowWatched(showId);
          const showProgress = showsProgress[showId];

          const isShowWatchedLater =
            localShowWatched?.last_watched_at &&
            localLastActivity &&
            new Date(localShowWatched.last_watched_at) >
              new Date(localLastActivity.episodes.watched_at);

          const isProgressLater =
            localShowWatched?.last_watched_at &&
            showProgress?.last_watched_at &&
            new Date(showProgress.last_watched_at) > new Date(localShowWatched.last_watched_at);

          const isShowUpdatedLater =
            localShowWatched?.last_updated_at &&
            showWatched?.last_updated_at &&
            new Date(showWatched.last_updated_at) > new Date(localShowWatched.last_updated_at);

          if (!isShowWatchedLater && !isProgressLater && !isShowUpdatedLater) {
            return of(undefined);
          }

          if (isShowUpdatedLater) {
            this.showsUpdated.push({
              ids: showWatched.show.ids,
              updateAt: showWatched.last_updated_at!,
            });
          }

          return this.showService.syncShowProgress(showId, options);
        });

        return forkJoin(observables).pipe(defaultIfEmpty(null));
      }),
      map(() => undefined),
      take(1),
      finalize(() => {
        if (options && !options.publishSingle) {
          this.showService.showsProgress$.next(this.showService.showsProgress$.value);
        }
      })
    );
  }

  syncShowsTranslations(options?: SyncOptions): Observable<void> {
    const language = this.configService.config$.value.language.substring(0, 2);
    return this.showService.getShows$().pipe(
      switchMap((shows) => {
        const observables: Observable<void>[] = [];

        if (language !== 'en') {
          observables.push(
            ...shows.map((show) => {
              const showId = show.ids.trakt;
              return this.translationService.syncShowTranslation(showId, language, options);
            })
          );
        }

        return forkJoin(observables).pipe(defaultIfEmpty(null));
      }),
      map(() => undefined),
      take(1),
      finalize(() => {
        if (options && !options.publishSingle) {
          this.translationService.showsTranslations$.next(
            this.translationService.showsTranslations$.value
          );
        }
      })
    );
  }

  syncTmdbShows(options?: SyncOptions): Observable<void> {
    return this.showService.getShows$().pipe(
      switchMap((shows) => {
        const observables: Observable<void>[] = [];

        if (options && !options?.force && this.showsUpdated.length > 0) {
          for (const showUpdate of this.showsUpdated) {
            observables.push(
              this.tmdbService.syncTmdbShow(showUpdate.ids.tmdb, { ...options, force: true })
            );
          }
        }

        observables.push(
          ...shows.map((show) => {
            const showId = show.ids.tmdb;
            return this.tmdbService.syncTmdbShow(showId, options);
          })
        );

        return forkJoin(observables).pipe(defaultIfEmpty(null));
      }),
      map(() => undefined),
      take(1),
      finalize(() => {
        if (options && !options.publishSingle) {
          this.tmdbService.tmdbShows$.next(this.tmdbService.tmdbShows$.value);
        }
      })
    );
  }

  syncListItems(options?: SyncOptions): Observable<void> {
    return this.listService.lists$.pipe(
      switchMap((lists) => {
        const observables = lists.map((list) =>
          this.listService.syncListItems(list.ids.slug, options)
        );

        return forkJoin(observables).pipe(defaultIfEmpty(null));
      }),
      map(() => undefined),
      finalize(() => {
        if (options && !options.publishSingle) {
          this.listService.listItems$.next(this.listService.listItems$.value);
        }
      })
    );
  }

  syncShowsNextEpisodes(options?: SyncOptions): Observable<void> {
    const showUpdatedEpisodesObservable = this.syncShowsUpdatedEpisodes();

    const language = this.configService.config$.value.language.substring(0, 2);
    const episodesObservable = this.showService.showsProgress$.pipe(
      switchMap((showsProgress) => {
        const observables = Object.entries(showsProgress).map(([traktShowId, showProgress]) => {
          if (!showProgress?.next_episode) return of(undefined);

          const observables: Observable<void>[] = [
            this.syncEpisode(
              parseInt(traktShowId),
              showProgress?.next_episode.season,
              showProgress?.next_episode.number,
              language,
              options
            ),
          ];

          const ids = this.showService.getIdsByTraktId(parseInt(traktShowId));
          if (ids) {
            observables.push(
              this.tmdbService.syncTmdbSeason(ids.tmdb, showProgress?.next_episode.season, options)
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

    const watchlistEpisodesObservables = this.listService.watchlist$.pipe(
      switchMap((watchlistItems) => {
        const observables = watchlistItems.map((watchlistItem) => {
          return this.syncEpisode(watchlistItem.show.ids.trakt, 1, 1, language, options);
        });
        return forkJoin(observables).pipe(defaultIfEmpty(null));
      }),
      take(1)
    );

    return forkJoin([
      showUpdatedEpisodesObservable,
      episodesObservable,
      watchlistEpisodesObservables,
    ]).pipe(
      map(() => undefined),
      finalize(() => {
        if (options && !options.publishSingle) {
          this.episodeService.showsEpisodes$.next(this.episodeService.showsEpisodes$.value);
          this.tmdbService.tmdbEpisodes$.next(this.tmdbService.tmdbEpisodes$.value);
          this.translationService.showsEpisodesTranslations$.next(
            this.translationService.showsEpisodesTranslations$.value
          );
        }
      })
    );
  }

  syncNewOnceADay(options?: SyncOptions): Observable<void> {
    let configChanged = false;
    return this.configService.config$.pipe(
      switchMap((config) => {
        const lastFetchedAt = config.lastFetchedAt;
        const observables: Observable<void>[] = [];
        const currentDate = new Date();
        const oneDayOld = new Date();
        oneDayOld.setDate(oneDayOld.getDate() - 1);
        const oldestDay = new Date();
        oldestDay.setTime(0);

        const progressFetchedAt = lastFetchedAt.progress
          ? new Date(lastFetchedAt.progress)
          : oldestDay;

        if (progressFetchedAt <= oneDayOld) {
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

        if (episodesFetchedAt <= oneDayOld) {
          observables.push(
            this.syncShowsEpisodes({ ...options, force: true, publishSingle: false })
          );
          config.lastFetchedAt = {
            ...config.lastFetchedAt,
            episodes: currentDate.toISOString(),
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
        if (configChanged) this.configService.syncConfig();
      })
    );
  }

  private syncShowsUpdatedEpisodes(): Observable<void> {
    if (this.showsUpdated.length === 0) return of(undefined);

    const observables: Observable<void>[] = [];

    for (const showUpdate of this.showsUpdated) {
      observables.push(this.syncShowEpisodes(showUpdate.ids.trakt));
    }

    this.showsUpdated = [];

    return forkJoin(observables).pipe(
      defaultIfEmpty(null),
      map(() => undefined)
    );
  }

  private syncShowEpisodes(showId: number, options?: SyncOptions): Observable<void> {
    const observables: Observable<void>[] = [];

    const language = this.configService.config$.value.language.substring(0, 2);

    const episodes = Object.entries(this.episodeService.showsEpisodes$.value)
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

  private syncEpisode(
    showId: number,
    seasonNumber: number | undefined,
    episodeNumber: number | undefined,
    language: string,
    options?: SyncOptions
  ): Observable<void> {
    const observables: Observable<void>[] = [];

    observables.push(
      this.episodeService.syncShowEpisode(showId, seasonNumber, episodeNumber, options)
    );

    const tmdbId = this.showService.getIdsByTraktId(showId)?.tmdb;
    if (tmdbId) {
      observables.push(
        this.tmdbService.syncTmdbEpisode(tmdbId, seasonNumber, episodeNumber, options)
      );
    }

    if (language !== 'en') {
      observables.push(
        this.translationService.syncShowEpisodeTranslation(
          showId,
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
  }

  private syncShowsEpisodes(options?: SyncOptions): Observable<void> {
    return this.showService.showsWatched$.pipe(
      switchMap((showsWatched) => {
        const observables: Observable<void>[] = showsWatched.map((showsWatched) => {
          return this.syncShowEpisodes(showsWatched.show.ids.trakt, options);
        });

        return forkJoin(observables).pipe(defaultIfEmpty(null));
      }),
      map(() => undefined),
      take(1),
      finalize(() => {
        if (options && !options.publishSingle) {
          this.episodeService.showsEpisodes$.next(this.episodeService.showsEpisodes$.value);
          this.tmdbService.tmdbEpisodes$.next(this.tmdbService.tmdbEpisodes$.value);
          this.translationService.showsEpisodesTranslations$.next(
            this.translationService.showsEpisodesTranslations$.value
          );
        }
      })
    );
  }

  syncAddEpisode(episode?: Episode | null, ids?: Ids): void {
    if (!episode || !ids) throw Error('Argument is missing');
    this.episodeService.addEpisode(episode).subscribe({
      next: async (res) => {
        if (res.not_found.episodes.length > 0)
          return onError(res, this.snackBar, undefined, 'Episode(s) not found');

        forkJoin([
          this.showService.syncShowProgress(ids.trakt, { force: true, publishSingle: true }),
          this.showService.syncShowsWatched({ force: true, publishSingle: true }),
        ]).subscribe();
      },
      error: (error) => onError(error, this.snackBar),
    });
  }

  syncRemoveEpisode(episode?: Episode, ids?: Ids): void {
    if (!episode || !ids) throw Error('Argument is missing');
    this.episodeService.removeEpisode(episode).subscribe({
      next: async (res) => {
        if (res.not_found.episodes.length > 0)
          return onError(res, this.snackBar, undefined, 'Episode(s) not found');

        forkJoin([
          this.showService.syncShowProgress(ids.trakt, { force: true, publishSingle: true }),
          this.showService.syncShowsWatched({ force: true, publishSingle: true }),
        ]).subscribe();
      },
      error: (error) => onError(error, this.snackBar),
    });
  }

  syncRemoveShow(show?: TraktShow): void {
    if (!show) throw Error('Show is missing');
    this.showService.removeShow(show).subscribe({
      next: async (res) => {
        if (res.not_found.shows.length > 0)
          return onError(res, this.snackBar, undefined, 'Show(s) not found');

        forkJoin([
          this.showService.syncShowProgress(show.ids.trakt, { force: true, publishSingle: true }),
          this.showService.syncShowsWatched({ force: true, publishSingle: true }),
        ]).subscribe();

        this.showService.removeFavorite(show.ids.trakt);
      },
      error: (error) => onError(error, this.snackBar),
    });
  }

  syncAddToWatchlist(ids: Ids): void {
    this.listService.addToWatchlist(ids).subscribe(async (res) => {
      if (res.not_found.shows.length > 0)
        return onError(res, this.snackBar, undefined, 'Show(s) not found');

      await this.syncNew();
    });
  }

  syncRemoveFromWatchlist(ids: Ids): void {
    this.listService.removeFromWatchlist(ids).subscribe(async (res) => {
      if (res.not_found.shows.length > 0)
        return onError(res, this.snackBar, undefined, 'Show(s) not found');

      await this.syncNew();
    });
  }
}
