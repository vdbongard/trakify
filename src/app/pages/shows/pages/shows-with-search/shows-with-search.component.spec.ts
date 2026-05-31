import { ComponentFixture, TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { Router } from '@angular/router';
import { of } from 'rxjs';
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
import type { ShowWithMeta } from '@type/Chip';
import type { Show, ShowWatchedOrPlayedAll } from '@type/Trakt';
import type { WatchlistItem } from '@type/TraktList';

describe('ShowsWithSearchComponent', () => {
  let fixture: ComponentFixture<ShowsWithSearchComponent>;
  let component: ShowsWithSearchComponent;

  let routerMock: {
    navigate: ReturnType<typeof vi.fn>;
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
    routerMock = {
      navigate: vi.fn(() => Promise.resolve(true)),
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
        provideTanStackQuery(new QueryClient()),
        provideOAuthClient(),
        { provide: Router, useValue: routerMock },
        { provide: ShowService, useValue: showServiceMock },
        {
          provide: TmdbService,
          useValue: {
            getTmdbShowQueries: vi.fn(() => signal([])),
            getShowsInfosWithTmdb: vi.fn((_: unknown, showsInfosWithoutTmdb: () => unknown[]) =>
              signal(showsInfosWithoutTmdb() as unknown[]),
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
    }).compileComponents();

    fixture = TestBed.createComponent(ShowsWithSearchComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
    await fixture.whenStable();
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

  it('should render chips when no search query', () => {
    const chips = fixture.nativeElement.querySelector('mat-chip-set');
    expect(chips).toBeTruthy();
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

  it('builds show info using progress watched and watchlist state', () => {
    const show = makeShow(10, 'Ten');
    showServiceMock.showsProgress.s.set({
      [show.ids.trakt]: {
        aired: 10,
        completed: 5,
        last_episode: null,
        last_watched_at: null,
        reset_at: null,
        seasons: [],
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
      component.searchForShow('search').subscribe((value) => resolve(value));
    });

    expect(showServiceMock.fetchSearchForShows).toHaveBeenCalledWith('search');
    expect(response).toEqual(result);
  });
});
