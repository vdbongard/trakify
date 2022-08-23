import { Component, OnDestroy, OnInit } from '@angular/core';
import {
  BehaviorSubject,
  catchError,
  combineLatest,
  map,
  Observable,
  of,
  Subject,
  switchMap,
  takeUntil,
} from 'rxjs';
import { ActivatedRoute, Router } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ListService } from '../../../shared/services/trakt/list.service';
import { BaseComponent } from '../../../shared/helper/base-component';
import { wait } from '../../../shared/helper/wait';
import { onError } from '../../../shared/helper/error';
import { TmdbService } from '../../../shared/services/tmdb.service';
import { ShowInfo } from '../../../../types/interfaces/Show';
import { ShowService } from '../../../shared/services/trakt/show.service';
import { LoadingState } from '../../../../types/enum';
import { Chip } from '../../../../types/interfaces/Chip';
import { Show } from '../../../../types/interfaces/Trakt';
import { ExecuteService } from '../../../shared/services/execute.service';

@Component({
  selector: 't-add-show',
  templateUrl: './add-show.component.html',
  styleUrls: ['./add-show.component.scss'],
})
export class AddShowComponent extends BaseComponent implements OnInit, OnDestroy {
  loadingState = new BehaviorSubject<LoadingState>(LoadingState.LOADING);
  showsInfos?: ShowInfo[];
  searchValue?: string;

  chips: Chip[] = [
    {
      name: 'Trending',
      slug: 'trending',
      fetch: this.showService
        .fetchTrendingShows()
        .pipe(map((shows) => shows.map((show) => show.show))),
    },
    {
      name: 'Popular',
      slug: 'popular',
      fetch: this.showService.fetchPopularShows(),
    },
    {
      name: 'Recommended',
      slug: 'recommended',
      fetch: this.showService
        .fetchRecommendedShows()
        .pipe(map((shows) => shows.map((show) => show.show))),
    },
  ];
  defaultSlug = 'trending';
  activeSlug = 'trending';

  nextShows$ = new Subject<void>();

  constructor(
    public showService: ShowService,
    public tmdbService: TmdbService,
    private router: Router,
    private route: ActivatedRoute,
    public listService: ListService,
    private snackBar: MatSnackBar,
    public executeService: ExecuteService
  ) {
    super();
  }

  async ngOnInit(): Promise<void> {
    this.route.queryParams.pipe(takeUntil(this.destroy$)).subscribe(async (queryParams) => {
      this.searchValue = queryParams['search'];
      this.activeSlug = queryParams['slug'] ?? this.defaultSlug;

      this.searchValue
        ? await this.searchForShow(this.searchValue)
        : await this.getShowInfos(this.chips.find((chip) => chip.slug === this.activeSlug)?.fetch);
    });
  }

  override ngOnDestroy(): void {
    super.ngOnDestroy();
    this.nextShows$.complete();
  }

  async searchForShow(searchValue: string): Promise<void> {
    const fetchShows = this.showService
      .fetchSearchForShows(searchValue)
      .pipe(map((results) => results.map((result) => result.show)));
    await this.getShowInfos(fetchShows);
  }

  async getShowInfos(fetchShows?: Observable<Show[]>): Promise<void> {
    if (!fetchShows) return;

    this.nextShows$.next();
    this.loadingState.next(LoadingState.LOADING);
    this.showsInfos = undefined;
    await wait();

    fetchShows
      .pipe(
        switchMap((shows) => {
          this.showsInfos = shows.map((show) => ({
            show,
          }));

          this.loadingState.next(LoadingState.SUCCESS);

          return combineLatest([
            this.showService.showsProgress.$,
            this.showService.getShowsWatched$(),
            this.listService.watchlist.$,
            of(shows),
          ]);
        }),
        switchMap(([showsProgress, showsWatched, watchlistItems, shows]) => {
          this.showsInfos = this.showsInfos?.map((showInfo) => ({
            ...showInfo,
            showProgress: showInfo.show && showsProgress[showInfo.show.ids.trakt],
            showWatched: showsWatched.find(
              (showWatched) => showWatched.show.ids.trakt === showInfo.show?.ids.trakt
            ),
            isWatchlist: !!watchlistItems?.find(
              (watchlistItem) => watchlistItem.show.ids.trakt === showInfo.show?.ids.trakt
            ),
          }));

          return combineLatest([
            combineLatest(
              shows.map((show) =>
                this.showService
                  .getShow$(show.ids, { fetch: true })
                  .pipe(catchError(() => of(undefined)))
              )
            ),
            combineLatest(
              shows.map((show) =>
                this.tmdbService
                  .getTmdbShow$(show.ids, { fetch: true })
                  .pipe(catchError(() => of(undefined)))
              )
            ),
          ]);
        }),
        map(([shows, tmdbShows]) => {
          this.showsInfos = this.showsInfos?.map((showInfo, i) => ({
            ...showInfo,
            show: shows[i] ?? showInfo.show,
            tmdbShow: tmdbShows[i] ?? showInfo.tmdbShow,
          }));
        }),
        takeUntil(this.nextShows$),
        takeUntil(this.destroy$)
      )
      .subscribe({ error: (error) => onError(error, this.snackBar, this.loadingState) });
  }

  async searchSubmitted(event: SubmitEvent): Promise<void> {
    const search = (
      (event.target as HTMLElement)?.querySelector('input[type="search"]') as HTMLInputElement
    )?.value;

    await this.router.navigate([], {
      queryParamsHandling: 'merge',
      queryParams: search ? { search } : undefined,
    });
  }

  async changeShowsSelection(slug: string): Promise<void> {
    await this.router.navigate([], {
      queryParamsHandling: 'merge',
      queryParams: { slug },
      skipLocationChange: true,
    });
  }
}
