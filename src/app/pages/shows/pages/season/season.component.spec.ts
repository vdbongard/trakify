import { ComponentFixture, TestBed } from '@angular/core/testing';
import SeasonComponent from './season.component';
import { ActivatedRoute } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideOAuthClient } from 'angular-oauth2-oidc';
import { of } from 'rxjs';

describe('SeasonComponent', () => {
  let component: SeasonComponent;
  let fixture: ComponentFixture<SeasonComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      providers: [
        {
          provide: ActivatedRoute,
          useValue: {
            params: of({
              show: 'test-show',
              season: '1',
            }),
          },
        },
        provideHttpClient(),
        provideHttpClientTesting(),
        provideOAuthClient(),
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(SeasonComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should render season page sections', () => {
    const loadingWrappers = fixture.nativeElement.querySelectorAll('t-loading');
    const seasonHeader = fixture.nativeElement.querySelector('t-season-header');
    const seasonEpisodes = fixture.nativeElement.querySelector('t-season-episodes');

    expect(loadingWrappers.length).toBe(2);
    expect(seasonHeader).toBeTruthy();
    expect(seasonEpisodes).toBeTruthy();
  });
});
