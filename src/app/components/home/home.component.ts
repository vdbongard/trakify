import { Component, OnDestroy, OnInit } from '@angular/core';
import { OAuthService } from 'angular-oauth2-oidc';
import { SeriesService } from '../../services/series.service';
import { Subscription } from 'rxjs';
import { LastActivity, SeriesWatched } from '../../../types/interfaces/Trakt';
import { TmdbService } from '../../services/tmdb.service';
import { Configuration, Series } from '../../../types/interfaces/Tmdb';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss'],
})
export class HomeComponent implements OnInit, OnDestroy {
  isLoggedIn = false;
  subscriptions: Subscription[] = [];
  seriesWatched: SeriesWatched[] = [];
  tmdbSeries: { [key: number]: Series } | undefined;
  config: Configuration | undefined;

  constructor(
    private oauthService: OAuthService,
    private seriesService: SeriesService,
    public tmdbService: TmdbService
  ) {}

  ngOnInit(): void {
    this.isLoggedIn = this.oauthService.hasValidAccessToken();

    if (!this.isLoggedIn) return;

    this.seriesService.getLastActivity().subscribe((lastActivity: LastActivity) => {
      const localLastActivity = this.seriesService.getLocalLastActivity();
      if (
        Object.keys(localLastActivity).length > 0 &&
        new Date(lastActivity.episodes.watched_at) <=
          new Date(localLastActivity.episodes.watched_at)
      )
        return;

      this.seriesService.setLocalLastActivity(lastActivity);
      this.seriesService.sync();
    });

    this.subscriptions = [
      this.seriesService.seriesWatched.subscribe((series) => {
        this.seriesWatched = series;
        this.seriesWatched.forEach((series) => {
          this.tmdbService.syncSeries(series.show.ids.tmdb);
        });
      }),
      this.tmdbService.series.subscribe((series) => {
        this.tmdbSeries = series;
      }),
      this.tmdbService.config.subscribe((config) => (this.config = config)),
    ];
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach((subscription) => subscription.unsubscribe());
  }

  async login(): Promise<void> {
    this.oauthService.initCodeFlow();
  }
}
