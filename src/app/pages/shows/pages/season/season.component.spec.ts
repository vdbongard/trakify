import { ComponentFixture, TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import SeasonComponent from './season.component';
import { ActivatedRoute } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideOAuthClient } from 'angular-oauth2-oidc';
import { of, EMPTY } from 'rxjs';
import { mockShow } from '@shared/mocks/mockShow';
import { ShowService } from '../../data/show.service';
import { SeasonService } from '../../data/season.service';
import { Title } from '@angular/platform-browser';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ExecuteService } from '@services/execute.service';
import { AuthService } from '@services/auth.service';
import { provideTanStackQuery, QueryClient } from '@tanstack/angular-query-experimental';
import { queryKeys } from '@shared/query-keys';
import { EpisodeFull } from '@type/Trakt';

const mockSeasons = [
  { number: 1, ids: { trakt: 1, tmdb: 1, tvdb: 1, tvrage: 1 } },
] as import('@type/Trakt').Season[];

describe('SeasonComponent', () => {
  let component: SeasonComponent;
  let fixture: ComponentFixture<SeasonComponent>;

  beforeEach(async () => {
    const queryClient = new QueryClient();
    queryClient.setQueryData(queryKeys.show('test-show'), mockShow);
    queryClient.setQueryData(queryKeys.seasons(mockShow.ids.trakt), mockSeasons);
    queryClient.setQueryData(queryKeys.seasonEpisodes(mockShow.ids.trakt, 1), [] as EpisodeFull[]);

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
            root: null,
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
          provide: SeasonService,
          useValue: {
            fetchSeasons: vi.fn(() => of(mockSeasons)),
            getSeasonEpisodes$: vi.fn(() => of([] as EpisodeFull[])),
            activeSeason: { set: vi.fn() },
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

    fixture = TestBed.createComponent(SeasonComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('show', 'test-show');
    fixture.componentRef.setInput('season', '1');
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should render season page sections', () => {
    const seasonHeader = fixture.nativeElement.querySelector('t-season-header');
    const seasonEpisodes = fixture.nativeElement.querySelector('t-season-episodes');

    expect(seasonHeader).toBeTruthy();
    expect(seasonEpisodes).toBeTruthy();
  });
});
