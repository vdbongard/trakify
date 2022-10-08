import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { MatSnackBar } from '@angular/material/snack-bar';
import { BehaviorSubject, forkJoin, lastValueFrom, map, Observable, take } from 'rxjs';
import { OAuthService } from 'angular-oauth2-oidc';

import { TmdbService } from './tmdb.service';
import { ShowService } from './trakt/show.service';
import { ConfigService } from './config.service';
import { AuthService } from './auth.service';
import { ListService } from './trakt/list.service';
import { EpisodeService } from './trakt/episode.service';
import { InfoService } from './info.service';
import { TranslationService } from './trakt/translation.service';
import { DialogService } from './dialog.service';
import { SyncService } from './sync.service';
import { SeasonService } from './trakt/season.service';
import { LoadingState } from '@type/enum';
import { onError } from '@helper/error';

import type { Episode, Season, Show } from '@type/interfaces/Trakt';
import type { List } from '@type/interfaces/TraktList';
import { isNextEpisodeOrLater } from '@helper/shows';
import { SyncOptions } from '@type/interfaces/Sync';

@Injectable({
  providedIn: 'root',
})
export class ExecuteService {
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
    private translationService: TranslationService,
    private dialogService: DialogService,
    private syncService: SyncService,
    private seasonService: SeasonService
  ) {}

  async addEpisode(
    episode: Episode | null | undefined,
    show: Show,
    state?: BehaviorSubject<LoadingState>
  ): Promise<void> {
    if (!episode || !show) throw Error('Argument is empty (addEpisode)');
    state?.next(LoadingState.LOADING);

    const withSync = await this.addEpisodeOptimistically(episode, show, state);

    this.episodeService.addEpisode(episode).subscribe({
      next: async (res) => {
        if (res.not_found.episodes.length > 0) throw Error('Episode(s) not found (addEpisode)');

        if (withSync) {
          await this.syncService.syncNew();
          this.snackBar.open('Added show', undefined, { duration: 2000 });
        }

        state?.next(LoadingState.SUCCESS);
      },
      error: (error) => onError(error, this.snackBar, state),
    });
  }

  private async addEpisodeOptimistically(
    episode: Episode,
    show: Show,
    state?: BehaviorSubject<LoadingState>
  ): Promise<void | true> {
    return new Promise((resolve) => {
      let nextEpisodeNumbers: { season: number; number: number } | undefined = undefined;

      // update shows watched
      const showWatchedIndex = this.showService.getShowWatchedIndex(show);
      if (showWatchedIndex === -1) {
        this.snackBar.open('Adding new show...');
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
            episode.number
          );
          if (episodeProgress) episodeProgress.completed = true;
          else {
            seasonProgress.episodes.push({
              number: episode.number,
              completed: true,
              // eslint-disable-next-line @typescript-eslint/naming-convention
              last_watched_at: new Date().toISOString(),
            });
          }
        }

        // check if is next episode
        if (isNextEpisodeOrLater(showProgress, episode)) {
          const nextEpisodeTmdb = this.tmdbService.getTmdbEpisode(
            show,
            episode.season,
            episode.number + 1
          );

          if (!nextEpisodeTmdb) {
            const tmdbShow = this.tmdbService.getTmdbShow(show);

            const nextSeasonTmdb = tmdbShow.seasons.find(
              (season) => season.season_number === episode.season + 1
            );

            if (!nextSeasonTmdb) {
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

        this.showService.updateShowProgress();
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
            })
            .pipe(
              take(1),
              map((episode) => {
                showProgress.next_episode = this.episodeService.getEpisodeFromEpisodeFull(episode);
                this.showService.updateShowProgress();
                return;
              })
            ),
          this.syncService.syncEpisode(
            show.ids.trakt,
            nextEpisodeNumbers.season,
            nextEpisodeNumbers.number,
            this.configService.config.$.value.language.substring(0, 2),
            syncOptions
          ),
          this.tmdbService.tmdbSeasons.sync(show.ids.tmdb, nextEpisodeNumbers.season, syncOptions),
        ];

        forkJoin(observables).subscribe(() => {
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
    state?: BehaviorSubject<LoadingState>
  ): void {
    if (!episode || !show) throw Error('Argument is empty (removeEpisode)');
    state?.next(LoadingState.LOADING);

    this.removeEpisodeOptimistically(episode, show, state);

    this.episodeService.removeEpisode(episode).subscribe({
      next: async (res) => {
        if (res.not_found.episodes.length > 0) throw Error('Episode(s) not found (removeEpisode)');

        state?.next(LoadingState.SUCCESS);
      },
      error: (error) => onError(error, this.snackBar, state),
    });
  }

  private removeEpisodeOptimistically(
    episode: Episode,
    show: Show,
    state?: BehaviorSubject<LoadingState>
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
          episode.number
        );
        if (episodeProgress) episodeProgress.completed = false;
      }

      this.showService.updateShowProgress();
    }

    // todo update next episode

    state?.next(LoadingState.SUCCESS);
  }

  addToWatchlist(show: Show): void {
    const snackBarRef = this.snackBar.open('Adding show to the watchlist...');

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
      ]).subscribe(() => snackBarRef.dismiss());
    });
  }

  removeFromWatchlist(show: Show): void {
    this.listService.removeFromWatchlistOptimistically(show);

    this.listService.removeFromWatchlist(show).subscribe(async (res) => {
      if (res.not_found.shows.length > 0)
        return onError(res, this.snackBar, undefined, 'Show(s) not found');

      this.tmdbService.removeShow(show);
      this.translationService.removeShowTranslation(show);
      this.episodeService.removeShowsEpisodes(show);
      this.translationService.removeShowsEpisodesTranslation(show);

      this.listService.watchlist.sync().subscribe();
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

    this.listService.removeList({ ids: { slug: listSlug } } as List).subscribe({
      next: async () => {
        this.listService.lists
          .sync({
            force: true,
            publishSingle: true,
          })
          .subscribe(() => snackBarRef.dismiss());
      },
      error: (error) => onError(error, this.snackBar),
    });
  }

  async addShow(show?: Show): Promise<void> {
    if (!show) return onError(undefined, this.snackBar, undefined, 'Show is missing');

    const confirm = await this.dialogService.confirm({
      title: 'Mark as seen?',
      message: 'Do you want to mark the show as seen?',
      confirmButton: 'Mark as seen',
    });
    if (!confirm) return;

    const snackBarRef = this.snackBar.open('Marking show as seen...');

    this.showService.addShowAsSeen(show).subscribe({
      next: async (res) => {
        if (res.not_found.shows.length > 0)
          return onError(res, this.snackBar, undefined, 'Show(s) not found');

        await this.syncService.syncNew();

        snackBarRef.dismiss();
      },
      error: (error) => onError(error, this.snackBar),
    });
  }

  async removeShow(show?: Show): Promise<void> {
    if (!show) return onError(undefined, this.snackBar, undefined, 'Show is missing');

    const confirm = await this.dialogService.confirm({
      title: 'Remove show?',
      message: 'Do you want to remove the show?',
      confirmButton: 'Remove',
    });
    if (!confirm) return;

    const snackBarRef = this.snackBar.open('Removing show...');

    this.showService.removeShowAsSeen(show).subscribe({
      next: async (res) => {
        if (res.not_found.shows.length > 0)
          return onError(res, this.snackBar, undefined, 'Show(s) not found');

        this.tmdbService.removeShow(show);
        this.translationService.removeShowTranslation(show);
        this.episodeService.removeShowsEpisodes(show);
        this.translationService.removeShowsEpisodesTranslation(show);
        this.showService.removeShowProgress(show);
        this.showService.removeFavorite(show);

        snackBarRef.dismiss();
      },
      error: (error) => onError(error, this.snackBar),
    });
  }

  async addSeason(seasonOrNumber?: Season | number, show?: Show): Promise<void> {
    if (!seasonOrNumber || !show)
      return onError(undefined, this.snackBar, undefined, 'Season or show is missing');

    const confirm = await this.dialogService.confirm({
      title: 'Mark as seen?',
      message: 'Do you want to mark the season as seen?',
      confirmButton: 'Mark as seen',
    });
    if (!confirm) return;

    const snackBarRef = this.snackBar.open('Marking season as seen...');

    const season =
      typeof seasonOrNumber === 'number'
        ? await lastValueFrom(this.seasonService.getSeasonFromNumber$(seasonOrNumber, show))
        : seasonOrNumber;

    if (!season) return onError(undefined, this.snackBar, undefined, 'Season does not exist');

    this.seasonService.addSeason(season).subscribe({
      next: async (res) => {
        if (res.not_found.shows.length > 0)
          return onError(res, this.snackBar, undefined, 'Show(s) not found');

        await this.syncService.syncNew();

        snackBarRef.dismiss();
      },
      error: (error) => onError(error, this.snackBar),
    });
  }

  async removeSeason(season?: Season, show?: Show): Promise<void> {
    if (!season || !show)
      return onError(undefined, this.snackBar, undefined, 'Season or show is missing');

    const confirm = await this.dialogService.confirm({
      title: 'Mark as unseen?',
      message: 'Do you want to mark the season as not seen?',
      confirmButton: 'Mark as unseen',
    });
    if (!confirm) return;

    const snackBarRef = this.snackBar.open('Marking season as unseen...');

    this.seasonService.removeSeason(season).subscribe({
      next: async (res) => {
        if (res.not_found.shows.length > 0)
          return onError(res, this.snackBar, undefined, 'Show(s) not found');

        await this.syncService.syncNew();

        snackBarRef.dismiss();
      },
      error: (error) => onError(error, this.snackBar),
    });
  }
}
