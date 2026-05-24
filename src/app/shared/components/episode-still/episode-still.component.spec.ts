import { ComponentFixture, TestBed } from '@angular/core/testing';
import { EpisodeStillComponent } from './episode-still.component';
import { provideRouter } from '@angular/router';
import type { TmdbEpisode } from '@type/Tmdb';

describe('EpisodeStillComponent', () => {
  let component: EpisodeStillComponent;
  let fixture: ComponentFixture<EpisodeStillComponent>;
  let nativeElement: HTMLElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EpisodeStillComponent],
      providers: [provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(EpisodeStillComponent);
    component = fixture.componentInstance;
    nativeElement = fixture.nativeElement as HTMLElement;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should render a lightbox link when the episode has a still path', async () => {
    fixture.componentRef.setInput('tmdbEpisode', tmdbEpisode('/still.jpg'));

    await fixture.whenStable();

    const link = nativeElement.querySelector<HTMLAnchorElement>('a.image-link');
    expect(link?.href).toBe('https://image.tmdb.org/t/p/original/still.jpg');
    expect(link?.getAttribute('data-pswp-width')).toBe('1920');
    expect(link?.getAttribute('data-pswp-height')).toBe('1080');
    expect(image()?.alt).toBe('Episode still');
  });

  it('should render a router link instead of a lightbox link when withLink is true', async () => {
    fixture.componentRef.setInput('tmdbEpisode', tmdbEpisode('/linked.jpg'));
    fixture.componentRef.setInput('withLink', true);
    fixture.componentRef.setInput('episodeLink', '/shows/s/show/season/1/episode/2');

    await fixture.whenStable();

    expect(nativeElement.querySelector('a.still-wrapper')).toBeTruthy();
    expect(nativeElement.querySelector('a.image-link')).toBeFalsy();
    expect(image()?.src).toBe('https://image.tmdb.org/t/p/original/linked.jpg');
  });

  it('should render the fallback still image when the episode has no still path', async () => {
    fixture.componentRef.setInput('tmdbEpisode', tmdbEpisode(null));

    await fixture.whenStable();

    const fallback = nativeElement.querySelector<HTMLImageElement>('img[alt="Still"]');
    expect(fallback).toBeTruthy();
    expect(nativeElement.querySelector('a.image-link')).toBeFalsy();
  });

  it('should render a placeholder while the episode is not loaded', async () => {
    await fixture.whenStable();

    expect(nativeElement.querySelector('div.still-thumbnail')).toBeTruthy();
    expect(nativeElement.querySelector('img')).toBeFalsy();
  });

  it('should reset the loaded state when the still path changes', async () => {
    fixture.componentRef.setInput('tmdbEpisode', tmdbEpisode('/first.jpg'));
    await fixture.whenStable();
    component.stillLoaded.set(true);

    fixture.componentRef.setInput('tmdbEpisode', tmdbEpisode('/second.jpg'));
    await fixture.whenStable();

    expect(component.stillLoaded()).toBe(false);
  });

  function image(): HTMLImageElement | null {
    return nativeElement.querySelector('img[alt="Episode still"]');
  }
});

function tmdbEpisode(stillPath: string | null): TmdbEpisode {
  return {
    air_date: '2020-01-01',
    episode_number: 1,
    id: 1,
    name: 'Episode 1',
    season_number: 1,
    still_path: stillPath,
  };
}
