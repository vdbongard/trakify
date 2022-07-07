import { Injectable } from '@angular/core';
import { Observable, of, switchMap } from 'rxjs';
import { Episode as TraktEpisode, Ids, LastActivity } from '../../types/interfaces/Trakt';
import { TmdbService } from './tmdb.service';
import { OAuthService } from 'angular-oauth2-oidc';
import { ConfigService } from './config.service';
import { ShowService } from './show.service';
import { HttpClient } from '@angular/common/http';
import { Config } from '../config';
import { AuthService } from './auth.service';
import { MatSnackBar } from '@angular/material/snack-bar';

@Injectable({
  providedIn: 'root',
})
export class SyncService {
  constructor(
    private http: HttpClient,
    private tmdbService: TmdbService,
    private oauthService: OAuthService,
    private showService: ShowService,
    private configService: ConfigService,
    private authService: AuthService,
    private snackBar: MatSnackBar
  ) {
    this.authService.isLoggedIn$
      .pipe(switchMap((isLoggedIn) => (isLoggedIn ? this.fetchLastActivity() : of(undefined))))
      .subscribe({
        next: async (lastActivity: LastActivity | undefined) => {
          if (!lastActivity) return;
          await this.showService.sync(lastActivity);
        },
        error: () => {
          this.snackBar.open(`An error occurred while fetching trakt`, undefined, {
            duration: 2000,
          });
        },
      });

    this.showService.showsProgress$.subscribe((showsProgress) => {
      Object.entries(showsProgress).forEach(async ([showId, showProgress]) => {
        if (!showProgress.next_episode) return;
        await this.showService.syncShowEpisode(
          parseInt(showId),
          showProgress.next_episode.season,
          showProgress.next_episode.number
        );
      });
    });
  }

  fetchLastActivity(): Observable<LastActivity> {
    return this.http.get<LastActivity>(
      `${Config.traktBaseUrl}/sync/last_activities`,
      Config.traktOptions
    );
  }

  syncAddToHistory(episode: TraktEpisode, ids: Ids): void {
    this.showService.addToHistory(episode).subscribe(async (res) => {
      if (res.not_found.episodes.length > 0) {
        console.error('res', res);
        return;
      }

      this.fetchLastActivity().subscribe((lastActivity) => {
        this.showService.sync(lastActivity);
        this.showService.removeNewShow(ids.trakt);
      });
    });
  }

  syncRemoveFromHistory(episode: TraktEpisode, ids: Ids): void {
    this.showService.removeFromHistory(episode).subscribe(async (res) => {
      if (res.not_found.episodes.length > 0) {
        console.error('res', res);
        return;
      }

      this.fetchLastActivity().subscribe((lastActivity) => {
        this.showService.sync(lastActivity);
        this.showService.addNewShow(ids, episode);
      });
    });
  }
}
