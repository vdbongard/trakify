import { ComponentFixture, TestBed } from '@angular/core/testing';
import { BaseEpisodeComponent } from './base-episode.component';
import { provideRouter } from '@angular/router';
import type { EpisodeFull, EpisodeProgress, Show } from '@type/Trakt';
import type { TmdbEpisode } from '@type/Tmdb';

describe('BaseEpisodeComponent', () => {
  let fixture: ComponentFixture<BaseEpisodeComponent>;
  let nativeElement: HTMLElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BaseEpisodeComponent],
      providers: [provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(BaseEpisodeComponent);
    nativeElement = fixture.nativeElement as HTMLElement;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(fixture.componentInstance).toBeTruthy();
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

    it('should render mark as seen when completed is false', () => {
      fixture.componentRef.setInput('isLoggedIn', true);
      fixture.componentRef.setInput('show', createMockShow());
      fixture.componentRef.setInput('episode', createMockEpisode());
      fixture.componentRef.setInput('episodeProgress', createMockEpisodeProgress(false));
      fixture.detectChanges();

      const button = nativeElement.querySelector<HTMLButtonElement>('button.tertiary-button');
      expect(button?.textContent?.trim()).toBe('Mark as seen');
    });

    it('should render mark as unseen when completed is true', () => {
      fixture.componentRef.setInput('isLoggedIn', true);
      fixture.componentRef.setInput('show', createMockShow());
      fixture.componentRef.setInput('episode', createMockEpisode());
      fixture.componentRef.setInput('episodeProgress', createMockEpisodeProgress(true));
      fixture.detectChanges();

      const button = nativeElement.querySelector<HTMLButtonElement>('button.tertiary-button');
      expect(button?.textContent?.trim()).toBe('Mark as unseen');
    });

    it('should render mark as seen when episodeProgress is undefined', () => {
      fixture.componentRef.setInput('isLoggedIn', true);
      fixture.componentRef.setInput('show', createMockShow());
      fixture.componentRef.setInput('episode', createMockEpisode());
      fixture.detectChanges();

      const button = nativeElement.querySelector<HTMLButtonElement>('button.tertiary-button');
      expect(button?.textContent?.trim()).toBe('Mark as seen');
    });

    it('should hide button for new shows when first aired date is null', () => {
      fixture.componentRef.setInput('isLoggedIn', true);
      fixture.componentRef.setInput('isNewShow', true);
      fixture.componentRef.setInput('show', createMockShow());
      fixture.componentRef.setInput('episode', { ...createMockEpisode(), first_aired: null });
      fixture.detectChanges();

      const button = nativeElement.querySelector('button.tertiary-button');
      expect(button).toBeFalsy();
    });

    it('should show button for new shows when first aired date is undefined', () => {
      fixture.componentRef.setInput('isLoggedIn', true);
      fixture.componentRef.setInput('isNewShow', true);
      fixture.componentRef.setInput('show', createMockShow());
      fixture.componentRef.setInput('episode', { ...createMockEpisode(), first_aired: undefined });
      fixture.detectChanges();

      const button = nativeElement.querySelector('button.tertiary-button');
      expect(button).toBeTruthy();
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
