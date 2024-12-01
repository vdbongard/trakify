import { TestBed } from '@angular/core/testing';

import { DevtoolsOptionsService } from './devtools-options.service';

describe('DevtoolsOptionsService', () => {
  let service: DevtoolsOptionsService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(DevtoolsOptionsService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
