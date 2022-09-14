import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
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

import { ListService } from '@services/trakt/list.service';
import { BaseComponent } from '@helper/base-component';
import { wait } from '@helper/wait';
import { onError } from '@helper/error';
import { TmdbService } from '@services/tmdb.service';
import { ShowService } from '@services/trakt/show.service';
import { ExecuteService } from '@services/execute.service';

import { LoadingState } from '@type/enum';

import type { ShowInfo } from '@type/interfaces/Show';
import type { Chip } from '@type/interfaces/Chip';
import type { Show } from '@type/interfaces/Trakt';
import { z } from 'zod';

@Component({
  selector: 't-add-show',
  templateUrl: './add-show.component.html',
  styleUrls: ['./add-show.component.scss'],
})
export class AddShowComponent extends BaseComponent implements OnInit, OnDestroy {
  pageState = new BehaviorSubject<LoadingState>(LoadingState.LOADING);
  showsInfos?: ShowInfo[];
  searchValue?: string | null;

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
    this.route.queryParams
      .pipe(
        map((queryParams) => queryParamSchema.parse(queryParams)),
        takeUntil(this.destroy$)
      )
      .subscribe(async (queryParams) => {
        this.searchValue = queryParams.search;
        this.activeSlug = queryParams.slug ?? this.defaultSlug;

        this.searchValue
          ? await this.searchForShow(this.searchValue)
          : await this.getShowInfos(
              this.chips.find((chip) => chip.slug === this.activeSlug)?.fetch
            );
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
    this.pageState.next(LoadingState.LOADING);
    this.showsInfos = undefined;
    await wait();

    fetchShows
      .pipe(
        switchMap((shows) =>
          combineLatest([
            this.showService.showsProgress.$,
            this.showService.getShowsWatched$(),
            this.listService.watchlist.$,
            of(shows),
          ])
        ),
        switchMap(([showsProgress, showsWatched, watchlistItems, shows]) => {
          this.showsInfos = shows.map((show) => ({
            show,
            showProgress: show && showsProgress[show.ids.trakt],
            showWatched:
              show &&
              showsWatched.find((showWatched) => showWatched.show.ids.trakt === show.ids.trakt),
            isWatchlist: !!watchlistItems?.find(
              (watchlistItem) => watchlistItem.show.ids.trakt === show.ids.trakt
            ),
          }));

          this.pageState.next(LoadingState.SUCCESS);

          return combineLatest(
            shows.map((show) => this.tmdbService.getTmdbShow$(show.ids, { fetch: true }))
          );
        }),
        map((tmdbShows) => {
          this.showsInfos = this.showsInfos?.map((showInfo, i) => ({
            ...showInfo,
            tmdbShow: tmdbShows[i] ?? showInfo.tmdbShow,
          }));
        }),
        takeUntil(this.nextShows$),
        takeUntil(this.destroy$)
      )
      .subscribe({ error: (error) => onError(error, this.snackBar, this.pageState) });
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

const queryParamSchema = z.object({
  search: z.string().optional(),
  slug: z.string().optional(),
});
