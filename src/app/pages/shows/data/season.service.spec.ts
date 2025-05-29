import { TestBed } from '@angular/core/testing';

import { SeasonService } from './season.service';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';

describe('SeasonService', () => {
  let service: SeasonService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(SeasonService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
