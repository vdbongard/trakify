import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ShowListItemComponent } from './show-list-item.component';
import { mockShow } from '@shared/mocks/mockShow';
import { page } from 'vitest/browser';
import type { TmdbSeason, TmdbShow } from '@type/Tmdb';
import type { ShowProgress } from '@type/Trakt';

const mockTmdbShow = {
  poster_path: '/test-poster.jpg',
  name: 'Test Show',
} as unknown as TmdbShow;

/** A poster rendered the way the list renders it: every input set before the first render, so
 *  NgOptimizedImage never sees a priority or loading change after it has initialised. */
function renderPoster(overrides: { i?: number; eager?: boolean }): HTMLImageElement {
  const row = TestBed.createComponent(ShowListItemComponent);
  row.componentRef.setInput('show', mockShow);
  row.componentRef.setInput('tmdbShow', mockTmdbShow);
  if (overrides.i !== undefined) row.componentRef.setInput('i', overrides.i);
  if (overrides.eager !== undefined) {
    row.componentRef.setInput('withEagerImage', overrides.eager);
  }
  row.detectChanges();
  return row.nativeElement.querySelector('img');
}

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

  it('should render the next season poster from the show response for a show in progress', () => {
    fixture.componentRef.setInput('tmdbShow', {
      poster_path: '/show.jpg',
      seasons: [{ season_number: 2, poster_path: '/season-2.jpg' }],
    } as unknown as TmdbShow);
    fixture.componentRef.setInput('progress', {
      next_episode: { season: 2 },
    } as unknown as ShowProgress);
    fixture.detectChanges();

    const img = fixture.nativeElement.querySelector('img');
    expect(img.src).toBe('https://image.tmdb.org/t/p/w185/season-2.jpg');
  });

  it('should fall back to the season detail poster when the show response lists no seasons', () => {
    fixture.componentRef.setInput('tmdbShow', mockTmdbShow);
    fixture.componentRef.setInput('tmdbSeason', {
      poster_path: '/season.jpg',
    } as unknown as TmdbSeason);
    fixture.componentRef.setInput('progress', {
      next_episode: { season: 2 },
    } as unknown as ShowProgress);
    fixture.detectChanges();

    const img = fixture.nativeElement.querySelector('img');
    expect(img.src).toBe('https://image.tmdb.org/t/p/w185/season.jpg');
  });

  it('should render show-added button when progress is provided', async () => {
    fixture.componentRef.setInput('tmdbShow', mockTmdbShow);
    fixture.componentRef.setInput('withAddButtons', true);
    fixture.componentRef.setInput('isLoggedIn', true);
    fixture.componentRef.setInput('progress', {} as ShowProgress);
    fixture.detectChanges();
    await expect.element(page.getByRole('button', { name: 'Show added' })).toBeVisible();
  });

  it('preloads the poster of the first screenful', () => {
    const img = renderPoster({ i: 0 });

    expect(img.fetchPriority).toBe('high');
    expect(img.loading).toBe('eager');
  });

  it('leaves a poster past the first screenful to the browser to fetch later', () => {
    const img = renderPoster({ i: 5 });

    expect(img.fetchPriority).toBe('auto');
  });

  it('loads the rest of the first page eagerly, without preloading it', () => {
    const img = renderPoster({ i: 8, eager: true });

    expect(img.loading).toBe('eager');
    expect(img.fetchPriority).toBe('auto');
  });

  it('keeps a first-page poster above the fold preloaded rather than merely eager', () => {
    const img = renderPoster({ i: 0, eager: true });

    expect(img.fetchPriority).toBe('high');
    expect(img.loading).toBe('eager');
  });

  it('leaves a later page to load as the reader scrolls', () => {
    const img = renderPoster({ i: 8 });

    expect(img.loading).toBe('lazy');
  });
});
