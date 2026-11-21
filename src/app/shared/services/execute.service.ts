import { inject, Injectable, WritableSignal } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { QueryClient } from '@tanstack/angular-query';
import { firstValueFrom } from 'rxjs';
import { TmdbService } from '../../pages/shows/data/tmdb.service';
import { ShowService } from '../../pages/shows/data/show.service';
import { ConfigService } from './config.service';
import { ListService } from '../../pages/lists/data/list.service';
import { EpisodeService } from '../../pages/shows/data/episode.service';
import { TranslationService } from '../../pages/shows/data/translation.service';
import { DialogService } from './dialog.service';
import { SyncService } from './sync.service';
import { SeasonService } from '../../pages/shows/data/season.service';
import { LoadingState } from '@type/Loading';
import { onError } from '@helper/error';
import type { Episode, Season, Show } from '@type/Trakt';
import type { List } from '@type/TraktList';
import { SYNTHETIC_EPISODE_TRAKT_ID } from '@helper/episodes';
import { queryKeys } from '@shared/query-keys';
import { SyncOptions } from '@type/Sync';
import { snackBarMinDurationMs } from '@constants';
import { setTimeoutMin } from '@helper/setTimeoutMin';

interface AddEpisodeOptimisticResult {
  withSync: boolean;
  showNewShowSnackBar: boolean;
}

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
  queryClient = inject(QueryClient);

  private invalidateHistory(): void {
    void this.queryClient.invalidateQueries({ queryKey: queryKeys.history() });
  }

  async addEpisode(
    episode: Episode,
    show: Show,
    state?: WritableSignal<LoadingState>,
    options: { batch?: boolean } = {},
  ): Promise<void> {
    state?.set('loading');

    const optimisticResult = await this.addEpisodeOptimistically(episode, show);
    const snackBarRef = optimisticResult?.showNewShowSnackBar
      ? this.snackBar.open('Adding new show...')
      : undefined;
    const timeStart = snackBarRef ? new Date() : undefined;

    try {
      const res = await firstValueFrom(
        this.episodeService.addEpisode(episode, new Date(), options),
      );
      if (res.not_found.episodes.length > 0) throw Error('Episode(s) not found (addEpisode)');

      this.invalidateHistory();

      if (optimisticResult?.withSync) {
        await this.syncService.syncNew();
        if (timeStart) {
          setTimeoutMin(() => snackBarRef!.dismiss(), timeStart, snackBarMinDurationMs);
        }
      }

      state?.set('success');
    } catch (error) {
      onError(error, this.snackBar, state && [state]);
    }
  }

  private async addEpisodeOptimistically(
    episode: Episode,
    show: Show,
  ): Promise<AddEpisodeOptimisticResult | undefined> {
    let nextEpisodeNumbers: { season: number; number: number } | undefined = undefined;

    const showWatchedIndex = this.showService.getShowWatchedIndex(show);
    const showWatched = showWatchedIndex !== -1;
    if (showWatchedIndex > 0) {
      this.showService.moveShowWatchedToFront(showWatchedIndex);
    }

    const preMarkProgress = this.showService.showsProgress.s()[show.ids.trakt];
    const showIsNew = !showWatched && !!preMarkProgress && preMarkProgress.completed === 0;
    const advanceNeeded = this.showService.markEpisodeSeen(show, episode);
    const showProgress = this.showService.showsProgress.s()[show.ids.trakt];

    if (showProgress && advanceNeeded && show.ids.tmdb != null) {
      const nextEpisodeTmdb = this.tmdbService.getTmdbEpisode(
        show,
        episode.season,
        episode.number + 1,
      );

      if (!nextEpisodeTmdb) {
        const tmdbShow = await this.tmdbService.fetchTmdbShowEntry(show).catch(() => null);
        if (tmdbShow) {
          const nextSeasonTmdb = tmdbShow.seasons.find(
            (season) => season.season_number === episode.season + 1,
          );

          if (!nextSeasonTmdb?.episode_count) {
            this.showService.clearNextEpisode(show);
          } else {
            nextEpisodeNumbers = { season: nextSeasonTmdb.season_number, number: 1 };
            showProgress!.next_episode = {
              ids: { trakt: SYNTHETIC_EPISODE_TRAKT_ID },
              number: 1,
              season: nextSeasonTmdb.season_number,
              title: null,
            };
            this.showService.updateShowsProgress();
          }
        }
      } else {
        nextEpisodeNumbers = {
          season: nextEpisodeTmdb.season_number,
          number: nextEpisodeTmdb.episode_number,
        };
      }
    }

    if (!showProgress) {
      return { withSync: true, showNewShowSnackBar: !showWatched };
    }

    if (showWatched) {
      this.listService.removeFromWatchlistOptimistically(show);
    }

    if (nextEpisodeNumbers && showProgress) {
      const tasks: Promise<void>[] = [
        this.episodeService
          .fetchEpisode(show, nextEpisodeNumbers.season, nextEpisodeNumbers.number, {
            persist: true,
          })
          .then((episode) => {
            const nextEpisodeCompact = this.episodeService.getEpisodeFromEpisodeFull(episode);
            showProgress.next_episode = nextEpisodeCompact;
            this.showService.updateShowsProgress();
          }),
        this.syncService.syncEpisode(
          show.ids.trakt,
          nextEpisodeNumbers.season,
          nextEpisodeNumbers.number,
          this.configService.config.s().language.substring(0, 2),
        ),
        ...(show.ids.tmdb
          ? [this.tmdbService.tmdbSeasons.syncIds([show.ids.tmdb, nextEpisodeNumbers.season])]
          : []),
      ];

      await Promise.allSettled(tasks);
      return showWatched ? undefined : { withSync: true, showNewShowSnackBar: showIsNew };
    }

    return showWatched ? undefined : { withSync: true, showNewShowSnackBar: showIsNew };
  }

  addEpisodeBatched(episode: Episode, show: Show): Promise<void> {
    return this.addEpisode(episode, show, undefined, { batch: true });
  }

  async removeEpisode(
    episode: Episode,
    show: Show,
    state?: WritableSignal<LoadingState>,
    options: { batch?: boolean } = {},
  ): Promise<void> {
    state?.set('loading');

    this.removeEpisodeOptimistically(episode, show);

    try {
      const res = await firstValueFrom(this.episodeService.removeEpisode(episode, options));
      if (res.not_found.episodes.length > 0) throw Error('Episode(s) not found (removeEpisode)');

      this.invalidateHistory();

      state?.set('success');
    } catch (error) {
      onError(error, this.snackBar, state && [state]);
    }
  }

  private removeEpisodeOptimistically(episode: Episode, show: Show): void {
    this.showService.unmarkEpisodeSeen(show, episode);
  }

  async addToWatchlist(show: Show): Promise<void> {
    const snackBarRef = this.snackBar.open('Adding show to the watchlist...');
    const timeStart = new Date();

    this.listService.addToWatchlistOptimistically(show);

    try {
      const res = await firstValueFrom(this.listService.addToWatchlist(show));
      if (res.not_found.shows.length > 0)
        return onError(res, this.snackBar, undefined, 'Show(s) not found');

      const language = this.configService.config.s().language.substring(0, 2);

      await Promise.all([
        this.listService.watchlist.sync(),
        ...(show.ids.tmdb ? [this.tmdbService.tmdbShows.syncIds([show.ids.tmdb])] : []),
        this.syncService.syncShowTranslation(show.ids.trakt, language),
        this.syncService.syncEpisode(show.ids.trakt, 1, 1, language),
      ]);
      setTimeoutMin(() => snackBarRef.dismiss(), timeStart, snackBarMinDurationMs);
    } catch (error) {
      onError(error, this.snackBar);
    }
  }

  removeEpisodeBatched(episode: Episode, show: Show): Promise<void> {
    return this.removeEpisode(episode, show, undefined, { batch: true });
  }

  async removeFromWatchlist(show: Show): Promise<void> {
    const snackBarRef = this.snackBar.open('Removing show from the watchlist...');
    const timeStart = new Date();

    this.listService.removeFromWatchlistOptimistically(show);

    try {
      const res = await firstValueFrom(this.listService.removeFromWatchlist(show));
      if (res.not_found.shows.length > 0)
        return onError(res, this.snackBar, undefined, 'Show(s) not found');

      if (show.ids.tmdb != null) this.tmdbService.removeShow(show.ids.tmdb);
      this.translationService.removeShowTranslation(show.ids.trakt);
      this.episodeService.removeShowsEpisodes(show);
      this.translationService.removeShowsEpisodesTranslation(show);

      await this.listService.watchlist.sync();
      setTimeoutMin(() => snackBarRef.dismiss(), timeStart, snackBarMinDurationMs);
    } catch (error) {
      onError(error, this.snackBar);
    }
  }

  async removeList(listSlug: string): Promise<void> {
    const confirm = await this.dialogService.confirm({
      title: 'Remove list?',
      message: 'Do you want to remove the active list?',
      confirmButton: 'Remove',
    });
    if (!confirm) return;

    const snackBarRef = this.snackBar.open('Removing list...');
    const timeStart = new Date();

    try {
      await firstValueFrom(this.listService.removeList({ ids: { slug: listSlug } } as List));
      await this.listService.lists.sync({ force: true });
      setTimeoutMin(() => snackBarRef.dismiss(), timeStart, snackBarMinDurationMs);
    } catch (error) {
      onError(error, this.snackBar);
    }
  }

  async addShow(show: Show, options?: SyncOptions): Promise<void> {
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

    try {
      const res = await firstValueFrom(this.showService.addShowAsSeen(show));
      if (res.not_found.shows.length > 0)
        return onError(res, this.snackBar, undefined, 'Show(s) not found');

      this.invalidateHistory();

      await this.syncService.syncNew();

      setTimeoutMin(() => snackBarRef.dismiss(), timeStart, snackBarMinDurationMs);
    } catch (error) {
      onError(error, this.snackBar);
    }
  }

  async removeShow(show: Show, options: SyncOptions = { showConfirm: true }): Promise<void> {
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

    try {
      const res = await firstValueFrom(this.showService.removeShowAsSeen(show));
      if (res.not_found.shows.length > 0)
        return onError(res, this.snackBar, undefined, 'Show(s) not found');

      this.invalidateHistory();

      this.showService.removeShowWatched(show);
      if (show.ids.tmdb != null) this.tmdbService.removeShow(show.ids.tmdb);
      this.translationService.removeShowTranslation(show.ids.trakt);
      this.episodeService.removeShowsEpisodes(show);
      this.translationService.removeShowsEpisodesTranslation(show);
      this.showService.removeShowProgress(show.ids.trakt);
      this.showService.removeFavorite(show);

      setTimeoutMin(() => snackBarRef.dismiss(), timeStart, snackBarMinDurationMs);
    } catch (error) {
      onError(error, this.snackBar);
    }
  }

  async addShowHidden(show: Show): Promise<void> {
    this.showService.showsHidden.s()?.push({
      hidden_at: new Date().toISOString(),
      show,
      type: 'show',
    });
    this.showService.updateShowsHidden();

    try {
      const res = await firstValueFrom(this.showService.addShowHidden(show));
      if (res.not_found.shows.length > 0)
        return onError(res, this.snackBar, undefined, 'Show(s) not found');
    } catch (error) {
      onError(error, this.snackBar);
    }
  }

  async removeShowHidden(show: Show): Promise<void> {
    const showsHidden = this.showService.showsHidden
      .s()
      ?.filter((showHidden) => showHidden.show.ids.trakt !== show.ids.trakt);
    this.showService.updateShowsHidden(showsHidden);

    try {
      const res = await firstValueFrom(this.showService.removeShowHidden(show));
      if (res.not_found.shows.length > 0)
        return onError(res, this.snackBar, undefined, 'Show(s) not found');
    } catch (error) {
      onError(error, this.snackBar);
    }
  }

  async addSeason(
    seasonOrNumber: Season | number,
    show: Show,
    options?: SyncOptions,
  ): Promise<void> {
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
        ? await this.seasonService.getSeasonFromNumber(seasonOrNumber, show)
        : seasonOrNumber;

    if (!season) return onError(undefined, this.snackBar, undefined, 'Season does not exist');

    try {
      const res = await firstValueFrom(this.seasonService.addSeason(season));
      if (res.not_found.shows.length > 0)
        return onError(res, this.snackBar, undefined, 'Show(s) not found');

      this.invalidateHistory();

      void this.syncService.syncNew();

      setTimeoutMin(() => snackBarRef.dismiss(), timeStart, snackBarMinDurationMs);
    } catch (error) {
      onError(error, this.snackBar);
    }
  }

  async removeSeason(
    season: Season,
    show: Show,
    options: SyncOptions = { showConfirm: true },
  ): Promise<void> {
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

    try {
      const res = await firstValueFrom(this.seasonService.removeSeason(season));
      if (res.not_found.shows.length > 0)
        return onError(res, this.snackBar, undefined, 'Show(s) not found');

      this.invalidateHistory();

      void this.syncService.syncNew();

      setTimeoutMin(() => snackBarRef.dismiss(), timeStart, snackBarMinDurationMs);
    } catch (error) {
      onError(error, this.snackBar);
    }
  }

  async refreshShow(show: Show): Promise<void> {
    const language = this.configService.config.s().language.substring(0, 2);
    const options: SyncOptions = { force: true };

    try {
      await Promise.all([
        this.showService.showsProgress.syncIds([show.ids.trakt], options),
        ...(show.ids.tmdb
          ? [
              this.tmdbService.tmdbShows.syncIds(
                [show.ids.tmdb, TmdbService.tmdbShowExtendedString],
                options,
              ),
            ]
          : []),
        this.syncService.syncShowTranslation(show.ids.trakt, language, options),
      ]);
      this.snackBar.open('Show refreshed', undefined, { duration: 2000 });
    } catch (error) {
      onError(error, this.snackBar);
    }
  }
}
