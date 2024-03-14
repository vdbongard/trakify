import { Component, computed, inject, Injector, input, Signal } from '@angular/core';
import { Router } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import {
  catchError,
  EMPTY,
  forkJoin,
  lastValueFrom,
  map,
  merge,
  Observable,
  of,
  switchMap,
  take,
  toArray,
} from 'rxjs';
import { ListService } from '../../../lists/data/list.service';
import { TmdbService } from '../../data/tmdb.service';
import { ShowService } from '../../data/show.service';
import { ExecuteService } from '@services/execute.service';
import type { ShowInfo } from '@type/Show';
import { Chip, ShowMeta, ShowWithMeta } from '@type/Chip';
import {
  AnticipatedShow,
  RecommendedShow,
  Show,
  ShowProgress,
  ShowWatched,
  ShowWatchedOrPlayedAll,
  TrendingShow,
} from '@type/Trakt';
import { WatchlistItem } from '@type/TraktList';
import { AuthService } from '@services/auth.service';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatChipsModule } from '@angular/material/chips';
import { LoadingComponent } from '@shared/components/loading/loading.component';
import { ShowsComponent } from '@shared/components/shows/shows.component';
import { ConfigService } from '@services/config.service';
import { injectQuery } from '@tanstack/angular-query-experimental';
import type { CreateQueryResult } from '@tanstack/angular-query-experimental/src/types';
import { MatButton } from '@angular/material/button';
import { SpinnerComponent } from '@shared/components/spinner/spinner.component';
import { TmdbShow } from '@type/Tmdb';

@Component({
  selector: 't-add-show',
  standalone: true,
  imports: [
    FormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatChipsModule,
    LoadingComponent,
    ShowsComponent,
    MatButton,
    SpinnerComponent,
  ],
  templateUrl: './shows-with-search.component.html',
  styleUrl: './shows-with-search.component.scss',
})
export default class ShowsWithSearchComponent {
  showService = inject(ShowService);
  tmdbService = inject(TmdbService);
  router = inject(Router);
  listService = inject(ListService);
  snackBar = inject(MatSnackBar);
  executeService = inject(ExecuteService);
  authService = inject(AuthService);
  injector = inject(Injector);
  configService = inject(ConfigService);

  slug = input<string>('watched');
  searchValue = input<string | undefined>(undefined, { alias: 'q' });

  chips: Chip[] = [
    {
      name: 'Watched',
      slug: 'watched',
      query: this.getWatchedShowsQuery(),
    },
    {
      name: 'Anticipated',
      slug: 'anticipated',
      query: this.getAnticipatedShowsQuery(),
    },
    {
      name: 'Trending',
      slug: 'trending',
      query: this.getTrendingShowsQuery(),
    },
    {
      name: 'Popular',
      slug: 'popular',
      query: this.getPopularShowsQuery(),
    },
    {
      name: 'Recommended',
      slug: 'recommended',
      query: this.getRecommendedShowsQuery(),
    },
    {
      name: 'Played',
      slug: 'played',
      query: this.getPlayedShowsQuery(),
    },
  ];

  showsQuery = computed(() => {
    if (this.searchValue()) {
      return this.searchedShowsQuery;
    } else {
      const chip = this.chips.find((chip) => chip.slug === this.slug());
      return chip?.query ?? this.chips[0].query;
    }
  });

  showsInfos: Signal<ShowInfo[]> = computed(() => {
    const showWithMeta = this.showsQuery()?.data();
    if (!showWithMeta) return [];

    const showsProgress = this.showService.showsProgress.s();
    const showsWatched = this.showService.getShowsWatched();
    const watchlistItems = this.listService.watchlist.s();

    return showWithMeta.map((showWithMeta) =>
      this.getShowInfo(showsProgress, showsWatched, watchlistItems, showWithMeta),
    );
  });

  searchedShowsQuery: CreateQueryResult<ShowWithMeta[]> = injectQuery(() => ({
    enabled: !!this.searchValue(),
    queryKey: ['searchedShows', this.searchValue()],
    queryFn: (): Promise<ShowWithMeta[]> => lastValueFrom(this.searchForShow(this.searchValue()!)),
  }));

