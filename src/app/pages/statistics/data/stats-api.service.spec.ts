import { TestBed } from '@angular/core/testing';
import { StatsApiService } from './stats-api.service';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';

describe('StatsApiService', () => {
  let service: StatsApiService;
  let httpTesting: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(StatsApiService);
    httpTesting = TestBed.inject(HttpTestingController);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('fetches stats behind a promise seam', async () => {
    const stats = {
      movies: { plays: 0, watched: 0, minutes: 0, collected: 0, ratings: 0, comments: 0 },
      shows: { watched: 0, collected: 0, ratings: 0, comments: 0 },
      seasons: { ratings: 0, comments: 0 },
      episodes: { plays: 0, watched: 0, minutes: 10, collected: 0, ratings: 0, comments: 0 },
      network: { friends: 0, followers: 0, following: 0 },
      ratings: {
        total: 0,
        distribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0, 7: 0, 8: 0, 9: 0, 10: 0 },
      },
    };

    const promise = service.fetchStats();

    expect(promise).toBeInstanceOf(Promise);
    httpTesting.expectOne((request) => request.url.endsWith('/users/me/stats')).flush(stats);
    await expect(promise).resolves.toEqual(stats);
  });

  it('resolves null when the user has no stats yet', async () => {
    const promise = service.fetchStats();

    httpTesting.expectOne((request) => request.url.endsWith('/users/me/stats')).flush(null);
    await expect(promise).resolves.toBeNull();
  });
});
