import { Component, OnDestroy, OnInit } from '@angular/core';
import {
  BehaviorSubject,
  combineLatest,
  filter,
  forkJoin,
  map,
  Observable,
  of,
  take,
  takeUntil,
} from 'rxjs';
import { ShowInfo } from '../../../../types/interfaces/Show';
import { TmdbService } from '../../../services/tmdb.service';
import { ShowService } from '../../../services/show.service';
import { wait } from '../../../helper/wait';
import { ActivatedRoute, Router } from '@angular/router';
import { WatchlistItem } from '../../../../types/interfaces/TraktList';
import { Chip } from '../../../../types/interfaces/Chip';
import { TraktShow } from '../../../../types/interfaces/Trakt';
import { ListService } from '../../../services/list.service';
import { BaseComponent } from '../../../helper/base-component';

@Component({
  selector: 'app-add-show',
  templateUrl: './add-show.component.html',
  styleUrls: ['./add-show.component.scss'],
})
export class AddShowComponent extends BaseComponent implements OnInit, OnDestroy {
  shows: ShowInfo[] = [];
  isLoading = new BehaviorSubject<boolean>(false);
  searchValue?: string;
  isWatchlist?: boolean;

  chips: Chip[] = [
    {
      name: 'Trending',
      observable: this.showService
        .fetchTrendingShows()
        .pipe(map((shows) => shows.map((show) => show.show))),
    },
    {
      name: 'Popular',
      observable: this.showService.fetchPopularShows(),
    },
    {
      name: 'Recommended',
      observable: this.showService
        .fetchRecommendedShows()
        .pipe(map((shows) => shows.map((show) => show.show))),
    },
  ];
  activeChip = 0;

  constructor(
    public showService: ShowService,
    public tmdbService: TmdbService,
    private router: Router,
    private route: ActivatedRoute,
    public listService: ListService
  ) {
    super();
  }

  async ngOnInit(): Promise<void> {
    this.route.queryParams.pipe(takeUntil(this.destroy$)).subscribe(async (queryParams) => {
      this.searchValue = queryParams['search'];
      this.isWatchlist = !!queryParams['is-watchlist'];
      if (!this.searchValue) return this.getCustomShows(this.chips[this.activeChip].observable);
      this.searchForShow(this.searchValue);
    });

    combineLatest([
      this.showService.getShowsWatchedWatchlistedAndAdded$(),
      this.showService.showsProgress$,
    ])
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.shows.forEach((show) => {
          const showId = show.show?.ids.trakt;
          show.showWatched = this.showService.getShowWatched(showId);
          show.showProgress = this.showService.getShowProgress(showId);
        });
      });

    this.listService.watchlist$
      .pipe(
        filter(() => !!this.isWatchlist),
        takeUntil(this.destroy$)
      )
      .subscribe((watchlistItems) => {
        this.shows.forEach((show) => {
          const showId = show.show?.ids.trakt;
          show.isWatchlist = this.isWatchlistItem(showId, watchlistItems);
        });
      });
  }

  searchForShow(searchValue: string): void {
    this.isLoading.next(true);
    this.shows = [];

    this.showService.fetchSearchForShows(searchValue).subscribe((results) => {
      forkJoin(
        results.map((result) => {
          const tmdbId = result.show.ids.tmdb;
          if (!tmdbId) return of(undefined);
          return this.tmdbService.fetchTmdbShow(tmdbId);
        })
      ).subscribe(async (tmdbShows) => {
        for (let i = 0; i < tmdbShows.length; i++) {
          this.shows.push({
            show: results[i].show,
            tmdbShow: tmdbShows[i],
            showProgress: this.showService.getShowProgress(results[i].show.ids.trakt),
            showWatched: this.showService.getShowWatched(results[i].show.ids.trakt),
          });
        }

        await wait();
        this.isLoading.next(false);
      });
    });
  }

  getCustomShows(fetch: Observable<TraktShow[]>): void {
    this.isLoading.next(true);
    this.shows = [];
    fetch.subscribe((shows) => {
      const tmdbShows = forkJoin(
        shows.map((show) => this.tmdbService.fetchTmdbShow(show.ids.tmdb))
      );
      const watchlist = this.listService.watchlist$;
      combineLatest([tmdbShows, watchlist])
        .pipe(take(1))
        .subscribe(async ([tmdbShows, watchlistItems]) => {
          shows.forEach((show, i) => {
            this.shows.push({
              show: show,
              tmdbShow: tmdbShows[i],
              showProgress: this.showService.getShowProgress(show.ids.trakt),
              showWatched: this.showService.getShowWatched(show.ids.trakt),
              isWatchlist: this.isWatchlist && this.isWatchlistItem(show.ids.trakt, watchlistItems),
            });
          });
          await wait();
          this.isLoading.next(false);
        });
    });
  }

  isWatchlistItem(showId: number | undefined, watchlistItems: WatchlistItem[]): boolean {
    if (!showId) return false;
    return !!watchlistItems.find((watchlistItem) => watchlistItem.show.ids.trakt === showId);
  }

  async searchSubmitted(): Promise<void> {
    if (!this.searchValue) {
      await this.router.navigate(['series', 'add-series'], {
        queryParamsHandling: 'merge',
      });
      return;
    }

    await this.router.navigate(['series', 'add-series'], {
      queryParamsHandling: 'merge',
      queryParams: { search: this.searchValue },
    });
  }

  changeSelection(index: number): void {
    this.activeChip = index;
    this.getCustomShows(this.chips[index].observable);
  }
}
