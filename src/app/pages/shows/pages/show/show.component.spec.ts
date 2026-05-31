import { ComponentFixture, TestBed } from '@angular/core/testing';
import ShowComponent from './show.component';
import { ActivatedRoute } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideOAuthClient } from 'angular-oauth2-oidc';
import { of } from 'rxjs';

describe('ShowComponent', () => {
  let component: ShowComponent;
  let fixture: ComponentFixture<ShowComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      providers: [
        {
          provide: ActivatedRoute,
          useValue: {
            params: of({
              show: 'test-show',
            }),
          },
        },
        provideHttpClient(),
        provideHttpClientTesting(),
        provideOAuthClient(),
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ShowComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should render show page sections', () => {
    const rootLoading = fixture.nativeElement.querySelector('t-loading');
    const header = fixture.nativeElement.querySelector('t-show-header');
    const cast = fixture.nativeElement.querySelector('t-show-cast');
    const details = fixture.nativeElement.querySelector('t-show-details');
    const nextEpisode = fixture.nativeElement.querySelector('t-show-next-episode');
    const seasons = fixture.nativeElement.querySelector('t-show-seasons');
    const links = fixture.nativeElement.querySelector('t-show-links');

    expect(rootLoading).toBeTruthy();
    expect(header).toBeTruthy();
    expect(cast).toBeTruthy();
    expect(details).toBeTruthy();
    expect(nextEpisode).toBeTruthy();
    expect(seasons).toBeTruthy();
    expect(links).toBeTruthy();
  });
});
