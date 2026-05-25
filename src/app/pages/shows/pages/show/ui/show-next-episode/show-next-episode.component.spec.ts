import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ShowNextEpisodeComponent } from './show-next-episode.component';
import { provideRouter } from '@angular/router';
import { mockShow } from '@shared/mocks/mockShow';
import type { NextEpisode } from '@type/Episode';
import type { ShowWatched } from '@type/Trakt';
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

  it('should show loading state when isLoading is true', () => {
    createComponent({ isLoading: true });
    const loading = fixture.nativeElement.querySelector('.loading');
    expect(loading).toBeTruthy();
    expect(fixture.nativeElement.querySelector('h2')).toBeFalsy();
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
