import { Component, OnDestroy, OnInit } from '@angular/core';
import {
  BehaviorSubject,
  catchError,
  combineLatest,
  filter,
  forkJoin,
  map,
  Observable,
  of,
  take,
  takeUntil,
  tap,
} from 'rxjs';
import { ShowInfo } from '../../../../types/interfaces/Show';
import { TmdbService } from '../../../services/tmdb.service';
import { ActivatedRoute, Router } from '@angular/router';
import { WatchlistItem } from '../../../../types/interfaces/TraktList';
import { Chip } from '../../../../types/interfaces/Chip';
import { TraktShow } from '../../../../types/interfaces/Trakt';
import { ListService } from '../../../services/trakt/list.service';
import { BaseComponent } from '../../../helper/base-component';
import { LoadingState } from '../../../../types/enum';
import { InfoService } from '../../../services/info.service';
import { ShowService } from '../../../services/trakt/show.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { onError } from '../../../helper/error';

@Component({
  selector: 'app-add-show',
  templateUrl: './add-show.component.html',
  styleUrls: ['./add-show.component.scss'],
})
export class AddShowComponent extends BaseComponent implements OnInit, OnDestroy {
  loadingState = new BehaviorSubject<LoadingState>(LoadingState.LOADING);
  showsInfos: ShowInfo[] = [];
  searchValue?: string;
  isWatchlist?: boolean;

  chips: Chip[] = [
    {
      name: 'Trending',
      slug: 'trending',
      observable: this.showService
        .fetchTrendingShows()
        .pipe(map((shows) => shows.map((show) => show.show))),
    },
    {
      name: 'Popular',
      slug: 'popular',
      observable: this.showService.fetchPopularShows(),
    },
    {
      name: 'Recommended',
      slug: 'recommended',
      observable: this.showService
        .fetchRecommendedShows()
        .pipe(map((shows) => shows.map((show) => show.show))),
    },
  ];
  defaultSlug = 'trending';
  activeSlug = 'trending';

  constructor(
    public showService: ShowService,
    public infoService: InfoService,
    public tmdbService: TmdbService,
    private router: Router,
    private route: ActivatedRoute,
    public listService: ListService,
    private snackBar: MatSnackBar
  ) {
    super();
  }

  async ngOnInit(): Promise<void> {
    this.route.queryParams.pipe(takeUntil(this.destroy$)).subscribe(async (queryParams) => {
      this.searchValue = queryParams['search'];
      this.isWatchlist = !!queryParams['is-watchlist'];
      this.activeSlug = queryParams['slug'] ?? this.defaultSlug;

      if (!this.searchValue) {
        const chip: Chip | undefined = this.chips.find((chip) => chip.slug === this.activeSlug);
        return this.getCustomShows(chip?.observable);
      }

      this.searchForShow(this.searchValue);
    });

    combineLatest([this.showService.getShows$(), this.showService.showsProgress$])
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.showsInfos.forEach((show) => {
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
        this.showsInfos.forEach((show) => {
          const showId = show.show?.ids.trakt;
          show.isWatchlist = this.isWatchlistItem(showId, watchlistItems);
        });
      });
  }

  searchForShow(searchValue: string): void {
    this.showService
      .fetchSearchForShows(searchValue)
      .pipe(tap(() => (this.showsInfos = [])))
      .subscribe({
        next: (results) => {
          forkJoin(
            results.map((result) => {
              const ids = result.show.ids;
              if (!ids) return of(undefined);
              return this.tmdbService.getTmdbShow$(ids, false, true).pipe(
                take(1),
                catchError(() => of(undefined))
              );
            })
          ).subscribe(async (tmdbShows) => {
            for (let i = 0; i < tmdbShows.length; i++) {
              this.showsInfos.push({
                show: results[i].show,
                tmdbShow: tmdbShows[i],
                showProgress: this.showService.getShowProgress(results[i].show.ids.trakt),
                showWatched: this.showService.getShowWatched(results[i].show.ids.trakt),
              });
            }

            this.loadingState.next(LoadingState.SUCCESS);
          });
        },
        error: (error) => onError(error, this.snackBar, this.loadingState),
      });
  }

  getCustomShows(fetch?: Observable<TraktShow[]>): void {
    if (!fetch) return;

    this.loadingState.next(LoadingState.LOADING);
    this.showsInfos = [];

    fetch.subscribe((shows) => {
      const tmdbShows = forkJoin(
        shows.map((show) => this.tmdbService.getTmdbShow$(show.ids, false, true).pipe(take(1)))
      );
      const watchlist = this.listService.watchlist$;
      combineLatest([tmdbShows, watchlist])
        .pipe(take(1))
        .subscribe({
          next: async ([tmdbShows, watchlistItems]) => {
            shows.forEach((show, i) => {
              this.showsInfos.push({
                show: show,
                tmdbShow: tmdbShows[i],
                showProgress: this.showService.getShowProgress(show.ids.trakt),
                showWatched: this.showService.getShowWatched(show.ids.trakt),
                isWatchlist:
                  this.isWatchlist && this.isWatchlistItem(show.ids.trakt, watchlistItems),
              });
            });

            this.loadingState.next(LoadingState.SUCCESS);
          },
          error: (error) => onError(error, this.snackBar, this.loadingState),
        });
    });
  }

  isWatchlistItem(showId: number | undefined, watchlistItems: WatchlistItem[]): boolean {
    if (!showId) return false;
    return !!watchlistItems.find((watchlistItem) => watchlistItem.show.ids.trakt === showId);
  }

  async searchSubmitted(event: SubmitEvent): Promise<void> {
    const search = (
      (event.target as HTMLElement)?.querySelector('input[type="search"]') as HTMLInputElement
    )?.value;

    if (!search) {
      await this.router.navigate(['series', 'add-series'], {
        queryParamsHandling: 'merge',
      });
      return;
    }

    await this.router.navigate(['series', 'add-series'], {
      queryParamsHandling: 'merge',
      queryParams: { search },
    });
  }

  async changeSelection(slug: string): Promise<void> {
    await this.router.navigate([], { queryParamsHandling: 'merge', queryParams: { slug } });
  }
}
