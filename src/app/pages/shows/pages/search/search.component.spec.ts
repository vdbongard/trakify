import { ComponentFixture, TestBed } from '@angular/core/testing';
import SearchComponent from './search.component';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideTanStackQuery, QueryClient } from '@tanstack/angular-query-experimental';

describe('SearchComponent', () => {
  let fixture: ComponentFixture<SearchComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideTanStackQuery(new QueryClient()),
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(SearchComponent);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('should render search form and shows list container', () => {
    const form = fixture.nativeElement.querySelector('form.search-form');
    const searchInput = fixture.nativeElement.querySelector('input[data-test-id="search"]');
    const shows = fixture.nativeElement.querySelector('t-shows');

    expect(form).toBeTruthy();
    expect(searchInput).toBeTruthy();
    expect(shows).toBeTruthy();
  });
});
