import { ComponentFixture, TestBed } from '@angular/core/testing';

import RedirectComponent from './redirect.component';
import { OAuthService } from 'angular-oauth2-oidc';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { SyncService } from '@services/sync.service';

describe('RedirectComponent', () => {
  let component: RedirectComponent;
  let fixture: ComponentFixture<RedirectComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        {
          provide: OAuthService,
          useValue: {
            tryLoginCodeFlow: (): Promise<void> => Promise.resolve(),
            hasValidAccessToken: (): boolean => true,
          },
        },
        {
          provide: SyncService,
          useValue: {
            syncNew: (): Promise<void> => Promise.resolve(),
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(RedirectComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
