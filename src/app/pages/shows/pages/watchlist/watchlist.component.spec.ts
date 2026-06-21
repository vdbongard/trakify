import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideTanStackQuery, QueryClient } from '@tanstack/angular-query-experimental';
import { provideOAuthClient } from 'angular-oauth2-oidc';
import WatchlistComponent from './watchlist.component';

describe('WatchlistComponent', () => {
  let fixture: ComponentFixture<WatchlistComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
        provideTanStackQuery(new QueryClient()),
        provideOAuthClient(),
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(WatchlistComponent);
    fixture.detectChanges();
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('should render FAB with add show link', () => {
    const fab: HTMLAnchorElement = fixture.nativeElement.querySelector('a[mat-fab]');
    const icon = fab?.querySelector('mat-icon');

    expect(fab).toBeTruthy();
    expect(icon?.textContent?.trim()).toBe('add');
    expect(fab.getAttribute('aria-label')).toBe('Add show to watchlist');
    expect(fab.getAttribute('routerLink')).toBe('/shows/add-show');
  });

  it('should render t-shows component', () => {
    const shows = fixture.nativeElement.querySelector('t-shows');
    expect(shows).toBeTruthy();
  });
});
