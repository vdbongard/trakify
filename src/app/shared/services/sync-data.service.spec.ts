import { TestBed } from '@angular/core/testing';

import { SyncDataService } from './sync-data.service';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';

describe('SyncDataService', () => {
  let service: SyncDataService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(SyncDataService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
