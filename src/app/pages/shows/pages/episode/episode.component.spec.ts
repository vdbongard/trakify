import { ComponentFixture, TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import EpisodeComponent from './episode.component';
import { ActivatedRoute } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideOAuthClient } from 'angular-oauth2-oidc';
import { of, EMPTY } from 'rxjs';
import { provideTanStackQuery, QueryClient } from '@tanstack/angular-query-experimental';
import { queryKeys } from '@shared/query-keys';
import { mockShow } from '@shared/mocks/mockShow';
import { ShowService } from '../../data/show.service';
import { EpisodeService } from '../../data/episode.service';
import { SeasonService } from '../../data/season.service';
import { TmdbService } from '../../data/tmdb.service';
import { ExecuteService } from '@services/execute.service';
import { AuthService } from '@services/auth.service';
import { Title } from '@angular/platform-browser';
import { MatSnackBar } from '@angular/material/snack-bar';
import { EpisodeFull } from '@type/Trakt';
import { TmdbEpisode } from '@type/Tmdb';


const mockEpisode = {
  season: 1,
  number: 1,
  title: 'Test Episode',
  ids: { trakt: 1, tmdb: 1, tvdb: 1, tvrage: 1 },
  first_aired: null,
  updated_at: '',
} satisfies EpisodeFull;

const mockSeasons = [
  { number: 1, ids: { trakt: 1, tmdb: 1, tvdb: 1, tvrage: 1 } },
] as import('@type/Trakt').Season[];

describe('EpisodeComponent', () => {
  let component: EpisodeComponent;
  let fixture: ComponentFixture<EpisodeComponent>;

  beforeEach(async () => {
    const queryClient = new QueryClient();
    queryClient.setQueryData(queryKeys.show('test-show'), mockShow);
    queryClient.setQueryData(queryKeys.seasons(mockShow.ids.trakt), mockSeasons);
    queryClient.setQueryData(
      queryKeys.seasonEpisodes(mockShow.ids.trakt, 1),
      [] as EpisodeFull[],
    );
    queryClient.setQueryData(
      queryKeys.episode(mockShow.ids.trakt, 1, 1),
      mockEpisode,
    );
    queryClient.setQueryData(
      queryKeys.tmdbEpisode(mockShow.ids.tmdb, 1, 1),
      null as TmdbEpisode | null,
    );

    await TestBed.configureTestingModule({
      providers: [
        provideTanStackQuery(queryClient),
        {
          provide: ActivatedRoute,
          useValue: {
            params: of({}),
            snapshot: { url: [], params: {}, queryParams: {}, fragment: null, data: {} },
            url: of([]),
            queryParams: of({}),
            fragment: of(null),
            data: of({}),
            outlet: 'primary',
            component: null,
            parent: null,
            firstChild: null,
            children: [],
            pathFromRoot: [],
            paramMap: of({ get: (): string | null => null }),
            queryParamMap: of({ get: (): string | null => null }),
          },
        },
        provideHttpClient(),
        provideHttpClientTesting(),
        provideOAuthClient(),
        {
          provide: ShowService,
          useValue: {
            fetchShow: vi.fn(() => of(mockShow)),
            showsProgress: { s: signal({}) },
            activeShow: { set: vi.fn() },
          },
        },
        {
          provide: EpisodeService,
          useValue: {
            getEpisode$: vi.fn(() => of(mockEpisode)),
            getEpisodeProgress$: vi.fn(() => of(undefined)),
          },
        },
        {
          provide: SeasonService,
          useValue: {
            fetchSeasons: vi.fn(() => of(mockSeasons)),
            getSeasonEpisodes$: vi.fn(() => of([] as EpisodeFull[])),
          },
        },
        {
          provide: TmdbService,
          useValue: {
            getTmdbEpisode$: vi.fn(() => of(null)),
          },
        },
        { provide: Title, useValue: { setTitle: vi.fn() } },
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
            removeEpisode: vi.fn(async () => undefined),
          },
        },
        {
          provide: AuthService,
          useValue: {
            isLoggedIn: signal(true),
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(EpisodeComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('show', 'test-show');
    fixture.componentRef.setInput('season', '1');
    fixture.componentRef.setInput('episode', '1');
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should render episode page sections', () => {
    const episodeHeader = fixture.nativeElement.querySelector('t-episode-header');
    const episode = fixture.nativeElement.querySelector('t-episode');

    expect(episodeHeader).toBeTruthy();
    expect(episode).toBeTruthy();
  });
});
