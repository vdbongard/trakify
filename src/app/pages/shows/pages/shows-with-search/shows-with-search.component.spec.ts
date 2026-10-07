import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Component, computed, input, output, signal } from '@angular/core';
import { Router, type Navigation } from '@angular/router';
import { of, throwError } from 'rxjs';
import ShowsWithSearchComponent from './shows-with-search.component';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideOAuthClient } from 'angular-oauth2-oidc';
import { provideTanStackQuery, QueryClient } from '@tanstack/angular-query-experimental';
import { ShowService } from '../../data/show.service';
import { TmdbService } from '../../data/tmdb.service';
import { ListService } from '../../../lists/data/list.service';
import { ExecuteService } from '@services/execute.service';
import { AuthService } from '@services/auth.service';
import { ConfigService } from '@services/config.service';
import { mockShow } from '@shared/mocks/mockShow';
import { ShowsComponent } from '@shared/components/shows/shows.component';
import type { ShowWithMeta } from '@type/Chip';
import type { Show, ShowWatchedOrPlayedAll } from '@type/Trakt';
import type { WatchlistItem } from '@type/TraktList';

@Component({ selector: 't-shows', template: '' })
class ShowsStubComponent {
  isLoggedIn = input<boolean>();
  showsInfos = input<unknown[]>();
  back = input<string>();
  withYear = input<boolean>();
  withEpisodesCount = input<boolean>();
  withAddButtons = input<boolean>();
  transitionDisabled = input<boolean>();
  add = output<Show>();
  remove = output<Show>();
}

