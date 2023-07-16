import { inject, Injectable } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import {
  BehaviorSubject,
  catchError,
  forkJoin,
  lastValueFrom,
  map,
  Observable,
  of,
  take,
} from 'rxjs';

import { TmdbService } from '../../shows/data/tmdb.service';
import { ShowService } from '../../shows/data/show.service';
import { ConfigService } from './config.service';
import { ListService } from '../../lists/data/list.service';
import { EpisodeService } from '../../shows/data/episode.service';
import { TranslationService } from '../../shows/data/translation.service';
import { DialogService } from './dialog.service';
import { SyncService } from './sync.service';
import { SeasonService } from '../../shows/data/season.service';
import { LoadingState } from '@type/Enum';
import { onError } from '@helper/error';

import type { Episode, Season, Show } from '@type/Trakt';
import type { List } from '@type/TraktList';
import { isNextEpisodeOrLater } from '@helper/shows';
import { SyncOptions } from '@type/Sync';
import { snackBarMinDurationMs } from '@constants';
import { setTimeoutMin } from '@helper/setTimeoutMin';

@Injectable({
  providedIn: 'root',
})
export class ExecuteService {
  tmdbService = inject(TmdbService);
  showService = inject(ShowService);
  configService = inject(ConfigService);
  snackBar = inject(MatSnackBar);
  listService = inject(ListService);
  episodeService = inject(EpisodeService);
  translationService = inject(TranslationService);
  dialogService = inject(DialogService);
  syncService = inject(SyncService);
  seasonService = inject(SeasonService);

  async addEpisode(
    episode: Episode | null | undefined,
    show: Show,
    state?: BehaviorSubject<LoadingState>,
  ): Promise<void> {
    if (!episode || !show) throw Error('Argument is empty (addEpisode)');
    state?.next(LoadingState.LOADING);

    const withSync = await this.addEpisodeOptimistically(episode, show, state);
    const snackBarRef = withSync && this.snackBar.open('Adding new show...');
    const timeStart = withSync && new Date();

    this.episodeService
      .addEpisode(episode)
      .pipe(take(1))
      .subscribe({
        next: async (res) => {
          if (res.not_found.episodes.length > 0) throw Error('Episode(s) not found (addEpisode)');

          if (withSync) {
            await this.syncService.syncNew();
            setTimeoutMin(() => snackBarRef!.dismiss(), timeStart!, snackBarMinDurationMs);
          }

          state?.next(LoadingState.SUCCESS);
        },
        error: (error) => onError(error, this.snackBar, state && [state]),
      });
  }

