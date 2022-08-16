import { Injectable } from '@angular/core';
import { Episode, Ids, Season, TraktShow } from '../../../types/interfaces/Trakt';
import { onError } from '../helper/error';
import { forkJoin } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { TmdbService } from './tmdb.service';
import { OAuthService } from 'angular-oauth2-oidc';
import { ShowService } from './trakt/show.service';
import { ConfigService } from './config.service';
import { AuthService } from './auth.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ListService } from './trakt/list.service';
import { EpisodeService } from './trakt/episode.service';
import { InfoService } from './info.service';
import { TranslationService } from './trakt/translation.service';
import { List } from '../../../types/interfaces/TraktList';
import { DialogService } from './dialog.service';
import { SyncService } from './sync.service';
import { SeasonService } from './trakt/season.service';

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

  addEpisode(episode?: Episode | null, ids?: Ids): void {
    if (!episode || !ids) throw Error('Argument is missing');
    this.episodeService.addEpisode(episode).subscribe({
      next: async (res) => {
        if (res.not_found.episodes.length > 0)
          return onError(res, this.snackBar, undefined, 'Episode(s) not found');

        forkJoin([
          this.showService.syncShowProgress(ids.trakt, { force: true, publishSingle: true }),
          this.showService.syncShowsWatched({ force: true, publishSingle: false }),
          this.listService.syncWatchlist({ force: true, publishSingle: false }),
        ]).subscribe();
      },
      error: (error) => onError(error, this.snackBar),
    });
  }

  removeEpisode(episode?: Episode, ids?: Ids): void {
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

  async removeList(listSlug?: string): Promise<void> {
    if (!listSlug) return onError(undefined, this.snackBar, undefined, 'List is missing');

    const confirm = await this.dialogService.confirm({
      title: 'Remove list?',
      message: 'Do you want to remove the active list?',
      confirmButton: 'Remove',
    });
    if (!confirm) return;

    this.listService.removeList({ ids: { slug: listSlug } } as List).subscribe({
      next: async () => {
        this.listService
          .syncLists({
            force: true,
            publishSingle: true,
          })
          .subscribe();
      },
      error: (error) => onError(error, this.snackBar),
    });
  }

  async addShow(show?: TraktShow): Promise<void> {
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

        forkJoin([
          this.showService.syncShowProgress(show.ids.trakt, {
            force: true,
            publishSingle: true,
          }),
          this.showService.syncShowsWatched({ force: true, publishSingle: true }),
        ]).subscribe();
      },
      error: (error) => onError(error, this.snackBar),
    });
  }

  async removeShow(show?: TraktShow): Promise<void> {
    if (!show) return onError(undefined, this.snackBar, undefined, 'Show is missing');

    const confirm = await this.dialogService.confirm({
      title: 'Remove show?',
      message: 'Do you want to remove the show?',
      confirmButton: 'Remove',
    });
    if (!confirm) return;

    this.showService.removeShow(show).subscribe({
      next: async (res) => {
        if (res.not_found.shows.length > 0)
          return onError(res, this.snackBar, undefined, 'Show(s) not found');

        forkJoin([
          this.showService.syncShowProgress(show.ids.trakt, {
            force: true,
            publishSingle: true,
          }),
          this.showService.syncShowsWatched({ force: true, publishSingle: true }),
        ]).subscribe();

        this.showService.removeFavorite(show);
      },
      error: (error) => onError(error, this.snackBar),
    });
  }

  async addSeason(season?: Season, show?: TraktShow): Promise<void> {
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

        forkJoin([
          this.showService.syncShowProgress(show.ids.trakt, {
            force: true,
            publishSingle: true,
          }),
          this.showService.syncShowsWatched({ force: true, publishSingle: true }),
        ]).subscribe();
      },
      error: (error) => onError(error, this.snackBar),
    });
  }

  async removeSeason(season?: Season, show?: TraktShow): Promise<void> {
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

        forkJoin([
          this.showService.syncShowProgress(show.ids.trakt, {
            force: true,
            publishSingle: true,
          }),
          this.showService.syncShowsWatched({ force: true, publishSingle: true }),
        ]).subscribe();
      },
      error: (error) => onError(error, this.snackBar),
    });
  }
}
