import { TestBed } from '@angular/core/testing';

import { EpisodeService } from './episode.service';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';

describe('EpisodeService', () => {
  let service: EpisodeService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(EpisodeService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
