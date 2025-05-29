import { ComponentFixture, TestBed } from '@angular/core/testing';

import ShowsWithSearchComponent from './shows-with-search.component';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideOAuthClient } from 'angular-oauth2-oidc';
import { provideTanStackQuery, QueryClient } from '@tanstack/angular-query-experimental';

describe('ShowsWithSearchComponent', () => {
  let component: ShowsWithSearchComponent;
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
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
