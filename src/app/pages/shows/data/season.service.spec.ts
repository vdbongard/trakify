import { TestBed } from '@angular/core/testing';
import { HttpClient } from '@angular/common/http';
import { signal } from '@angular/core';
import { firstValueFrom, of } from 'rxjs';
import { SeasonService } from './season.service';
import { ShowService } from './show.service';
import { ConfigService } from '@services/config.service';
import { mockShow } from '@shared/mocks/mockShow';
import type { Episode, EpisodeFull, Season, SeasonProgress, ShowProgress } from '@type/Trakt';

describe('SeasonService', () => {
  let service: SeasonService;
  let httpMock: {
    get: ReturnType<typeof vi.fn>;
    post: ReturnType<typeof vi.fn>;
  };

  let showProgressSignal: ReturnType<typeof signal<Record<number, ShowProgress | undefined>>>;

  const seasonOne: Season = {
    number: 1,
    ids: {
      trakt: 1,
      tmdb: 1,
      tvdb: 1,
      tvrage: 1,
    },
  };

  const seasonTwo: Season = {
    number: 2,
    ids: {
      trakt: 2,
      tmdb: 2,
      tvdb: 2,
      tvrage: 2,
    },
  };

  const seasonProgressOne: SeasonProgress = {
    aired: 2,
    completed: 1,
    number: 1,
    title: null,
    episodes: [
      { number: 1, completed: true, last_watched_at: null },
      { number: 2, completed: false, last_watched_at: null },
    ],
  };

  const showProgress: ShowProgress = {
    aired: 2,
    completed: 1,
    last_episode: null,
    last_watched_at: null,
    reset_at: null,
    seasons: [seasonProgressOne],
  };

  const episode: Episode = {
    ids: {
      trakt: 10,
      tmdb: 10,
      tvdb: 10,
      tvrage: 10,
      imdb: 'tt10',
    },
    number: 1,
    season: 1,
    title: 'Original Episode',
    translations: [{ language: 'de', title: 'Localized Episode', overview: null }],
  };

  const episodeFull: EpisodeFull = {
    ...episode,
    first_aired: '2020-01-01T00:00:00.000Z',
  };

  beforeEach(() => {
    httpMock = {
      get: vi.fn(() => of([])),
      post: vi.fn(() => of({})),
    };

    showProgressSignal = signal<Record<number, ShowProgress | undefined>>({
      [mockShow.ids.trakt]: showProgress,
    });

    TestBed.configureTestingModule({
      providers: [
        { provide: HttpClient, useValue: httpMock },
        {
          provide: ShowService,
          useValue: {
            showsProgress: {
              s: showProgressSignal,
            },
          },
        },
        {
          provide: ConfigService,
          useValue: {
            config: {
              s: signal({ language: 'de-DE' }),
            },
          },
        },
      ],
    });

    service = TestBed.inject(SeasonService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('fetchSeasons', () => {
    it('fetches seasons for show and parses response', async () => {
      httpMock.get.mockReturnValue(of([seasonOne, seasonTwo]));

      const result = await firstValueFrom(service.fetchSeasons(mockShow));

      expect(httpMock.get).toHaveBeenCalledWith('https://api.trakt.tv/shows/123456/seasons');
      expect(result).toEqual([seasonOne, seasonTwo]);
    });
  });

  describe('fetchSeasonEpisodes', () => {
    it('requests full episodes and non-english translations by default', async () => {
      httpMock.get.mockReturnValue(of([episodeFull]));

      const result = await firstValueFrom(service.fetchSeasonEpisodes(mockShow.ids.trakt, 1, 'de'));

      expect(httpMock.get).toHaveBeenCalledWith('https://api.trakt.tv/shows/123456/seasons/1', {
        params: { extended: 'full', translations: 'de' },
      });
      expect(result).toEqual([episodeFull]);
    });

    it('omits translations for english language', async () => {
      httpMock.get.mockReturnValue(of([episodeFull]));

      await firstValueFrom(service.fetchSeasonEpisodes(mockShow.ids.trakt, 1, 'en'));

      expect(httpMock.get).toHaveBeenCalledWith('https://api.trakt.tv/shows/123456/seasons/1', {
        params: { extended: 'full' },
      });
    });

    it('requests basic episodes without extended param when disabled', async () => {
      httpMock.get.mockReturnValue(of([episode]));

      const result = await firstValueFrom(
        service.fetchSeasonEpisodes<Episode>(mockShow.ids.trakt, 1, undefined, false),
      );

      expect(httpMock.get).toHaveBeenCalledWith('https://api.trakt.tv/shows/123456/seasons/1', {
        params: {},
      });
      expect(result).toEqual([episode]);
    });
  });

  describe('addSeason and removeSeason', () => {
    it('posts add season payload to sync history', async () => {
      const response = { added: { episodes: 1 } };
      httpMock.post.mockReturnValue(of(response));

      const result = await firstValueFrom(service.addSeason(seasonOne));

      expect(httpMock.post).toHaveBeenCalledWith('https://api.trakt.tv/sync/history', {
        seasons: [seasonOne],
      });
      expect(result).toEqual(response);
    });

    it('posts remove season payload to sync history remove endpoint', async () => {
      const response = { deleted: { episodes: 1 } };
      httpMock.post.mockReturnValue(of(response));

      const result = await firstValueFrom(service.removeSeason(seasonOne));

      expect(httpMock.post).toHaveBeenCalledWith('https://api.trakt.tv/sync/history/remove', {
        seasons: [seasonOne],
      });
      expect(result).toEqual(response);
    });
  });

  describe('getSeasonProgress$', () => {
    it('throws when show or season number is missing', () => {
      expect(() => service.getSeasonProgress$(undefined, 1)).toThrow(
        'Argument is empty (getSeasonProgress$)',
      );
      expect(() => service.getSeasonProgress$(mockShow, undefined)).toThrow(
        'Argument is empty (getSeasonProgress$)',
      );
    });

    it('returns matching season progress from show progress store', async () => {
      const result = await firstValueFrom(service.getSeasonProgress$(mockShow, 1));

      expect(result).toEqual(seasonProgressOne);
    });
  });

  describe('getSeasonEpisodes$', () => {
    it('throws when show or season number is missing', () => {
      expect(() => service.getSeasonEpisodes$(undefined, 1)).toThrow(
        'Argument is empty (getSeasonEpisodes$)',
      );
      expect(() => service.getSeasonEpisodes$(mockShow, undefined)).toThrow(
        'Argument is empty (getSeasonEpisodes$)',
      );
    });

    it('fetches season episodes with configured language and applies translations', async () => {
      const fetchSpy = vi
        .spyOn(service, 'fetchSeasonEpisodes')
        .mockReturnValue(of([episodeFull] as EpisodeFull[]));

      const result = await firstValueFrom(service.getSeasonEpisodes$<EpisodeFull>(mockShow, 1));

      expect(fetchSpy).toHaveBeenCalledWith(mockShow.ids.trakt, 1, 'de', true);
      expect(result[0]?.title).toBe('Localized Episode');
    });

    it('skips translation when withTranslation is false', async () => {
      const fetchSpy = vi
        .spyOn(service, 'fetchSeasonEpisodes')
        .mockReturnValue(of([episodeFull] as EpisodeFull[]));

      const result = await firstValueFrom(
        service.getSeasonEpisodes$<EpisodeFull>(mockShow, 1, true, false),
      );

      expect(fetchSpy).toHaveBeenCalledWith(mockShow.ids.trakt, 1, '', true);
      expect(result[0]?.title).toBe('Original Episode');
    });
  });

  describe('season helpers', () => {
    it('gets season progress by season number', () => {
      expect(service.getSeasonProgress(showProgress, 1)).toEqual(seasonProgressOne);
      expect(service.getSeasonProgress(showProgress, 9)).toBeUndefined();
    });

    it('gets season by number from fetched seasons', async () => {
      vi.spyOn(service, 'fetchSeasons').mockReturnValue(of([seasonOne, seasonTwo]));

      const result = await firstValueFrom(service.getSeasonFromNumber$(2, mockShow));

      expect(result).toEqual(seasonTwo);
    });
  });
});