describe('ShowsWithSearchComponent', () => {
  let fixture: ComponentFixture<ShowsWithSearchComponent>;
  let component: ShowsWithSearchComponent;
  let queryClient: QueryClient;
  let intersectionObserverCallback: IntersectionObserverCallback | undefined;
  let intersectionObserverTargets: Element[];

  let routerMock: {
    navigate: ReturnType<typeof vi.fn>;
    getCurrentNavigation: ReturnType<typeof vi.fn>;
    url: string;
  };
  let showServiceMock: {
    fetchSearchForShows: ReturnType<typeof vi.fn>;
    fetchWatchedShows: ReturnType<typeof vi.fn>;
    fetchAnticipatedShows: ReturnType<typeof vi.fn>;
    fetchTrendingShows: ReturnType<typeof vi.fn>;
    fetchPopularShows: ReturnType<typeof vi.fn>;
    fetchRecommendedShows: ReturnType<typeof vi.fn>;
    fetchPlayedShows: ReturnType<typeof vi.fn>;
    showsProgress: { s: ReturnType<typeof signal<Record<number, unknown>>> };
    getShowsWatched: ReturnType<typeof vi.fn>;
  };

  const watcherCountKey = 'watcher_count';
  const playCountKey = 'play_count';
  const listCountKey = 'list_count';
  const userCountKey = 'user_count';

  const makeShow = (id: number, title: string): Show => ({
    ...mockShow,
    title,
    ids: {
      ...mockShow.ids,
      trakt: id,
      slug: `show-${id}`,
      tmdb: id,
      tvdb: id,
      tvrage: id,
      imdb: `tt${id}`,
    },
  });

  beforeEach(async () => {
    intersectionObserverCallback = undefined;
    intersectionObserverTargets = [];
    vi.stubGlobal(
      'IntersectionObserver',
      class {
        constructor(callback: IntersectionObserverCallback) {
          intersectionObserverCallback = callback;
        }

        observe(target: Element): void {
          intersectionObserverTargets.push(target);
        }

        disconnect(): void {}
      },
    );

    routerMock = {
      navigate: vi.fn(() => Promise.resolve(true)),
      getCurrentNavigation: vi.fn(() => null),
      url: '/shows/add',
    };

    showServiceMock = {
      fetchSearchForShows: vi.fn(() => of([])),
      fetchWatchedShows: vi.fn(() => of([])),
      fetchAnticipatedShows: vi.fn(() => of([])),
      fetchTrendingShows: vi.fn(() => of([])),
      fetchPopularShows: vi.fn(() => of([])),
      fetchRecommendedShows: vi.fn(() => of([])),
      fetchPlayedShows: vi.fn(() => of([])),
      showsProgress: { s: signal<Record<number, unknown>>({}) },
      getShowsWatched: vi.fn(() => []),
    };

    await TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideTanStackQuery((queryClient = new QueryClient())),
        provideOAuthClient(),
        { provide: Router, useValue: routerMock },
        { provide: ShowService, useValue: showServiceMock },
        {
          provide: TmdbService,
          useValue: {
            getTmdbShowQueries: vi.fn(() => signal([])),
            getShowsInfosWithTmdb: vi.fn((_: unknown, showsInfosWithoutTmdb: () => unknown[]) =>
              computed(() => showsInfosWithoutTmdb() as unknown[]),
            ),
          },
        },
        {
          provide: ListService,
          useValue: {
            watchlist: { s: signal<WatchlistItem[]>([]) },
          },
        },
        {
          provide: ExecuteService,
          useValue: {
            addToWatchlist: vi.fn(),
            removeFromWatchlist: vi.fn(),
          },
        },
        {
          provide: AuthService,
          useValue: {
            isLoggedIn: vi.fn(() => true),
          },
        },
        {
          provide: ConfigService,
          useValue: {
            config: {
              s: signal({ language: 'en-US' }),
            },
          },
        },
      ],
    });
    TestBed.overrideComponent(ShowsWithSearchComponent, {
      remove: { imports: [ShowsComponent] },
      add: { imports: [ShowsStubComponent] },
    });
    await TestBed.compileComponents();

    fixture = TestBed.createComponent(ShowsWithSearchComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
    await fixture.whenStable();
  });

  afterEach((): void => {
    vi.unstubAllGlobals();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should render search form', () => {
    const form = fixture.nativeElement.querySelector('form.search-form');
    expect(form).toBeTruthy();
    const input = fixture.nativeElement.querySelector('input[type="search"]');
    expect(input).toBeTruthy();
  });

  it('keeps loaded search results visible when a refetch fails', async () => {
    const searchResult: ShowWithMeta = { show: makeShow(42, 'Loaded show') };
    const searchQueryKey = ['searchedShows', 'from'];
    queryClient.setDefaultOptions({ queries: { retry: false } });
    queryClient.setQueryData(searchQueryKey, { pages: [[searchResult]], pageParams: [1] });
    showServiceMock.fetchSearchForShows.mockReturnValue(
      throwError(() => new Error('429 Too Many Requests')),
    );

    fixture.destroy();
    fixture = TestBed.createComponent(ShowsWithSearchComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('q', 'from');
    fixture.detectChanges();
    await fixture.whenStable();
    await queryClient.invalidateQueries({ queryKey: searchQueryKey });

    expect(fixture.nativeElement.querySelector('.search-controls')).toHaveClass(
      'search-controls--searching',
    );

    await vi.waitFor(() => {
      expect(fixture.nativeElement.querySelector('t-error-text')).toBeTruthy();
    });

    expect(showServiceMock.fetchSearchForShows).toHaveBeenCalledWith('from', 1, 20);
    expect(component.searchedShowsQuery.data()?.pages.flat()).toEqual([searchResult]);
    expect(component.shows()[0]?.title).toBe('Loaded show');
    expect(component.searchedShowsQuery.isError()).toBe(true);
    expect(component.searchedShowsQuery.error()?.message).toBe('429 Too Many Requests');
    expect(fixture.nativeElement.querySelector('t-shows')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('t-error-text')?.textContent).toContain(
      '429 Too Many Requests',
    );
  });

  it('keeps loaded results and shows a next-page error next to the load-more control', async () => {
    const firstPage: ShowWithMeta[] = Array.from({ length: 20 }, (_, index) => ({
      show: makeShow(index + 300, `Loaded show ${index + 1}`),
    }));
    queryClient.setDefaultOptions({ queries: { retry: false } });
    showServiceMock.fetchSearchForShows.mockImplementation((_query: string, page: number) =>
      page === 1 ? of(firstPage) : throwError(() => new Error('429 Too Many Requests')),
    );

    fixture.destroy();
    fixture = TestBed.createComponent(ShowsWithSearchComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('q', 'from');
    fixture.detectChanges();
    await fixture.whenStable();

    await vi.waitFor(() => {
      expect(component.shows()).toHaveLength(20);
    });

    fixture.nativeElement.querySelector('button')?.click();

    await vi.waitFor(() => {
      expect(component.searchedShowsQuery.isFetchNextPageError()).toBe(true);
    });

    expect(component.shows()).toHaveLength(20);
    expect(fixture.nativeElement.querySelector('t-shows')).toBeTruthy();
    expect(
      fixture.nativeElement.querySelector('.search-pagination t-error-text')?.textContent,
    ).toContain('429 Too Many Requests');
  });

  it('loads search results in pages of 20 when the scroll sentinel is reached', async () => {
    const firstPage: ShowWithMeta[] = Array.from({ length: 20 }, (_, index) => ({
      show: makeShow(index + 100, `First page show ${index + 1}`),
    }));
    const secondPage: ShowWithMeta[] = [{ show: makeShow(200, 'Second page show') }];
    showServiceMock.fetchSearchForShows.mockImplementation((_query: string, page: number) =>
      of(page === 1 ? firstPage : secondPage),
    );

    fixture.destroy();
    fixture = TestBed.createComponent(ShowsWithSearchComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('q', 'from');
    fixture.detectChanges();
    await fixture.whenStable();

    await vi.waitFor(() => {
      expect(component.shows()).toHaveLength(20);
    });

    expect(showServiceMock.fetchSearchForShows).toHaveBeenCalledWith('from', 1, 20);
    const sentinel = fixture.nativeElement.querySelector('.search-page-sentinel') as Element;
    expect(sentinel).toBeTruthy();
    expect(intersectionObserverTargets).toContain(sentinel);

    intersectionObserverCallback?.(
      [{ isIntersecting: true, target: sentinel } as IntersectionObserverEntry],
      {} as IntersectionObserver,
    );

    await vi.waitFor(() => {
      expect(component.shows()).toHaveLength(21);
    });

    expect(showServiceMock.fetchSearchForShows).toHaveBeenCalledWith('from', 2, 20);
  });

  it('focuses search after imperative navigation requesting focus', async () => {
    fixture.destroy();
    routerMock.getCurrentNavigation.mockReturnValue({
      trigger: 'imperative',
      extras: { info: 'focusSearch' },
    } as unknown as Navigation);

    fixture = TestBed.createComponent(ShowsWithSearchComponent);
    fixture.detectChanges();
    await fixture.whenStable();

    const input = fixture.nativeElement.querySelector('input[type="search"]');
    expect(document.activeElement).toBe(input);
  });

  it('does not focus search on initial load or reload', async () => {
    fixture.destroy();
    routerMock.getCurrentNavigation.mockReturnValue({
      trigger: 'imperative',
      extras: { state: { focusSearch: true } },
    } as unknown as Navigation);

    fixture = TestBed.createComponent(ShowsWithSearchComponent);
    fixture.detectChanges();
    await fixture.whenStable();

    const input = fixture.nativeElement.querySelector('input[type="search"]');
    expect(document.activeElement).not.toBe(input);
  });

  it('does not focus search when returning through browser history', async () => {
    fixture.destroy();
    routerMock.getCurrentNavigation.mockReturnValue({
      trigger: 'popstate',
      extras: { info: 'focusSearch' },
    } as unknown as Navigation);

    fixture = TestBed.createComponent(ShowsWithSearchComponent);
    fixture.detectChanges();
    await fixture.whenStable();

    const input = fixture.nativeElement.querySelector('input[type="search"]');
    expect(document.activeElement).not.toBe(input);
  });

  it('should render chips when no search query', () => {
    const chips = fixture.nativeElement.querySelector('mat-chip-set');
    expect(chips).toBeTruthy();
    expect(fixture.nativeElement.querySelector('.search-controls')).not.toHaveClass(
      'search-controls--searching',
    );
    const chipElements: NodeListOf<HTMLElement> =
      fixture.nativeElement.querySelectorAll('mat-chip');
    expect(chipElements.length).toBe(6);
  });

  it('returns watched show meta only when watcher count exists', () => {
    const withCount = { [watcherCountKey]: 1234 } as ShowWatchedOrPlayedAll;
    const withoutCount = { [watcherCountKey]: null } as ShowWatchedOrPlayedAll;

    expect(component.getWatchedShowMeta(withCount)).toEqual([{ name: '1,234 watched' }]);
    expect(component.getWatchedShowMeta(withoutCount)).toEqual([]);
  });

  it('returns played show meta only when play count exists', () => {
    const withCount = { [playCountKey]: 90 } as ShowWatchedOrPlayedAll;
    const withoutCount = { [playCountKey]: null } as ShowWatchedOrPlayedAll;

    expect(component.getPlayedShowMeta(withCount)).toEqual([{ name: '90 played' }]);
    expect(component.getPlayedShowMeta(withoutCount)).toEqual([]);
  });

  it('creates anticipated, trending and recommended meta labels', () => {
    const anticipatedMeta = component.getAnticipatedShowMeta({
      [listCountKey]: 1234,
      show: { ...makeShow(1, 'Show'), first_aired: '2020-01-02' },
    } as never);
    const trendingMeta = component.getTrendingShowMeta({ watchers: 55 } as never);
    const recommendedMeta = component.getRecommendedShowMeta({ [userCountKey]: 8 } as never);

    expect(anticipatedMeta[0]?.name).toContain('1,234 lists');
    expect(anticipatedMeta[0]?.name).toContain('2. Jan. 2020');
    expect(trendingMeta).toEqual([{ name: '55 watchers' }]);
    expect(recommendedMeta).toEqual([{ name: 'Score 8' }]);
  });

  it('builds show info using unified progress and watchlist state', () => {
    const show = makeShow(10, 'Ten');
    showServiceMock.showsProgress.s.set({
      [show.ids.trakt]: {
        aired: 10,
        completed: 5,
        last_episode: null,
        last_watched_at: null,
        reset_at: null,
      },
    });
    showServiceMock.getShowsWatched.mockReturnValue([{ show }]);

    const listService = TestBed.inject(ListService);
    listService.watchlist.s.set([
      {
        id: show.ids.trakt,
        listed_at: '2020-01-01T00:00:00.000Z',
        notes: null,
        show,
        type: 'show',
      },
    ]);

    const info = component.getShowInfo({
      show,
      meta: [{ name: 'Meta' }],
      tmdbShow: { id: 10, name: 'Tmdb Ten' } as never,
    });

    expect(info.showMeta).toEqual([{ name: 'Meta' }]);
    expect(info.showProgress).toBeTruthy();
    expect(info.showWatched).toBeTruthy();
    expect(info.isWatchlist).toBe(true);
  });

  it('navigates with query on submit and clears query when empty', () => {
    const form = document.createElement('form');
    const input = document.createElement('input');
    input.type = 'search';
    input.value = 'the office';
    form.appendChild(input);

    component.searchSubmitted({ target: form } as unknown as SubmitEvent);
    expect(routerMock.navigate).toHaveBeenCalledWith([], { queryParams: { q: 'the office' } });

    input.value = '';
    component.searchSubmitted({ target: form } as unknown as SubmitEvent);
    expect(routerMock.navigate).toHaveBeenCalledWith([], { queryParams: undefined });
  });

  it('changes selected slug and merges query params', () => {
    component.changeShowsSelection(component.chips[2]);

    expect(routerMock.navigate).toHaveBeenCalledWith([], {
      queryParamsHandling: 'merge',
      queryParams: { slug: 'trending' },
    });
  });

  it('formats numbers and dates with configured locale rules', () => {
    expect(component.formatNumber(12345)).toBe('12,345');
    expect(component.formatDate('2020-01-02')).toBe('2. Jan. 2020');
    expect(component.formatDate(undefined)).toBe('');
    expect(component.formatDate(null)).toBe('');
  });

  it('fetch wrappers map result arrays into show with meta shape', async () => {
    const watchedShow = { [watcherCountKey]: 42, show: makeShow(1, 'A') };
    const anticipatedShow = {
      [listCountKey]: 4,
      show: { ...makeShow(2, 'B'), first_aired: '2020-01-01' },
    };
    const trendingShow = { watchers: 12, show: makeShow(3, 'C') };
    const recommendedShow = { [userCountKey]: 6, show: makeShow(4, 'D') };
    const playedShow = { [playCountKey]: 33, show: makeShow(5, 'E') };

    showServiceMock.fetchWatchedShows.mockReturnValue(of([watchedShow]));
    showServiceMock.fetchAnticipatedShows.mockReturnValue(of([anticipatedShow]));
    showServiceMock.fetchTrendingShows.mockReturnValue(of([trendingShow]));
    showServiceMock.fetchPopularShows.mockReturnValue(of([makeShow(6, 'F')]));
    showServiceMock.fetchRecommendedShows.mockReturnValue(of([recommendedShow]));
    showServiceMock.fetchPlayedShows.mockReturnValue(of([playedShow]));

    const watched = await component.fetchWatchedShows('weekly');
    const anticipated = await component.fetchAnticipatedShows();
    const trending = await component.fetchTrendingShows();
    const popular = await component.fetchPopularShows();
    const recommended = await component.fetchRecommendedShows();
    const played = await component.fetchPlayedShows('weekly');

    expect(watched[0]?.meta?.[0]?.name).toContain('watched');
    expect(anticipated[0]?.meta?.[0]?.name).toContain('lists');
    expect(trending[0]?.meta?.[0]?.name).toContain('watchers');
    expect(popular[0]?.meta).toEqual([]);
    expect(recommended[0]?.meta).toEqual([{ name: 'Score 6' }]);
    expect(played[0]?.meta?.[0]?.name).toContain('played');
  });

  it('searchForShow delegates to show service', async () => {
    const result: ShowWithMeta[] = [{ show: makeShow(99, 'Search') }];
    showServiceMock.fetchSearchForShows.mockReturnValue(of(result));

    const response = await new Promise<ShowWithMeta[]>((resolve) => {
      component.searchForShow('search', 1).subscribe((value) => resolve(value));
    });

    expect(showServiceMock.fetchSearchForShows).toHaveBeenCalledWith('search', 1, 20);
    expect(response).toEqual(result);
  });
});
