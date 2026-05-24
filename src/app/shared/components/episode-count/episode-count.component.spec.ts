import { ComponentFixture, TestBed } from '@angular/core/testing';
import { EpisodeCountComponent } from './episode-count.component';
import type { EpisodeFull, ShowProgress } from '@type/Trakt';
import type { TmdbSeason } from '@type/Tmdb';

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
    setInputs({
      showProgress: showProgress({ completed: 1, aired: 3 }),
      nextEpisode,
      tmdbSeason,
      episodes: 3,
    });

    await fixture.whenStable();

    expect(text()).toBe('2 remaining');
  });

  it('should show the total episode count when no episodes remain', async () => {
    setInputs({
      showProgress: showProgress({ completed: 3, aired: 3 }),
      nextEpisode,
      tmdbSeason,
      episodes: 3,
    });

    await fixture.whenStable();

    expect(text()).toBe('3 episodes');
  });

  it('should show dividers when requested', async () => {
    setInputs({
      showProgress: showProgress({ completed: 1, aired: 3 }),
      nextEpisode,
      tmdbSeason,
      episodes: 3,
      withDividerLeft: true,
      withDividerRight: true,
    });

    await fixture.whenStable();

    expect(text()).toBe('· 2 remaining ·');
  });

  it('should not render while the next episode is being refreshed', async () => {
    setInputs({
      showProgress: showProgress({ completed: 1, aired: 3, nextEpisode: undefined }),
      nextEpisode,
      tmdbSeason,
      episodes: 3,
    });

    await fixture.whenStable();

    expect(text()).toBe('');
  });

  function setInputs(inputs: {
    showProgress: ShowProgress;
    nextEpisode: EpisodeFull;
    tmdbSeason: TmdbSeason;
    episodes: number;
    withDividerLeft?: boolean;
    withDividerRight?: boolean;
  }): void {
    fixture.componentRef.setInput('showProgress', inputs.showProgress);
    fixture.componentRef.setInput('nextEpisode', inputs.nextEpisode);
    fixture.componentRef.setInput('tmdbSeason', inputs.tmdbSeason);
    fixture.componentRef.setInput('episodes', inputs.episodes);
    fixture.componentRef.setInput('withDividerLeft', inputs.withDividerLeft ?? false);
    fixture.componentRef.setInput('withDividerRight', inputs.withDividerRight ?? false);
  }

  function text(): string {
    return fixture.nativeElement.textContent.trim().replace(/\s+/g, ' ');
  }
});

function showProgress(options: {
  completed: number;
  aired: number;
  nextEpisode?: ShowProgress['next_episode'];
}): ShowProgress {
  const nextEpisode = Object.hasOwn(options, 'nextEpisode')
    ? options.nextEpisode
    : nextEpisodeProgress;

  return {
    aired: options.aired,
    completed: options.completed,
    last_episode: null,
    last_watched_at: null,
    next_episode: nextEpisode,
    reset_at: null,
    seasons: [
      {
        aired: options.aired,
        completed: options.completed,
        episodes: [
          { completed: true, last_watched_at: null, number: 1 },
          { completed: options.completed > 1, last_watched_at: null, number: 2 },
          { completed: options.completed > 2, last_watched_at: null, number: 3 },
        ],
        number: 1,
        title: 'Season 1',
      },
    ],
  };
}

const nextEpisodeProgress = {
  ids: { trakt: 2, tmdb: 2 },
  number: 2,
  season: 1,
  title: 'Episode 2',
};

const nextEpisode: EpisodeFull = {
  ...nextEpisodeProgress,
  first_aired: '2020-01-08T00:00:00.000Z',
};

const tmdbSeason: TmdbSeason = {
  air_date: '2020-01-01',
  episodes: [
    {
      air_date: '2020-01-01',
      episode_number: 1,
      id: 1,
      name: 'Episode 1',
      season_number: 1,
    },
    {
      air_date: '2020-01-08',
      episode_number: 2,
      id: 2,
      name: 'Episode 2',
      season_number: 1,
    },
    {
      air_date: '2020-01-15',
      episode_number: 3,
      id: 3,
      name: 'Episode 3',
      season_number: 1,
    },
  ],
  id: 1,
  name: 'Season 1',
  poster_path: null,
  season_number: 1,
};
