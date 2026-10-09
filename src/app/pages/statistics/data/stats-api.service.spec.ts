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
    const stats = { episodes: { minutes: 10 } };

    const promise = service.fetchStats();

    expect(promise).toBeInstanceOf(Promise);
    httpTesting.expectOne((request) => request.url.endsWith('/users/me/stats')).flush(stats);
    await expect(promise).resolves.toEqual(stats);
  });
});
