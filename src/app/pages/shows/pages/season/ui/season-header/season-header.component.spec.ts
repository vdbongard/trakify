import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { MatProgressBarHarness } from '@angular/material/progress-bar/testing';
import { SeasonHeaderComponent } from './season-header.component';
import { provideRouter } from '@angular/router';
import type { SeasonProgress, Season } from '@type/Trakt';

describe('SeasonHeaderComponent', () => {
  let fixture: ComponentFixture<SeasonHeaderComponent>;

  function createComponent(overrides?: {
    seasonNumber?: string;
    showSlug?: string;
    seasons?: Season[];
    seasonProgress?: SeasonProgress;
  }): void {
    fixture = TestBed.createComponent(SeasonHeaderComponent);
    fixture.componentRef.setInput('seasonNumber', overrides?.seasonNumber ?? '1');
    fixture.componentRef.setInput('showSlug', overrides?.showSlug ?? 'test-show');
    if (overrides?.seasons !== undefined) {
      fixture.componentRef.setInput('seasons', overrides.seasons);
    }
    if (overrides?.seasonProgress !== undefined) {
      fixture.componentRef.setInput('seasonProgress', overrides.seasonProgress);
    }
    fixture.detectChanges();
  }

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      providers: [provideRouter([])],
    }).compileComponents();
  });

  it('should create', () => {
    createComponent();
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('should render season title from progress title', () => {
    createComponent({
      seasonProgress: { title: 'Season 1', number: 1, aired: 0, completed: 0, episodes: [] } as unknown as SeasonProgress,
    });
    const title = fixture.nativeElement.querySelector('h3.title');
    expect(title.textContent.trim()).toBe('Season 1');
  });

  it('should render season title from season number', () => {
    createComponent({ seasonNumber: '2' });
    const title = fixture.nativeElement.querySelector('h3.title');
    expect(title.textContent.trim()).toBe('Season 2');
  });

  it('should render Specials for season 0', () => {
    createComponent({ seasonNumber: '0' });
    const title = fixture.nativeElement.querySelector('h3.title');
    expect(title.textContent.trim()).toBe('Specials');
  });

  it('should disable previous button on first season', () => {
    const seasons = [
      { number: 1, ids: { trakt: 1, tmdb: 1, tvdb: 1, tvrage: 1 } },
      { number: 2, ids: { trakt: 2, tmdb: 2, tvdb: 2, tvrage: 2 } },
    ] as Season[];
    createComponent({ seasonNumber: '1', seasons });
    const prev = fixture.nativeElement.querySelector('[data-test-id="previous-button"]');
    expect(prev.getAttribute('aria-disabled')).toBe('true');
  });

  it('should disable next button on last season', () => {
    const seasons = [
      { number: 1, ids: { trakt: 1, tmdb: 1, tvdb: 1, tvrage: 1 } },
      { number: 2, ids: { trakt: 2, tmdb: 2, tvdb: 2, tvrage: 2 } },
    ] as Season[];
    createComponent({ seasonNumber: '2', seasons });
    const next = fixture.nativeElement.querySelector('[data-test-id="next-button"]');
    expect(next.getAttribute('aria-disabled')).toBe('true');
  });

  it('should render progress bar with correct value when progress exists', async () => {
    createComponent({
      seasonProgress: { completed: 3, aired: 10, number: 1, title: 'Season 1', episodes: [] } as unknown as SeasonProgress,
    });
    const loader = TestbedHarnessEnvironment.loader(fixture);
    const bar = await loader.getHarness(MatProgressBarHarness);
    expect(await bar.getValue()).toBe(30);
  });
});
