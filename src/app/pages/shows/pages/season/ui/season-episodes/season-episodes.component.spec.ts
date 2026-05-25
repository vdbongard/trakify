import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SeasonEpisodesComponent } from './season-episodes.component';
import { provideRouter } from '@angular/router';
import { mockShow } from '@shared/mocks/mockShow';
import type { EpisodeFull, SeasonProgress } from '@type/Trakt';

describe('SeasonEpisodesComponent', () => {
  let fixture: ComponentFixture<SeasonEpisodesComponent>;

  const baseEpisode = {
    season: 1,
    number: 1,
    title: 'Ep 1',
    ids: { trakt: 1, tmdb: 1, tvdb: 1, tvrage: 1 },
    first_aired: null,
  } as unknown as EpisodeFull;

  function createComponent(overrides?: {
    seasonNumber?: string;
    episodes?: EpisodeFull[];
    seasonProgress?: SeasonProgress;
    show?: typeof mockShow;
  }): void {
    fixture = TestBed.createComponent(SeasonEpisodesComponent);
    fixture.componentRef.setInput('seasonNumber', overrides?.seasonNumber ?? '1');
    if (overrides?.episodes !== undefined) fixture.componentRef.setInput('episodes', overrides.episodes);
    if (overrides?.seasonProgress !== undefined) fixture.componentRef.setInput('seasonProgress', overrides.seasonProgress);
    if (overrides?.show !== undefined) fixture.componentRef.setInput('show', overrides.show);
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

  it('should render episode links for each episode', () => {
    const episodes = [
      { ...baseEpisode, ids: { ...baseEpisode.ids, trakt: 1 } },
      { ...baseEpisode, number: 2, ids: { ...baseEpisode.ids, trakt: 2 } },
    ] as EpisodeFull[];
    createComponent({ episodes, show: mockShow });
    const links = fixture.nativeElement.querySelectorAll('a.episode-link');
    expect(links.length).toBe(2);
    expect(links[0].getAttribute('href')).toBe('/shows/s/test-show/season/1/episode/1');
    expect(links[1].getAttribute('href')).toBe('/shows/s/test-show/season/1/episode/2');
  });

  it('should render episode links from seasonProgress when episodes is not provided', () => {
    const seasonProgress = {
      episodes: [
        { number: 1, completed: true, last_watched_at: null },
        { number: 2, completed: false, last_watched_at: null },
      ],
    } as unknown as SeasonProgress;
    createComponent({ seasonProgress, show: mockShow });
    const links = fixture.nativeElement.querySelectorAll('a.episode-link');
    expect(links.length).toBe(2);
  });

  it('should render season-episode-item children', () => {
    const episodes = [
      { ...baseEpisode, ids: { ...baseEpisode.ids, trakt: 1 } },
    ] as EpisodeFull[];
    createComponent({ episodes, show: mockShow });
    const items = fixture.nativeElement.querySelectorAll('t-season-episode-item');
    expect(items.length).toBe(1);
  });
});
