import { Component, computed, inject, Injector, input } from '@angular/core';
import { Router } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { catchError, forkJoin, lastValueFrom, map, type Observable, of, take } from 'rxjs';
import { ListService } from '../../../lists/data/list.service';
import { TmdbService } from '../../data/tmdb.service';
import { ShowService } from '../../data/show.service';
import { ExecuteService } from '@services/execute.service';
import type { ShowInfo } from '@type/Show';
import { Chip, ShowMeta, ShowWithMeta } from '@type/Chip';
import {
  AnticipatedShow,
  RecommendedShow,
  ShowSearch,
  ShowWatchedOrPlayedAll,
  TrendingShow,
} from '@type/Trakt';
import { AuthService } from '@services/auth.service';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatChipsModule } from '@angular/material/chips';
import { LoadingComponent } from '@shared/components/loading/loading.component';
import { ShowsComponent } from '@shared/components/shows/shows.component';
import { ConfigService } from '@services/config.service';
import { injectQueries, injectQuery } from '@tanstack/angular-query-experimental';
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

  tmdbShowQueries = injectQueries({
    queries: computed(() => {
      const shows = this.showsQuery().data() ?? [];
      return shows.map((show) => ({
        queryKey: ['tmdbShow', show.show.ids.trakt],
        queryFn: (): Promise<TmdbShowWithId> => this.fetchTmdbShow(show),
      }));
    }),
  });

  showInfosList = computed(() => {
    const showsWithMeta = this.showsQuery().data() ?? [];
    const tmdbShowData = this.tmdbShowQueries().map((query) => query.data);
    const showsWithMetaAndTmdb: ShowWithMeta[] = showsWithMeta.map((show) => {
      const i = tmdbShowData.findIndex((t) => t?.[1]?.traktId === show.show.ids.trakt);
      const tmdbShow = tmdbShowData[i]?.[0];
      return { ...show, tmdbShow } satisfies ShowWithMeta;
    });
    const showInfos = showsWithMetaAndTmdb.map((s) => this.getShowInfo(s));
    return showInfos;
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
    const watchedShows$ = this.showService
      .fetchWatchedShows()
      .pipe(
        map((shows) => shows.map((show) => ({ ...show, meta: this.getWatchedShowMeta(show) }))),
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
    const anticipatedShows$ = this.showService
      .fetchAnticipatedShows()
      .pipe(
        map((shows) => shows.map((show) => ({ ...show, meta: this.getAnticipatedShowMeta(show) }))),
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
    const trendingShows$ = this.showService
      .fetchTrendingShows()
      .pipe(
        map((shows) => shows.map((show) => ({ ...show, meta: this.getTrendingShowMeta(show) }))),
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
    const popularShows$ = this.showService
      .fetchPopularShows()
      .pipe(map((shows) => shows.map((show) => ({ show, meta: [] }))));
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
    const recommendedShows$ = this.showService
      .fetchRecommendedShows()
      .pipe(
        map((shows) => shows.map((show) => ({ ...show, meta: this.getRecommendedShowMeta(show) }))),
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
    const playedShows$ = this.showService
      .fetchPlayedShows()
      .pipe(map((shows) => shows.map((show) => ({ ...show, meta: this.getPlayedShowMeta(show) }))));
    return lastValueFrom(playedShows$);
  }

  getPlayedShowMeta(show: ShowWatchedOrPlayedAll): ShowMeta[] {
    if (show.play_count === null) return [];
    return [{ name: `${this.formatNumber(show.play_count)} played` }];
  }

  searchForShow(searchValue: string): Observable<ShowWithMeta[]> {
    return this.showService
      .fetchSearchForShows(searchValue)
      .pipe(
        map((shows) =>
          shows
            .sort((a, b) => b.score - a.score)
            .map((show) => ({ ...show, meta: this.getSearchedShowMeta(show) })),
        ),
      );
  }

  getSearchedShowMeta(result: ShowSearch): ShowMeta[] {
    return [{ name: `Score ${Math.round(result.score)}` }] as ShowMeta[];
  }

  fetchTmdbShow(show: ShowWithMeta): Promise<TmdbShowWithId> {
    const tmdbShow$ = this.tmdbService.getTmdbShow$(show.show, false, { fetch: true }).pipe(
      catchError(() => of(null)),
      take(1),
    );
    const traktId = show.show.ids.trakt;
    return lastValueFrom(forkJoin([tmdbShow$, of({ traktId })]));
  }

  getShowInfo(showWithMeta: ShowWithMeta): ShowInfo {
    const showsProgress = this.showService.showsProgress.s();
    const showsWatched = this.showService.getShowsWatched();
    const watchlistItems = this.listService.watchlist.s();
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

type TmdbShowWithId = [TmdbShow | null, { traktId: number }];
