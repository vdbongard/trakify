import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ShowNextEpisodeComponent } from './show-next-episode.component';
import { provideRouter } from '@angular/router';
import { mockShow } from '@shared/mocks/mockShow';
import type { NextEpisode } from '@type/Episode';
import type { ShowProgress, ShowWatched } from '@type/Trakt';
import type { TmdbShow } from '@type/Tmdb';

describe('ShowNextEpisodeComponent', () => {
  let fixture: ComponentFixture<ShowNextEpisodeComponent>;

  const baseTmdbShow = {
    number_of_episodes: 24,
    seasons: [],
    type: 'Scripted',
    status: 'Returning Series',
  } as unknown as TmdbShow;

  const baseNextEpisode: NextEpisode = [
    {
      season: 1,
      number: 5,
      title: 'Ep 5',
      ids: { trakt: 1, tmdb: 1, tvdb: 1, tvrage: 1 },
      first_aired: '2023-01-15T00:00:00.000Z',
    } as unknown as undefined,
    null,
    null,
  ];

  function createComponent(overrides?: {
    isLoading?: boolean;
    nextEpisode?: NextEpisode;
    tmdbShow?: TmdbShow;
    show?: typeof mockShow;
    showWatched?: ShowWatched;
    showProgress?: ShowProgress;
  }): void {
    fixture = TestBed.createComponent(ShowNextEpisodeComponent);
    if (overrides?.isLoading !== undefined)
      fixture.componentRef.setInput('isLoading', overrides.isLoading);
    if (overrides?.nextEpisode !== undefined)
      fixture.componentRef.setInput('nextEpisode', overrides.nextEpisode);
    if (overrides?.tmdbShow !== undefined)
      fixture.componentRef.setInput('tmdbShow', overrides.tmdbShow);
    if (overrides?.show !== undefined) fixture.componentRef.setInput('show', overrides.show);
    if (overrides?.showWatched !== undefined)
      fixture.componentRef.setInput('showWatched', overrides.showWatched);
    if (overrides?.showProgress !== undefined)
      fixture.componentRef.setInput('showProgress', overrides.showProgress);
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

  it('should render nothing while loading', () => {
    // The block is up to ~700px tall once the episode arrives, so a placeholder box reserved
    // nothing worth the flash it caused on every page load.
    createComponent({ isLoading: true, nextEpisode: baseNextEpisode, tmdbShow: baseTmdbShow });
    expect(fixture.nativeElement.querySelector('.loading')).toBeFalsy();
    expect(fixture.nativeElement.querySelector('h2')).toBeFalsy();
    expect(fixture.nativeElement.textContent.trim()).toBe('');
  });

  it('should show next episode heading when nextEpisode and episodes exist', () => {
    createComponent({ nextEpisode: baseNextEpisode, tmdbShow: baseTmdbShow });
    const heading = fixture.nativeElement.querySelector('h2');
    expect(heading.textContent.trim()).toBe('Next episode');
  });

  it('should show "No next episode" when episodes is 0', () => {
    createComponent({
      nextEpisode: baseNextEpisode,
      tmdbShow: { ...baseTmdbShow, number_of_episodes: 0 },
    });
    const noNext = fixture.nativeElement.querySelector('.no-next-episode');
    expect(noNext).toBeTruthy();
  });

  it('should show "No next episode" when show is watched and no next episode', () => {
    createComponent({
      tmdbShow: baseTmdbShow,
      showWatched: {} as ShowWatched,
    });
    const noNext = fixture.nativeElement.querySelector('.no-next-episode');
    expect(noNext).toBeTruthy();
  });

  it('should not say "No next episode" for a show that has not aired yet', () => {
    // Trakt reports `aired: 0` when nothing has aired, and TMDB has no season data either (so
    // `episodes()` is 0). The other unaired shows render an empty block here, so this one must
    // too -- there is no episode to be next, and nothing to have caught up on.
    createComponent({
      tmdbShow: { ...baseTmdbShow, number_of_episodes: 0, seasons: [] },
      showProgress: { aired: 0, next_episode: null } as unknown as ShowProgress,
    });
    const noNext = fixture.nativeElement.querySelector('.no-next-episode');
    expect(noNext).toBeFalsy();
  });

  it('should still say "No next episode" for a fully watched show', () => {
    // A caught-up show also reports `next_episode: null`, but it has aired and finished, so the
    // message is the whole point of the block.
    createComponent({
      tmdbShow: baseTmdbShow,
      showWatched: {} as ShowWatched,
      showProgress: { aired: 208, completed: 208, next_episode: null } as unknown as ShowProgress,
    });
    const noNext = fixture.nativeElement.querySelector('.no-next-episode');
    expect(noNext).toBeTruthy();
  });

  it('should render t-episode child when show and tmdbShow are provided', () => {
    createComponent({
      nextEpisode: baseNextEpisode,
      tmdbShow: baseTmdbShow,
      show: mockShow,
    });
    const episode = fixture.nativeElement.querySelector('t-episode');
    expect(episode).toBeTruthy();
  });
});
