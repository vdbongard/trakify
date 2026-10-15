import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { HistoryService } from './history.service';
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

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });

    service = TestBed.inject(HistoryService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('requests the given page of the user history', async () => {
    const plays = service.fetchPlays(2);

    const request = httpMock.expectOne(
      'https://api.trakt.tv/users/me/history/episodes?page=2&limit=50',
    );
    expect(request.request.method).toBe('GET');

    request.flush([play]);

    await expect(plays).resolves.toEqual([play]);
  });

  it('requests nothing until a page is asked for', () => {
    httpMock.expectNone('https://api.trakt.tv/users/me/history/episodes?page=1&limit=50');
  });
});
