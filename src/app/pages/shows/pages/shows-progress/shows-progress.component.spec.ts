import { ComponentFixture, TestBed } from '@angular/core/testing';
import ShowsProgressComponent from './shows-progress.component';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideOAuthClient } from 'angular-oauth2-oidc';
import { provideTanStackQuery, QueryClient } from '@tanstack/angular-query-experimental';
import { provideRouter } from '@angular/router';

describe('ShowsProgressComponent', () => {
  let fixture: ComponentFixture<ShowsProgressComponent>;

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

    fixture = TestBed.createComponent(ShowsProgressComponent);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('should render FAB with add show link', () => {
    const fab: HTMLAnchorElement = fixture.nativeElement.querySelector('a[mat-fab]');
    expect(fab).toBeTruthy();
    expect(fab.getAttribute('aria-label')).toBe('Add show to watchlist');
    expect(fab.getAttribute('routerLink')).toBe('/shows/add-show');
  });

  it('should render t-shows component', () => {
    const shows = fixture.nativeElement.querySelector('t-shows');
    expect(shows).toBeTruthy();
  });
});
