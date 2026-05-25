import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ShowListItemComponent } from './show-list-item.component';
import { mockShow } from '@shared/mocks/mockShow';
import type { TmdbShow } from '@type/Tmdb';
import type { ShowProgress } from '@type/Trakt';

const mockTmdbShow = {
  poster_path: '/test-poster.jpg',
  name: 'Test Show',
} as unknown as TmdbShow;

describe('ShowListItemComponent', () => {
  let fixture: ComponentFixture<ShowListItemComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ShowListItemComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(ShowListItemComponent);
    fixture.componentRef.setInput('show', mockShow);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('should render poster image from tmdbShow', () => {
    fixture.componentRef.setInput('tmdbShow', mockTmdbShow);
    fixture.detectChanges();
    const img = fixture.nativeElement.querySelector('img');
    expect(img).toBeTruthy();
    expect(img.src).toBe('https://image.tmdb.org/t/p/w185/test-poster.jpg');
  });

  it('should render fallback poster when tmdbShow has no poster_path', () => {
    fixture.componentRef.setInput('tmdbShow', null);
    fixture.detectChanges();
    const img = fixture.nativeElement.querySelector('img');
    expect(img).toBeTruthy();
    expect(img.src).toContain('poster.png');
  });

  it('should render show-added button when progress is provided', () => {
    fixture.componentRef.setInput('tmdbShow', mockTmdbShow);
    fixture.componentRef.setInput('withAddButtons', true);
    fixture.componentRef.setInput('isLoggedIn', true);
    fixture.componentRef.setInput('progress', {} as ShowProgress);
    fixture.detectChanges();
    const button = fixture.nativeElement.querySelector('[data-test-id="show-added"]');
    expect(button).toBeTruthy();
  });
});
