import { Component, OnDestroy, OnInit } from '@angular/core';
import { OAuthService } from 'angular-oauth2-oidc';
import { ShowService } from '../../services/show.service';
import { Subscription } from 'rxjs';
import { ShowProgress, ShowWatched } from '../../../types/interfaces/Trakt';
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
  showsProgress: { [id: number]: ShowProgress } = {};
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
      this.showService.showsProgress.subscribe((shows) => (this.showsProgress = shows)),
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

  setCustomFields(shows: ShowWatched[]): void {
    shows.forEach((show) => {
      show.episodesWatched = this.getNumberOfEpisodesWatched(show);
    });
  }

  getNumberOfEpisodesWatched(show: ShowWatched): number {
    let number = 0;
    show.seasons.forEach((season) => {
      if (season.number === 0) return;
      season.episodes.forEach(() => {
        number++;
      });
    });
    return number;
  }
}
