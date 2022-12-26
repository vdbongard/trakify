import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import {
  BehaviorSubject,
  catchError,
  combineLatest,
  map,
  merge,
  NEVER,
  Observable,
  of,
  shareReplay,
  Subject,
  switchMap,
  takeUntil,
} from 'rxjs';

import { ListService } from '../../../lists/data/list.service';
import { Base } from '@helper/base';
import { wait } from '@helper/wait';
import { onError } from '@helper/error';
import { TmdbService } from '../../data/tmdb.service';
import { ShowService } from '../../data/show.service';
import { ExecuteService } from '@services/execute.service';

import { LoadingState } from '@type/Enum';

import type { ShowInfo } from '@type/Show';
import type { Chip } from '@type/Chip';
import type { Show, ShowProgress, ShowWatched } from '@type/Trakt';
import { z } from 'zod';
import { WatchlistItem } from '@type/TraktList';
import { AuthService } from '@services/auth.service';
import { EpisodeService } from '../../data/episode.service';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatChipsModule } from '@angular/material/chips';
import { AsyncPipe, NgForOf, NgIf } from '@angular/common';
import { LoadingComponent } from '@shared/components/loading/loading.component';
import { ShowsComponent } from '@shared/components/shows/shows.component';

@Component({
  selector: 't-add-show',
  templateUrl: './shows-with-search.component.html',
  styleUrls: ['./shows-with-search.component.scss'],
  standalone: true,
  imports: [
    NgIf,
    NgForOf,
    AsyncPipe,
    FormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatChipsModule,
    LoadingComponent,
    ShowsComponent,
  ],
})
export class ShowsWithSearchComponent extends Base implements OnInit, OnDestroy {
  pageState = new BehaviorSubject<LoadingState>(LoadingState.LOADING);
  showsInfos?: ShowInfo[];
  searchValue: string | null = null;

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
    {
      name: 'Upcoming',
      slug: 'upcoming',
      fetch: this.episodeService
        .fetchCalendarAll()
        .pipe(map((shows) => shows.map((show) => show.show))),
    },
  ];
  defaultSlug = 'trending';
  activeSlug = 'trending';

  nextShows$ = new Subject<void>();

  constructor(
    public showService: ShowService,
    public tmdbService: TmdbService,
    public router: Router,
    private route: ActivatedRoute,
    public listService: ListService,
    private snackBar: MatSnackBar,
    public executeService: ExecuteService,
    public authService: AuthService,
    private episodeService: EpisodeService
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
        this.searchValue = queryParams.q ?? null;
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

    const fetchShowsShared = fetchShows.pipe(shareReplay());

    fetchShowsShared
      .pipe(
        switchMap((shows) =>
          combineLatest([
            this.showService.showsProgress.$,
            this.showService.getShowsWatched$(),
            this.listService.watchlist.$,
            of(shows),
          ])
        ),
        map(([showsProgress, showsWatched, watchlistItems, shows]) => {
          if (!this.showsInfos) {
            this.showsInfos = shows.map((show) =>
              this.getShowInfo(undefined, showsProgress, showsWatched, watchlistItems, show)
            );
          } else {
            this.showsInfos = this.showsInfos.map((showInfo) =>
              this.getShowInfo(showInfo, showsProgress, showsWatched, watchlistItems, undefined)
            );
          }

          console.debug('showsInfos', this.showsInfos);
          this.pageState.next(LoadingState.SUCCESS);
        }),
        takeUntil(this.nextShows$),
        takeUntil(this.destroy$)
      )
      .subscribe({
        error: (error) => onError(error, this.snackBar, [this.pageState]),
      });

    fetchShowsShared
      .pipe(
        switchMap((shows) => {
          return merge(
            ...shows.map((show) =>
              this.tmdbService
                .getTmdbShow$(show, false, { fetch: true })
                .pipe(catchError(() => NEVER))
            )
          );
        }),
        map((tmdbShow) => {
          if (!tmdbShow || !this.showsInfos) return;

          this.showsInfos = this.showsInfos.map((showInfos) => {
            if (!showInfos.show) return showInfos;
            if (showInfos.show.ids.tmdb === null) return { ...showInfos, tmdbShow: null };
            return showInfos.show.ids.tmdb !== tmdbShow.id ? showInfos : { ...showInfos, tmdbShow };
          });
          console.debug('showsInfos', this.showsInfos);
        }),
        takeUntil(this.nextShows$),
        takeUntil(this.destroy$)
      )
      .subscribe({
        error: (error) => onError(error, this.snackBar, [this.pageState]),
      });
  }

  getShowInfo(
    showInfo: ShowInfo | undefined,
    showsProgress: { [showId: string]: ShowProgress | undefined },
    showsWatched: ShowWatched[],
    watchlistItems: WatchlistItem[] | undefined,
    showParam?: Show
  ): ShowInfo {
    const show = showParam ?? showInfo?.show;
    return {
      ...showInfo,
      show,
      showProgress: show && showsProgress[show.ids.trakt],
      showWatched: showsWatched.find(
        (showWatched) => showWatched.show.ids.trakt === show?.ids.trakt
      ),
      isWatchlist: !!watchlistItems?.find(
        (watchlistItem) => watchlistItem.show.ids.trakt === show?.ids.trakt
      ),
    };
  }

  async searchSubmitted(event: SubmitEvent): Promise<void> {
    const search = (
      (event.target as HTMLElement)?.querySelector('input[type="search"]') as HTMLInputElement
    )?.value;

    await this.router.navigate([], {
      queryParamsHandling: 'merge',
      queryParams: search ? { q: search } : undefined,
    });
  }

  async changeShowsSelection(chip: Chip): Promise<void> {
    await this.router.navigate([], {
      queryParamsHandling: 'merge',
      queryParams: { slug: chip.slug },
    });
  }
}

const queryParamSchema = z.object({
  q: z.string().optional(),
  slug: z.string().optional(),
});
