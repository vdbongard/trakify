import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ShowListItemContentComponent } from './show-list-item-content.component';
import { mockShow } from '@shared/mocks/mockShow';
import type { EpisodeFull, ShowProgress, ShowWatched } from '@type/Trakt';
import type { TmdbShow } from '@type/Tmdb';

describe('ShowListItemContentComponent', () => {
  let fixture: ComponentFixture<ShowListItemContentComponent>;

  const baseTmdbShow = {
    name: 'TMDB Show',
    number_of_episodes: 24,
    networks: [{ name: 'Netflix' }],
    status: 'Returning Series',
  } as unknown as TmdbShow;

  const baseEpisode = {
    season: 1,
    number: 5,
    title: 'Episode Five',
    ids: { trakt: 1, tmdb: 1, tvdb: 1, tvrage: 1 },
    first_aired: '2023-01-15T00:00:00.000Z',
  } as unknown as EpisodeFull;

  function createComponent(overrides?: {
    show?: typeof mockShow;
    tmdbShow?: TmdbShow | null;
    isLoggedIn?: boolean;
    isFavorite?: boolean;
    withYear?: boolean;
    withEpisode?: boolean;
    withProgressbar?: boolean;
    showProgress?: ShowProgress;
    showWatched?: ShowWatched;
    episode?: EpisodeFull;
  }): void {
    fixture = TestBed.createComponent(ShowListItemContentComponent);
    if (overrides?.show !== undefined) fixture.componentRef.setInput('show', overrides.show);
    if (overrides?.tmdbShow !== undefined)
      fixture.componentRef.setInput('tmdbShow', overrides.tmdbShow);
    if (overrides?.isLoggedIn !== undefined)
      fixture.componentRef.setInput('isLoggedIn', overrides.isLoggedIn);
    if (overrides?.isFavorite !== undefined)
      fixture.componentRef.setInput('isFavorite', overrides.isFavorite);
    if (overrides?.withYear !== undefined)
      fixture.componentRef.setInput('withYear', overrides.withYear);
    if (overrides?.withEpisode !== undefined)
      fixture.componentRef.setInput('withEpisode', overrides.withEpisode);
    if (overrides?.withProgressbar !== undefined)
      fixture.componentRef.setInput('withProgressbar', overrides.withProgressbar);
    if (overrides?.showProgress !== undefined)
      fixture.componentRef.setInput('showProgress', overrides.showProgress);
    if (overrides?.showWatched !== undefined)
      fixture.componentRef.setInput('showWatched', overrides.showWatched);
    if (overrides?.episode !== undefined)
      fixture.componentRef.setInput('episode', overrides.episode);
    fixture.detectChanges();
  }

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ShowListItemContentComponent],
    }).compileComponents();
  });

  it('should create', () => {
    createComponent();
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('should render show title from tmdbShow name', () => {
    createComponent({ show: mockShow, tmdbShow: baseTmdbShow });
    const title = fixture.nativeElement.querySelector('h2.title');
    expect(title.textContent.trim()).toBe('TMDB Show');
  });

  it('should render show title from show title when tmdbShow is null', () => {
    createComponent({ show: mockShow, tmdbShow: null });
    const title = fixture.nativeElement.querySelector('h2.title');
    expect(title.textContent.trim()).toBe('Test Show');
  });

  it('should render year when withYear is true', () => {
    createComponent({ show: mockShow, withYear: true });
    const title = fixture.nativeElement.querySelector('h2.title');
    expect(title.textContent.trim()).toBe('Test Show  (2023)');
  });

  it('should render favorite button when logged in', () => {
    createComponent({ show: mockShow, isLoggedIn: true });
    const btn = fixture.nativeElement.querySelector('.favorite-button');
    expect(btn).toBeTruthy();
  });

  it('should not render favorite button when not logged in', () => {
    createComponent({ show: mockShow, isLoggedIn: false });
    const btn = fixture.nativeElement.querySelector('.favorite-button');
    expect(btn).toBeFalsy();
  });

  it('should render episode text when withEpisode is true', () => {
    createComponent({ show: mockShow, withEpisode: true, episode: baseEpisode });
    const text = fixture.nativeElement.querySelector('.next-episode-text');
    expect(text.textContent.trim()).toBe('S01E05 Episode Five');
  });

  it('should render show status when no episode and show is not ended', () => {
    createComponent({ show: mockShow, tmdbShow: baseTmdbShow, withEpisode: true });
    const status = fixture.nativeElement.querySelector('.show-status');
    expect(status.textContent.trim()).toBe('Returning Series');
  });

  it('should render progress bar when withProgressbar, showProgress, and showWatched', () => {
    const showProgress = {
      completed: 0,
      aired: 0,
      last_episode: null,
      last_watched_at: null,
      reset_at: null,
      seasons: [],
    } as unknown as ShowProgress;
    const showWatched = {
      show: mockShow,
      plays: 0,
      last_watched_at: null,
      last_updated_at: null,
      reset_at: null,
    } as unknown as ShowWatched;
    createComponent({ show: mockShow, withProgressbar: true, showProgress, showWatched });
    const bar = fixture.nativeElement.querySelector('mat-progress-bar');
    expect(bar).toBeTruthy();
  });
});
