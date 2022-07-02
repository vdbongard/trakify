import { Component, OnDestroy, OnInit } from '@angular/core';
import { BehaviorSubject, combineLatest, filter, forkJoin, of, Subscription } from 'rxjs';
import { ShowInfo } from '../../../../types/interfaces/Show';
import { TmdbService } from '../../../services/tmdb.service';
import { ShowService } from '../../../services/show.service';
import { wait } from '../../../helper/wait';
import { ActivatedRoute, Router } from '@angular/router';

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

        if (!this.searchValue) {
          this.getTrendingShows();
          return;
        }

        this.isLoading.next(true);
        this.shows = [];

        this.showService.fetchSearchForShows(this.searchValue).subscribe((results) => {
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
      }),
      this.showService
        .fetchWatchlist()
        .pipe(filter(() => !!this.isWatchlist))
        .subscribe((watchlistItems) => {
          watchlistItems.forEach((watchlistItem) => {
            const watchlistShow = this.shows.find(
              (show) => show.show.ids.trakt === watchlistItem.show.ids.trakt
            );
            if (watchlistShow) watchlistShow.isWatchlist = true;
          });
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
    ];
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach((subscription) => subscription.unsubscribe());
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
