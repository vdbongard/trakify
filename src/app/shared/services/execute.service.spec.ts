import { TestBed } from '@angular/core/testing';

import { ExecuteService } from './execute.service';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideOAuthClient } from 'angular-oauth2-oidc';

describe('ExecuteService', () => {
  let service: ExecuteService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting(), provideOAuthClient()],
    });
    service = TestBed.inject(ExecuteService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
