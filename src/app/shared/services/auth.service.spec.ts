import { TestBed } from '@angular/core/testing';
import { AuthService } from './auth.service';
import { OAuthService } from 'angular-oauth2-oidc';
import { Router } from '@angular/router';

describe('AuthService', () => {
  let service: AuthService;
  let mockOAuthService: Partial<OAuthService>;
  let mockRouter: Partial<Router>;

  beforeEach(() => {
    mockOAuthService = {
      hasValidAccessToken: vi.fn().mockReturnValue(true),
      logOut: vi.fn(),
    };
    mockRouter = {
      navigateByUrl: vi.fn().mockResolvedValue(true),
    };

    TestBed.configureTestingModule({
      providers: [
        { provide: OAuthService, useValue: mockOAuthService },
        { provide: Router, useValue: mockRouter },
      ],
    });

    localStorage.clear();
    service = TestBed.inject(AuthService);
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should set isLoggedIn based on valid access token', () => {
    expect(service.isLoggedIn()).toBe(true);
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
