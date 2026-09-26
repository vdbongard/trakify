import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { page } from 'vitest/browser';
import { signal } from '@angular/core';
import ShowComponent from './show.component';
import { ActivatedRoute, Router } from '@angular/router';
import { BreakpointObserver } from '@angular/cdk/layout';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideOAuthClient } from 'angular-oauth2-oidc';
import { EMPTY, NEVER, of, throwError } from 'rxjs';
import { mockShow } from '@shared/mocks/mockShow';
import type { Episode } from '@type/Trakt';
import { TmdbService } from '../../data/tmdb.service';
import { ShowService } from '../../data/show.service';
import { EpisodeService } from '../../data/episode.service';
import { ListService } from '../../../lists/data/list.service';
import { Title } from '@angular/platform-browser';
import { MatSnackBar } from '@angular/material/snack-bar';
import { AuthService } from '@services/auth.service';
import { DialogService } from '@services/dialog.service';
import { ExecuteService } from '@services/execute.service';
import { provideTanStackQuery, QueryClient } from '@tanstack/angular-query-experimental';

describe('ShowComponent', () => {
  let component: ShowComponent;
  let fixture: ComponentFixture<ShowComponent>;
  let showsProgressSignal: ReturnType<typeof signal<Record<string, unknown>>>;
  let watchlistSignal: ReturnType<typeof signal<unknown[]>>;
  let getShowProgressMock: ReturnType<typeof vi.fn>;
  let queryClient: QueryClient;

  beforeEach(async () => {
    showsProgressSignal = signal<Record<string, unknown>>({});
    watchlistSignal = signal<unknown[]>([]);
    getShowProgressMock = vi.fn(() =>
      of({
        aired: 0,
        completed: 0,
        last_episode: null,
        last_watched_at: null,
        next_episode: null,
        reset_at: null,
        seasons: [],
      }),
    );

    queryClient = new QueryClient();
    queryClient.setQueryData(['show', 'test-show'], mockShow);
    queryClient.setQueryData(['tmdbShow', mockShow.ids.tmdb, 'en-US'], {
      id: 10,
      name: 'Test Show',
      status: 'Returning Series',
      seasons: [],
      genres: [],
      created_by: [],
      episode_run_time: [],
      first_air_date: '2022-01-01',
      homepage: '',
      number_of_episodes: 0,
      overview: '',
      poster_path: null,
      type: '',
      vote_average: 0,
      vote_count: 0,
      aggregate_credits: { cast: [] },
    });

    await TestBed.configureTestingModule({
      providers: [
        provideTanStackQuery(queryClient),
        {
          provide: ActivatedRoute,
          useValue: {
            params: of({ show: 'test-show' }),
          },
        },
        provideHttpClient(),
        provideHttpClientTesting(),
        provideOAuthClient(),
        {
          provide: ShowService,
          useValue: {
            fetchShow: vi.fn(() => of(mockShow)),
            showsWatched: { s: signal([]) },
            showsProgress: { s: showsProgressSignal },
            getShowProgress$: getShowProgressMock,
            updateShowsProgress: vi.fn(),
            favorites: { s: signal<number[]>([]) },
            isFavorite: vi.fn(() => false),
            activeShow: { set: vi.fn() },
            addFavorite: vi.fn(),
            removeFavorite: vi.fn(),
          },
        },
        {
          provide: TmdbService,
          useValue: {
            getTmdbShow$: vi.fn(() =>
              of({
                id: 10,
                status: 'Returning Series',
                seasons: [],
                genres: [],
                created_by: [],
                episode_run_time: [],
                aggregate_credits: { cast: [] },
              }),
            ),
            getTmdbEpisode$: vi.fn(() => of(undefined)),
            getTmdbSeason$: vi.fn(() => of(null)),
            fetchTmdbShowExtended: vi.fn(() =>
              of({
                id: 10,
                status: 'Returning Series',
                seasons: [],
                genres: [],
                created_by: [],
                episode_run_time: [],
                aggregate_credits: { cast: [] },
              }),
            ),
            tmdbEpisodes: { s: signal({}) },
            tmdbSeasons: { s: signal({}) },
            toTmdbSeason: vi.fn(() => undefined),
          },
        },
        {
          provide: EpisodeService,
          useValue: {
            showsEpisodes: { s: signal({}) },
            getEpisode$: vi.fn(() => of(undefined)),
            fetchEpisodesFromShow: vi.fn(() => of({})),
          },
        },
        {
          provide: ListService,
          useValue: {
            watchlist: { s: watchlistSignal },
          },
        },
        {
          provide: BreakpointObserver,
          useValue: {
            observe: vi.fn(() => of({ matches: false })),
          },
        },
        { provide: Title, useValue: { setTitle: vi.fn() } },
        {
          provide: Router,
          useValue: {
            currentNavigation: vi.fn(() => null),
          },
        },
        {
          provide: MatSnackBar,
          useValue: {
            open: vi.fn(() => ({ onAction: (): typeof EMPTY => EMPTY })),
          },
        },
        {
          provide: ExecuteService,
          useValue: {
            addEpisode: vi.fn(async () => undefined),
            addShow: vi.fn(),
            addToWatchlist: vi.fn(),
            removeFromWatchlist: vi.fn(),
            removeEpisode: vi.fn(),
          },
        },
        {
          provide: AuthService,
          useValue: {
            isLoggedIn: signal(true),
          },
        },
        {
          provide: DialogService,
          useValue: {
            showTrailer: vi.fn(),
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ShowComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('show', 'test-show');
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should render show page sections', () => {
    const header = fixture.nativeElement.querySelector('t-show-header');
    const cast = fixture.nativeElement.querySelector('t-show-cast');
    const details = fixture.nativeElement.querySelector('t-show-details');
    const nextEpisode = fixture.nativeElement.querySelector('t-show-next-episode');
    const seasons = fixture.nativeElement.querySelector('t-show-seasons');
    const links = fixture.nativeElement.querySelector('t-show-links');

    expect(header).toBeTruthy();
    expect(cast).toBeTruthy();
    expect(details).toBeTruthy();
    expect(nextEpisode).toBeTruthy();
    expect(seasons).toBeTruthy();
    expect(links).toBeTruthy();
  });

  describe('isNewShow', () => {
    it('is undefined while the progress record is still unknown', () => {
      // No record anywhere and the fetch has not answered: the bulk sync only fills the overview
      // store, so this is the state a show that is already in progress passes through.
      getShowProgressMock.mockImplementation(() => NEVER);
      fixture.destroy();
      queryClient.removeQueries({ queryKey: ['showProgress', mockShow.ids.trakt] });
      fixture = TestBed.createComponent(ShowComponent);
      component = fixture.componentInstance;
      fixture.componentRef.setInput('show', 'test-show');
      fixture.detectChanges();

      expect(component.isNewShow()).toBeUndefined();
    });

    it('is true when the fetch finds no progress at all', async () => {
      await vi.waitFor(() => expect(component.isNewShow()).toBe(true));
    });

    it('is true when the fetched progress has no watched episodes (unstarted show)', () => {
      // The on-page progress fetch stores a progress record for any show, even with no watch
      // history (Trakt returns `completed: 0`), so a watchlist-only show must stay "new".
      showsProgressSignal.set({
        [mockShow.ids.trakt]: {
          completed: 0,
          seasons: [],
        },
      });
      fixture.detectChanges();

      expect(component.isNewShow()).toBe(true);
    });

    it('is false once the show has watched episodes', () => {
      showsProgressSignal.set({
        [mockShow.ids.trakt]: {
          completed: 3,
          seasons: [],
        },
      });
      fixture.detectChanges();

      expect(component.isNewShow()).toBe(false);
    });

    it('keeps the header buttons for an unstarted watchlist show', () => {
      showsProgressSignal.set({
        [mockShow.ids.trakt]: {
          completed: 0,
          seasons: [],
        },
      });
      watchlistSignal.set([{ show: mockShow }]);
      fixture.detectChanges();

      const header = fixture.debugElement.query(By.css('t-show-header'));
      expect(header).toBeTruthy();
      expect(header.componentInstance.isNewShow()).toBe(true);
      expect(page.getByText('Mark show as seen')).toBeInTheDocument();
      expect(page.getByText('Remove from watchlist')).toBeInTheDocument();
    });
  });

  describe('reactive branches', () => {
    interface ReactiveSetupOptions {
      showProgress: unknown;
      tmdbStatus: string;
      tmdbSeasons: { season_number: number }[];
      /** Trakt episode details keyed by episode number, returned by the getEpisode$ mock. */
      episodeDetails?: Record<number, unknown>;
    }

    async function setupReactiveComponent(options: ReactiveSetupOptions): Promise<{
      fixture: ComponentFixture<ShowComponent>;
      component: ShowComponent;
      showsProgressSignal: ReturnType<typeof signal<Record<string, unknown>>>;
      episodeServiceMock: {
        showsEpisodes: { s: ReturnType<typeof signal> };
        getEpisode$: ReturnType<typeof vi.fn>;
        fetchEpisodesFromShow: ReturnType<typeof vi.fn>;
      };
      tmdbServiceMock: {
        getTmdbShow$: ReturnType<typeof vi.fn>;
        tmdbEpisodes: { s: ReturnType<typeof signal> };
        tmdbSeasons: { s: ReturnType<typeof signal> };
        toTmdbSeason: ReturnType<typeof vi.fn>;
      };
      titleMock: {
        setTitle: ReturnType<typeof vi.fn>;
      };
    }> {
      TestBed.resetTestingModule();

      const queryClient = new QueryClient();
      queryClient.setQueryData(['show', 'test-show'], mockShow);
      queryClient.setQueryData(['tmdbShow', mockShow.ids.tmdb, 'en-US'], {
        id: 10,
        status: options.tmdbStatus,
        seasons: options.tmdbSeasons,
        aggregate_credits: { cast: [] },
      });

      const episodeServiceMock = {
        showsEpisodes: { s: signal<Record<string, unknown>>({}) },
        getEpisode$: vi.fn((_show: unknown, _season: unknown, episodeNumber: number) =>
          of(options.episodeDetails?.[episodeNumber] ?? undefined),
        ),
        fetchEpisodesFromShow: vi.fn(() => of({})),
      };

      const tmdbServiceMock = {
        getTmdbShow$: vi.fn(() =>
          of({
            id: 10,
            status: options.tmdbStatus,
            seasons: options.tmdbSeasons,
            aggregate_credits: { cast: [] },
          }),
        ),
        getTmdbEpisode$: vi.fn(() => of(undefined)),
        getTmdbSeason$: vi.fn(() => of(null)),
        fetchTmdbShowExtended: vi.fn(() =>
          of({
            id: 10,
            status: options.tmdbStatus,
            seasons: options.tmdbSeasons,
            aggregate_credits: { cast: [] },
          }),
        ),
        tmdbEpisodes: { s: signal<Record<string, unknown>>({}) },
        tmdbSeasons: { s: signal<Record<string, unknown>>({}) },
        toTmdbSeason: vi.fn(() => undefined),
      };

      const titleMock = {
        setTitle: vi.fn(),
      };

      const showsProgressSignal = signal<Record<string, unknown>>({});
      showsProgressSignal.set({ [mockShow.ids.trakt]: options.showProgress });

      TestBed.configureTestingModule({
        providers: [
          provideTanStackQuery(queryClient),
          {
            provide: ActivatedRoute,
            useValue: {
              params: of({ show: 'test-show' }),
            },
          },
          {
            provide: ShowService,
            useValue: {
              fetchShow: vi.fn(() => of(mockShow)),
              showsWatched: { s: signal([]) },
              showsProgress: { s: showsProgressSignal },
              getShowProgress$: vi.fn(() => of(undefined)),
              updateShowsProgress: vi.fn(),
              favorites: { s: signal<number[]>([]) },
              isFavorite: vi.fn(() => false),
              activeShow: { set: vi.fn() },
            },
          },
          { provide: TmdbService, useValue: tmdbServiceMock },
          { provide: EpisodeService, useValue: episodeServiceMock },
          {
            provide: ListService,
            useValue: {
              watchlist: { s: signal([]) },
            },
          },
          {
            provide: BreakpointObserver,
            useValue: {
              observe: vi.fn(() => of({ matches: false })),
            },
          },
          { provide: Title, useValue: titleMock },
          {
            provide: Router,
            useValue: {
              currentNavigation: vi.fn(() => null),
            },
          },
          {
            provide: MatSnackBar,
            useValue: {
              open: vi.fn(() => ({ onAction: (): typeof EMPTY => EMPTY })),
            },
          },
          {
            provide: ExecuteService,
            useValue: {
              addEpisode: vi.fn(async () => undefined),
            },
          },
          {
            provide: AuthService,
            useValue: {
              isLoggedIn: signal(true),
            },
          },
          {
            provide: DialogService,
            useValue: {
              showTrailer: vi.fn(),
            },
          },
          provideHttpClient(),
          provideHttpClientTesting(),
          provideOAuthClient(),
        ],
      });

      TestBed.overrideComponent(ShowComponent, {
        set: {
          template: '<div>show test host</div>',
        },
      });

      await TestBed.compileComponents();

      const branchFixture = TestBed.createComponent(ShowComponent);
      const branchComponent = branchFixture.componentInstance;
      branchFixture.componentRef.setInput('show', 'test-show');
      branchFixture.detectChanges();
      await branchFixture.whenStable();
      branchFixture.detectChanges();

      return {
        fixture: branchFixture,
        component: branchComponent,
        showsProgressSignal,
        episodeServiceMock,
        tmdbServiceMock,
        titleMock,
      };
    }

    it('reorders tmdb seasons and sets page title from show', async () => {
      const { component: branchComponent, titleMock } = await setupReactiveComponent({
        showProgress: {
          next_episode: { season: 1, number: 1 },
          seasons: [],
        },
        tmdbStatus: 'Returning Series',
        tmdbSeasons: [{ season_number: 1 }, { season_number: 0 }, { season_number: 2 }],
      });

      expect(titleMock.setTitle).toHaveBeenCalledWith(`${mockShow.title} - Trakify`);
      expect(branchComponent.showQuery.isSuccess()).toBe(true);
      expect(branchComponent.tmdbShow()?.seasons.map((season) => season.season_number)).toEqual([
        2, 1, 0,
      ]);
    });

    it('treats specials next episode as null', async () => {
      const { component: branchComponent } = await setupReactiveComponent({
        showProgress: {
          next_episode: { season: 0, number: 1 },
          seasons: [],
        },
        tmdbStatus: 'Returning Series',
        tmdbSeasons: [{ season_number: 0 }, { season_number: 1 }],
      });

      expect(branchComponent.nextTraktEpisode()).toBeNull();
    });

    it('does not wait for a next episode Trakt reports as nonexistent', async () => {
      const { component: branchComponent, episodeServiceMock } = await setupReactiveComponent({
        // An unaired, never-watched show: Trakt answers `next_episode: null`, so S01E01 does
        // not exist. Guessing it left the block loading forever once the request 404'd.
        showProgress: {
          next_episode: null,
          seasons: [],
        },
        tmdbStatus: 'Planned',
        tmdbSeasons: [{ season_number: 1 }],
      });

      expect(branchComponent.nextTraktEpisode()).toBeNull();
      expect(branchComponent.nextEpisodeLoading()).toBe(false);
      expect(episodeServiceMock.getEpisode$).not.toHaveBeenCalled();
    });

    it('does not fetch S01E01 while the next episode is transiently undefined', async () => {
      const { component: branchComponent, episodeServiceMock } = await setupReactiveComponent({
        showProgress: {
          // transient state while the optimistic "mark as seen" advance runs
          next_episode: undefined,
          seasons: [],
        },
        tmdbStatus: 'Returning Series',
        tmdbSeasons: [{ season_number: 1 }],
      });

      expect(branchComponent.nextTraktEpisode()).toBeNull();
      expect(episodeServiceMock.getEpisode$).not.toHaveBeenCalled();
    });

    it('keeps the current next episode mounted while the next one loads after mark as seen', async () => {
      const {
        component: branchComponent,
        showsProgressSignal,
        fixture,
      } = await setupReactiveComponent({
        showProgress: {
          next_episode: { season: 1, number: 2 },
          seasons: [],
        },
        tmdbStatus: 'Returning Series',
        tmdbSeasons: [{ season_number: 1 }],
        episodeDetails: {
          2: { ids: { trakt: 20 }, season: 1, number: 2, title: 'Ep 2', first_aired: null },
          3: { ids: { trakt: 30 }, season: 1, number: 3, title: 'Ep 3', first_aired: null },
        },
      });

      expect(branchComponent.nextTraktEpisode()).toMatchObject({ season: 1, number: 2 });

      // The optimistic "mark as seen" advance publishes a synthetic next episode (season 1,
      // episode 3, trakt id 0) whose detail fetch has not resolved yet.
      showsProgressSignal.set({
        [mockShow.ids.trakt]: {
          next_episode: { ids: { trakt: 0 }, season: 1, number: 3, title: null },
          seasons: [],
        },
      });
      fixture.detectChanges();

      // The previous episode stays rendered (placeholder while revalidating) so the
      // `t-episode` element is never removed -> no layout shift.
      expect(branchComponent.nextTraktEpisode()).toMatchObject({ season: 1, number: 2 });
      expect(branchComponent.nextEpisodeLoading()).toBe(false);

      await fixture.whenStable();
      fixture.detectChanges();
      // The observer notification for the freshly fetched next episode is flushed on a
      // macrotask; poll for the in-place content swap to the new episode.
      await vi.waitFor(() => {
        expect(branchComponent.nextTraktEpisode()).toMatchObject({ season: 1, number: 3 });
      });
    });
  });

  describe('show query errors', () => {
    async function setupShowQueryErrorComponent(options: {
      seedShow: boolean;
    }): Promise<{ fixture: ComponentFixture<ShowComponent>; component: ShowComponent }> {
      TestBed.resetTestingModule();

      const queryClient = new QueryClient({
        // fail fast so the error state is reached without retry backoff delays
        defaultOptions: { queries: { retry: false } },
      });
      const tmdbShowData = {
        id: 10,
        name: 'Test Show',
        status: 'Returning Series',
        seasons: [],
        genres: [],
        created_by: [],
        episode_run_time: [],
        first_air_date: '2022-01-01',
        homepage: '',
        number_of_episodes: 0,
        overview: '',
        poster_path: null,
        type: 'Scripted',
        vote_average: 0,
        vote_count: 0,
        aggregate_credits: { cast: [] },
      };
      if (options.seedShow) {
        queryClient.setQueryData(['show', 'test-show'], mockShow);
        queryClient.setQueryData(['tmdbShow', mockShow.ids.tmdb, 'en-US'], tmdbShowData);
      }

      await TestBed.configureTestingModule({
        providers: [
          provideTanStackQuery(queryClient),
          {
            provide: ActivatedRoute,
            useValue: {
              params: of({ show: 'test-show' }),
            },
          },
          {
            provide: ShowService,
            useValue: {
              fetchShow: vi.fn(() =>
                throwError(
                  () =>
                    new Error(
                      'Http failure response for https://api.trakt.tv/shows/test-show: 0 undefined',
                    ),
                ),
              ),
              showsWatched: { s: signal([]) },
              showsProgress: { s: signal({}) },
              getShowProgress$: vi.fn(() => of(undefined)),
              updateShowsProgress: vi.fn(),
              favorites: { s: signal<number[]>([]) },
              isFavorite: vi.fn(() => false),
              activeShow: { set: vi.fn() },
              addFavorite: vi.fn(),
              removeFavorite: vi.fn(),
            },
          },
          {
            provide: TmdbService,
            useValue: {
              getTmdbShow$: vi.fn(() => of(tmdbShowData)),
              getTmdbEpisode$: vi.fn(() => of(undefined)),
              getTmdbSeason$: vi.fn(() => of(null)),
              fetchTmdbShowExtended: vi.fn(() => of(tmdbShowData)),
              tmdbEpisodes: { s: signal({}) },
              tmdbSeasons: { s: signal({}) },
              toTmdbSeason: vi.fn(() => undefined),
            },
          },
          {
            provide: EpisodeService,
            useValue: {
              showsEpisodes: { s: signal({}) },
              getEpisode$: vi.fn(() => of(undefined)),
              fetchEpisodesFromShow: vi.fn(() => of({})),
            },
          },
          {
            provide: ListService,
            useValue: {
              watchlist: { s: signal([]) },
            },
          },
          {
            provide: BreakpointObserver,
            useValue: {
              observe: vi.fn(() => of({ matches: false })),
            },
          },
          { provide: Title, useValue: { setTitle: vi.fn() } },
          {
            provide: Router,
            useValue: {
              currentNavigation: vi.fn(() => null),
            },
          },
          {
            provide: MatSnackBar,
            useValue: {
              open: vi.fn(() => ({ onAction: (): typeof EMPTY => EMPTY })),
            },
          },
          {
            provide: ExecuteService,
            useValue: {
              addEpisode: vi.fn(async () => undefined),
            },
          },
          {
            provide: AuthService,
            useValue: {
              isLoggedIn: signal(true),
            },
          },
          {
            provide: DialogService,
            useValue: {
              showTrailer: vi.fn(),
            },
          },
          provideHttpClient(),
          provideHttpClientTesting(),
          provideOAuthClient(),
        ],
      }).compileComponents();

      const fixture = TestBed.createComponent(ShowComponent);
      const component = fixture.componentInstance;
      fixture.componentRef.setInput('show', 'test-show');
      fixture.detectChanges();
      await fixture.whenStable();
      fixture.detectChanges();

      return { fixture, component };
    }

    it('replaces the page with the error when the show cannot be loaded at all', async () => {
      const { fixture } = await setupShowQueryErrorComponent({ seedShow: false });

      await vi.waitFor(() => {
        expect(fixture.nativeElement.querySelector('t-error-text')).toBeTruthy();
      });
      expect(fixture.nativeElement.querySelector('t-show-header')).toBeNull();
      expect(fixture.nativeElement.querySelector('.container')).toBeNull();
    });

    it('keeps the already loaded page sections and shows the refresh error inline', async () => {
      const { fixture } = await setupShowQueryErrorComponent({ seedShow: true });

      // The cached show keeps the page mounted (poster, header, sections), the failed
      // refresh only adds an inline error instead of replacing the whole page.
      await vi.waitFor(() => {
        expect(fixture.nativeElement.querySelector('t-error-text')).toBeTruthy();
      });
      expect(fixture.nativeElement.querySelector('t-show-header')).toBeTruthy();
      expect(fixture.nativeElement.querySelector('t-show-cast')).toBeTruthy();
      expect(fixture.nativeElement.querySelector('t-show-details')).toBeTruthy();
    });
  });

  describe('methods', () => {
    it('throws when addToHistory episode is missing', async () => {
      const methodComponent = Object.create(ShowComponent.prototype) as ShowComponent;

      await expect(methodComponent.addToHistory(undefined, mockShow)).rejects.toThrow(
        'Episode is empty (addToHistory)',
      );
    });

    it('calls execute service when adding episode to history', async () => {
      const methodComponent = Object.create(ShowComponent.prototype) as ShowComponent;
      methodComponent.executeService = {
        addEpisode: vi.fn(() => Promise.resolve(undefined)),
      } as never;
      methodComponent.seenLoading = signal('success') as never;

      const episode: Episode = {
        ids: {
          trakt: 1,
          tmdb: 1,
          tvdb: 1,
          tvrage: 1,
          imdb: 'tt1',
        },
        season: 1,
        number: 1,
        title: 'Episode 1',
      };

      await methodComponent.addToHistory(episode, mockShow);

      expect(methodComponent.executeService.addEpisode).toHaveBeenCalledWith(
        episode,
        mockShow,
        methodComponent.seenLoading,
      );
    });

    it('handles addToHistory errors and marks seen loading as error', async () => {
      const methodComponent = Object.create(ShowComponent.prototype) as ShowComponent;
      methodComponent.executeService = {
        addEpisode: vi.fn(() => Promise.reject(new Error('failed to add'))),
      } as never;
      methodComponent.seenLoading = signal<'success' | 'error'>('success') as never;
      methodComponent.snackBar = {
        open: vi.fn(() => ({
          onAction: (): typeof EMPTY => EMPTY,
        })),
      } as never;

      const episode: Episode = {
        ids: {
          trakt: 1,
          tmdb: 1,
          tvdb: 1,
          tvrage: 1,
          imdb: 'tt1',
        },
        season: 1,
        number: 1,
        title: 'Episode 1',
      };

      await methodComponent.addToHistory(episode, mockShow);

      expect(methodComponent.seenLoading()).toBe('error');
      expect(methodComponent.snackBar.open).toHaveBeenCalled();
    });

    it('destroys lightbox and clears active show on destroy', () => {
      const methodComponent = Object.create(ShowComponent.prototype) as ShowComponent;
      const destroy = vi.fn();
      const activeShowSet = vi.fn();

      methodComponent.lightbox = { destroy } as never;
      methodComponent.showService = {
        activeShow: { set: activeShowSet },
      } as never;

      methodComponent.ngOnDestroy();

      expect(destroy).toHaveBeenCalled();
      expect(activeShowSet).toHaveBeenCalledWith(undefined);
    });
  });
});
