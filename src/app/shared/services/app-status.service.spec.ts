import { TestBed } from '@angular/core/testing';

import { AppStatusService } from './app-status.service';
import { provideServiceWorker } from '@angular/service-worker';

describe('AppStatusService', () => {
  let service: AppStatusService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideServiceWorker('ngsw-worker.js')],
    });
    service = TestBed.inject(AppStatusService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
