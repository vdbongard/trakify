import { Component, OnDestroy, OnInit } from '@angular/core';
import {
  BehaviorSubject,
  combineLatest,
  filter,
  forkJoin,
  of,
  Subscription,
  switchMap,
} from 'rxjs';
import { ShowInfo } from '../../../../types/interfaces/Show';
import { TmdbService } from '../../../services/tmdb.service';
import { ShowService } from '../../../services/show.service';
import { wait } from '../../../helper/wait';
import { ActivatedRoute, Router } from '@angular/router';
import { WatchlistItem } from '../../../../types/interfaces/TraktList';

@Component({
  selector: 'app-add-show',
  templateUrl: './add-show.component.html',
  styleUrls: ['./add-show.component.scss'],
})
export class AddShowComponent implements OnInit, OnDestroy {
  subscriptions: Subscription[] = [];
  shows: ShowInfo[] = [];
  isLoading = new BehaviorSubject<boolean>(false);
  searchValue?: string;
  isWatchlist?: boolean;

  constructor(
    public showService: ShowService,
    public tmdbService: TmdbService,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  async ngOnInit(): Promise<void> {
    this.subscriptions = [
      this.route.queryParams.subscribe(async (queryParams) => {
        this.searchValue = queryParams['search'];
        this.isWatchlist = !!queryParams['is-watchlist'];
        if (!this.searchValue) return this.getTrendingShows();
        this.searchForShow(this.searchValue);
      }),
      combineLatest([this.showService.getShowsAll$(), this.showService.showsProgress$]).subscribe(
        () => {
          this.shows.forEach((show) => {
            const showId = show.show.ids.trakt;
            show.showWatched = this.showService.getShowWatched(showId);
            show.showProgress = this.showService.getShowProgress(showId);
          });
        }
      ),
      this.showService.updated
        .pipe(
          switchMap(() => this.showService.fetchWatchlist().pipe(filter(() => !!this.isWatchlist)))
        )
        .subscribe((watchlistItems) => {
          this.shows.forEach((show) => {
            const showId = show.show.ids.trakt;
            show.isWatchlist = this.isWatchlistItem(showId, watchlistItems);
          });
        }),
    ];
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach((subscription) => subscription.unsubscribe());
  }

  searchForShow(searchValue: string): void {
    this.isLoading.next(true);
    this.shows = [];

    this.showService.fetchSearchForShows(searchValue).subscribe((results) => {
      forkJoin(
        results.map((result) => {
          const tmdbId = result.show.ids.tmdb;
          if (!tmdbId) return of(undefined);
          return this.tmdbService.fetchShow(tmdbId);
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

  getTrendingShows(): void {
    this.isLoading.next(true);
    this.shows = [];
    this.showService.fetchTrendingShows().subscribe((trendingShows) => {
      forkJoin(
        trendingShows.map((trendingShow) => this.tmdbService.fetchShow(trendingShow.show.ids.tmdb))
      ).subscribe(async (tmdbShows) => {
        trendingShows.forEach((trendingShow, i) => {
          this.shows.push({
            show: trendingShow.show,
            tmdbShow: tmdbShows[i],
            showProgress: this.showService.getShowProgress(trendingShow.show.ids.trakt),
            showWatched: this.showService.getShowWatched(trendingShow.show.ids.trakt),
          });
        });
        await wait();
        this.isLoading.next(false);
      });
    });
  }

  isWatchlistItem(showId: number, watchlistItems: WatchlistItem[]): boolean {
    return !!watchlistItems.find((watchlistItem) => watchlistItem.show.ids.trakt === showId);
  }

  async searchSubmitted(): Promise<void> {
    if (!this.searchValue) {
      await this.router.navigate(['add-series'], {
        queryParamsHandling: 'merge',
      });
      return;
    }

    await this.router.navigate(['add-series'], {
      queryParamsHandling: 'merge',
      queryParams: { search: this.searchValue },
    });
  }
}
