import { ComponentFixture, TestBed } from '@angular/core/testing';
import { EpisodeHeaderComponent } from './episode-header.component';
import { provideRouter } from '@angular/router';
import { page } from 'vitest/browser';
import type { EpisodeFull, Episode } from '@type/Trakt';
import type { TmdbEpisode } from '@type/Tmdb';

describe('EpisodeHeaderComponent', () => {
  let fixture: ComponentFixture<EpisodeHeaderComponent>;

  const baseEpisode = {
    season: 1,
    number: 5,
    title: 'Episode Five',
    ids: { trakt: 1, tmdb: 1, tvdb: 1, tvrage: 1 },
    first_aired: '2023-01-15T00:00:00.000Z',
  } as unknown as EpisodeFull;

  const baseTmdbEpisode = {
    name: 'TMDB Episode',
    still_path: null,
    overview: null,
  } as unknown as TmdbEpisode;

  function createComponent(overrides?: {
    episodeNumber?: string;
    seasonNumber?: string;
    showSlug?: string;
    episode?: EpisodeFull;
    tmdbEpisode?: TmdbEpisode;
    episodes?: Episode[];
  }): void {
    fixture = TestBed.createComponent(EpisodeHeaderComponent);
    fixture.componentRef.setInput('episodeNumber', overrides?.episodeNumber ?? '5');
    fixture.componentRef.setInput('seasonNumber', overrides?.seasonNumber ?? '1');
    fixture.componentRef.setInput('showSlug', overrides?.showSlug ?? 'test-show');
    if (overrides?.episode !== undefined)
      fixture.componentRef.setInput('episode', overrides.episode);
    if (overrides?.tmdbEpisode !== undefined)
      fixture.componentRef.setInput('tmdbEpisode', overrides.tmdbEpisode);
    if (overrides?.episodes !== undefined)
      fixture.componentRef.setInput('episodes', overrides.episodes);
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

  it('should render episode title from episode', async () => {
    createComponent({ episode: baseEpisode });
    await expect.element(page.getByRole('heading', { level: 1 })).toHaveTextContent('Episode Five');
  });

  it('should render episode title from tmdbEpisode when episode has no title', async () => {
    createComponent({ episode: { ...baseEpisode, title: '' }, tmdbEpisode: baseTmdbEpisode });
    await expect.element(page.getByRole('heading', { level: 1 })).toHaveTextContent('TMDB Episode');
  });

  it('should not render a fallback title while the episode is unknown', async () => {
    createComponent();
    // The placeholder keeps the heading blank; it must never surface the episode number.
    await expect.element(page.getByRole('heading', { level: 1 })).toHaveAccessibleName(/^\s*$/);
  });

  it('should render the tmdb title when the episode is unknown', async () => {
    createComponent({ tmdbEpisode: baseTmdbEpisode });
    await expect.element(page.getByRole('heading', { level: 1 })).toHaveTextContent('TMDB Episode');
  });

  it('should render fallback title from episode number once the episode exists', async () => {
    createComponent({ episode: { ...baseEpisode, title: '' } });
    await expect.element(page.getByRole('heading', { level: 1 })).toHaveTextContent('Episode 5');
  });

  it('should render air date', () => {
    createComponent({ episode: baseEpisode });
    const subtitle = fixture.nativeElement.querySelector('h2.subtitle');
    expect(subtitle.textContent.trim()).toBe('15. Jan. 2023 (Sun.)');
  });

  it('should disable previous button on first episode', async () => {
    createComponent({ episodeNumber: '1' });
    await expect
      .element(page.getByRole('link', { name: 'Previous episode' }))
      .toHaveAttribute('aria-disabled', 'true');
  });

  it('should disable next button on last episode', async () => {
    createComponent({
      episodes: [
        { number: 1 },
        { number: 2 },
        { number: 3 },
        { number: 4 },
        { number: 5 },
      ] as Episode[],
    });
    await expect
      .element(page.getByRole('link', { name: 'Next episode' }))
      .toHaveAttribute('aria-disabled', 'true');
  });
});
