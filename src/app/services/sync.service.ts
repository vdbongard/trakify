import { Injectable } from '@angular/core';
import {
  BehaviorSubject,
  firstValueFrom,
  forkJoin,
  map,
  Observable,
  of,
  switchMap,
  take,
} from 'rxjs';
import { Episode, Ids, LastActivity, ShowUpdated } from '../../types/interfaces/Trakt';
import { TmdbService } from './tmdb.service';
import { OAuthService } from 'angular-oauth2-oidc';
import { ConfigService } from './config.service';
import { ShowService } from './show.service';
import { HttpClient } from '@angular/common/http';
import { Config } from '../config';
import { AuthService } from './auth.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { getLocalStorage, setLocalStorage } from '../helper/localStorage';
import { LocalStorage } from '../../types/enum';
import { ListService } from './list.service';
import { EpisodeService } from './episode.service';
import { InfoService } from './info.service';

@Injectable({
  providedIn: 'root',
})
export class SyncService {
  isSyncing = new BehaviorSubject<boolean>(false);

  remoteSyncMap: Record<string, () => Observable<void>> = {
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
    private infoService: InfoService
  ) {
    this.authService.isLoggedIn$
      .pipe(switchMap((isLoggedIn) => (isLoggedIn ? this.fetchLastActivity() : of(undefined))))
      .subscribe({
        next: async (lastActivity: LastActivity | undefined) => {
          if (!lastActivity) return;
          await this.sync(lastActivity);
        },
        error: () => {
          this.snackBar.open(`An error occurred while fetching trakt`, undefined, {
            duration: 2000,
          });
        },
      });
  }

  fetchLastActivity(): Observable<LastActivity> {
    return this.http.get<LastActivity>(`${Config.traktBaseUrl}/sync/last_activities`);
  }

  async sync(lastActivity?: LastActivity, force?: boolean): Promise<void> {
    this.isSyncing.next(true);

    let observables: Observable<void>[] = [];

    const localLastActivity = getLocalStorage<LastActivity>(LocalStorage.LAST_ACTIVITY);

    const syncAll = !localLastActivity || force;

    if (syncAll) {
      observables.push(...Object.values(this.remoteSyncMap).map((syncValues) => syncValues()));
      observables.push(this.configService.syncConfig());
      observables.push(this.showService.syncFavorites());
    } else {
      if (lastActivity) {
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
      }

      observables.push(...this.syncEmpty());
    }

    await Promise.all(observables.map((observable) => firstValueFrom(observable)));

    observables = [
      this.syncShowsProgress(force),
      this.syncShowsTranslations(force),
      this.syncTmdbShows(force),
      this.syncListItems(force),
    ];
    await Promise.allSettled(observables.map((observable) => firstValueFrom(observable)));

    observables = [this.syncShowsEpisodes(force)];
    await Promise.allSettled(observables.map((observable) => firstValueFrom(observable)));

    if (lastActivity) setLocalStorage(LocalStorage.LAST_ACTIVITY, lastActivity);
    this.isSyncing.next(false);
  }

