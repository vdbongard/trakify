import { Component, OnDestroy, OnInit } from '@angular/core';
import {
  EpisodeFull,
  ShowHidden,
  ShowProgress,
  ShowWatched,
} from '../../../types/interfaces/Trakt';
import { Config } from '../../../types/interfaces/Config';
import { Configuration, Show } from '../../../types/interfaces/Tmdb';
import { combineLatest, Subscription } from 'rxjs';
import { ShowService } from '../../services/show.service';
import { TmdbService } from '../../services/tmdb.service';
import { ConfigService } from '../../services/config.service';

@Component({
  selector: 'app-shows',
  templateUrl: './shows.component.html',
  styleUrls: ['./shows.component.scss'],
})
export class ShowsComponent implements OnInit, OnDestroy {
  subscriptions: Subscription[] = [];
  shows: { showWatched: ShowWatched; showProgress: ShowProgress }[] = [];
  tmdbShows: { [key: number]: Show } | undefined;
  tmdbConfig: Configuration | undefined;
  favorites: number[] = [];

  constructor(
    public showService: ShowService,
    public tmdbService: TmdbService,
    private configService: ConfigService
  ) {}

  ngOnInit(): void {
    this.subscriptions = [
      combineLatest([
        this.showService.showsWatched,
        this.showService.showsProgress,
        this.showService.showsHidden,
        this.showService.showsEpisodes,
        this.showService.favorites,
        this.configService.config,
        this.tmdbService.shows,
      ]).subscribe(
        ([
          showsWatched,
          showsProgress,
          showsHidden,
          showsEpisodes,
          favorites,
          config,
          tmdbShows,
        ]) => {
          if (
            !showsWatched ||
            !showsHidden ||
            !config ||
            !showsProgress ||
            !showsEpisodes ||
            !tmdbShows
          )
            return;

          const shows: { showWatched: ShowWatched; showProgress: ShowProgress }[] = [];

          showsWatched.forEach((showWatched) => {
            const showProgress = showsProgress[showWatched.show.ids.trakt];
            if (!showProgress) return;
            if (this.hideNoNewEpisodes(showProgress, config)) return;
            if (this.hideCompleted(showProgress, tmdbShows[showWatched.show.ids.tmdb], config))
              return;
            if (this.hideHidden(showsHidden, showWatched, config)) return;

            shows.push({ showWatched, showProgress });
          });
          shows.sort((a, b) => {
            const sortFavorites = this.sortFavoritesFirst(a, b, favorites, config);
            if (sortFavorites) return sortFavorites;

            const sortByNextEpisode = this.sortByNewestEpisode(a, b, showsEpisodes, config);
            if (sortByNextEpisode) return sortByNextEpisode;

            return 1;
          });

          this.shows = shows;
        }
      ),
      this.showService.favorites.subscribe((favorites) => (this.favorites = favorites)),
      this.tmdbService.shows.subscribe((shows) => (this.tmdbShows = shows)),
      this.tmdbService.config.subscribe((config) => (this.tmdbConfig = config)),
    ];
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach((subscription) => subscription.unsubscribe());
  }

  private hideHidden(showsHidden: ShowHidden[], showWatched: ShowWatched, config: Config): boolean {
    return (
      !!config.filters.find((filter) => filter.name === 'Hidden' && filter.value) &&
      !!showsHidden.find((show) => show.show.ids.trakt === showWatched.show.ids.trakt)
    );
  }

  private hideNoNewEpisodes(showProgress: ShowProgress, config: Config): boolean {
    return (
      !!config.filters.find((filter) => filter.name === 'No new episodes' && filter.value) &&
      showProgress.aired === showProgress.completed
    );
  }

  private hideCompleted(showProgress: ShowProgress, tmdbShow: Show, config: Config): boolean {
    return (
      !!config.filters.find((filter) => filter.name === 'Completed' && filter.value) &&
      ['Ended', 'Canceled'].includes(tmdbShow.status) &&
      showProgress.aired === showProgress.completed
    );
  }

  private sortFavoritesFirst(
    a: { showWatched: ShowWatched; showProgress: ShowProgress },
    b: { showWatched: ShowWatched; showProgress: ShowProgress },
    favorites: number[],
    config: Config
  ): number | undefined {
    if (
      !config.sortOptions.find(
        (sortOption) => sortOption.name === 'Favorites first' && sortOption.value
      )
    )
      return;
    if (
      favorites.includes(a.showWatched.show.ids.trakt) &&
      !favorites.includes(b.showWatched.show.ids.trakt)
    )
      return -1;
    if (
      favorites.includes(b.showWatched.show.ids.trakt) &&
      !favorites.includes(a.showWatched.show.ids.trakt)
    )
      return 1;
    return;
  }

  private sortByNewestEpisode(
    a: { showWatched: ShowWatched; showProgress: ShowProgress },
    b: { showWatched: ShowWatched; showProgress: ShowProgress },
    showsEpisodes: { [id: number]: EpisodeFull[] },
    config: Config
  ): number | undefined {
    if (config.sort.by !== 'Newest episode') return;

    const nextEpisodeA = showsEpisodes[a.showWatched.show.ids.trakt]?.find(
      (episode) =>
        episode.season === a.showProgress.next_episode.season &&
        episode.number === a.showProgress.next_episode.number
    );
    const nextEpisodeB = showsEpisodes[b.showWatched.show.ids.trakt]?.find(
      (episode) =>
        episode.season === b.showProgress.next_episode.season &&
        episode.number === b.showProgress.next_episode.number
    );
    if (!nextEpisodeA) return 1;
    if (!nextEpisodeB) return -1;
    return (
      new Date(nextEpisodeB.first_aired).getTime() - new Date(nextEpisodeA.first_aired).getTime()
    );
  }

  showId(index: number, show: { showWatched: ShowWatched; showProgress: ShowProgress }): number {
    return show.showWatched.show.ids.trakt;
  }
}
