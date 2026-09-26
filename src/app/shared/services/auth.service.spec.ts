import { TestBed } from '@angular/core/testing';
import { AuthService } from './auth.service';
import { OAuthService, OAuthEvent } from 'angular-oauth2-oidc';
import { Router } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { Subject } from 'rxjs';
import { authCodeFlowConfig } from '@shared/auth-config';
import { LocalStorage } from '@type/Enum';
import { SYNC_STORE_KEY, SYNC_STORE_VERSION } from './sync.service';

describe('AuthService', () => {
  let service: AuthService;
  let mockOAuthService: Partial<OAuthService> & { events: Subject<OAuthEvent> };
  let mockRouter: Partial<Router>;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    mockOAuthService = {
      hasValidAccessToken: vi.fn().mockReturnValue(true),
      logOut: vi.fn(),
      getAccessTokenExpiration: vi.fn().mockReturnValue(null),
      events: new Subject<OAuthEvent>(),
    };
    mockRouter = {
      navigateByUrl: vi.fn().mockResolvedValue(true),
    };

    TestBed.configureTestingModule({
      providers: [
        { provide: OAuthService, useValue: mockOAuthService },
        { provide: Router, useValue: mockRouter },
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    });

    localStorage.clear();
    service = TestBed.inject(AuthService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    localStorage.clear();
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should set isLoggedIn based on valid access token', () => {
    expect(service.isLoggedIn()).toBe(true);
  });

  describe('setupAutoRefresh', () => {
    it('should refresh an expired token and store the new tokens', async () => {
      localStorage.setItem('refresh_token', 'stale-refresh-token');
      mockOAuthService.hasValidAccessToken = vi.fn().mockReturnValue(false);

      service.setupAutoRefresh();

      const req = httpMock.expectOne('https://api.trakt.tv/oauth/token');
      expect(req.request.method).toBe('POST');
      expect(req.request.headers.get('Content-Type')).toBe('application/x-www-form-urlencoded');
      const body = req.request.body;
      expect(body).toContain('grant_type=refresh_token');
      expect(body).toContain('refresh_token=stale-refresh-token');
      expect(body).toContain(`client_id=${authCodeFlowConfig.clientId}`);
      expect(body).toContain(
        `redirect_uri=${encodeURIComponent(authCodeFlowConfig.redirectUri ?? '')}`,
      );

      req.flush({
        access_token: 'new-access-token',
        refresh_token: 'new-refresh-token',
        expires_in: 604800,
        scope: '',
      });
      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(localStorage.getItem('access_token')).toBe('new-access-token');
      expect(localStorage.getItem('refresh_token')).toBe('new-refresh-token');
      expect(localStorage.getItem('expires_at')).not.toBeNull();
      expect(service.isLoggedIn()).toBe(true);
    });

    it('should stay logged out when the refresh fails', async () => {
      localStorage.setItem('refresh_token', 'unusable-refresh-token');
      mockOAuthService.hasValidAccessToken = vi.fn().mockReturnValue(false);

      service.setupAutoRefresh();

      const req = httpMock.expectOne('https://api.trakt.tv/oauth/token');
      req.flush(
        { error: 'invalid_grant', error_description: 'session not found' },
        { status: 400, statusText: 'Bad Request' },
      );
      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(service.isLoggedIn()).toBe(false);
      expect(localStorage.getItem('access_token')).toBeNull();
    });

    it('should not call the token endpoint when no refresh token exists', () => {
      mockOAuthService.hasValidAccessToken = vi.fn().mockReturnValue(false);

      service.setupAutoRefresh();

      httpMock.expectNone('https://api.trakt.tv/oauth/token');
    });

    it('should arm a refresh timer while the access token is still valid', () => {
      vi.useFakeTimers();
      localStorage.setItem('refresh_token', 'valid-refresh-token');
      mockOAuthService.hasValidAccessToken = vi.fn().mockReturnValue(true);
      mockOAuthService.getAccessTokenExpiration = vi
        .fn()
        .mockReturnValue(Date.now() + 60 * 60 * 1000);

      service.setupAutoRefresh();

      httpMock.expectNone('https://api.trakt.tv/oauth/token');
      vi.useRealTimers();
    });

    it('should update isLoggedIn when a token is received', () => {
      mockOAuthService.hasValidAccessToken = vi.fn().mockReturnValue(true);
      service.setupAutoRefresh();

      mockOAuthService.events.next({ type: 'token_received' } as OAuthEvent);

      expect(service.isLoggedIn()).toBe(true);
    });
  });

  describe('logout', () => {
    it('should clear localStorage items except config', async () => {
      localStorage.setItem('showsWatched', 'someData');
      localStorage.setItem('favorites', 'moreData');
      localStorage.setItem('config', '{}');
      await service.logout();
      expect(localStorage.getItem('showsWatched')).toBeNull();
      expect(localStorage.getItem('favorites')).toBeNull();
      expect(localStorage.getItem('config')).toBe('{}');
    });

    it('should clear the last sync timestamp it kept in the config', async () => {
      localStorage.setItem(
        LocalStorage.CONFIG,
        JSON.stringify({ lastFetchedAt: { sync: '2024-05-01T10:00:00.000Z' } }),
      );

      await service.logout();

      // The data stores are gone, so a fresh timestamp would make the next login skip the
      // sync and land on an empty progress page.
      const config = JSON.parse(localStorage.getItem(LocalStorage.CONFIG) ?? '{}');
      expect(config.lastFetchedAt.sync).toBeNull();
    });

    it('should keep the store version so the caches are not re-migrated', async () => {
      localStorage.setItem(SYNC_STORE_KEY, JSON.stringify(SYNC_STORE_VERSION));

      await service.logout();

      // The version describes the format of the caches, not their contents; there is
      // nothing stale-format left to migrate.
      expect(localStorage.getItem(SYNC_STORE_KEY)).toBe(JSON.stringify(SYNC_STORE_VERSION));
    });

    it('should leave a config without timestamps untouched', async () => {
      localStorage.setItem(LocalStorage.CONFIG, '{}');

      await service.logout();

      expect(localStorage.getItem(LocalStorage.CONFIG)).toBe('{}');
    });

    it('should call oauthService.logOut', async () => {
      await service.logout();
      expect(mockOAuthService.logOut).toHaveBeenCalled();
    });

    it('should set isLoggedIn to false', async () => {
      await service.logout();
      expect(service.isLoggedIn()).toBe(false);
    });

    it('should navigate to /login', async () => {
      await service.logout();
      expect(mockRouter.navigateByUrl).toHaveBeenCalledWith('/login');
    });
  });
});
