import { Component, OnDestroy, OnInit } from '@angular/core';
import {
  BehaviorSubject,
  combineLatest,
  filter,
  forkJoin,
  map,
  Observable,
  of,
  switchMap,
  take,
  takeUntil,
  tap,
} from 'rxjs';
import { ShowInfo } from '../../../../types/interfaces/Show';
import { TmdbService } from '../../../services/tmdb.service';
import { ActivatedRoute, Router } from '@angular/router';
import { WatchlistItem } from '../../../../types/interfaces/TraktList';
import { Chip } from '../../../../types/interfaces/Chip';
import { ShowProgress, TraktShow } from '../../../../types/interfaces/Trakt';
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

  watchlistItems?: WatchlistItem[];
  shows?: TraktShow[];
  showsProgress?: { [showId: number]: ShowProgress };

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

    this.showService
      .getShows$()
      .pipe(takeUntil(this.destroy$))
      .subscribe((shows) => {
        this.shows = shows;
      });

    this.showService.showsProgress$.pipe(takeUntil(this.destroy$)).subscribe((showsProgress) => {
      this.showsProgress = showsProgress;
    });

    this.listService.watchlist$
      .pipe(
        filter(() => !!this.isWatchlist),
        takeUntil(this.destroy$)
      )
      .subscribe((watchlistItems) => {
        this.watchlistItems = watchlistItems;
      });
  }

  searchForShow(searchValue: string): void {
    this.showService
      .fetchSearchForShows(searchValue)
      .pipe(
        tap(() => (this.showsInfos = [])),
        switchMap((results) => {
          const tmdbShows = forkJoin(
            results.map((result) =>
              result.show.ids
                ? this.tmdbService.getTmdbShow$(result.show.ids, false, true).pipe(take(1))
                : of(undefined)
            )
          );
          const showsProgress = forkJoin(
            results.map((result) =>
              result.show.ids
                ? this.showService.getShowProgress$(result.show.ids.trakt).pipe(take(1))
                : of(undefined)
            )
          );
          const showsWatched = forkJoin(
            results.map((result) =>
              result.show.ids
                ? this.showService.getShowWatched$(result.show.ids.trakt).pipe(take(1))
                : of(undefined)
            )
          );
          return combineLatest([of(results), tmdbShows, showsProgress, showsWatched]);
        })
      )
      .subscribe({
        next: ([results, tmdbShows, showProgress, showsWatched]) => {
          for (let i = 0; i < results.length; i++) {
            this.showsInfos.push({
              show: results[i].show,
              tmdbShow: tmdbShows[i],
              showProgress: showProgress[i],
              showWatched: showsWatched[i],
              isWatchlist: this.isWatchlistItem(results[i].show.ids.trakt, this.watchlistItems),
            });
          }

          this.loadingState.next(LoadingState.SUCCESS);
        },
        error: (error) => onError(error, this.snackBar, this.loadingState),
      });
  }

  getCustomShows(fetch?: Observable<TraktShow[]>): void {
    if (!fetch) return;

    this.loadingState.next(LoadingState.LOADING);
    this.showsInfos = [];

    fetch.subscribe((shows) => {
      forkJoin(
        shows.map((show) => this.tmdbService.getTmdbShow$(show.ids, false, true).pipe(take(1)))
      )
        .pipe(take(1))
        .subscribe({
          next: async (tmdbShows) => {
            shows.forEach((show, i) => {
              this.showsInfos.push({
                show,
                tmdbShow: tmdbShows[i],
                showProgress: this.showService.getShowProgress(show.ids.trakt),
                showWatched: this.showService.getShowWatched(show.ids.trakt),
                isWatchlist: this.isWatchlistItem(show.ids.trakt, this.watchlistItems),
              });
            });

            this.loadingState.next(LoadingState.SUCCESS);
          },
          error: (error) => onError(error, this.snackBar, this.loadingState),
        });
    });
  }

  isWatchlistItem(showId: number | undefined, watchlistItems?: WatchlistItem[]): boolean {
    if (!showId || !watchlistItems) return false;
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
