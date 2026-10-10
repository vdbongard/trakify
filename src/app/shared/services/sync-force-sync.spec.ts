import { TestBed } from '@angular/core/testing';
import { HttpClient } from '@angular/common/http';
import { MatSnackBar } from '@angular/material/snack-bar';
import { signal } from '@angular/core';
import { of } from 'rxjs';
import { SyncService } from './sync.service';
import { SyncDataService } from './sync-data.service';
import { ConfigService } from './config.service';
import { AuthService } from './auth.service';
import { LocalStorageService } from './local-storage.service';
import { ShowService } from '../../pages/shows/data/show.service';
import { ListService } from '../../pages/lists/data/list.service';
import { TranslationService } from '../../pages/shows/data/translation.service';
import { EpisodeService } from '../../pages/shows/data/episode.service';
import { TmdbService } from '../../pages/shows/data/tmdb.service';
import { SeasonService } from '../../pages/shows/data/season.service';
import { InfoService } from '../../pages/shows/data/info.service';
import { mockShow } from '@shared/mocks/mockShow';
import { resetRateLimit } from '@operator/rateLimit';

/**
 * A force sync ("Sync all") batches signal publishes so the list UI settles instead of
 * jumping mid-sync. The batched stores must still be visible to the later sync steps:
 * orphan cleanup runs against fresh bulk data, so freshly synced entries survive while
 * genuine orphans are still evicted.
 */
describe('SyncService force sync', () => {
  let syncService: SyncService;
  let infoService: InfoService;
  let showService: ShowService;

  const freshNext = {
    season: 2,
    number: 4,
    title: 'Fresh next',
    first_aired: '2026-11-01T20:00:00.000Z',
    ids: { trakt: 999, tmdb: 888, imdb: null, tvdb: null, tvrage: null },
  };
  const watchedEntry = {
    last_updated_at: null,
    last_watched_at: '2026-01-01T00:00:00.000Z',
    plays: 5,
    reset_at: null,
    show: mockShow,
  };
  const overviewEntry = {
    show: mockShow,
    progress: {
      aired: 10,
      completed: 9,
      last_episode: null,
      last_watched_at: null,
      next_episode: freshNext,
      reset_at: null,
    },
  };

  beforeEach(() => {
    resetRateLimit();
    TestBed.configureTestingModule({
      providers: [
        {
          provide: HttpClient,
          useValue: {
            get: vi.fn((url: string) => {
              if (url.includes('/sync/watched/shows'))
                return url.includes('page=1&') ? of([watchedEntry]) : of([]);
              if (url.includes('/users/hidden/progress_watched')) return of([]);
              if (url.includes('/users/me/watchlist/shows')) return of([]);
              if (url.includes('/users/me/lists')) return of([]);
              if (url.includes('/sync/progress/watched'))
                return url.includes('page=1&') ? of([overviewEntry]) : of([]);
              return of([]);
            }),
          },
        },
        {
          provide: LocalStorageService,
          useValue: { getObject: vi.fn(() => undefined), setObject: vi.fn() },
        },
        { provide: AuthService, useValue: { isLoggedIn: signal(true) } },
        { provide: MatSnackBar, useValue: { open: vi.fn() } },
        SyncDataService,
        ConfigService,
        ShowService,
        ListService,
        TranslationService,
        EpisodeService,
        TmdbService,
        SeasonService,
        InfoService,
        SyncService,
      ],
    });
    syncService = TestBed.inject(SyncService);
    infoService = TestBed.inject(InfoService);
    showService = TestBed.inject(ShowService);
  });

  it('keeps the freshly synced next episode instead of evicting it as an orphan', async () => {
    await syncService.sync({} as never, { force: true });

    const progress = showService.showsProgress.s()[mockShow.ids.trakt];
    expect(progress?.next_episode).toMatchObject({ season: 2, number: 4 });
  });

  it('renders the next episode on the progress list after a force sync', async () => {
    await syncService.sync({} as never, { force: true });

    const infos = infoService.getShowsFilteredAndSorted()();
    expect(infos).toHaveLength(1);
    expect(infos[0].nextEpisode).toBeDefined();
  });

  it('still evicts progress for shows that are no longer synced', async () => {
    const orphanId = 999999;
    showService.showsProgress.s.set({
      [orphanId]: {
        aired: 1,
        completed: 0,
        last_episode: null,
        last_watched_at: null,
        next_episode: null,
        reset_at: null,
      },
    } as never);

    await syncService.sync({} as never, { force: true });

    const progress = showService.showsProgress.s();
    expect(progress[orphanId]).toBeUndefined();
    expect(progress[mockShow.ids.trakt]?.next_episode).toMatchObject({ season: 2, number: 4 });
  });
});
