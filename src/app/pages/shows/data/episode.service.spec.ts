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
    getEpisodeTranslation$: ReturnType<typeof vi.fn>;
    showsEpisodesTranslations: {
      s: ReturnType<typeof signal<Record<string, { title?: string }>>>;
    };
  };
  let showServiceMock: {
    showsProgress: {
      s: ReturnType<typeof signal<Record<string, ShowProgress | undefined>>>;
    };
    updateShowsProgress: ReturnType<typeof vi.fn>;
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
      getEpisodeTranslation$: vi.fn(() => of(undefined)),
      showsEpisodesTranslations: {
        s: signal<Record<string, { title?: string }>>({}),
      },
    };

    showServiceMock = {
      showsProgress: {
        s: signal<Record<string, ShowProgress | undefined>>({}),
      },
      updateShowsProgress: vi.fn(),
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
              fetch: vi.fn(() => of(episodeFull)),
              sync: vi.fn(() => of(undefined)),
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
      expect(service.toNextEpisode(showProgress, undefined, mockShow)).toBeUndefined();
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

  describe('getEpisode$', () => {
    it('throws when required arguments are missing', () => {
      expect(() => service.getEpisode$(mockShow, undefined, 1)).toThrow(
        'Argument is empty (getEpisode$)',
      );
    });

    it('returns stored episode and applies translation signal', async () => {
      service.showsEpisodes.s.set({ [episodeId]: episodeFull });
      translationServiceMock.getEpisodeTranslation$.mockReturnValue(
        of({ title: 'Localized title' }),
      );

      const result = await firstValueFrom(service.getEpisode$(mockShow, 1, 1));

      expect(result?.title).toBe('Localized title');
    });

    it('throws when stored episode object is empty', async () => {
      service.showsEpisodes.s.set({ [episodeId]: {} as EpisodeFull });

      await expect(firstValueFrom(service.getEpisode$(mockShow, 1, 1))).rejects.toThrow(
        'Episode is empty (getEpisode$)',
      );
    });
  });

  describe('getEpisodeProgress$', () => {
    it('throws when required arguments are missing', () => {
      expect(() => service.getEpisodeProgress$(mockShow, 1, undefined)).toThrow(
        'Argument is empty (getEpisodeProgress$)',
      );
    });

    it('returns episode progress from show progress store', async () => {
      showServiceMock.showsProgress.s.set({
        [showId]: {
          aired: 2,
          completed: 1,
          last_episode: null,
          last_watched_at: null,
          reset_at: null,
          seasons: [
            {
              aired: 2,
              completed: 1,
              number: 1,
              title: null,
              episodes: [
                { number: 1, completed: true, last_watched_at: null },
                { number: 2, completed: false, last_watched_at: null },
              ],
            },
          ],
        } as ShowProgress,
      });

      const progress = await firstValueFrom(service.getEpisodeProgress$(mockShow, 1, 2));

      expect(progress?.number).toBe(2);
      expect(progress?.completed).toBe(false);
    });
  });

  describe('getEpisodes$', () => {
    it('maps episodes and applies translation per episode id', async () => {
      service.showsEpisodes.s.set({ [episodeId]: episodeFull });
      translationServiceMock.showsEpisodesTranslations.s.set({
        [episodeId]: { title: 'Localized' },
      });

      const episodes = await firstValueFrom(service.getEpisodes$());

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
    it('updates show progress when new aired episode is found', () => {
      service.showsEpisodes.s.set({
        [episodeId2]: episode2Full,
      });
      showServiceMock.showsProgress.s.set({
        [showId]: {
          aired: 1,
          completed: 0,
          last_episode: null,
          last_watched_at: null,
          reset_at: null,
          seasons: [
            {
              aired: 1,
              completed: 0,
              number: 1,
              title: null,
              episodes: [{ number: 1, completed: false, last_watched_at: null }],
            },
          ],
        } as ShowProgress,
      });

      service.addMissingShowProgress();

      expect(showServiceMock.updateShowsProgress).toHaveBeenCalled();
    });
  });

  describe('addEpisode and removeEpisode', () => {
    it('buffers add episode and posts sync history payload', async () => {
      vi.useFakeTimers();
      httpMock.post.mockReturnValue(of({ not_found: { episodes: [] } }));

      const resultPromise = firstValueFrom(
        service.addEpisode({
          ids: episodeFull.ids,
          season: 1,
          number: 1,
          title: 'Episode 1',
        } as Episode),
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

    it('buffers remove episode and posts sync history remove payload', async () => {
      vi.useFakeTimers();
      httpMock.post.mockReturnValue(of({ not_found: { episodes: [] } }));

      const resultPromise = firstValueFrom(
        service.removeEpisode({
          ids: episodeFull.ids,
          season: 1,
          number: 1,
          title: 'Episode 1',
        } as Episode),
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
