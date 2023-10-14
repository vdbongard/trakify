import { Component, DestroyRef, inject, Injector, OnDestroy, OnInit, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import {
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
import { wait } from '@helper/wait';
import { onError } from '@helper/error';
import { TmdbService } from '../../data/tmdb.service';
import { ShowService } from '../../data/show.service';
import { ExecuteService } from '@services/execute.service';
import { LoadingState } from '@type/Enum';
import type { ShowInfo } from '@type/Show';
import { Chip, ShowWithMeta } from '@type/Chip';
import type { ShowProgress, ShowWatched } from '@type/Trakt';
import { z } from 'zod';
import { WatchlistItem } from '@type/TraktList';
import { AuthService } from '@services/auth.service';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatChipsModule } from '@angular/material/chips';
import { CommonModule } from '@angular/common';
import { LoadingComponent } from '@shared/components/loading/loading.component';
import { ShowsComponent } from '@shared/components/shows/shows.component';
import { takeUntilDestroyed, toObservable } from '@angular/core/rxjs-interop';

@Component({
  selector: 't-add-show',
  templateUrl: './shows-with-search.component.html',
  styleUrls: ['./shows-with-search.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatChipsModule,
    LoadingComponent,
    ShowsComponent,
  ],
})
export default class ShowsWithSearchComponent implements OnInit, OnDestroy {
  showService = inject(ShowService);
  tmdbService = inject(TmdbService);
  router = inject(Router);
  route = inject(ActivatedRoute);
  listService = inject(ListService);
  snackBar = inject(MatSnackBar);
  executeService = inject(ExecuteService);
  authService = inject(AuthService);
  destroyRef = inject(DestroyRef);
  injector = inject(Injector);

  pageState = signal(LoadingState.LOADING);
  showsInfos?: ShowInfo[];
  searchValue: string | null = null;

  chips: Chip[] = [
    {
      name: 'Trending',
      slug: 'trending',
      fetch: this.showService.fetchTrendingShows().pipe(
        map((shows) =>
          shows.map((show) => ({
            show: show.show,
            meta: [{ name: 'Watchers', value: show.watchers }],
          })),
        ),
      ),
    },
    {
      name: 'Popular',
      slug: 'popular',
      fetch: this.showService
        .fetchPopularShows()
        .pipe(map((shows) => shows.map((show) => ({ show, meta: [] })))),
    },
    {
      name: 'Recommended',
      slug: 'recommended',
      fetch: this.showService.fetchRecommendedShows().pipe(
        map((shows) =>
          shows.map((show) => ({
            show: show.show,
            meta: [{ name: 'Score', value: show.user_count }],
          })),
        ),
      ),
    },
  ];
  defaultSlug = 'trending';
  activeSlug = 'trending';

  nextShows$ = new Subject<void>();

  ngOnInit(): void {
    this.route.queryParams
      .pipe(
        map((queryParams) => queryParamSchema.parse(queryParams)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((queryParams) => {
        this.searchValue = queryParams.q ?? null;
        this.activeSlug = queryParams.slug ?? this.defaultSlug;

        this.searchValue
          ? void this.searchForShow(this.searchValue)
          : void this.getShowInfos(this.chips.find((chip) => chip.slug === this.activeSlug)?.fetch);
      });
  }

  ngOnDestroy(): void {
    this.nextShows$.complete();
  }

  async searchForShow(searchValue: string): Promise<void> {
    const fetchShows = this.showService.fetchSearchForShows(searchValue).pipe(
      map((results) =>
        results.map((result) => ({
          show: result.show,
          meta: [{ name: 'Score', value: Math.round(result.score) }],
        })),
      ),
    );
    await this.getShowInfos(fetchShows);
  }

  async getShowInfos(fetchShowsWithMeta?: Observable<ShowWithMeta[]>): Promise<void> {
    if (!fetchShowsWithMeta) return;

    this.nextShows$.next();
    this.pageState.set(LoadingState.LOADING);
    this.showsInfos = undefined;
    await wait();

    const fetchShowsWithMetaShared = fetchShowsWithMeta.pipe(shareReplay());

    fetchShowsWithMetaShared
      .pipe(
        switchMap((showsWithMeta) =>
          combineLatest([
            toObservable(this.showService.showsProgress.s, { injector: this.injector }),
            this.showService.getShowsWatched$(),
            toObservable(this.listService.watchlist.s, { injector: this.injector }),
            of(showsWithMeta),
          ]),
        ),
        map(([showsProgress, showsWatched, watchlistItems, showsWithMeta]) => {
          if (!this.showsInfos) {
            this.showsInfos = showsWithMeta.map((showWithMeta) =>
              this.getShowInfo(
                undefined,
                showsProgress,
                showsWatched,
                watchlistItems,
                showWithMeta,
              ),
            );
          } else {
            this.showsInfos = this.showsInfos.map((showInfo) =>
              this.getShowInfo(showInfo, showsProgress, showsWatched, watchlistItems, undefined),
            );
          }

          console.debug('showsInfos', this.showsInfos);
          this.pageState.set(LoadingState.SUCCESS);
        }),
        takeUntil(this.nextShows$),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        error: (error) => onError(error, this.snackBar, [this.pageState]),
      });

    fetchShowsWithMetaShared
      .pipe(
        switchMap((showsWithMeta) => {
          return merge(
            ...showsWithMeta.map((showWithMeta) =>
              this.tmdbService
                .getTmdbShow$(showWithMeta.show, false, { fetch: true })
                .pipe(catchError(() => NEVER)),
            ),
          );
        }),
        map((tmdbShow) => {
          if (!tmdbShow || !this.showsInfos) return;

          this.showsInfos = this.showsInfos.map((showInfos) => {
            if (!showInfos.show) return showInfos;
            if (showInfos.show.ids.tmdb === null) return { ...showInfos, tmdbShow: undefined };
            return showInfos.show.ids.tmdb !== tmdbShow.id ? showInfos : { ...showInfos, tmdbShow };
          });
          console.debug('showsInfos', this.showsInfos);
        }),
        takeUntil(this.nextShows$),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        error: (error) => onError(error, this.snackBar, [this.pageState]),
      });
  }

  getShowInfo(
    showInfo: ShowInfo | undefined,
    showsProgress: Record<string, ShowProgress | undefined>,
    showsWatched: ShowWatched[],
    watchlistItems: WatchlistItem[] | undefined,
    showWithMeta?: ShowWithMeta,
  ): ShowInfo {
    const show = showWithMeta?.show ?? showInfo?.show;
    return {
      ...showInfo,
      show,
      showMeta: showWithMeta?.meta,
      showProgress: show && showsProgress[show.ids.trakt],
      showWatched: showsWatched.find(
        (showWatched) => showWatched.show.ids.trakt === show?.ids.trakt,
      ),
      isWatchlist: !!watchlistItems?.find(
        (watchlistItem) => watchlistItem.show.ids.trakt === show?.ids.trakt,
      ),
    };
  }

  async searchSubmitted(event: SubmitEvent): Promise<void> {
    const target = event.target as HTMLElement;
    const input = target.querySelector('input[type="search"]') as HTMLInputElement | undefined;
    const searchValue = input?.value;

    await this.router.navigate([], {
      queryParamsHandling: 'merge',
      queryParams: searchValue ? { q: searchValue } : undefined,
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
