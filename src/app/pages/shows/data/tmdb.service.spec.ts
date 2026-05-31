import { TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { firstValueFrom, of } from 'rxjs';
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
    getShowTranslation$: ReturnType<typeof vi.fn>;
    getEpisodeTranslation$: ReturnType<typeof vi.fn>;
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
      getShowTranslation$: vi.fn(() => of(undefined)),
      getEpisodeTranslation$: vi.fn(() => of(undefined)),
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
                sync: vi.fn(() => of(undefined)),
                fetch: vi.fn(() => of(tmdbShow)),
              })
              .mockReturnValueOnce({
                s: tmdbSeasonSignal,
                sync: vi.fn(() => of(undefined)),
                fetch: vi.fn(() => of(tmdbSeason)),
              })
              .mockReturnValueOnce({
                s: tmdbEpisodeSignal,
                sync: vi.fn(() => of(undefined)),
                fetch: vi.fn(() => of(tmdbEpisode)),
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
  });

  describe('getTmdbShow$', () => {
    it('throws when no stored show and no fetch requested', async () => {
      await expect(firstValueFrom(service.getTmdbShow$(mockShow))).rejects.toThrow(
        'Tmdb show is empty (getTmdbShow$)',
      );
    });

    it('returns stored show without fetch', async () => {
      tmdbShowSignal.set({ [showId]: tmdbShow });

      const result = await firstValueFrom(service.getTmdbShow$(mockShow));

      expect(result.id).toBe(showId);
      expect(translationServiceMock.getShowTranslation$).toHaveBeenCalled();
    });
  });

  describe('getTmdbSeason$', () => {
    it('throws when arguments are missing', () => {
      expect(() => service.getTmdbSeason$(mockShow, undefined)).toThrow(
        'Argument is empty (getTmdbSeason$)',
      );
    });

    it('returns stored season from signal', async () => {
      tmdbSeasonSignal.set({ [seasonId]: tmdbSeason });

      const result = await firstValueFrom(service.getTmdbSeason$(mockShow, 1));

      expect(result.id).toBe(tmdbSeason.id);
    });
  });

  describe('getTmdbEpisode$', () => {
    it('throws when arguments are missing', () => {
      expect(() => service.getTmdbEpisode$(mockShow, undefined, 1)).toThrow(
        'Argument is empty (getTmdbEpisode$)',
      );
    });

    it('returns stored episode from signal', async () => {
      tmdbEpisodeSignal.set({ [episodeId]: tmdbEpisode });

      const result = await firstValueFrom(service.getTmdbEpisode$(mockShow, 1, 1));

      expect(result?.id).toBe(tmdbEpisode.id);
    });

    it('throws for empty stored episode object', async () => {
      tmdbEpisodeSignal.set({ [episodeId]: {} as TmdbEpisode });

      await expect(firstValueFrom(service.getTmdbEpisode$(mockShow, 1, 1))).rejects.toThrow(
        'Episode is empty (getTmdbEpisode$)',
      );
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
      vi.spyOn(service, 'getTmdbShow$').mockReturnValue(of(tmdbShow));

      const tuple = await service.fetchTmdbShow(mockShow);

      expect(tuple[0]).toEqual(tmdbShow);
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
