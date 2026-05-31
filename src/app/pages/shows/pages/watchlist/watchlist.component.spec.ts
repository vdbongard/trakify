import { ComponentFixture, TestBed } from '@angular/core/testing';
import WatchlistComponent from './watchlist.component';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideOAuthClient } from 'angular-oauth2-oidc';
import { provideRouter } from '@angular/router';

describe('WatchlistComponent', () => {
  let fixture: ComponentFixture<WatchlistComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
        provideOAuthClient(),
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(WatchlistComponent);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('should render loading state', () => {
    const loading = fixture.nativeElement.querySelector('t-loading');
    const shows = fixture.nativeElement.querySelector('t-shows');

    expect(loading).toBeTruthy();
    expect(shows).toBeTruthy();
  });

  it('should render FAB with add show link', () => {
    const fab: HTMLAnchorElement = fixture.nativeElement.querySelector('a[mat-fab]');
    const icon = fab?.querySelector('mat-icon');

    expect(fab).toBeTruthy();
    expect(icon?.textContent?.trim()).toBe('add');
    expect(fab.getAttribute('aria-label')).toBe('Add show to watchlist');
    expect(fab.getAttribute('routerLink')).toBe('/shows/add-show');
  });
});
