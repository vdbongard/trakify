import { TestBed } from '@angular/core/testing';

import { StatsApiService } from './stats-api.service';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';

describe('StatsApiService', () => {
  let service: StatsApiService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(StatsApiService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
