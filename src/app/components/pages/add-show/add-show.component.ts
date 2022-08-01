import { Component, OnDestroy, OnInit } from '@angular/core';
import {
  BehaviorSubject,
  filter,
  forkJoin,
  map,
  Observable,
  of,
  switchMap,
  take,
  takeUntil,
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

  watchlistItems?: WatchlistItem[];

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
    this.loadingState.next(LoadingState.LOADING);
    this.showsInfos = [];

    this.showService
      .fetchSearchForShows(searchValue)
      .pipe(
        switchMap((results) => {
          return forkJoin([
            of(results),
            forkJoin(
              results.map((result) =>
                forkJoin([
                  this.tmdbService.getTmdbShow$(result.show.ids, false, true).pipe(take(1)),
                  this.showService.getShowProgress$(result.show.ids.trakt).pipe(take(1)),
                  this.showService.getShowWatched$(result.show.ids.trakt).pipe(take(1)),
                ])
              )
            ),
          ]);
        })
      )
      .subscribe({
        next: ([results, infos]) => {
          this.showsInfos = results.map((result, i) => {
            return {
              show: result.show,
              tmdbShow: infos[i][0],
              showProgress: infos[i][1],
              showWatched: infos[i][2],
              isWatchlist: this.isWatchlistItem(result.show.ids.trakt, this.watchlistItems),
            };
          });

          this.loadingState.next(LoadingState.SUCCESS);
        },
        error: (error) => onError(error, this.snackBar, this.loadingState),
      });
  }

  getCustomShows(fetch?: Observable<TraktShow[]>): void {
    if (!fetch) return;

    this.loadingState.next(LoadingState.LOADING);
    this.showsInfos = [];

    fetch
      .pipe(
        switchMap((shows) => {
          return forkJoin([
            of(shows),
            forkJoin(
              shows.map((show) =>
                forkJoin([
                  this.tmdbService.getTmdbShow$(show.ids, false, true).pipe(take(1)),
                  this.showService.getShowProgress$(show.ids.trakt).pipe(take(1)),
                  this.showService.getShowWatched$(show.ids.trakt).pipe(take(1)),
                ])
              )
            ),
          ]);
        })
      )
      .subscribe({
        next: async ([shows, infos]) => {
          this.showsInfos = shows.map((show, i) => {
            return {
              show,
              tmdbShow: infos[i][0],
              showProgress: infos[i][1],
              showWatched: infos[i][2],
              isWatchlist: this.isWatchlistItem(show.ids.trakt, this.watchlistItems),
            };
          });

          this.loadingState.next(LoadingState.SUCCESS);
        },
        error: (error) => onError(error, this.snackBar, this.loadingState),
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
