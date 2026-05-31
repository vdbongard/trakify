import { ComponentFixture, TestBed } from '@angular/core/testing';
import UpcomingComponent from './upcoming.component';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideTanStackQuery, QueryClient } from '@tanstack/angular-query-experimental';

describe('UpcomingComponent', () => {
  let fixture: ComponentFixture<UpcomingComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideTanStackQuery(new QueryClient()),
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(UpcomingComponent);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('should show spinner while loading', () => {
    const spinner = fixture.nativeElement.querySelector('t-spinner');
    const shows = fixture.nativeElement.querySelector('t-shows');
    const loadMoreButton = fixture.nativeElement.querySelector('button[matbutton]');
    const errorText = fixture.nativeElement.querySelector('t-error-text');

    expect(spinner).toBeTruthy();
    expect(shows).toBeFalsy();
    expect(loadMoreButton).toBeFalsy();
    expect(errorText).toBeFalsy();
  });
});
