import { Component, OnDestroy, OnInit } from '@angular/core';
import { OAuthService } from 'angular-oauth2-oidc';
import { ShowService } from '../../services/show.service';
import { combineLatest, Subscription } from 'rxjs';
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
  shows: { showWatched: ShowWatched; showProgress: ShowProgress }[] = [];
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
      combineLatest([
        this.showService.showsWatched,
        this.showService.showsProgress,
        this.showService.showsHidden,
        this.showService.showsEpisodes,
      ]).subscribe(([showsWatched, showsProgress, showsHidden, showsEpisodes]) => {
        if (!showsWatched || !showsHidden) return;
        if (Object.keys(showsProgress).length === 0) return;

        showsWatched.forEach((showWatched) => {
          const showProgress = showsProgress[showWatched.show.ids.trakt];
          if (!showProgress) return;
          if (showProgress.aired === showProgress.completed) return;
          if (showsHidden.find((show) => show.show.ids.trakt === showWatched.show.ids.trakt))
            return;

          this.shows.push({ showWatched, showProgress });
        });
        this.shows.sort((a, b) => {
          const nextEpisodeA = showsEpisodes[a.showWatched.show.ids.trakt].find(
            (episode) =>
              episode.season === a.showProgress.next_episode.season &&
              episode.number === a.showProgress.next_episode.number
          );
          const nextEpisodeB = showsEpisodes[b.showWatched.show.ids.trakt].find(
            (episode) =>
              episode.season === b.showProgress.next_episode.season &&
              episode.number === b.showProgress.next_episode.number
          );
          if (!nextEpisodeA) return 1;
          if (!nextEpisodeB) return -1;
          return (
            new Date(nextEpisodeB.first_aired).getTime() -
            new Date(nextEpisodeA.first_aired).getTime()
          );
        });
      }),
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
