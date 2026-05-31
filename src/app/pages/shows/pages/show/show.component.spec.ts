import { ComponentFixture, TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import ShowComponent from './show.component';
import { ActivatedRoute, Router } from '@angular/router';
import { BreakpointObserver } from '@angular/cdk/layout';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideOAuthClient } from 'angular-oauth2-oidc';
import { EMPTY, of } from 'rxjs';
import { mockShow } from '@shared/mocks/mockShow';
import type { Episode } from '@type/Trakt';
import { TmdbService } from '../../data/tmdb.service';
import { ShowService } from '../../data/show.service';
import { EpisodeService } from '../../data/episode.service';
import { ParamService } from '@services/param.service';
import { ListService } from '../../../lists/data/list.service';
import { Title } from '@angular/platform-browser';
import { MatSnackBar } from '@angular/material/snack-bar';
import { AuthService } from '@services/auth.service';
import { DialogService } from '@services/dialog.service';
import { ExecuteService } from '@services/execute.service';

describe('ShowComponent', () => {
  let component: ShowComponent;
  let fixture: ComponentFixture<ShowComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      providers: [
        {
          provide: ActivatedRoute,
          useValue: {
            params: of({
              show: 'test-show',
            }),
          },
        },
        provideHttpClient(),
        provideHttpClientTesting(),
        provideOAuthClient(),
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ShowComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should render show page sections', () => {
    const rootLoading = fixture.nativeElement.querySelector('t-loading');
    const header = fixture.nativeElement.querySelector('t-show-header');
    const cast = fixture.nativeElement.querySelector('t-show-cast');
    const details = fixture.nativeElement.querySelector('t-show-details');
    const nextEpisode = fixture.nativeElement.querySelector('t-show-next-episode');
    const seasons = fixture.nativeElement.querySelector('t-show-seasons');
    const links = fixture.nativeElement.querySelector('t-show-links');

    expect(rootLoading).toBeTruthy();
    expect(header).toBeTruthy();
    expect(cast).toBeTruthy();
    expect(details).toBeTruthy();
    expect(nextEpisode).toBeTruthy();
    expect(seasons).toBeTruthy();
    expect(links).toBeTruthy();
  });

  describe('reactive branches', () => {
    interface ReactiveSetupOptions {
      showProgress: unknown;
      tmdbStatus: string;
      tmdbSeasons: { season_number: number }[];
    }

    const AGGREGATE_CREDITS = 'aggregate_credits' as const;

    async function setupReactiveComponent(options: ReactiveSetupOptions): Promise<{
      fixture: ComponentFixture<ShowComponent>;
      component: ShowComponent;
      episodeServiceMock: {
        getEpisode$: ReturnType<typeof vi.fn>;
        fetchEpisodesFromShow: ReturnType<typeof vi.fn>;
      };
      tmdbServiceMock: {
        getTmdbEpisode$: ReturnType<typeof vi.fn>;
        getTmdbSeason$: ReturnType<typeof vi.fn>;
      };
      titleMock: {
        setTitle: ReturnType<typeof vi.fn>;
      };
    }> {
      TestBed.resetTestingModule();

      const episodeServiceMock = {
        getEpisode$: vi.fn(() =>
          of({
            ids: { trakt: 1, tmdb: 1, tvdb: 1, tvrage: 1, imdb: 'tt1' },
            season: 1,
            number: 1,
            title: 'Episode 1',
          }),
        ),
        fetchEpisodesFromShow: vi.fn(() => of([])),
      };

      const tmdbServiceMock = {
        getTmdbShow$: vi.fn(() =>
          of({
            id: 10,
            status: options.tmdbStatus,
            seasons: options.tmdbSeasons,
            [AGGREGATE_CREDITS]: { cast: [] },
          }),
        ),
        getTmdbEpisode$: vi.fn(() => of({ id: 1, season_number: 1, episode_number: 1 })),
        getTmdbSeason$: vi.fn(() => of({ id: 1 })),
      };

      const titleMock = {
        setTitle: vi.fn(),
      };

      TestBed.configureTestingModule({
        providers: [
          {
            provide: ActivatedRoute,
            useValue: {
              params: of({ show: 'test-show' }),
            },
          },
          {
            provide: ShowService,
            useValue: {
              show$: vi.fn(() => of(mockShow)),
              getShowWatched$: vi.fn(() => of(undefined)),
              getShowProgress$: vi.fn(() => of(options.showProgress)),
              favorites: { s: signal<number[]>([]) },
              activeShow: { set: vi.fn() },
            },
          },
          { provide: TmdbService, useValue: tmdbServiceMock },
          { provide: EpisodeService, useValue: episodeServiceMock },
          {
            provide: ParamService,
            useValue: {
              params$: vi.fn((params$: ReturnType<typeof of>) => params$),
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
      branchFixture.detectChanges();
      await branchFixture.whenStable();

      return {
        fixture: branchFixture,
        component: branchComponent,
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
      expect(branchComponent.tmdbShow()?.seasons.map((season) => season.season_number)).toEqual([
        2, 1, 0,
      ]);
    });

    it('treats specials next episode as null and skips episode fetch calls', async () => {
      const {
        component: branchComponent,
        episodeServiceMock,
        tmdbServiceMock,
      } = await setupReactiveComponent({
        showProgress: {
          next_episode: { season: 0, number: 1 },
          seasons: [],
        },
        tmdbStatus: 'Returning Series',
        tmdbSeasons: [{ season_number: 0 }, { season_number: 1 }],
      });

      expect(branchComponent.nextTraktEpisode()).toBeNull();
      expect(episodeServiceMock.getEpisode$).not.toHaveBeenCalled();
      expect(tmdbServiceMock.getTmdbEpisode$).not.toHaveBeenCalled();
      expect(tmdbServiceMock.getTmdbSeason$).not.toHaveBeenCalled();
    });

    it('skips season episodes fetch when show is ended', async () => {
      const { episodeServiceMock } = await setupReactiveComponent({
        showProgress: undefined,
        tmdbStatus: 'Ended',
        tmdbSeasons: [{ season_number: 1 }],
      });

      expect(episodeServiceMock.fetchEpisodesFromShow).not.toHaveBeenCalled();
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

      expect(methodComponent.executeService.addEpisode).toHaveBeenCalledWith(episode, mockShow);
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