  private async addEpisodeOptimistically(
    episode: Episode,
    show: Show,
    state?: BehaviorSubject<LoadingState>,
  ): Promise<void | true> {
    return new Promise((resolve) => {
      let nextEpisodeNumbers: { season: number; number: number } | undefined = undefined;

      // update shows watched
      const showWatchedIndex = this.showService.getShowWatchedIndex(show);
      if (showWatchedIndex === -1) {
        return resolve(true);
      } else if (showWatchedIndex > 0) {
        this.showService.moveShowWatchedToFront(showWatchedIndex);
      }

      // update show progress
      const showProgress = this.showService.getShowProgress(show);
      if (showProgress) {
        showProgress.completed++;
        if (showProgress.completed > showProgress.aired)
          showProgress.aired = showProgress.completed;

        // update season progress
        const seasonProgress = this.seasonService.getSeasonProgress(showProgress, episode.season);
        if (seasonProgress) {
          seasonProgress.completed++;
          if (seasonProgress.completed > seasonProgress.aired)
            seasonProgress.aired = seasonProgress.completed;

          // update episode progress
          const episodeProgress = this.episodeService.getEpisodeProgress(
            seasonProgress,
            episode.number,
          );
          if (episodeProgress) {
            episodeProgress.completed = true;
            episodeProgress.last_watched_at = new Date().toISOString();
          } else {
            seasonProgress.episodes.push({
              number: episode.number,
              completed: true,
              last_watched_at: new Date().toISOString(),
            });
          }
        }

        if (isNextEpisodeOrLater(showProgress, episode)) {
          const nextEpisodeTmdb = this.tmdbService.getTmdbEpisode(
            show,
            episode.season,
            episode.number + 1,
          );

          if (!nextEpisodeTmdb) {
            const tmdbShow = this.tmdbService.getTmdbShow(show);

            const nextSeasonTmdb = tmdbShow.seasons.find(
              (season) => season.season_number === episode.season + 1,
            );

            if (!nextSeasonTmdb?.episode_count) {
              showProgress.next_episode = null;
            } else {
              nextEpisodeNumbers = { season: nextSeasonTmdb.season_number, number: 1 };
              showProgress.next_episode = undefined;
            }
          } else {
            nextEpisodeNumbers = {
              season: nextEpisodeTmdb.season_number,
              number: nextEpisodeTmdb.episode_number,
            };
            showProgress.next_episode = undefined;
          }
        }

        // when next_episode is undefined, JSON.stringify will delete it
        this.showService.updateShowsProgress(this.showService.showsProgress.$.value, {
          save: showProgress.next_episode !== undefined,
        });
      }

      // remove show from watchlist
      this.listService.removeFromWatchlistOptimistically(show);

      // execute if is next episode
      if (nextEpisodeNumbers && showProgress) {
        const syncOptions: SyncOptions = { deleteOld: true, publishSingle: true };
        const observables: Observable<void>[] = [
          this.episodeService
            .getEpisode$(show, nextEpisodeNumbers.season, nextEpisodeNumbers.number, {
              fetch: true,
              sync: true,
            })
            .pipe(
              map((episode) => {
                showProgress.next_episode = this.episodeService.getEpisodeFromEpisodeFull(episode);
                this.showService.updateShowsProgress();
                return;
              }),
              take(1),
            ),
          this.syncService.syncEpisode(
            show.ids.trakt,
            nextEpisodeNumbers.season,
            nextEpisodeNumbers.number,
            this.configService.config.$.value.language.substring(0, 2),
            syncOptions,
          ),
          this.tmdbService.tmdbSeasons.sync(show.ids.tmdb, nextEpisodeNumbers.season, syncOptions),
        ];

        forkJoin(observables)
          .pipe(catchError(() => of(undefined)))
          .subscribe(() => {
            state?.next(LoadingState.SUCCESS);
            resolve();
          });
      } else {
        state?.next(LoadingState.SUCCESS);
        resolve();
      }
    });
  }

  removeEpisode(
    episode?: Episode | null,
    show?: Show,
    state?: BehaviorSubject<LoadingState>,
  ): void {
    if (!episode || !show) throw Error('Argument is empty (removeEpisode)');
    state?.next(LoadingState.LOADING);

    this.removeEpisodeOptimistically(episode, show, state);

    this.episodeService
      .removeEpisode(episode)
      .pipe(take(1))
      .subscribe({
        next: async (res) => {
          if (res.not_found.episodes.length > 0)
            throw Error('Episode(s) not found (removeEpisode)');

          state?.next(LoadingState.SUCCESS);
        },
        error: (error) => onError(error, this.snackBar, state && [state]),
      });
  }

  private removeEpisodeOptimistically(
    episode: Episode,
    show: Show,
    state?: BehaviorSubject<LoadingState>,
  ): void {
    // update show progress
    const showProgress = this.showService.getShowProgress(show);
    if (showProgress) {
      showProgress.completed = Math.max(showProgress.completed - 1, 0);

      // update season progress
      const seasonProgress = this.seasonService.getSeasonProgress(showProgress, episode.season);
      if (seasonProgress) {
        seasonProgress.completed = Math.max(seasonProgress.completed - 1, 0);

        // update episode progress
        const episodeProgress = this.episodeService.getEpisodeProgress(
          seasonProgress,
          episode.number,
        );
        if (episodeProgress) episodeProgress.completed = false;
      }

      this.showService.updateShowsProgress();
    }

    // todo update next episode

    state?.next(LoadingState.SUCCESS);
  }

  addToWatchlist(show: Show): void {
    const snackBarRef = this.snackBar.open('Adding show to the watchlist...');
    const timeStart = new Date();

    this.listService.addToWatchlistOptimistically(show);

    this.listService.addToWatchlist(show).subscribe(async (res) => {
      if (res.not_found.shows.length > 0)
        return onError(res, this.snackBar, undefined, 'Show(s) not found');

      const language = this.configService.config.$.value.language.substring(0, 2);

      forkJoin([
        this.listService.watchlist.sync(),
        this.tmdbService.tmdbShows.sync(show.ids.tmdb),
        this.syncService.syncShowTranslation(show.ids.trakt, language),
        this.syncService.syncEpisode(show.ids.trakt, 1, 1, language),
      ]).subscribe({
        next: () => setTimeoutMin(() => snackBarRef.dismiss(), timeStart, snackBarMinDurationMs),
        error: (error) => onError(error, this.snackBar),
      });
    });
  }

