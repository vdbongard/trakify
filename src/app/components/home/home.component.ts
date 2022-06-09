import { Component, OnDestroy, OnInit } from '@angular/core';
import { OAuthService } from 'angular-oauth2-oidc';
import { ShowService } from '../../services/show.service';
import { Subscription } from 'rxjs';
import { ShowWatched } from '../../../types/interfaces/Trakt';
import { TmdbService } from '../../services/tmdb.service';
import { Configuration, Show } from '../../../types/interfaces/Tmdb';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss'],
})
export class HomeComponent implements OnInit, OnDestroy {
  isLoggedIn = false;
  subscriptions: Subscription[] = [];
  showsWatched: ShowWatched[] = [];
  tmdbShows: { [key: number]: Show } | undefined;
  config: Configuration | undefined;

  constructor(
    private oauthService: OAuthService,
    private showService: ShowService,
    public tmdbService: TmdbService
  ) {}

  ngOnInit(): void {
    this.isLoggedIn = this.oauthService.hasValidAccessToken();

    if (!this.isLoggedIn) return;

    this.subscriptions = [
      this.showService.showsWatched.subscribe((shows) => (this.showsWatched = shows)),
      this.tmdbService.shows.subscribe((shows) => (this.tmdbShows = shows)),
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
