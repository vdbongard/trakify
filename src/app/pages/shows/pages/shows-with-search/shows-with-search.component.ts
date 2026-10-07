import {
  afterNextRender,
  Component,
  computed,
  effect,
  ElementRef,
  inject,
  input,
  viewChild,
} from '@angular/core';
import { formatDate } from '@angular/common';
import { Router } from '@angular/router';
import { lastValueFrom, map, type Observable } from 'rxjs';
import { ListService } from '../../../lists/data/list.service';
import { TmdbService } from '../../data/tmdb.service';
import { ShowService } from '../../data/show.service';
import { ExecuteService } from '@services/execute.service';
import type { ShowInfo } from '@type/Show';
import { Chip, ShowMeta, ShowWithMeta } from '@type/Chip';
import {
  AnticipatedShow,
  Period,
  RecommendedShow,
  ShowWatchedOrPlayedAll,
  TrendingShow,
} from '@type/Trakt';
import { AuthService } from '@services/auth.service';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatChipsModule } from '@angular/material/chips';
import { MatButtonModule } from '@angular/material/button';
import { A11yModule } from '@angular/cdk/a11y';
import { ShowsComponent } from '@shared/components/shows/shows.component';
import { ConfigService } from '@services/config.service';
import {
  CreateQueryResult,
  injectInfiniteQuery,
  injectQuery,
} from '@tanstack/angular-query-experimental';
import { SpinnerComponent } from '@shared/components/spinner/spinner.component';
import { ErrorText } from '@shared/components/error-text/error-text.component';
import { SHOW_SEARCH_PAGE_SIZE } from '@constants';

@Component({
  selector: 't-add-show',
  imports: [
    FormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatChipsModule,
    MatButtonModule,
    A11yModule,
    ShowsComponent,
    SpinnerComponent,
    ErrorText,
  ],
  templateUrl: './shows-with-search.component.html',
  styleUrl: './shows-with-search.component.scss',
})
export default class ShowsWithSearchComponent {
  showService = inject(ShowService);
  tmdbService = inject(TmdbService);
  router = inject(Router);
  listService = inject(ListService);
  executeService = inject(ExecuteService);
  authService = inject(AuthService);
  configService = inject(ConfigService);

  searchInput = viewChild.required<ElementRef<HTMLInputElement>>('searchInput');
  searchPageSentinel = viewChild<ElementRef<HTMLElement>>('searchPageSentinel');

  constructor() {
    const navigation = this.router.getCurrentNavigation();
    const shouldFocusSearch =
      navigation?.trigger === 'imperative' && navigation.extras.info === 'focusSearch';

    afterNextRender(() => {
      if (shouldFocusSearch) {
        this.searchInput().nativeElement.focus();
      }
    });

    effect((onCleanup) => {
      const sentinel = this.searchPageSentinel()?.nativeElement;
      if (!this.q() || !sentinel || typeof IntersectionObserver === 'undefined') return;

      const observer = new IntersectionObserver(
        (entries) => {
          if (entries.some((entry) => entry.isIntersecting)) this.loadNextSearchPage();
        },
        { rootMargin: '0px 0px 200px 0px' },
      );
      observer.observe(sentinel);
      onCleanup(() => observer.disconnect());
    });
  }

  slug = input<string>('watched');
  q = input<string | undefined>();

  chips: Chip[] = [
    {
      name: 'Weekly',
      slug: 'watched',
      query: this.getWatchedShowsQuery('weekly'),
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
      query: this.getPlayedShowsQuery('weekly'),
    },
  ];

  showsQuery = computed(() => {
    const chip = this.chips.find((chip) => chip.slug === this.slug());
    return chip?.query ?? this.chips[0].query;
  });

  showsWithMeta = computed(() => {
    if (this.q()) return this.searchedShowsQuery.data()?.pages.flat() ?? [];
    return this.showsQuery().data() ?? [];
  });

  isShowsQueryPending = computed(() => {
    if (this.q()) return this.searchedShowsQuery.isPending();
    return this.showsQuery().isPending();
  });

  showsQueryError = computed(() => {
    if (this.q()) return this.searchedShowsQuery.error();
    return this.showsQuery().error();
  });

  hasShowsQueryData = computed(() => {
    if (this.q()) return this.searchedShowsQuery.data() !== undefined;
    return this.showsQuery().data() !== undefined;
  });

