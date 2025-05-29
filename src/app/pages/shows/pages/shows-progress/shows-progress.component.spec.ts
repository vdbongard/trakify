import { ComponentFixture, TestBed } from '@angular/core/testing';

import ShowsProgressComponent from './shows-progress.component';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideOAuthClient } from 'angular-oauth2-oidc';
import { provideTanStackQuery, QueryClient } from '@tanstack/angular-query-experimental';
import { provideRouter } from '@angular/router';

describe('ShowsProgressComponent', () => {
  let component: ShowsProgressComponent;
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
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
