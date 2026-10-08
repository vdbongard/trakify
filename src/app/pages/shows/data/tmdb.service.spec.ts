import { TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { of, throwError } from 'rxjs';
import { TmdbService } from './tmdb.service';
import { ShowService } from './show.service';
import { TranslationService } from './translation.service';
import { LocalStorageService } from '@services/local-storage.service';
import { SyncDataService } from '@services/sync-data.service';
import { LocalStorage } from '@type/Enum';
import { mockShow } from '@shared/mocks/mockShow';
import type { TmdbEpisode, TmdbSeason, TmdbShow } from '@type/Tmdb';
import { provideTanStackQuery, QueryClient } from '@tanstack/angular-query-experimental';

describe('TmdbService', () => {
  let service: TmdbService;
  let localStorageServiceMock: {
    setObject: ReturnType<typeof vi.fn>;
  };
  let translationServiceMock: {
    getShowTranslation: ReturnType<typeof vi.fn>;
    ensureShowTranslation: ReturnType<typeof vi.fn>;
    getEpisodeTranslation: ReturnType<typeof vi.fn>;
  };

  const tmdbShowSignal = signal<Record<string, TmdbShow | undefined>>({});
  const tmdbSeasonSignal = signal<Record<string, TmdbSeason | undefined>>({});
  const tmdbEpisodeSignal = signal<Record<string, TmdbEpisode | undefined>>({});

  const showId = 123456;
  const seasonId = `${showId}-1`;
  const episodeId = `${showId}-1-1`;

  const tmdbShow: TmdbShow = {
    id: showId,
    name: 'TMDB Show',
    overview: 'Overview',
    created_by: [],
    episode_run_time: [45],
    first_air_date: '2020-01-01',
    genres: [],
    homepage: 'https://example.com',
    networks: [],
    number_of_episodes: 10,
    poster_path: '/poster.jpg',
    seasons: [
      {
        air_date: '2020-01-01',
        episode_count: 10,
        id: 1,
        name: 'Season 1',
        overview: 'Season overview',
        poster_path: '/season.jpg',
        season_number: 1,
      },
    ],
    status: 'Ended',
    type: 'Scripted',
    vote_average: 7,
    vote_count: 100,
  };

  const tmdbSeason: TmdbSeason = {
    id: 10,
    name: 'Season 1',
    poster_path: '/season.jpg',
    episodes: [
      {
        id: 200,
        name: 'Episode 1',
        episode_number: 1,
        season_number: 1,
        air_date: '2020-01-01',
      },
    ],
  };

  const tmdbEpisode: TmdbEpisode = {
    id: 200,
    name: 'Episode 1',
    episode_number: 1,
    season_number: 1,
    air_date: '2020-01-01',
  };

  beforeEach(() => {
    tmdbShowSignal.set({});
    tmdbSeasonSignal.set({});
    tmdbEpisodeSignal.set({});

    localStorageServiceMock = {
      setObject: vi.fn(),
    };

    translationServiceMock = {
      getShowTranslation: vi.fn(() => undefined),
      ensureShowTranslation: vi.fn(() => Promise.resolve(undefined)),
      getEpisodeTranslation: vi.fn(() => undefined),
    };

    TestBed.configureTestingModule({
      providers: [
        provideTanStackQuery(new QueryClient()),
        { provide: ShowService, useValue: { getShows$: vi.fn(() => of([])) } },
        { provide: TranslationService, useValue: translationServiceMock },
        { provide: LocalStorageService, useValue: localStorageServiceMock },
        {
          provide: SyncDataService,
          useValue: {
            syncObjects: vi
              .fn()
              .mockReturnValueOnce({
                s: tmdbShowSignal,
                syncIds: vi.fn(() => of(undefined)),
                fetchIds: vi.fn(() => of(tmdbShow)),
                evictWhere: vi.fn(() => undefined),
                flush: vi.fn(() => undefined),
              })
              .mockReturnValueOnce({
                s: tmdbSeasonSignal,
                syncIds: vi.fn(() => of(undefined)),
                fetchIds: vi.fn(() => of(tmdbSeason)),
                evictWhere: vi.fn(() => undefined),
                flush: vi.fn(() => undefined),
              })
              .mockReturnValueOnce({
                s: tmdbEpisodeSignal,
                syncIds: vi.fn(() => of(undefined)),
                fetchIds: vi.fn(() => of(tmdbEpisode)),
                evictWhere: vi.fn(() => undefined),
                flush: vi.fn(() => undefined),
              }),
          },
        },
      ],
    });

    service = TestBed.inject(TmdbService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('removeShow', () => {
    it('removes stored tmdb show and persists it', () => {
      tmdbShowSignal.set({ [showId]: tmdbShow });

      service.removeShow(showId);

      expect(service.tmdbShows.s()[showId]).toBeUndefined();
      expect(localStorageServiceMock.setObject).toHaveBeenCalledWith(
        LocalStorage.TMDB_SHOWS,
        service.tmdbShows.s(),
      );
    });

    it('ignores missing id or unknown show', () => {
      tmdbShowSignal.set({ [showId]: tmdbShow });

      service.removeShow(undefined);
      service.removeShow(999999);

      expect(service.tmdbShows.s()[showId]).toBeTruthy();
      expect(localStorageServiceMock.setObject).not.toHaveBeenCalled();
    });
  });

  describe('getTmdbSeason and getTmdbEpisode', () => {
    it('returns season by show and season number', () => {
      tmdbSeasonSignal.set({ [seasonId]: tmdbSeason });

      expect(service.getTmdbSeason(mockShow, 1)).toEqual(tmdbSeason);
    });

    it('throws when season not found', () => {
      tmdbSeasonSignal.set({});

      expect(() => service.getTmdbSeason(mockShow, 1)).toThrow('Tmdb season empty');
    });

    it('returns episode from season when it exists', () => {
      tmdbSeasonSignal.set({ [seasonId]: tmdbSeason });

      expect(service.getTmdbEpisode(mockShow, 1, 1)?.id).toBe(tmdbEpisode.id);
      expect(service.getTmdbEpisode(mockShow, 1, 99)).toBeUndefined();
    });

    it('returns undefined when the season is not cached yet', () => {
      tmdbSeasonSignal.set({});

      expect(service.getTmdbEpisode(mockShow, 1, 1)).toBeUndefined();
    });
  });

  describe('fetchTmdbShowEntry', () => {
    it('throws when the show has no tmdb id', () => {
      const showWithoutTmdb = { ...mockShow, ids: { ...mockShow.ids, tmdb: null } };

      expect(() => service.fetchTmdbShowEntry(showWithoutTmdb)).toThrow(
        'Tmdb show is empty (fetchTmdbShowEntry)',
      );
    });

    it('returns the stored show with translation without fetching', async () => {
      tmdbShowSignal.set({ [showId]: tmdbShow });
      translationServiceMock.getShowTranslation.mockReturnValue({ title: 'Localized' });
      const fetchIds = service.tmdbShows.fetchIds as unknown as ReturnType<typeof vi.fn>;

      const result = await service.fetchTmdbShowEntry(mockShow);

      expect(result.name).toBe('Localized');
      expect(fetchIds).not.toHaveBeenCalled();
      expect(translationServiceMock.ensureShowTranslation).not.toHaveBeenCalled();
    });

    it('throws for empty stored show object', () => {
      tmdbShowSignal.set({ [showId]: {} as TmdbShow });

      expect(() => service.fetchTmdbShowEntry(mockShow)).toThrow(
        'Tmdb show is empty (fetchTmdbShowEntry)',
      );
    });

    it('fetches a missing show without persisting by default', async () => {
      translationServiceMock.ensureShowTranslation.mockResolvedValue({ title: 'Fetched' });
      const fetchIds = service.tmdbShows.fetchIds as unknown as ReturnType<typeof vi.fn>;

      const result = await service.fetchTmdbShowEntry(mockShow);

      expect(fetchIds).toHaveBeenCalledWith([showId, ''], { persist: false });
      expect(translationServiceMock.ensureShowTranslation).toHaveBeenCalledWith(mockShow, {
        persist: false,
      });
      expect(result.name).toBe('Fetched');
    });

    it('persists the translation fetch when the translation is cached but the show is missing', async () => {
      translationServiceMock.getShowTranslation.mockReturnValue({ title: 'Stored' });

      await service.fetchTmdbShowEntry(mockShow);

      expect(translationServiceMock.ensureShowTranslation).toHaveBeenCalledWith(mockShow, {
        persist: true,
      });
    });

    it('passes force and persist through on refetch', async () => {
      tmdbShowSignal.set({ [showId]: tmdbShow });

      await service.fetchTmdbShowEntry(mockShow, { force: true, persist: true });

      const fetchIds = service.tmdbShows.fetchIds as unknown as ReturnType<typeof vi.fn>;
      expect(fetchIds).toHaveBeenCalledWith([showId, ''], { persist: true });
      expect(translationServiceMock.ensureShowTranslation).toHaveBeenCalledWith(mockShow, {
        force: true,
        persist: true,
      });
    });
  });

  describe('fetchTmdbSeason', () => {
    it('throws when arguments are missing', () => {
      expect(() => service.fetchTmdbSeason(mockShow, undefined)).toThrow(
        'Argument is empty (fetchTmdbSeason)',
      );
    });

    it('returns the stored season without fetching', async () => {
      tmdbSeasonSignal.set({ [seasonId]: tmdbSeason });
      const fetchIds = service.tmdbSeasons.fetchIds as unknown as ReturnType<typeof vi.fn>;

      const result = await service.fetchTmdbSeason(mockShow, 1);

      expect(result).toEqual(tmdbSeason);
      expect(fetchIds).not.toHaveBeenCalled();
    });

    it('fetches a missing season with persist', async () => {
      const fetchIds = service.tmdbSeasons.fetchIds as unknown as ReturnType<typeof vi.fn>;

      const result = await service.fetchTmdbSeason(mockShow, 1);

      expect(fetchIds).toHaveBeenCalledWith([showId, 1], { persist: true });
      expect(result).toEqual(tmdbSeason);
    });

    it('throws when the fetched season is empty', async () => {
      const fetchIds = service.tmdbSeasons.fetchIds as unknown as ReturnType<typeof vi.fn>;
      fetchIds.mockReturnValueOnce(of(undefined));

      await expect(service.fetchTmdbSeason(mockShow, 1)).rejects.toThrow(
        'Season is empty (fetchTmdbSeason)',
      );
    });
  });

  describe('fetchTmdbEpisode', () => {
    it('throws when arguments are missing', () => {
      expect(() => service.fetchTmdbEpisode(mockShow, undefined, 1)).toThrow(
        'Argument is empty (fetchTmdbEpisode)',
      );
    });

    it('returns the stored episode with translation without fetching', async () => {
      tmdbEpisodeSignal.set({ [episodeId]: tmdbEpisode });
      translationServiceMock.getEpisodeTranslation.mockReturnValue({ title: 'Localized' });
      const fetchIds = service.tmdbEpisodes.fetchIds as unknown as ReturnType<typeof vi.fn>;

      const result = await service.fetchTmdbEpisode(mockShow, 1, 1);

      expect(result?.name).toBe('Localized');
      expect(fetchIds).not.toHaveBeenCalled();
      expect(translationServiceMock.getEpisodeTranslation).toHaveBeenCalledWith(mockShow, 1, 1);
    });

    it('throws for empty stored episode object', () => {
      tmdbEpisodeSignal.set({ [episodeId]: {} as TmdbEpisode });

      expect(() => service.fetchTmdbEpisode(mockShow, 1, 1)).toThrow(
        'Episode is empty (fetchTmdbEpisode)',
      );
    });

    it('returns undefined when the show has no tmdb id', async () => {
      const showWithoutTmdb = { ...mockShow, ids: { ...mockShow.ids, tmdb: null } };
      const fetchIds = service.tmdbEpisodes.fetchIds as unknown as ReturnType<typeof vi.fn>;

      const result = await service.fetchTmdbEpisode(showWithoutTmdb, 1, 1);

      expect(result).toBeUndefined();
      expect(fetchIds).not.toHaveBeenCalled();
    });

    it('fetches a missing episode without persisting by default', async () => {
      const fetchIds = service.tmdbEpisodes.fetchIds as unknown as ReturnType<typeof vi.fn>;

      const result = await service.fetchTmdbEpisode(mockShow, 1, 1);

      expect(fetchIds).toHaveBeenCalledWith([showId, 1, 1], { persist: false });
      expect(translationServiceMock.getEpisodeTranslation).toHaveBeenCalledWith(mockShow, 1, 1);
      expect(result?.name).toBe('Episode 1');
    });

    it('passes persist through on refetch', async () => {
      tmdbEpisodeSignal.set({ [episodeId]: tmdbEpisode });

      const result = await service.fetchTmdbEpisode(mockShow, 1, 1, { force: true, persist: true });

      const fetchIds = service.tmdbEpisodes.fetchIds as unknown as ReturnType<typeof vi.fn>;
      expect(fetchIds).toHaveBeenCalledWith([showId, 1, 1], { persist: true });
      expect(translationServiceMock.getEpisodeTranslation).toHaveBeenCalledWith(mockShow, 1, 1);
      expect(result?.name).toBe('Episode 1');
    });
  });

  describe('toTmdbSeason', () => {
    it('returns undefined when next episode is missing', () => {
      expect(service.toTmdbSeason(mockShow, undefined)).toBeUndefined();
    });

    it('returns matching season for show progress next episode', () => {
      tmdbSeasonSignal.set({ [seasonId]: tmdbSeason });

      const showProgress = {
        next_episode: {
          ids: { trakt: 1, slug: 'ep' },
          number: 1,
          season: 1,
          title: 'Next',
        },
      } as never;

      expect(service.toTmdbSeason(mockShow, showProgress)?.id).toBe(tmdbSeason.id);
    });
  });

  describe('fetchTmdbShow', () => {
    it('returns tuple of tmdb show and trakt id', async () => {
      const tuple = await service.fetchTmdbShow(mockShow);

      expect(tuple[0]).toEqual(tmdbShow);
      expect(tuple[1].traktId).toBe(mockShow.ids.trakt);
    });

    it('returns null show when the fetch fails', async () => {
      const fetchIds = service.tmdbShows.fetchIds as unknown as ReturnType<typeof vi.fn>;
      fetchIds.mockReturnValueOnce(throwError(() => new Error('TMDB down')));

      const tuple = await service.fetchTmdbShow(mockShow);

      expect(tuple[0]).toBeNull();
      expect(tuple[1].traktId).toBe(mockShow.ids.trakt);
    });
  });

  describe('query helpers', () => {
    it('builds empty tmdb query list for undefined shows', () => {
      const queries = TestBed.runInInjectionContext(() =>
        service.getTmdbShowQueries(signal(undefined)),
      );
      expect(queries()).toEqual([]);
    });

    it('merges tmdb query data with show infos by trakt id', () => {
      const tmdbQueryData = signal([
        {
          data: signal<[TmdbShow | null, { traktId: number }]>([
            tmdbShow,
            { traktId: mockShow.ids.trakt },
          ]),
        },
      ] as never);
      const showInfos = signal([{ show: mockShow }]);

      const merged = service.getShowsInfosWithTmdb(tmdbQueryData, showInfos);

      expect(merged()[0].tmdbShow?.id).toBe(tmdbShow.id);
    });
  });
});
