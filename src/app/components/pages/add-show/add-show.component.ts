import { Component, OnDestroy, OnInit } from '@angular/core';
import {
  BehaviorSubject,
  combineLatest,
  map,
  Observable,
  of,
  Subject,
  switchMap,
  takeUntil,
} from 'rxjs';
import { ShowInfo } from '../../../../types/interfaces/Show';
import { TmdbService } from '../../../services/tmdb.service';
import { ActivatedRoute, Router } from '@angular/router';
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

  next$ = new Subject<void>();

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
      this.next$.next();

      this.searchValue = queryParams['search'];
      this.isWatchlist = !!queryParams['is-watchlist'];
      this.activeSlug = queryParams['slug'] ?? this.defaultSlug;

      if (!this.searchValue) {
        const chip: Chip | undefined = this.chips.find((chip) => chip.slug === this.activeSlug);
        return this.getShowInfos(chip?.observable);
      }

      this.searchForShow(this.searchValue);
    });
  }

  override ngOnDestroy(): void {
    super.ngOnDestroy();
    this.next$.complete();
  }

  searchForShow(searchValue: string): void {
    const fetchShows = this.showService
      .fetchSearchForShows(searchValue)
      .pipe(map((results) => results.map((result) => result.show)));
    this.getShowInfos(fetchShows);
  }

  getShowInfos(fetchShows?: Observable<TraktShow[]>): void {
    if (!fetchShows) return;

    this.loadingState.next(LoadingState.LOADING);
    this.showsInfos = [];

    fetchShows
      .pipe(
        switchMap((shows) => {
          return combineLatest([
            of(shows),
            combineLatest(
              shows.map((show) =>
                combineLatest([
                  this.tmdbService.getTmdbShow$(show.ids, false, true),
                  this.showService.getShowProgress$(show.ids.trakt),
                  this.showService.getShowWatched$(show.ids.trakt),
                  this.listService.getWatchlistItem$(show.ids),
                ])
              )
            ),
          ]);
        }),
        takeUntil(this.destroy$),
        takeUntil(this.next$)
      )
      .subscribe({
        next: async ([shows, infos]) => {
          this.showsInfos = shows.map((show, i) => {
            return {
              show,
              tmdbShow: infos[i][0],
              showProgress: infos[i][1],
              showWatched: infos[i][2],
              isWatchlist: !!infos[i][3],
            };
          });

          this.loadingState.next(LoadingState.SUCCESS);
        },
        error: (error) => onError(error, this.snackBar, this.loadingState),
      });
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

  async changeShowsSelection(slug: string): Promise<void> {
    await this.router.navigate([], { queryParamsHandling: 'merge', queryParams: { slug } });
  }
}
