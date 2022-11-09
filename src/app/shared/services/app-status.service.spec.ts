import { TestBed } from '@angular/core/testing';

import { AppStatusService } from './app-status.service';

describe('AppStatusService', () => {
  let service: AppStatusService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(AppStatusService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