  getWatchedShowsQuery(): CreateQueryResult<ShowWithMeta[]> {
    return injectQuery(() => ({
      enabled: !this.searchValue() && (this.slug() === 'watched' || !this.slug()),
      queryKey: ['watchedShows'],
      queryFn: (): Promise<ShowWithMeta[]> => this.fetchWatchedShows(),
    }));
  }

  fetchWatchedShows(): Promise<ShowWithMeta[]> {
    const watchedShows$ = this.showService.fetchWatchedShows().pipe(
      map((shows) => shows.map((show) => ({ ...show, meta: this.getWatchedShowMeta(show) }))),
      switchMap((watchedShows) => this.addTmdbToShows(watchedShows)),
    );
    return lastValueFrom(watchedShows$);
  }

  getWatchedShowMeta(show: ShowWatchedOrPlayedAll): ShowMeta[] {
    if (show.watcher_count === null) return [];
    return [{ name: `${this.formatNumber(show.watcher_count)} watched` }];
  }

  getAnticipatedShowsQuery(): CreateQueryResult<ShowWithMeta[]> {
    return injectQuery(() => ({
      enabled: !this.searchValue() && this.slug() === 'anticipated',
      queryKey: ['anticipatedShows'],
      queryFn: (): Promise<ShowWithMeta[]> => this.fetchAnticipatedShows(),
    }));
  }

  fetchAnticipatedShows(): Promise<ShowWithMeta[]> {
    const anticipatedShows$ = this.showService.fetchAnticipatedShows().pipe(
      map((shows) => shows.map((show) => ({ ...show, meta: this.getAnticipatedShowMeta(show) }))),
      switchMap((anticipatedShows) => this.addTmdbToShows(anticipatedShows)),
    );
    return lastValueFrom(anticipatedShows$);
  }

  getAnticipatedShowMeta(show: AnticipatedShow): ShowMeta[] {
    return [{ name: `${this.formatNumber(show.list_count)} lists` }];
  }

  getTrendingShowsQuery(): CreateQueryResult<ShowWithMeta[]> {
    return injectQuery(() => ({
      enabled: !this.searchValue() && this.slug() === 'trending',
      queryKey: ['trendingShows'],
      queryFn: (): Promise<ShowWithMeta[]> => this.fetchTrendingShows(),
    }));
  }

  fetchTrendingShows(): Promise<ShowWithMeta[]> {
    const trendingShows$ = this.showService.fetchTrendingShows().pipe(
      map((shows) => shows.map((show) => ({ ...show, meta: this.getTrendingShowMeta(show) }))),
      switchMap((trendingShows) => this.addTmdbToShows(trendingShows)),
    );
    return lastValueFrom(trendingShows$);
  }

  getTrendingShowMeta(show: TrendingShow): ShowMeta[] {
    return [{ name: `${this.formatNumber(show.watchers)} watchers` }];
  }

  getPopularShowsQuery(): CreateQueryResult<ShowWithMeta[]> {
    return injectQuery(() => ({
      enabled: !this.searchValue() && this.slug() === 'popular',
      queryKey: ['popularShows'],
      queryFn: (): Promise<ShowWithMeta[]> => this.fetchPopularShows(),
    }));
  }

  fetchPopularShows(): Promise<ShowWithMeta[]> {
    const popularShows$ = this.showService.fetchPopularShows().pipe(
      map((shows) => shows.map((show) => ({ show, meta: [] }))),
      switchMap((popularShows) => this.addTmdbToShows(popularShows)),
    );
    return lastValueFrom(popularShows$);
  }

  getRecommendedShowsQuery(): CreateQueryResult<ShowWithMeta[]> {
    return injectQuery(() => ({
      enabled: !this.searchValue() && this.slug() === 'recommended',
      queryKey: ['recommendedShows'],
      queryFn: (): Promise<ShowWithMeta[]> => this.fetchRecommendedShows(),
    }));
  }

  fetchRecommendedShows(): Promise<ShowWithMeta[]> {
    const recommendedShows$ = this.showService.fetchRecommendedShows().pipe(
      map((shows) => shows.map((show) => ({ ...show, meta: this.getRecommendedShowMeta(show) }))),
      switchMap((recommendedShows) => this.addTmdbToShows(recommendedShows)),
    );
    return lastValueFrom(recommendedShows$);
  }

