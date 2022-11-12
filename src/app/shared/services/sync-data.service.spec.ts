import { TestBed } from '@angular/core/testing';

import { SyncDataService } from './sync-data.service';

describe('SyncDataService', () => {
  let service: SyncDataService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(SyncDataService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