  shows = computed(() => {
    return this.showsWithMeta().map((showWithMeta) => showWithMeta.show);
  });

  tmdbShowQueries = this.tmdbService.getTmdbShowQueries(this.shows);

  showsInfosWithoutTmdb = computed(() => {
    return this.showsWithMeta().map((s) => this.getShowInfo(s));
  });

  showInfos = this.tmdbService.getShowsInfosWithTmdb(
    this.tmdbShowQueries,
    this.showsInfosWithoutTmdb,
  );

  searchedShowsQuery = injectInfiniteQuery(() => {
    const searchTerm = this.q();
    return {
      enabled: !!searchTerm,
      queryKey: ['searchedShows', searchTerm],
      queryFn: ({ pageParam }): Promise<ShowWithMeta[]> =>
        lastValueFrom(this.searchForShow(searchTerm!, pageParam)),
      initialPageParam: 1,
      getNextPageParam: (lastPage, _allPages, lastPageParam): number | undefined =>
        lastPage.length === SHOW_SEARCH_PAGE_SIZE ? lastPageParam + 1 : undefined,
      retry: 0,
      staleTime: 5 * 60 * 1000,
    };
  });

  loadNextSearchPage(): void {
    if (this.searchedShowsQuery.hasNextPage() && !this.searchedShowsQuery.isFetching()) {
      void this.searchedShowsQuery.fetchNextPage();
    }
  }

  getWatchedShowsQuery(period: Period): CreateQueryResult<ShowWithMeta[]> {
    return injectQuery(() => ({
      enabled: !this.q() && (this.slug() === 'watched' || !this.slug()),
      queryKey: ['watchedShows'],
      queryFn: (): Promise<ShowWithMeta[]> => this.fetchWatchedShows(period),
    }));
  }

  fetchWatchedShows(period: Period): Promise<ShowWithMeta[]> {
    const watchedShows$ = this.showService
      .fetchWatchedShows(period)
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
      enabled: !this.q() && this.slug() === 'anticipated',
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
    const listCount = this.formatNumber(show.list_count);
    const firstAired = this.formatDate(show.show.first_aired);
    return [{ name: `${listCount} lists • ${firstAired}` }];
  }

  getTrendingShowsQuery(): CreateQueryResult<ShowWithMeta[]> {
    return injectQuery(() => ({
      enabled: !this.q() && this.slug() === 'trending',
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
      enabled: !this.q() && this.slug() === 'popular',
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
      enabled: !this.q() && this.slug() === 'recommended',
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

  getPlayedShowsQuery(period: Period): CreateQueryResult<ShowWithMeta[]> {
    return injectQuery(() => ({
      enabled: !this.q() && this.slug() === 'played',
      queryKey: ['playedShows'],
      queryFn: (): Promise<ShowWithMeta[]> => this.fetchPlayedShows(period),
    }));
  }

  fetchPlayedShows(period: Period): Promise<ShowWithMeta[]> {
    const playedShows$ = this.showService
      .fetchPlayedShows(period)
      .pipe(map((shows) => shows.map((show) => ({ ...show, meta: this.getPlayedShowMeta(show) }))));
    return lastValueFrom(playedShows$);
  }

  getPlayedShowMeta(show: ShowWatchedOrPlayedAll): ShowMeta[] {
    if (show.play_count === null) return [];
    return [{ name: `${this.formatNumber(show.play_count)} played` }];
  }

  searchForShow(searchValue: string, page = 1): Observable<ShowWithMeta[]> {
    return this.showService.fetchSearchForShows(searchValue, page, SHOW_SEARCH_PAGE_SIZE);
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
      isWatchlist: watchlistItems.some(
        (watchlistItem) => watchlistItem.show.ids.trakt === show?.ids.trakt,
      ),
      tmdbShow: showWithMeta?.tmdbShow,
    };
  }

  searchSubmitted(event: SubmitEvent): void {
    const target = event.target as HTMLElement;
    const input = target.querySelector('input[type="search"]') as HTMLInputElement | undefined;
    input?.blur();

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

  formatDate(date: string | undefined | null): string {
    if (!date) return '';
    return formatDate(date, 'd. MMM. yyyy', 'en-US');
  }
}