  getRecommendedShowMeta(show: RecommendedShow): ShowMeta[] {
    return [{ name: `Score ${show.user_count}` }];
  }

  getPlayedShowsQuery(): CreateQueryResult<ShowWithMeta[]> {
    return injectQuery(() => ({
      enabled: !this.searchValue() && this.slug() === 'played',
      queryKey: ['playedShows'],
      queryFn: (): Promise<ShowWithMeta[]> => this.fetchPlayedShows(),
    }));
  }

  fetchPlayedShows(): Promise<ShowWithMeta[]> {
    const playedShows$ = this.showService.fetchPlayedShows().pipe(
      map((shows) => shows.map((show) => ({ ...show, meta: this.getPlayedShowMeta(show) }))),
      switchMap((playedShows) => this.addTmdbToShows(playedShows)),
    );
    return lastValueFrom(playedShows$);
  }

  getPlayedShowMeta(show: ShowWatchedOrPlayedAll): ShowMeta[] {
    if (show.play_count === null) return [];
    return [{ name: `${this.formatNumber(show.play_count)} played` }];
  }

  addTmdbToShows<T extends { show: Show }>(shows: T[]): Observable<ShowWithTmdb<T>[]> {
    const tmdbShows$ = forkJoin(
      shows.map((show) =>
        this.tmdbService.getTmdbShow$(show.show, false, { fetch: true }).pipe(
          catchError(() => of(undefined)),
          take(1),
        ),
      ),
    );

    const showsWithTmdb$ = tmdbShows$.pipe(
      map((tmdbShows) =>
        shows.map((show) => {
          const tmdbShow = tmdbShows.find((tmdbShow) => tmdbShow?.id === show.show.ids.tmdb);
          return { ...show, tmdbShow };
        }),
      ),
    );

    return showsWithTmdb$;
  }

  searchForShow(searchValue: string): Observable<ShowWithMeta[]> {
    return this.showService.fetchSearchForShows(searchValue).pipe(
      switchMap((shows) =>
        forkJoin([
          of(shows),
          merge(
            ...shows.map((show) =>
              this.tmdbService.getTmdbShow$(show.show, false, { fetch: true }).pipe(
                catchError(() => EMPTY),
                take(1),
              ),
            ),
          ).pipe(toArray()),
        ]),
      ),
      map(([shows, tmdbShows]) =>
        shows
          .sort((a, b) => b.score - a.score)
          .map((result) => ({
            show: result.show,
            meta: [{ name: `Score ${Math.round(result.score)}` }] as ShowMeta[],
            tmdbShow: tmdbShows.find((tmdbShow) => tmdbShow?.id === result.show.ids.tmdb),
          })),
      ),
    );
  }

  getShowInfo(
    showsProgress: Record<string, ShowProgress | undefined>,
    showsWatched: ShowWatched[],
    watchlistItems: WatchlistItem[] | undefined,
    showWithMeta: ShowWithMeta,
  ): ShowInfo {
    const show = showWithMeta.show;
    return {
      show,
      showMeta: showWithMeta?.meta,
      showProgress: show && showsProgress[show.ids.trakt],
      showWatched: showsWatched.find(
        (showWatched) => showWatched.show.ids.trakt === show?.ids.trakt,
      ),
      isWatchlist: !!watchlistItems?.find(
        (watchlistItem) => watchlistItem.show.ids.trakt === show?.ids.trakt,
      ),
      tmdbShow: showWithMeta?.tmdbShow,
    };
  }

  searchSubmitted(event: SubmitEvent): void {
    const target = event.target as HTMLElement;
    const input = target.querySelector('input[type="search"]') as HTMLInputElement | undefined;
    const searchValue = input?.value;

    this.router.navigate([], { queryParams: searchValue ? { q: searchValue } : undefined });
  }

  changeShowsSelection(chip: Chip): void {
    this.router.navigate([], {
      queryParamsHandling: 'merge',
      queryParams: { slug: chip.slug },
    });
  }

  formatNumber(value: number): string {
    const language = this.configService.config.s().language;
    return new Intl.NumberFormat(language, { maximumFractionDigits: 0 }).format(value);
  }
}

type ShowWithTmdb<T extends { show: Show }> = T & {
  show: Show;
  tmdbShow: TmdbShow | undefined;
};
