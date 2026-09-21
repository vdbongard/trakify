import { ComponentFixture, TestBed } from '@angular/core/testing';
import RedirectComponent from './redirect.component';
import { OAuthService } from 'angular-oauth2-oidc';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { Router } from '@angular/router';

describe('RedirectComponent', () => {
  let fixture: ComponentFixture<RedirectComponent>;
  let tryLoginCodeFlowMock: ReturnType<typeof vi.fn>;
  let hasValidAccessTokenMock: ReturnType<typeof vi.fn>;
  let navigateMock: ReturnType<typeof vi.fn>;

  beforeEach(async () => {
    tryLoginCodeFlowMock = vi.fn(async () => undefined);
    hasValidAccessTokenMock = vi.fn(() => true);
    navigateMock = vi.fn(async () => true);

    await TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        {
          provide: OAuthService,
          useValue: {
            tryLoginCodeFlow: tryLoginCodeFlowMock,
            hasValidAccessToken: hasValidAccessTokenMock,
          },
        },
        {
          provide: Router,
          useValue: {
            navigate: navigateMock,
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(RedirectComponent);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('should run login flow on valid token', async () => {
    await vi.waitFor(() => {
      expect(tryLoginCodeFlowMock).toHaveBeenCalled();
    });

    expect(hasValidAccessTokenMock).toHaveBeenCalled();
    expect(navigateMock).toHaveBeenCalledWith(['']);
  });
});
