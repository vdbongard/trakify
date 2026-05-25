import { ComponentFixture, TestBed } from '@angular/core/testing';
import ShowsWithSearchComponent from './shows-with-search.component';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideOAuthClient } from 'angular-oauth2-oidc';
import { provideTanStackQuery, QueryClient } from '@tanstack/angular-query-experimental';

describe('ShowsWithSearchComponent', () => {
  let fixture: ComponentFixture<ShowsWithSearchComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideTanStackQuery(new QueryClient()),
        provideOAuthClient(),
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ShowsWithSearchComponent);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('should render search form', () => {
    const form = fixture.nativeElement.querySelector('form.search-form');
    expect(form).toBeTruthy();
    const input = fixture.nativeElement.querySelector('input[type="search"]');
    expect(input).toBeTruthy();
  });

  it('should render chips when no search query', () => {
    const chips = fixture.nativeElement.querySelector('mat-chip-set');
    expect(chips).toBeTruthy();
    const chipElements: NodeListOf<HTMLElement> =
      fixture.nativeElement.querySelectorAll('mat-chip');
    expect(chipElements.length).toBe(6);
  });
});
