import { ComponentFixture, TestBed } from '@angular/core/testing';
import { BaseEpisodeComponent } from './base-episode.component';
import { provideRouter } from '@angular/router';
import type { EpisodeFull, EpisodeProgress, Show } from '@type/Trakt';
import type { TmdbEpisode } from '@type/Tmdb';

describe('BaseEpisodeComponent', () => {
  let component: BaseEpisodeComponent;
  let fixture: ComponentFixture<BaseEpisodeComponent>;
  let nativeElement: HTMLElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BaseEpisodeComponent],
      providers: [provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(BaseEpisodeComponent);
    component = fixture.componentInstance;
    nativeElement = fixture.nativeElement as HTMLElement;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('Computeds', () => {
    it('should compute showSlug correctly', () => {
      fixture.componentRef.setInput('show', createMockShow('breaking-bad', 123));
      expect(component.showSlug()).toBe('breaking-bad');

      fixture.componentRef.setInput('show', createMockShow('12345', 12345));
      expect(component.showSlug()).toBe('12345');
    });

    it('should compute episodeLink correctly', () => {
      // Inputs undefined
      expect(component.episodeLink()).toBeUndefined();

      // Inputs defined
      fixture.componentRef.setInput('show', createMockShow('breaking-bad', 123));
      fixture.componentRef.setInput('episode', createMockEpisode(1, 2));
      expect(component.episodeLink()).toBe('/shows/s/breaking-bad/season/1/episode/2');
    });

    it('should compute isInFuture correctly', () => {
      // Undefined first_aired
      fixture.componentRef.setInput('episode', { ...createMockEpisode(), first_aired: undefined });
      expect(component.isInFuture()).toBe(false);

      // Null first_aired
      fixture.componentRef.setInput('episode', { ...createMockEpisode(), first_aired: null });
      expect(component.isInFuture()).toBe(true);

      // Past first_aired
      fixture.componentRef.setInput('episode', {
        ...createMockEpisode(),
        first_aired: '2000-01-01T00:00:00.000Z',
      });
      expect(component.isInFuture()).toBe(false);

      // Future first_aired
      fixture.componentRef.setInput('episode', {
        ...createMockEpisode(),
        first_aired: '2100-01-01T00:00:00.000Z',
      });
      expect(component.isInFuture()).toBe(true);
    });
  });

  describe('HTML Rendering', () => {
    it('should render still element and title link when episode and show are defined', async () => {
      fixture.componentRef.setInput('show', createMockShow('breaking-bad', 123));
      fixture.componentRef.setInput('episode', createMockEpisode(1, 2, '2020-01-01'));
      fixture.componentRef.setInput('tmdbEpisode', createMockTmdbEpisode());
      fixture.detectChanges();
      await fixture.whenStable();

      const stillEl = nativeElement.querySelector('t-episode-still');
      expect(stillEl).toBeTruthy();

      const linkEl = nativeElement.querySelector<HTMLAnchorElement>('a.title');
      expect(linkEl).toBeTruthy();
      expect(linkEl?.textContent?.trim()).toBe('S01E02 Episode Title  · 1. Jan. 2020 (Wed.)');
    });

    it('should render overview description and Source: TMDB when episode is defined', () => {
      fixture.componentRef.setInput('episode', createMockEpisode(1, 2));
      fixture.detectChanges();

      const descriptionEl = nativeElement.querySelector('.description');
      expect(descriptionEl?.textContent?.trim()).toBe('This is a mock episode overview.');

      const sourceEl = nativeElement.querySelector('.source');
      expect(sourceEl?.textContent?.trim()).toBe('Source: TMDB');
    });

    it('should render fallback text when overview is empty', () => {
      fixture.componentRef.setInput('episode', { ...createMockEpisode(), overview: '' });
      fixture.detectChanges();

      const descriptionEl = nativeElement.querySelector('.description');
      expect(descriptionEl?.textContent?.trim()).toBe('No episode description.');
    });
  });

  describe('Actions & Buttons', () => {
    it('should not render seen button when isLoggedIn is false', () => {
      fixture.componentRef.setInput('isLoggedIn', false);
      fixture.componentRef.setInput('show', createMockShow());
      fixture.componentRef.setInput('episode', createMockEpisode());
      fixture.detectChanges();

      const button = nativeElement.querySelector('button.tertiary-button');
      expect(button).toBeFalsy();
    });

    it('should render seen button when isLoggedIn is true and isNewShow is false', () => {
      fixture.componentRef.setInput('isLoggedIn', true);
      fixture.componentRef.setInput('isNewShow', false);
      fixture.componentRef.setInput('show', createMockShow());
      fixture.componentRef.setInput('episode', createMockEpisode());
      fixture.detectChanges();

      const button = nativeElement.querySelector('button.tertiary-button');
      expect(button).toBeTruthy();
    });

    it('should render mark as seen and emit addEpisode when completed is false', async () => {
      const show = createMockShow();
      const episode = createMockEpisode();
      fixture.componentRef.setInput('isLoggedIn', true);
      fixture.componentRef.setInput('show', show);
      fixture.componentRef.setInput('episode', episode);
      fixture.componentRef.setInput('episodeProgress', createMockEpisodeProgress(false));
      fixture.detectChanges();

      const button = nativeElement.querySelector<HTMLButtonElement>('button.tertiary-button');
      expect(button?.textContent?.trim()).toBe('Mark as seen');

      let emitted: { episode: EpisodeFull; show: Show } | null = null;
      component.addEpisode.subscribe((event) => (emitted = event));

      button?.click();
      expect(emitted).toEqual({ episode, show });
    });

    it('should render mark as unseen and emit removeEpisode when completed is true', async () => {
      const show = createMockShow();
      const episode = createMockEpisode();
      fixture.componentRef.setInput('isLoggedIn', true);
      fixture.componentRef.setInput('show', show);
      fixture.componentRef.setInput('episode', episode);
      fixture.componentRef.setInput('episodeProgress', createMockEpisodeProgress(true));
      fixture.detectChanges();

      const button = nativeElement.querySelector<HTMLButtonElement>('button.tertiary-button');
      expect(button?.textContent?.trim()).toBe('Mark as unseen');

      let emitted: { episode: EpisodeFull; show: Show } | null = null;
      component.removeEpisode.subscribe((event) => (emitted = event));

      button?.click();
      expect(emitted).toEqual({ episode, show });
    });

    it('should render mark as seen and emit addEpisode when episodeProgress is undefined', async () => {
      const show = createMockShow();
      const episode = createMockEpisode();
      fixture.componentRef.setInput('isLoggedIn', true);
      fixture.componentRef.setInput('show', show);
      fixture.componentRef.setInput('episode', episode);
      fixture.detectChanges();

      const button = nativeElement.querySelector<HTMLButtonElement>('button.tertiary-button');
      expect(button?.textContent?.trim()).toBe('Mark as seen');

      let emitted: { episode: EpisodeFull; show: Show } | null = null;
      component.addEpisode.subscribe((event) => (emitted = event));

      button?.click();
      expect(emitted).toEqual({ episode, show });
    });

    it('should not render button when isLoggedIn, isNewShow and isInFuture are all true', () => {
      fixture.componentRef.setInput('isLoggedIn', true);
      fixture.componentRef.setInput('isNewShow', true);
      fixture.componentRef.setInput('show', createMockShow());
      fixture.componentRef.setInput('episode', createMockEpisode(1, 2, '2100-01-01T00:00:00.000Z'));
      fixture.detectChanges();

      const button = nativeElement.querySelector('button.tertiary-button');
      expect(button).toBeFalsy();
    });

    it('should render spinner and disable button when isSeenLoading is true', () => {
      fixture.componentRef.setInput('isLoggedIn', true);
      fixture.componentRef.setInput('isSeenLoading', true);
      fixture.componentRef.setInput('show', createMockShow());
      fixture.componentRef.setInput('episode', createMockEpisode());
      fixture.detectChanges();

      const spinner = nativeElement.querySelector('mat-spinner');
      expect(spinner).toBeTruthy();

      const button = nativeElement.querySelector<HTMLButtonElement>('button.tertiary-button');
      expect(button?.disabled).toBe(true);
    });

    it('should disable button when isInFuture is true', () => {
      fixture.componentRef.setInput('isLoggedIn', true);
      fixture.componentRef.setInput('isNewShow', false);
      fixture.componentRef.setInput('show', createMockShow());
      fixture.componentRef.setInput('episode', createMockEpisode(1, 2, '2100-01-01T00:00:00.000Z'));
      fixture.detectChanges();

      const button = nativeElement.querySelector<HTMLButtonElement>('button.tertiary-button');
      expect(button?.disabled).toBe(true);
    });
  });
});

function createMockShow(slug = 'breaking-bad', trakt = 123): Show {
  return {
    ids: {
      slug,
      trakt,
    },
    title: 'Show Title',
    year: 2020,
  };
}

function createMockEpisode(
  season = 1,
  number = 2,
  firstAired: string | null = '2020-01-01',
): EpisodeFull {
  return {
    ids: {
      trakt: 456,
      tvdb: 789,
    },
    season,
    number,
    title: 'Episode Title',
    first_aired: firstAired,
    overview: 'This is a mock episode overview.',
  };
}

function createMockEpisodeProgress(completed = false): EpisodeProgress {
  return {
    completed,
    last_watched_at: '2020-01-02',
    number: 2,
  };
}

function createMockTmdbEpisode(stillPath: string | null = null): TmdbEpisode {
  return {
    air_date: '2020-01-01',
    episode_number: 2,
    id: 999,
    name: 'TMDB Episode Name',
    season_number: 1,
    still_path: stillPath,
  };
}
