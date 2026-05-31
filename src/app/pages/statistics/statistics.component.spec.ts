import { ComponentFixture, TestBed } from '@angular/core/testing';
import StatisticsComponent from './statistics.component';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideTanStackQuery, QueryClient } from '@tanstack/angular-query-experimental';

describe('StatisticsComponent', () => {
  let component: StatisticsComponent;
  let fixture: ComponentFixture<StatisticsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideTanStackQuery(new QueryClient()),
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(StatisticsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should render statistics section headings and watched loading state', () => {
    const sectionTitles = Array.from(fixture.nativeElement.querySelectorAll('h2')).map(
      (el) => (el as HTMLHeadingElement).textContent?.trim() ?? '',
    );
    const spinner = fixture.nativeElement.querySelector('t-spinner');

    expect(sectionTitles).toEqual(['Shows', 'Episodes', 'Watched']);
    expect(spinner).toBeTruthy();
  });
});
