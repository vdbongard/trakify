import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { MatSnackBar } from '@angular/material/snack-bar';
import { BehaviorSubject } from 'rxjs';
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

import type { Episode, Ids, Season, Show } from '@type/interfaces/Trakt';
import type { List } from '@type/interfaces/TraktList';

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

  addEpisode(episode?: Episode | null, ids?: Ids, state?: BehaviorSubject<LoadingState>): void {
    if (!episode || !ids) throw Error('Argument is missing');
    state?.next(LoadingState.LOADING);
    this.episodeService.addEpisode(episode).subscribe({
      next: async (res) => {
        if (res.not_found.episodes.length > 0) throw Error('Episode(s) not found');

        await this.syncService.syncNew();
        state?.next(LoadingState.SUCCESS);
      },
      error: (error) => onError(error, this.snackBar, state),
    });
  }

  removeEpisode(episode?: Episode | null, ids?: Ids, state?: BehaviorSubject<LoadingState>): void {
    if (!episode || !ids) throw Error('Argument is missing');
    state?.next(LoadingState.LOADING);
    this.episodeService.removeEpisode(episode).subscribe({
      next: async (res) => {
        if (res.not_found.episodes.length > 0) throw Error('Episode(s) not found');

        await this.syncService.syncNew();
        state?.next(LoadingState.SUCCESS);
      },
      error: (error) => onError(error, this.snackBar, state),
    });
  }

  addToWatchlist(ids: Ids): void {
    this.snackBar.open('Added show to the watchlist', undefined, {
      duration: 2000,
    });

    this.listService.addToWatchlist(ids).subscribe(async (res) => {
      if (res.not_found.shows.length > 0)
        return onError(res, this.snackBar, undefined, 'Show(s) not found');

      await this.syncService.syncNew();
    });
  }

  removeFromWatchlist(ids: Ids): void {
    this.listService.removeFromWatchlist(ids).subscribe(async (res) => {
      if (res.not_found.shows.length > 0)
        return onError(res, this.snackBar, undefined, 'Show(s) not found');

      await this.syncService.syncNew();
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

    this.listService.removeList({ ids: { slug: listSlug } } as List).subscribe({
      next: async () => {
        this.listService.lists
          .sync({
            force: true,
            publishSingle: true,
          })
          .subscribe();
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

    this.showService.addShow(show).subscribe({
      next: async (res) => {
        if (res.not_found.shows.length > 0)
          return onError(res, this.snackBar, undefined, 'Show(s) not found');

        await this.syncService.syncNew();
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

    this.showService.removeShow(show).subscribe({
      next: async (res) => {
        if (res.not_found.shows.length > 0)
          return onError(res, this.snackBar, undefined, 'Show(s) not found');

        await this.syncService.syncNew();

        this.showService.removeShowProgress(show);
        this.translationService.removeShowTranslation(show);
        this.tmdbService.removeShow(show);
        this.episodeService.removeShowsEpisodes(show);
        this.translationService.removeShowsEpisodesTranslation(show);
        this.showService.removeFavorite(show);

        snackBarRef.dismiss();
      },
      error: (error) => onError(error, this.snackBar),
    });
  }

  async addSeason(season?: Season, show?: Show): Promise<void> {
    if (!season || !show)
      return onError(undefined, this.snackBar, undefined, 'Season or show is missing');

    const confirm = await this.dialogService.confirm({
      title: 'Mark as seen?',
      message: 'Do you want to mark the season as seen?',
      confirmButton: 'Mark as seen',
    });
    if (!confirm) return;

    this.seasonService.addSeason(season).subscribe({
      next: async (res) => {
        if (res.not_found.shows.length > 0)
          return onError(res, this.snackBar, undefined, 'Show(s) not found');

        await this.syncService.syncNew();
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

    this.seasonService.removeSeason(season).subscribe({
      next: async (res) => {
        if (res.not_found.shows.length > 0)
          return onError(res, this.snackBar, undefined, 'Show(s) not found');

        await this.syncService.syncNew();
      },
      error: (error) => onError(error, this.snackBar),
    });
  }
}
