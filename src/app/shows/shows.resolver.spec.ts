import { TestBed } from '@angular/core/testing';

import { ShowsResolver } from './shows.resolver';

describe('ShowsResolver', () => {
  let resolver: ShowsResolver;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    resolver = TestBed.inject(ShowsResolver);
  });

  it('should be created', () => {
    expect(resolver).toBeTruthy();
  });
});
