import { Component, OnDestroy, OnInit } from '@angular/core';
import { OAuthService } from 'angular-oauth2-oidc';
import { SeriesService } from '../../services/series.service';
import { Subscription } from 'rxjs';
import { SeriesWatched } from '../../../types/interfaces/Trakt';
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

    this.subscriptions = [
      this.seriesService.seriesWatched.subscribe((series) => (this.seriesWatched = series)),
      this.tmdbService.series.subscribe((series) => (this.tmdbSeries = series)),
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
