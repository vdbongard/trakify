import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatSnackBar } from '@angular/material/snack-bar';
import { provideRouter } from '@angular/router';
import { EMPTY, of, throwError } from 'rxjs';
import WatchlistComponent from './watchlist.component';
import { ListService } from '../../../lists/data/list.service';
import { EpisodeService } from '../../data/episode.service';
import { TmdbService } from '../../data/tmdb.service';
import { ExecuteService } from '@services/execute.service';
import { toEpisodeId } from '@helper/toShowId';
import { mockShow } from '@shared/mocks/mockShow';
import type { EpisodeFull, Show } from '@type/Trakt';
import type { WatchlistItem } from '@type/TraktList';
import type { TmdbShow } from '@type/Tmdb';

describe('WatchlistComponent', () => {
  let fixture: ComponentFixture<WatchlistComponent>;
  let component: WatchlistComponent;
  let listServiceMock: {
    getWatchlistItems$: ReturnType<typeof vi.fn>;
  };
  let episodeServiceMock: {
    getEpisodes$: ReturnType<typeof vi.fn>;
  };
  let tmdbServiceMock: {
    getTmdbShow$: ReturnType<typeof vi.fn>;
  };

  function createShow(id: number, title: string): Show {
    return {
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
    };
  }

  function createEpisode(showId: number, firstAired: string): EpisodeFull {
    return {
      ids: {
        trakt: showId,
        tmdb: showId,
        tvdb: showId,
        tvrage: showId,
        imdb: `tt${showId}`,
      },
      season: 1,
      number: 1,
      title: `Episode ${showId}`,
      first_aired: firstAired,
    };
  }

  function createWatchlistItem(show: Show): WatchlistItem {
    return {
      id: show.ids.trakt,
      listed_at: '2020-01-01T00:00:00.000Z',
      notes: null,
      show,
      type: 'show',
    };
  }

  beforeEach(async () => {
    const showOne = createShow(1, 'Show One');
    const showTwo = createShow(2, 'Show Two');

    listServiceMock = {
      getWatchlistItems$: vi.fn(() =>
        of([createWatchlistItem(showOne), createWatchlistItem(showTwo)]),
      ),
    };
    episodeServiceMock = {
      getEpisodes$: vi.fn(() =>
        of({
          [toEpisodeId(showOne.ids.trakt, 1, 1)]: createEpisode(
            showOne.ids.trakt,
            '2024-01-01T00:00:00.000Z',
          ),
          [toEpisodeId(showTwo.ids.trakt, 1, 1)]: createEpisode(
            showTwo.ids.trakt,
            '2023-01-01T00:00:00.000Z',
          ),
        }),
      ),
    };
    tmdbServiceMock = {
      getTmdbShow$: vi.fn((show: Show) => of({ id: show.ids.tmdb, name: `TMDB ${show.ids.tmdb}` })),
    };

    await TestBed.configureTestingModule({
      providers: [
        { provide: ListService, useValue: listServiceMock },
        { provide: EpisodeService, useValue: episodeServiceMock },
        { provide: TmdbService, useValue: tmdbServiceMock },
        { provide: ExecuteService, useValue: { removeFromWatchlist: vi.fn() } },
        {
          provide: MatSnackBar,
          useValue: {
            open: vi.fn((): { onAction: () => typeof EMPTY } => ({
              onAction: () => EMPTY,
            })),
          },
        },
        provideRouter([]),
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(WatchlistComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should render loading state', () => {
    const loading = fixture.nativeElement.querySelector('t-loading');
    const shows = fixture.nativeElement.querySelector('t-shows');

    expect(loading).toBeTruthy();
    expect(shows).toBeTruthy();
  });

  it('should render FAB with add show link', () => {
    const fab: HTMLAnchorElement = fixture.nativeElement.querySelector('a[mat-fab]');
    const icon = fab?.querySelector('mat-icon');

    expect(fab).toBeTruthy();
    expect(icon?.textContent?.trim()).toBe('add');
    expect(fab.getAttribute('aria-label')).toBe('Add show to watchlist');
    expect(fab.getAttribute('routerLink')).toBe('/shows/add-show');
  });

  it('maps watchlist data into show infos and marks success state', () => {
    const showsInfos = component.showsInfos();

    expect(component.pageState()).toBe('success');
    expect(showsInfos).toHaveLength(2);
    expect(showsInfos?.every((showInfo) => showInfo.isWatchlist === true)).toBe(true);
    expect(showsInfos?.[0]?.tmdbShow).toEqual({ id: 2, name: 'TMDB 2' });
    expect(showsInfos?.[0]?.nextEpisode?.first_aired).toBe('2023-01-01T00:00:00.000Z');
  });

  it('requests tmdb shows with fetchAlways option', async () => {
    const showOne = createShow(10, 'One');
    const showTwo = createShow(20, 'Two');

    const result = await new Promise<TmdbShow[]>((resolve) => {
      component.getTmdbShows$([showOne, showTwo]).subscribe((value) => resolve(value));
    });

    expect(tmdbServiceMock.getTmdbShow$).toHaveBeenCalledWith(showOne, false, {
      fetchAlways: true,
    });
    expect(tmdbServiceMock.getTmdbShow$).toHaveBeenCalledWith(showTwo, false, {
      fetchAlways: true,
    });
    expect(result).toEqual([
      { id: showOne.ids.tmdb, name: 'TMDB 10' },
      { id: showTwo.ids.tmdb, name: 'TMDB 20' },
    ]);
  });

  it('sets error state when watchlist stream fails', async () => {
    listServiceMock.getWatchlistItems$.mockReturnValueOnce(
      throwError(() => new Error('watchlist failed')),
    );

    const errorFixture = TestBed.createComponent(WatchlistComponent);
    errorFixture.detectChanges();
    await errorFixture.whenStable();

    expect(errorFixture.componentInstance.pageState()).toBe('error');
  });
});