  removeFromWatchlist(show: Show): void {
    const snackBarRef = this.snackBar.open('Removing show from the watchlist...');
    const timeStart = new Date();

    this.listService.removeFromWatchlistOptimistically(show);

    this.listService.removeFromWatchlist(show).subscribe(async (res) => {
      if (res.not_found.shows.length > 0)
        return onError(res, this.snackBar, undefined, 'Show(s) not found');

      this.tmdbService.removeShow(show.ids.tmdb);
      this.translationService.removeShowTranslation(show.ids.trakt);
      this.episodeService.removeShowsEpisodes(show);
      this.translationService.removeShowsEpisodesTranslation(show);

      this.listService.watchlist
        .sync()
        .subscribe(() =>
          setTimeoutMin(() => snackBarRef.dismiss(), timeStart, snackBarMinDurationMs),
        );
    });
  }

  async removeList(listSlug?: string | null): Promise<void> {
    if (!listSlug) return onError(undefined, this.snackBar, undefined, 'List is missing');

    const confirm = await this.dialogService.confirm({
      title: 'Remove list?',
      message: 'Do you want to remove the active list?',
      confirmButton: 'Remove',
    });
    if (!confirm) return;

    const snackBarRef = this.snackBar.open('Removing list...');
    const timeStart = new Date();

    this.listService.removeList({ ids: { slug: listSlug } } as List).subscribe({
      next: async () => {
        this.listService.lists
          .sync({
            force: true,
            publishSingle: true,
          })
          .subscribe(() =>
            setTimeoutMin(() => snackBarRef.dismiss(), timeStart, snackBarMinDurationMs),
          );
      },
      error: (error) => onError(error, this.snackBar),
    });
  }

  async addShow(show?: Show, options?: SyncOptions): Promise<void> {
    if (!show) return onError(undefined, this.snackBar, undefined, 'Show is missing');

    if (options?.showConfirm) {
      const confirm = await this.dialogService.confirm({
        title: 'Mark as seen?',
        message: 'Do you want to mark the show as seen?',
        confirmButton: 'Mark as seen',
      });
      if (!confirm) return;
    }

    const snackBarRef = this.snackBar.open('Marking show as seen...');
    const timeStart = new Date();

    this.showService.addShowAsSeen(show).subscribe({
      next: async (res) => {
        if (res.not_found.shows.length > 0)
          return onError(res, this.snackBar, undefined, 'Show(s) not found');

        await this.syncService.syncNew();

        setTimeoutMin(() => snackBarRef.dismiss(), timeStart, snackBarMinDurationMs);
      },
      error: (error) => onError(error, this.snackBar),
    });
  }

  async removeShow(show?: Show, options: SyncOptions = { showConfirm: true }): Promise<void> {
    if (!show) return onError(undefined, this.snackBar, undefined, 'Show is missing');

    if (options.showConfirm) {
      const confirm = await this.dialogService.confirm({
        title: 'Remove show?',
        message: 'Do you want to remove the show?',
        confirmButton: 'Remove',
      });
      if (!confirm) return;
    }

    const snackBarRef = this.snackBar.open('Removing show...');
    const timeStart = new Date();

    this.showService.removeShowAsSeen(show).subscribe({
      next: async (res) => {
        if (res.not_found.shows.length > 0)
          return onError(res, this.snackBar, undefined, 'Show(s) not found');

        this.showService.removeShowWatched(show);
        this.tmdbService.removeShow(show.ids.tmdb);
        this.translationService.removeShowTranslation(show.ids.trakt);
        this.episodeService.removeShowsEpisodes(show);
        this.translationService.removeShowsEpisodesTranslation(show);
        this.showService.removeShowProgress(show.ids.trakt);
        this.showService.removeFavorite(show);

        setTimeoutMin(() => snackBarRef.dismiss(), timeStart, snackBarMinDurationMs);
      },
      error: (error) => onError(error, this.snackBar),
    });
  }

