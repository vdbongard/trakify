import { Component, OnDestroy, OnInit } from '@angular/core';
import { OAuthService } from 'angular-oauth2-oidc';
import { SeriesService } from '../../services/series.service';
import { Subscription } from 'rxjs';
import { SeriesWatched, SeriesWatchedHistory } from '../../../types/interfaces/Trakt';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss'],
})
export class HomeComponent implements OnInit, OnDestroy {
  isLoggedIn = false;
  subscriptions: Subscription[] = [];
  seriesWatched: SeriesWatched[] = [];
  seriesWatchedHistory: SeriesWatchedHistory[] = [];

  constructor(private oauthService: OAuthService, private seriesService: SeriesService) {}

  ngOnInit(): void {
    this.isLoggedIn = this.oauthService.hasValidAccessToken();

    if (!this.isLoggedIn) return;

    this.subscriptions = [
      this.seriesService.getSeriesWatched().subscribe((series) => (this.seriesWatched = series)),
      this.seriesService
        .getSeriesWatchedHistory()
        .subscribe((series) => (this.seriesWatchedHistory = series)),
    ];
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach((subscription) => subscription.unsubscribe());
  }

  async login(): Promise<void> {
    this.oauthService.initCodeFlow();
  }
}
