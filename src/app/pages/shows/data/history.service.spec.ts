import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideTanStackQuery, QueryClient } from '@tanstack/angular-query-experimental';
import { HistoryService } from './history.service';
import { TmdbService } from './tmdb.service';
import { TranslationService } from './translation.service';
import { HISTORY_PAGE_SIZE } from '@constants';
import type { HistoryPlay } from '@type/Trakt';

const play: HistoryPlay = {
  action: 'watch',
  episode: { ids: { trakt: 10, tmdb: null }, number: 5, season: 2, title: 'Breakage' },
  id: 99,
  show: {
    ids: { trakt: 1, slug: 'breaking-bad', tmdb: 1399 },
    title: 'Breaking Bad',
    year: 2008,
  },
  type: 'episode',
  watched_at: '2026-10-15T20:15:00.000Z',
};

describe('HistoryService', () => {
  let service: HistoryService;
  let httpMock: HttpTestingController;
  let fetchTmdbEpisode: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideTanStackQuery(new QueryClient()),
      ],
    });

    service = TestBed.inject(HistoryService);
    httpMock = TestBed.inject(HttpTestingController);

    // The warm-up reads Plays over HTTP; the artwork behind them is another service's business.
    vi.spyOn(TestBed.inject(TranslationService), 'ensureEpisodeTranslation').mockResolvedValue(
      undefined,
    );
    fetchTmdbEpisode = vi
      .spyOn(TestBed.inject(TmdbService), 'fetchTmdbEpisode')
      .mockResolvedValue(null);
  });

  afterEach(() => httpMock.verify());

  it('requests the given page of the user history', async () => {
    const plays = service.fetchPlays(2);

    const request = httpMock.expectOne(
      `https://api.trakt.tv/users/me/history/episodes?page=2&limit=${HISTORY_PAGE_SIZE}`,
    );
    expect(request.request.method).toBe('GET');

    request.flush([play]);

    await expect(plays).resolves.toEqual([play]);
  });

  it('requests nothing until a page is asked for', () => {
    httpMock.expectNone(
      `https://api.trakt.tv/users/me/history/episodes?page=1&limit=${HISTORY_PAGE_SIZE}`,
    );
  });

  describe('warmFirstPage', () => {
    it('reads the first page of Plays and the artwork for each Episode on it', async () => {
      const rewatch = { ...play, id: 100 };
      const nextEpisode: HistoryPlay = {
        ...play,
        id: 101,
        episode: { ids: { trakt: 11, tmdb: null }, number: 6, season: 2, title: 'Buyout' },
      };
      vi.spyOn(service, 'fetchPlays').mockResolvedValue([play, rewatch, nextEpisode]);

      await service.warmFirstPage('en-US');

      expect(service.fetchPlays).toHaveBeenCalledTimes(1);
      expect(service.fetchPlays).toHaveBeenCalledWith(1);
      // One request per Episode: the rewatch asks for the same still as the Play it repeats.
      expect(fetchTmdbEpisode.mock.calls.map(([, , episodeNumber]) => episodeNumber)).toEqual([
        5, 6,
      ]);
    });

    it('gives up on a slow network rather than hold the navigation', async () => {
      vi.spyOn(service, 'fetchPlays').mockReturnValue(new Promise<HistoryPlay[]>(() => undefined));

      await expect(service.warmFirstPage('en-US')).resolves.toBeUndefined();
    });

    it('resolves without failing when the Plays cannot be read', async () => {
      vi.spyOn(service, 'fetchPlays').mockRejectedValue(new Error('offline'));

      await expect(service.warmFirstPage('en-US')).resolves.toBeUndefined();
    });
  });
});
