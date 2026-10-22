import { TestBed } from '@angular/core/testing';
import { App } from './app';
import { provideOAuthClient } from 'angular-oauth2-oidc';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideTanStackQuery, QueryClient } from '@tanstack/angular-query';
import { mockSwUpdateProvider } from '@shared/mocks/mockSwUpdate';

describe('App', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [App],
      providers: [
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
        provideTanStackQuery(() => new QueryClient()),
        mockSwUpdateProvider,
        provideOAuthClient(),
      ],
    }).compileComponents();
  });

  it('should create the app', () => {
    const fixture = TestBed.createComponent(App);
    const app = fixture.componentInstance;
    fixture.detectChanges();

    expect(app).toBeTruthy();
    expect(fixture.nativeElement.querySelector('t-header')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('t-nav')).toBeTruthy();
  });
});