  async addShowHidden(show?: Show): Promise<void> {
    if (!show) return onError(undefined, this.snackBar, undefined, 'Show is missing');

    // hide show optimistically
    this.showService.showsHidden.$.value?.push({
      hidden_at: new Date().toISOString(), // eslint-disable-line @typescript-eslint/naming-convention
      show,
      type: 'show',
    });
    this.showService.updateShowsHidden();

    this.showService.addShowHidden(show).subscribe({
      next: (res) => {
        if (res.not_found.shows.length > 0)
          return onError(res, this.snackBar, undefined, 'Show(s) not found');
      },
      error: (error) => onError(error, this.snackBar),
    });
  }

  async removeShowHidden(show?: Show): Promise<void> {
    if (!show) return onError(undefined, this.snackBar, undefined, 'Show is missing');

    // unhide show optimistically
    const showsHidden = this.showService.showsHidden.$.value?.filter(
      (showHidden) => showHidden.show.ids.trakt !== show.ids.trakt,
    );
    this.showService.updateShowsHidden(showsHidden);

    this.showService.removeShowHidden(show).subscribe({
      next: async (res) => {
        if (res.not_found.shows.length > 0)
          return onError(res, this.snackBar, undefined, 'Show(s) not found');
      },
      error: (error) => onError(error, this.snackBar),
    });
  }

  async addSeason(
    seasonOrNumber?: Season | number,
    show?: Show,
    options?: SyncOptions,
  ): Promise<void> {
    if (!seasonOrNumber || !show)
      return onError(undefined, this.snackBar, undefined, 'Season or show is missing');

    if (options?.showConfirm) {
      const confirm = await this.dialogService.confirm({
        title: 'Mark as seen?',
        message: 'Do you want to mark the season as seen?',
        confirmButton: 'Mark as seen',
      });
      if (!confirm) return;
    }

    const snackBarRef = this.snackBar.open('Marking season as seen...');
    const timeStart = new Date();

    const season =
      typeof seasonOrNumber === 'number'
        ? await lastValueFrom(this.seasonService.getSeasonFromNumber$(seasonOrNumber, show))
        : seasonOrNumber;

    if (!season) return onError(undefined, this.snackBar, undefined, 'Season does not exist');

    this.seasonService.addSeason(season).subscribe({
      next: (res) => {
        if (res.not_found.shows.length > 0)
          return onError(res, this.snackBar, undefined, 'Show(s) not found');

        void this.syncService.syncNew();

        setTimeoutMin(() => snackBarRef.dismiss(), timeStart, snackBarMinDurationMs);
      },
      error: (error) => onError(error, this.snackBar),
    });
  }

  async removeSeason(
    season?: Season,
    show?: Show,
    options: SyncOptions = { showConfirm: true },
  ): Promise<void> {
    if (!season || !show)
      return onError(undefined, this.snackBar, undefined, 'Season or show is missing');

    if (options.showConfirm) {
      const confirm = await this.dialogService.confirm({
        title: 'Mark as unseen?',
        message: 'Do you want to mark the season as not seen?',
        confirmButton: 'Mark as unseen',
      });
      if (!confirm) return;
    }

    const snackBarRef = this.snackBar.open('Marking season as unseen...');
    const timeStart = new Date();

    this.seasonService.removeSeason(season).subscribe({
      next: (res) => {
        if (res.not_found.shows.length > 0)
          return onError(res, this.snackBar, undefined, 'Show(s) not found');

        void this.syncService.syncNew();

        setTimeoutMin(() => snackBarRef.dismiss(), timeStart, snackBarMinDurationMs);
      },
      error: (error) => onError(error, this.snackBar),
    });
  }

  refreshShow(show: Show): void {
    const language = this.configService.config.$.value.language.substring(0, 2);
    const options: SyncOptions = { force: true };

    const observables = [
      this.showService.showsProgress.sync(show.ids.trakt, options),
      this.tmdbService.tmdbShows.sync(show.ids.tmdb, TmdbService.tmdbShowExtendedString, options),
      this.syncService.syncShowTranslation(show.ids.trakt, language, options),
    ];

    forkJoin(observables).subscribe({
      next: () => this.snackBar.open('Show refreshed', undefined, { duration: 2000 }),
      error: (error) => onError(error, this.snackBar),
    });
  }
}
