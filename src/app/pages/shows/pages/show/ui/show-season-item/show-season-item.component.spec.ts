import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { MatProgressBarHarness } from '@angular/material/progress-bar/testing';
import { ShowSeasonItemComponent } from './show-season-item.component';
import { mockTmdbShowSeason } from '@shared/mocks/mockTmdbShowSeason';
import type { ShowProgress } from '@type/Trakt';

describe('ShowSeasonItemComponent', () => {
  let fixture: ComponentFixture<ShowSeasonItemComponent>;

  function createComponent(overrides?: {
    season?: typeof mockTmdbShowSeason;
    showProgress?: ShowProgress;
  }): void {
    fixture = TestBed.createComponent(ShowSeasonItemComponent);
    fixture.componentRef.setInput('season', overrides?.season ?? mockTmdbShowSeason);
    if (overrides?.showProgress !== undefined) {
      fixture.componentRef.setInput('showProgress', overrides.showProgress);
    }
    fixture.detectChanges();
  }

  beforeEach(async () => {
    await TestBed.configureTestingModule({}).compileComponents();
  });

  it('should create', () => {
    createComponent();
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('should render season title and episode count when no progress', () => {
    createComponent();
    const title = fixture.nativeElement.querySelector('h3.title');
    expect(title.textContent.trim()).toBe('Season 1  (10 episodes)');
  });

  it('should render season title with completed/aired when progress exists', async () => {
    const showProgress = {
      aired: 0,
      completed: 0,
      last_episode: null,
      last_watched_at: null,
      reset_at: null,
      seasons: [
        { number: 1, completed: 3, aired: 10, episodes: [], title: null },
      ],
    } as unknown as ShowProgress;
    createComponent({ showProgress });
    const title = fixture.nativeElement.querySelector('h3.title');
    expect(title.textContent.trim()).toBe('Season 1  (3/10)');
    const loader = TestbedHarnessEnvironment.loader(fixture);
    const bar = await loader.getHarness(MatProgressBarHarness);
    expect(await bar.getValue()).toBe(30);
  });

  it('should display Specials for season 0', () => {
    createComponent({ season: { ...mockTmdbShowSeason, season_number: 0, name: 'Specials' } });
    const title = fixture.nativeElement.querySelector('h3.title');
    expect(title.textContent.trim()).toBe('Specials  (10 episodes)');
  });

  it('should show 0 progress when no episodes have aired', async () => {
    createComponent();
    const loader = TestbedHarnessEnvironment.loader(fixture);
    const bar = await loader.getHarness(MatProgressBarHarness);
    expect(await bar.getValue()).toBe(0);
  });
});
