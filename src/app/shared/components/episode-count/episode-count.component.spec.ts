import { ComponentFixture, TestBed } from '@angular/core/testing';
import { EpisodeCountComponent } from './episode-count.component';
import type { ShowProgressSummary } from '@type/ShowProgress';
import type { EpisodeFull } from '@type/Trakt';

describe('EpisodeCountComponent', () => {
  let component: EpisodeCountComponent;
  let fixture: ComponentFixture<EpisodeCountComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EpisodeCountComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(EpisodeCountComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should show the remaining episode count', async () => {
    setInputs({ progress: progressView({ completed: 1, aired: 3 }), episodes: 3 });
    await fixture.whenStable();
    expect(text()).toBe('2 remaining');
  });

  it('should hide the total episode count when all aired episodes have been seen', async () => {
    setInputs({ progress: progressView({ completed: 3, aired: 3 }), episodes: 3 });
    await fixture.whenStable();
    expect(text()).toBe('');
  });

  it('should show the total episode count when no episodes have been seen', async () => {
    setInputs({ progress: progressView({ completed: 0, aired: 3 }), episodes: 3 });
    await fixture.whenStable();
    expect(text()).toBe('3 episodes');
  });

  it('should use the singular label when an unseen show has one episode', async () => {
    setInputs({ progress: progressView({ completed: 0, aired: 1 }), episodes: 1 });
    await fixture.whenStable();
    expect(text()).toBe('1 episode');
  });

  it('should show dividers when requested', async () => {
    setInputs({
      progress: progressView({ completed: 1, aired: 3 }),
      episodes: 3,
      withDividerLeft: true,
      withDividerRight: true,
    });
    await fixture.whenStable();
    expect(text()).toBe('· 2 remaining ·');
  });

  it('should not render while the next episode is unknown', async () => {
    setInputs({ progress: progressView({ completed: 1, aired: 3 }, 'unknown'), episodes: 3 });
    await fixture.whenStable();
    expect(text()).toBe('');
  });

  it('should display the overview fallback without requiring seasonal detail', async () => {
    setInputs({ progress: progressView({ completed: 2, aired: 5 }), episodes: 5 });
    await fixture.whenStable();
    expect(text()).toBe('3 remaining');
  });

  it('should hide the total episode count when all overview episodes have been seen', async () => {
    setInputs({ progress: progressView({ completed: 5, aired: 5 }), episodes: 5 });
    await fixture.whenStable();
    expect(text()).toBe('');
  });

  it('should show the total episode count when no overview episodes are completed', async () => {
    setInputs({ progress: progressView({ completed: 0, aired: 5 }), episodes: 5 });
    await fixture.whenStable();
    expect(text()).toBe('5 episodes');
  });

  function setInputs(inputs: {
    progress: ShowProgressSummary;
    episodes: number;
    withDividerLeft?: boolean;
    withDividerRight?: boolean;
  }): void {
    fixture.componentRef.setInput('progress', inputs.progress);
    fixture.componentRef.setInput('episodes', inputs.episodes);
    fixture.componentRef.setInput('withDividerLeft', inputs.withDividerLeft ?? false);
    fixture.componentRef.setInput('withDividerRight', inputs.withDividerRight ?? false);
  }

  function text(): string {
    return fixture.nativeElement.textContent.trim().replace(/\s+/g, ' ');
  }
});

function progressView(
  values: { aired: number; completed: number },
  nextEpisodeState: 'episode' | 'unknown' = 'episode',
): ShowProgressSummary {
  const nextEpisode: ShowProgressSummary['nextEpisode'] =
    nextEpisodeState === 'unknown'
      ? { state: 'unknown' }
      : { state: 'episode', episode: { season: 1, number: 1, title: 'Episode 1' } as EpisodeFull };
  return {
    aired: values.aired,
    completed: values.completed,
    remaining: Math.max(0, values.aired - values.completed),
    nextEpisode,
    seasons: new Map(),
    tmdbSeason: undefined,
  };
}
