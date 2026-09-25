import { TestBed } from '@angular/core/testing';
import { HttpClient } from '@angular/common/http';
import { signal } from '@angular/core';
import { catchError, firstValueFrom, forkJoin, of, take } from 'rxjs';
import { EpisodeService } from './episode.service';
import { TranslationService } from './translation.service';
import { ShowService } from './show.service';
import { TmdbService } from './tmdb.service';
import { SeasonService } from './season.service';
import { ConfigService } from '@services/config.service';
import { LocalStorageService } from '@services/local-storage.service';
import { SyncDataService } from '@services/sync-data.service';
import { delayedResponse } from '@shared/mocks/mockRateLimit';
import { resetRateLimit } from '@operator/rateLimit';
import { mockShow } from '@shared/mocks/mockShow';

describe('EpisodeService mark-as-seen translation request', () => {
  let episodeService: EpisodeService;
  let translationService: TranslationService;
  let configSignal: ReturnType<typeof signal<{ language: string }>>;
  let httpMock: { get: ReturnType<typeof vi.fn> };
  let localStorageServiceMock: {
    getObject: ReturnType<typeof vi.fn>;
    setObject: ReturnType<typeof vi.fn>;
  };
  let translationTracking: { inFlight: number; maxInFlight: number };

  const translationRequests = (): number =>
    httpMock.get.mock.calls.filter(([url]) => String(url).includes('/translations/')).length;

  const episodeRequests = (): number =>
    httpMock.get.mock.calls.filter(
      ([url]) => String(url).includes('/episodes/') && !String(url).includes('/translations/'),
    ).length;

  const episodeFullFixture = {
    first_aired: '2026-10-01T20:00:00.000Z',
    ids: { trakt: 196180, slug: 'test-show', tmdb: 100, imdb: 'tt1', tvdb: 1, tvrage: null },
    number: 8,
    overview: 'overview',
    season: 2,
    title: 'Die Folge',
    translations: [],
  };

  beforeEach(() => {
    resetRateLimit();
    configSignal = signal({ language: 'en-US' });
    translationTracking = { inFlight: 0, maxInFlight: 0 };

    httpMock = {
      get: vi.fn((url: unknown) => {
        const u = String(url);
        if (u.includes('/translations/')) {
          return delayedResponse([{ title: 'Die Folge' }], 30, translationTracking);
        }
        if (u.includes('/episodes/')) {
          return delayedResponse(episodeFullFixture, 30, { inFlight: 0, maxInFlight: 0 });
        }
        return of({});
      }),
    };

    localStorageServiceMock = {
      getObject: vi.fn(() => undefined),
      setObject: vi.fn(),
    };

    TestBed.configureTestingModule({
      providers: [
        { provide: ConfigService, useValue: { config: { s: configSignal } } },
        { provide: LocalStorageService, useValue: localStorageServiceMock },
        { provide: HttpClient, useValue: httpMock },
        {
          provide: ShowService,
          useValue: { showsProgress: { s: signal({}) } },
        },
        {
          provide: TmdbService,
          useValue: {
            tmdbSeasons: { s: signal({}), sync: vi.fn(() => of(undefined)) },
          },
        },
        { provide: SeasonService, useValue: {} },
        SyncDataService,
        TranslationService,
        EpisodeService,
      ],
    });

    episodeService = TestBed.inject(EpisodeService);
    translationService = TestBed.inject(TranslationService);
    configSignal.set({ language: 'de-DE' });
  });

  /** The show page's nextEpisodeQuery: re-fetches the next episode on demand. */
  const pageEpisodeQuery = (): ReturnType<typeof firstValueFrom> =>
    firstValueFrom(episodeService.getEpisode$(mockShow, 2, 8, { fetch: true, sync: true }));

  /** The optimistic execute service forkJoin (getEpisode$ + syncEpisode legs + tmdbSeasons). */
  const executeForkJoin = (): ReturnType<typeof firstValueFrom> =>
    firstValueFrom(
      forkJoin([
        episodeService.getEpisode$(mockShow, 2, 8, { fetch: true, sync: true }).pipe(take(1)),
        episodeService.showsEpisodes.sync(mockShow.ids.trakt, 2, 8, {
          deleteOld: true,
          publishSingle: true,
        }),
        translationService.showsEpisodesTranslations.sync(mockShow.ids.trakt, 2, 8, 'de', {
          deleteOld: true,
          publishSingle: true,
        }),
        of(undefined),
      ]).pipe(catchError(() => of([undefined, undefined, undefined, undefined]))),
    );

  /** syncNew → syncShowsNextEpisodes: cache-skipping re-sync of the next episode translation. */
  const syncShowsNextEpisodes = (): ReturnType<typeof firstValueFrom> =>
    firstValueFrom(
      translationService.showsEpisodesTranslations
        .sync(mockShow.ids.trakt, 2, 8, 'de', { deleteOld: true })
        .pipe(take(1)),
    );

  it('persists a direct sync=true episode translation fetch', async () => {
    configSignal.set({ language: 'de-DE' });

    await firstValueFrom(
      translationService.showsEpisodesTranslations.fetch(mockShow.ids.trakt, 2, 8, 'de', true),
    );

    expect(translationRequests()).toBe(1);
    expect(translationService.showsEpisodesTranslations.s()[`${mockShow.ids.trakt}-2-8`]).toEqual({
      title: 'Die Folge',
    });
  });

  it('persists a sync=true getEpisodeTranslation$ subscription', async () => {
    configSignal.set({ language: 'de-DE' });

    await firstValueFrom(
      translationService.getEpisodeTranslation$(mockShow, 2, 8, { fetch: true, sync: true }),
    );

    expect(translationRequests()).toBe(1);
    expect(translationService.showsEpisodesTranslations.s()[`${mockShow.ids.trakt}-2-8`]).toEqual({
      title: 'Die Folge',
    });
  });

  it('fetches the episode translation once for a single next-episode query', async () => {
    await pageEpisodeQuery();

    expect(translationRequests()).toBe(1);
    expect(translationTracking.maxInFlight).toBe(1);
  });

  it('fetches the episode translation once across the full mark-as-seen flow', async () => {
    // Act 1 — page nextEpisodeQuery re-renders for the new next episode (fires immediately).
    await pageEpisodeQuery();
    expect(
      translationService.showsEpisodesTranslations.s()[`${mockShow.ids.trakt}-2-8`],
    ).toBeDefined();
    expect(translationRequests()).toBe(1);

    // Act 2 — the optimistic execute forkJoin runs after the TMDB show gate (~a round trip later).
    await executeForkJoin();

    // Act 3 — syncNew → syncShowsNextEpisodes re-syncs the next episode's translation.
    await syncShowsNextEpisodes();

    expect(translationRequests()).toBe(1);
    expect(episodeRequests()).toBe(1);
    expect(translationTracking.maxInFlight).toBe(1);
  });

  it('fetches the episode translation once when page query and execute forkJoin overlap', async () => {
    // Both actors subscribe before any response arrives (same microtask window).
    const page = pageEpisodeQuery();
    const execute = executeForkJoin();
    await Promise.all([page, execute]);

    expect(translationRequests()).toBe(1);
    expect(episodeRequests()).toBe(1);
    expect(translationTracking.maxInFlight).toBe(1);
  });
});
