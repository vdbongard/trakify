import { TestBed } from '@angular/core/testing';
import { HttpClient } from '@angular/common/http';
import { signal } from '@angular/core';
import { firstValueFrom, of } from 'rxjs';
import { EpisodeService } from './episode.service';
import { TmdbService } from './tmdb.service';
import { ShowService } from './show.service';
import { TranslationService } from './translation.service';
import { LocalStorageService } from '@services/local-storage.service';
import { SyncDataService } from '@services/sync-data.service';
import { SeasonService } from './season.service';
import { LocalStorage } from '@type/Enum';
import { mockShow } from '@shared/mocks/mockShow';
import type { Episode, EpisodeFull, SeasonProgress, ShowProgress } from '@type/Trakt';

describe('EpisodeService', () => {
  let service: EpisodeService;
  let httpMock: {
    get: ReturnType<typeof vi.fn>;
    post: ReturnType<typeof vi.fn>;
  };
  let localStorageServiceMock: {
    setObject: ReturnType<typeof vi.fn>;
  };
  let translationServiceMock: {
    getEpisodeTranslation: ReturnType<typeof vi.fn>;
    ensureEpisodeTranslation: ReturnType<typeof vi.fn>;
    showsEpisodesTranslations: {
      s: ReturnType<typeof signal<Record<string, { title?: string }>>>;
    };
  };
  let showServiceMock: {
    showsProgress: {
      s: ReturnType<typeof signal<Record<string, ShowProgress | undefined>>>;
    };
    updateShowsProgress: ReturnType<typeof vi.fn>;
    reconcileAiredEntries: ReturnType<typeof vi.fn>;
  };
  let seasonServiceMock: {
    getSeasonEpisodes$: ReturnType<typeof vi.fn>;
  };

  const showId = mockShow.ids.trakt;
  const episodeId = `${showId}-1-1`;
  const episodeId2 = `${showId}-1-2`;
  const otherShowEpisodeId = '999-1-1';

  const episodeFull: EpisodeFull = {
    ids: {
      trakt: 101,
      tmdb: 101,
      tvdb: 101,
      imdb: 'tt101',
    },
    number: 1,
    season: 1,
    title: 'Episode 1',
    first_aired: '2020-01-01T00:00:00.000Z',
    translations: [],
  };

  const episode2Full: EpisodeFull = {
    ...episodeFull,
    ids: { ...episodeFull.ids, trakt: 102, tmdb: 102, tvdb: 102, imdb: 'tt102' },
    number: 2,
    title: 'Episode 2',
    first_aired: '2020-01-02T00:00:00.000Z',
  };

  beforeEach(() => {
    httpMock = {
      get: vi.fn(() => of([])),
      post: vi.fn(() => of({ not_found: { episodes: [] } })),
    };

    localStorageServiceMock = {
      setObject: vi.fn(),
    };

    translationServiceMock = {
      getEpisodeTranslation: vi.fn(() => undefined),
      ensureEpisodeTranslation: vi.fn(() => Promise.resolve(undefined)),
      showsEpisodesTranslations: {
        s: signal<Record<string, { title?: string }>>({}),
      },
    };

    showServiceMock = {
      showsProgress: {
        s: signal<Record<string, ShowProgress | undefined>>({}),
      },
      updateShowsProgress: vi.fn(),
      reconcileAiredEntries: vi.fn(),
    };

    seasonServiceMock = {
      getSeasonEpisodes$: vi.fn(() => of([episodeFull])),
    };

    TestBed.configureTestingModule({
      providers: [
        { provide: HttpClient, useValue: httpMock },
        { provide: TmdbService, useValue: {} },
        { provide: ShowService, useValue: showServiceMock },
        { provide: TranslationService, useValue: translationServiceMock },
        { provide: LocalStorageService, useValue: localStorageServiceMock },
        { provide: SeasonService, useValue: seasonServiceMock },
        {
          provide: SyncDataService,
          useValue: {
            syncObjects: vi.fn(() => ({
              s: signal<Record<string, EpisodeFull | undefined>>({}),
              syncIds: vi.fn(() => of(undefined)),
              fetchIds: vi.fn(() => Promise.resolve(episodeFull)),
              evictWhere: vi.fn(() => undefined),
              flush: vi.fn(() => undefined),
            })),
          },
        },
      ],
    });

    service = TestBed.inject(EpisodeService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('basic mappers', () => {
    it('returns episode progress by number', () => {
      const seasonProgress: SeasonProgress = {
        aired: 2,
        completed: 1,
        number: 1,
        title: null,
        episodes: [
          { number: 1, completed: true, last_watched_at: null },
          { number: 2, completed: false, last_watched_at: null },
        ],
      };

      expect(service.getEpisodeProgress(seasonProgress, 2)?.number).toBe(2);
      expect(service.getEpisodeProgress(seasonProgress, 9)).toBeUndefined();
    });

    it('converts episode full to basic episode', () => {
      const mapped = service.getEpisodeFromEpisodeFull(episodeFull);

      expect(mapped).toEqual({
        ids: episodeFull.ids,
        number: episodeFull.number,
        season: episodeFull.season,
        title: episodeFull.title,
      });
      expect(service.getEpisodeFromEpisodeFull(undefined)).toBeUndefined();
      expect(service.getEpisodeFromEpisodeFull(null)).toBeNull();
    });

    it('returns next episode from progress and episode map', () => {
      const showProgress = {
        next_episode: {
          ids: { trakt: 102, slug: 's1e2' },
          number: 2,
          season: 1,
          title: 'Episode 2',
        },
      } as never;

      const result = service.toNextEpisode(showProgress, { [episodeId2]: episode2Full }, mockShow);

      expect(result?.title).toBe('Episode 2');
      expect(
        service.toNextEpisode(undefined, { [episodeId2]: episode2Full }, mockShow),
      ).toBeUndefined();
    });

    it('falls back to the compact next episode when its detail is not stored', () => {
      const showProgress = {
        next_episode: {
          ids: { trakt: 102, slug: 's1e2' },
          number: 2,
          season: 1,
          title: 'Episode 2',
        },
      } as never;

      const result = service.toNextEpisode(showProgress, undefined, mockShow);

      expect(result).toBeDefined();
      expect(result?.season).toBe(1);
      expect(result?.number).toBe(2);
      expect(result?.title).toBe('Episode 2');
    });

    it('keeps the air date from the overview next episode in the fallback', () => {
      const showProgress = {
        next_episode: {
          ids: { trakt: 102, slug: 's1e2' },
          number: 2,
          season: 1,
          title: 'Episode 2',
          first_aired: '2026-06-26T20:00:00.000Z',
        },
      } as never;

      const result = service.toNextEpisode(showProgress, undefined, mockShow);

      expect(result).toBeDefined();
      expect(result?.first_aired).toBe('2026-06-26T20:00:00.000Z');
      expect(result?.title).toBe('Episode 2');
    });

    it('blends the stored translation into the compact next episode fallback', () => {
      const showProgress = {
        next_episode: {
          ids: { trakt: 102, slug: 's1e2' },
          number: 2,
          season: 1,
          title: 'Episode 2',
          first_aired: '2026-06-26T20:00:00.000Z',
        },
      } as never;
      translationServiceMock.showsEpisodesTranslations.s.set({
        [episodeId2]: { title: 'Folge 2' },
      });

      const result = service.toNextEpisode(showProgress, undefined, mockShow);

      expect(result?.title).toBe('Folge 2');
      expect(result?.first_aired).toBe('2026-06-26T20:00:00.000Z');
    });
  });

  describe('removeShowsEpisodes', () => {
    it('removes show episodes by show prefix and persists', () => {
      service.showsEpisodes.s.set({
        [episodeId]: episodeFull,
        [episodeId2]: episode2Full,
        [otherShowEpisodeId]: episodeFull,
      });

      service.removeShowsEpisodes(mockShow);

      expect(service.showsEpisodes.s()).toEqual({ [otherShowEpisodeId]: episodeFull });
      expect(localStorageServiceMock.setObject).toHaveBeenCalledWith(LocalStorage.SHOWS_EPISODES, {
        [otherShowEpisodeId]: episodeFull,
      });
    });

    it('does nothing when no episode matches show prefix', () => {
      service.showsEpisodes.s.set({ [otherShowEpisodeId]: episodeFull });

      service.removeShowsEpisodes(mockShow);

      expect(localStorageServiceMock.setObject).not.toHaveBeenCalled();
    });
  });

  describe('fetchEpisode', () => {
    it('throws when required arguments are missing', () => {
      expect(() => service.fetchEpisode(mockShow, undefined, 1)).toThrow(
        'Argument is empty (fetchEpisode)',
      );
    });

    it('returns stored episode and applies translation without fetching', async () => {
      service.showsEpisodes.s.set({ [episodeId]: episodeFull });
      translationServiceMock.getEpisodeTranslation.mockReturnValue({ title: 'Localized title' });

      const result = await service.fetchEpisode(mockShow, 1, 1);

      expect(result?.title).toBe('Localized title');
      expect(translationServiceMock.ensureEpisodeTranslation).not.toHaveBeenCalled();
    });

    it('throws when stored episode object is empty', () => {
      service.showsEpisodes.s.set({ [episodeId]: {} as EpisodeFull });

      expect(() => service.fetchEpisode(mockShow, 1, 1)).toThrow('Episode is empty (fetchEpisode)');
    });

    it('fetches a missing episode without persisting by default', async () => {
      translationServiceMock.ensureEpisodeTranslation.mockResolvedValue({ title: 'Fetched title' });

      const result = await service.fetchEpisode(mockShow, 1, 1);

      const fetchIds = service.showsEpisodes.fetchIds as unknown as ReturnType<typeof vi.fn>;
      expect(fetchIds).toHaveBeenCalledWith([showId, 1, 1], { persist: false });
      expect(translationServiceMock.ensureEpisodeTranslation).toHaveBeenCalledWith(mockShow, 1, 1, {
        persist: false,
      });
      expect(result?.title).toBe('Fetched title');
    });

    it('persists the translation fetch when the translation is cached but the episode is missing', async () => {
      translationServiceMock.getEpisodeTranslation.mockReturnValue({ title: 'Stored translation' });

      await service.fetchEpisode(mockShow, 1, 1);

      const fetchIds = service.showsEpisodes.fetchIds as unknown as ReturnType<typeof vi.fn>;
      expect(fetchIds).toHaveBeenCalledWith([showId, 1, 1], { persist: false });
      expect(translationServiceMock.ensureEpisodeTranslation).toHaveBeenCalledWith(mockShow, 1, 1, {
        persist: true,
      });
    });

    it('passes force and persist through to episode and translation fetch', async () => {
      service.showsEpisodes.s.set({ [episodeId]: episodeFull });

      await service.fetchEpisode(mockShow, 1, 1, { force: true, persist: true });

      const fetchIds = service.showsEpisodes.fetchIds as unknown as ReturnType<typeof vi.fn>;
      expect(fetchIds).toHaveBeenCalledWith([showId, 1, 1], { persist: true });
      expect(translationServiceMock.ensureEpisodeTranslation).toHaveBeenCalledWith(mockShow, 1, 1, {
        force: true,
        persist: true,
      });
    });
  });

  describe('episodes', () => {
    it('maps episodes and applies translation per episode id', () => {
      service.showsEpisodes.s.set({ [episodeId]: episodeFull });
      translationServiceMock.showsEpisodesTranslations.s.set({
        [episodeId]: { title: 'Localized' },
      });

      const episodes = service.episodes();

      expect(episodes[episodeId]?.title).toBe('Localized');
    });
  });

  describe('fetchEpisodesFromShow', () => {
    it('returns empty object when tmdb show is missing', async () => {
      const episodes = await firstValueFrom(service.fetchEpisodesFromShow(undefined, mockShow));
      expect(episodes).toEqual({});
    });

    it('returns episodes grouped by season number', async () => {
      const tmdbShow = {
        seasons: [{ season_number: 1 }, { season_number: 2 }],
      } as never;
      seasonServiceMock.getSeasonEpisodes$.mockReturnValue(of([episodeFull]));

      const grouped = await firstValueFrom(service.fetchEpisodesFromShow(tmdbShow, mockShow));

      expect(grouped['1']?.length).toBe(1);
      expect(grouped['2']?.length).toBe(1);
    });

    it('handles season fetch errors by returning empty season list', async () => {
      const tmdbShow = {
        seasons: [{ season_number: 1 }],
      } as never;
      seasonServiceMock.getSeasonEpisodes$.mockReturnValue(of(undefined as never));

      const grouped = await firstValueFrom(service.fetchEpisodesFromShow(tmdbShow, mockShow));

      expect(grouped['1']).toEqual(undefined);
    });
  });

  describe('fetchCalendar', () => {
    it('calls calendar endpoint with date and days', async () => {
      httpMock.get.mockReturnValue(of([]));

      await firstValueFrom(service.fetchCalendar(14, '2025-01-01'));

      expect(httpMock.get).toHaveBeenCalledWith(
        'https://api.trakt.tv/calendars/my/shows/2025-01-01/14',
      );
    });
  });

  describe('addMissingShowProgress', () => {
    it('delegates aired-entry reconciliation to the unified store', () => {
      service.showsEpisodes.s.set({
        [episodeId2]: episode2Full,
      });

      service.addMissingShowProgress();

      expect(showServiceMock.reconcileAiredEntries).toHaveBeenCalledWith(service.showsEpisodes.s());
    });
  });

  describe('addEpisode and removeEpisode', () => {
    it('posts an add episode request immediately by default', async () => {
      const episode = {
        ids: episodeFull.ids,
        season: 1,
        number: 1,
        title: 'Episode 1',
      } as Episode;

      const result = await firstValueFrom(service.addEpisode(episode));

      expect(result).toEqual({ not_found: { episodes: [] } });
      expect(httpMock.post).toHaveBeenCalledWith('https://api.trakt.tv/sync/history', {
        episodes: [{ ids: episodeFull.ids }],
        watched_at: expect.any(String),
      });
    });

    it('buffers add episodes when batching is requested', async () => {
      vi.useFakeTimers();
      httpMock.post.mockReturnValue(of({ not_found: { episodes: [] } }));

      const resultPromise = firstValueFrom(
        service.addEpisode(
          {
            ids: episodeFull.ids,
            season: 1,
            number: 1,
            title: 'Episode 1',
          } as Episode,
          new Date(),
          { batch: true },
        ),
      );

      vi.advanceTimersByTime(1200);
      const result = await resultPromise;

      expect(result).toEqual({ not_found: { episodes: [] } });
      expect(httpMock.post).toHaveBeenCalledWith('https://api.trakt.tv/sync/history', {
        episodes: [{ ids: episodeFull.ids }],
        watched_at: expect.any(String),
      });
      vi.useRealTimers();
    });

    it('batches multiple add episodes into one history request', async () => {
      vi.useFakeTimers();
      httpMock.post.mockReturnValue(of({ not_found: { episodes: [] } }));
      const firstEpisode = { ...episodeFull, ids: { ...episodeFull.ids, trakt: 201 } } as Episode;
      const secondEpisode = {
        ...episode2Full,
        ids: { ...episode2Full.ids, trakt: 202 },
      } as Episode;

      const firstRequest = firstValueFrom(
        service.addEpisode(firstEpisode, new Date(), { batch: true }),
      );
      const secondRequest = firstValueFrom(
        service.addEpisode(secondEpisode, new Date(), { batch: true }),
      );
      vi.advanceTimersByTime(1200);
      await Promise.all([firstRequest, secondRequest]);

      expect(httpMock.post).toHaveBeenCalledTimes(1);
      expect(httpMock.post).toHaveBeenCalledWith('https://api.trakt.tv/sync/history', {
        episodes: [{ ids: firstEpisode.ids }, { ids: secondEpisode.ids }],
        watched_at: expect.any(String),
      });
      vi.useRealTimers();
    });

    it('posts a remove episode request immediately by default', async () => {
      const episode = {
        ids: episodeFull.ids,
        season: 1,
        number: 1,
        title: 'Episode 1',
      } as Episode;

      const result = await firstValueFrom(service.removeEpisode(episode));

      expect(result).toEqual({ not_found: { episodes: [] } });
      expect(httpMock.post).toHaveBeenCalledWith('https://api.trakt.tv/sync/history/remove', {
        episodes: [{ ids: episodeFull.ids }],
      });
    });

    it('buffers remove episodes when batching is requested', async () => {
      vi.useFakeTimers();
      httpMock.post.mockReturnValue(of({ not_found: { episodes: [] } }));

      const resultPromise = firstValueFrom(
        service.removeEpisode(
          {
            ids: episodeFull.ids,
            season: 1,
            number: 1,
            title: 'Episode 1',
          } as Episode,
          { batch: true },
        ),
      );

      vi.advanceTimersByTime(1200);
      const result = await resultPromise;

      expect(result).toEqual({ not_found: { episodes: [] } });
      expect(httpMock.post).toHaveBeenCalledWith('https://api.trakt.tv/sync/history/remove', {
        episodes: [{ ids: episodeFull.ids }],
      });
      vi.useRealTimers();
    });
  });
});
