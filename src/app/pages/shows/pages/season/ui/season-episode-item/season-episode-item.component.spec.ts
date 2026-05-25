import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { MatCheckboxHarness } from '@angular/material/checkbox/testing';
import { SeasonEpisodeItemComponent } from './season-episode-item.component';
import type { EpisodeFull, SeasonProgress } from '@type/Trakt';

describe('SeasonEpisodeItemComponent', () => {
  let fixture: ComponentFixture<SeasonEpisodeItemComponent>;

  const baseEpisode = {
    season: 1,
    number: 5,
    title: 'Episode Five',
    ids: { trakt: 1, tmdb: 1, tvdb: 1, tvrage: 1 },
    first_aired: '2023-01-15T00:00:00.000Z',
  } as unknown as EpisodeFull;

  function createComponent(overrides?: {
    i?: number;
    episode?: EpisodeFull;
    isLoggedIn?: boolean;
    seasonProgress?: SeasonProgress;
  }): void {
    fixture = TestBed.createComponent(SeasonEpisodeItemComponent);
    if (overrides?.i !== undefined) fixture.componentRef.setInput('i', overrides.i);
    if (overrides?.episode !== undefined)
      fixture.componentRef.setInput('episode', overrides.episode);
    if (overrides?.isLoggedIn !== undefined)
      fixture.componentRef.setInput('isLoggedIn', overrides.isLoggedIn);
    if (overrides?.seasonProgress !== undefined)
      fixture.componentRef.setInput('seasonProgress', overrides.seasonProgress);
    fixture.detectChanges();
  }

  beforeEach(async () => {
    await TestBed.configureTestingModule({}).compileComponents();
  });

  it('should create', () => {
    createComponent();
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('should render episode title and number', () => {
    createComponent({ episode: baseEpisode });
    const title = fixture.nativeElement.querySelector('h3.title');
    expect(title.textContent.trim()).toBe('Episode Five (5)');
  });

  it('should render fallback title when episode has no title', () => {
    createComponent({ episode: { ...baseEpisode, title: '' } });
    const title = fixture.nativeElement.querySelector('h3.title');
    expect(title.textContent.trim()).toBe('Episode 6');
  });

  it('should render fallback title using i when episode has no number', () => {
    const episode: Partial<EpisodeFull> = { ...baseEpisode, title: '' };
    delete (episode as { number?: unknown }).number;
    createComponent({
      episode: episode as EpisodeFull,
      i: 2,
    });
    const title = fixture.nativeElement.querySelector('h3.title');
    expect(title.textContent.trim()).toBe('Episode 3');
  });

  it('should render air date', () => {
    createComponent({ episode: baseEpisode });
    const subtitle = fixture.nativeElement.querySelector('h3.subtitle');
    expect(subtitle.textContent.trim()).toBe('15. Jan. 2023');
  });

  it('should render "No air date" when first_aired is null', () => {
    createComponent({ episode: { ...baseEpisode, first_aired: null } });
    const subtitle = fixture.nativeElement.querySelector('h3.subtitle');
    expect(subtitle.textContent.trim()).toBe('No air date');
  });

  it('should render "..." when episode is undefined', () => {
    createComponent();
    const subtitle = fixture.nativeElement.querySelector('h3.subtitle');
    expect(subtitle.textContent.trim()).toBe('...');
  });

  it('should show checkbox when logged in', () => {
    createComponent({ episode: baseEpisode, isLoggedIn: true });
    const checkbox = fixture.nativeElement.querySelector('mat-checkbox');
    expect(checkbox).toBeTruthy();
  });

  it('should hide checkbox when not logged in', () => {
    createComponent({ episode: baseEpisode, isLoggedIn: false });
    const checkbox = fixture.nativeElement.querySelector('mat-checkbox');
    expect(checkbox).toBeFalsy();
  });

  it('should check checkbox when episode is completed', async () => {
    const seasonProgress = {
      episodes: [{ number: 5, completed: true, last_watched_at: null }],
    } as unknown as SeasonProgress;
    createComponent({ episode: baseEpisode, isLoggedIn: true, seasonProgress });
    const loader = TestbedHarnessEnvironment.loader(fixture);
    const checkbox = await loader.getHarness(MatCheckboxHarness);
    expect(await checkbox.isChecked()).toBe(true);
  });
});
