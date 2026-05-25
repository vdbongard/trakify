import { ComponentFixture, TestBed } from '@angular/core/testing';
import { EpisodeHeaderComponent } from './episode-header.component';
import { provideRouter } from '@angular/router';
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

  it('should render episode title from episode', () => {
    createComponent({ episode: baseEpisode });
    const title = fixture.nativeElement.querySelector('h1.title');
    expect(title.textContent.trim()).toBe('Episode Five');
  });

  it('should render episode title from tmdbEpisode when episode has no title', () => {
    createComponent({ episode: { ...baseEpisode, title: '' }, tmdbEpisode: baseTmdbEpisode });
    const title = fixture.nativeElement.querySelector('h1.title');
    expect(title.textContent.trim()).toBe('TMDB Episode');
  });

  it('should render fallback title from episode number', () => {
    createComponent();
    const title = fixture.nativeElement.querySelector('h1.title');
    expect(title.textContent.trim()).toBe('Episode 5');
  });

  it('should render air date', () => {
    createComponent({ episode: baseEpisode });
    const subtitle = fixture.nativeElement.querySelector('h2.subtitle');
    expect(subtitle.textContent.trim()).toBe('15. Jan. 2023 (Sun.)');
  });

  it('should disable previous button on first episode', () => {
    createComponent({ episodeNumber: '1' });
    const prev = fixture.nativeElement.querySelector('[data-test-id="previous-button"]');
    expect(prev.getAttribute('aria-disabled')).toBe('true');
  });

  it('should disable next button on last episode', () => {
    createComponent({
      episodes: [
        { number: 1 },
        { number: 2 },
        { number: 3 },
        { number: 4 },
        { number: 5 },
      ] as Episode[],
    });
    const next = fixture.nativeElement.querySelector('[data-test-id="next-button"]');
    expect(next.getAttribute('aria-disabled')).toBe('true');
  });
});