  syncNew(): Observable<void> {
    return this.fetchLastActivity().pipe(
      switchMap((lastActivity) => {
        return this.sync(lastActivity);
      })
    );
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

  syncShowsProgress(force?: boolean): Observable<void> {
    return this.showService.showsWatched$.pipe(
      switchMap((showsWatched) => {
        const localLastActivity = getLocalStorage<LastActivity>(LocalStorage.LAST_ACTIVITY);
        const syncAll = !localLastActivity || force;
        const showsProgress = this.showService.showsProgress$.value;

        const observables = showsWatched.map((showWatched) => {
          const showId = showWatched.show.ids.trakt;

          if (syncAll || Object.keys(showsProgress).length === 0) {
            return this.showService.syncShowProgress(showId);
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

          return this.showService.syncShowProgress(showId);
        });

        return forkJoin(observables);
      }),
      map(() => undefined),
      take(1)
    );
  }

  syncShowsTranslations(force?: boolean): Observable<void> {
    const language = this.configService.config$.value.language.substring(0, 2);
    return this.showService.getLocalShows$().pipe(
      switchMap((shows) => {
        const observables: Observable<void>[] = [];

        if (language !== 'en') {
          observables.push(
            ...shows.map((show) => {
              const showId = show.ids.trakt;
              return this.showService.syncShowTranslation(showId, language, force);
            })
          );
        }

        return forkJoin(observables);
      }),
      map(() => undefined),
      take(1)
    );
  }

  syncTmdbShows(force?: boolean): Observable<void> {
    return this.showService.getLocalShows$().pipe(
      switchMap((shows) => {
        const observables: Observable<void>[] = [];

        if (!force && this.showsUpdated.length > 0) {
          for (const showUpdate of this.showsUpdated) {
            observables.push(this.tmdbService.syncTmdbShow(showUpdate.ids.tmdb, true));
          }
        }

        observables.push(
          ...shows.map((show) => {
            const showId = show.ids.tmdb;
            return this.tmdbService.syncTmdbShow(showId, force);
          })
        );

        return forkJoin(observables);
      }),
      map(() => undefined),
      take(1)
    );
  }

  syncListItems(force?: boolean): Observable<void> {
    return this.listService.lists$.pipe(
      switchMap((lists) => {
        const observables = lists.map((list) =>
          this.listService.syncListItems(list.ids.slug, force)
        );

        return forkJoin(observables);
      }),
      map(() => undefined)
    );
  }

  syncShowsEpisodes(force?: boolean): Observable<void> {
    const showUpdatedEpisodesObservable = this.syncShowsUpdatedEpisodes();

    const language = this.configService.config$.value.language.substring(0, 2);
    const episodesObservable = this.showService.showsProgress$.pipe(take(1)).pipe(
      switchMap((showsProgress) => {
        const observables = Object.entries(showsProgress).map(([showId, showProgress]) => {
          if (!showProgress.next_episode) return of(undefined);
          return this.syncEpisode(
            parseInt(showId),
            showProgress.next_episode.season,
            showProgress.next_episode.number,
            language,
            force
          );
        });
        return forkJoin(observables).pipe(map(() => undefined));
      })
    );

    return forkJoin([showUpdatedEpisodesObservable, episodesObservable]).pipe(map(() => undefined));
  }

  syncShowsUpdatedEpisodes(): Observable<void> {
    if (this.showsUpdated.length === 0) return of(undefined);

    const language = this.configService.config$.value.language.substring(0, 2);
    const observables: Observable<void>[] = [];

    for (const showUpdate of this.showsUpdated) {
      const episodes = Object.entries(this.episodeService.showsEpisodes$.value)
        .filter(([episodeId]) => episodeId.startsWith(`${showUpdate.ids.trakt}-`))
        .map((entry) => entry[1]);

      observables.push(
        ...episodes.map((episode) => {
          return this.syncEpisode(
            showUpdate.ids.trakt,
            episode.season,
            episode.number,
            language,
            true
          );
        })
      );
    }

    this.showsUpdated = [];

    return forkJoin(observables).pipe(map(() => undefined));
  }

  syncEpisode(
    showId: number,
    seasonNumber: number,
    episodeNumber: number,
    language: string,
    force?: boolean
  ): Observable<void> {
    const observables: Observable<void>[] = [];

    observables.push(
      this.episodeService.syncShowEpisode(showId, seasonNumber, episodeNumber, force)
    );

    const tmdbId = this.showService.getIdsByTraktId(showId)?.tmdb;
    if (tmdbId) {
      observables.push(
        this.tmdbService.syncTmdbEpisode(tmdbId, seasonNumber, episodeNumber, force)
      );
    }

    if (language !== 'en') {
      observables.push(
        this.episodeService.syncShowEpisodeTranslation(
          showId,
          seasonNumber,
          episodeNumber,
          language,
          force
        )
      );
    }

    return forkJoin(observables).pipe(map(() => undefined));
  }

  syncAddToHistory(ids?: Ids, episode?: Episode): void {
    if (!ids || !episode) return;
    this.episodeService.addToHistory(episode).subscribe(async (res) => {
      if (res.not_found.episodes.length > 0) {
        console.error('res', res);
        return;
      }

      this.syncNew().subscribe();
      this.infoService.removeNewShow(ids.trakt);
    });
  }

  syncRemoveFromHistory(ids?: Ids, episode?: Episode): void {
    if (!ids || !episode) return;
    this.episodeService.removeFromHistory(episode).subscribe(async (res) => {
      if (res.not_found.episodes.length > 0) {
        console.error('res', res);
        return;
      }

      await this.syncNew();
      this.infoService.addNewShow(ids, episode);
    });
  }
}
