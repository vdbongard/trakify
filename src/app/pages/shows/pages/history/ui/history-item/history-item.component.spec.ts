import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { HistoryItemComponent } from './history-item.component';
import type { HistoryPlay } from '@type/Trakt';
import type { TmdbEpisode, TmdbShow } from '@type/Tmdb';

const play: HistoryPlay = {
  action: 'watch',
  episode: { ids: { trakt: 10, tmdb: 42 }, number: 5, season: 2, title: 'Breakage' },
  id: 99,
  show: {
    ids: { trakt: 1, slug: 'breaking-bad', tmdb: 1399 },
    title: 'Breaking Bad',
    year: 2008,
  },
  type: 'episode',
  watched_at: new Date(2026, 9, 15, 20, 15).toISOString(),
};

describe('HistoryItemComponent', () => {
  let fixture: ComponentFixture<HistoryItemComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      providers: [provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(HistoryItemComponent);
    fixture.componentRef.setInput('play', play);
    fixture.detectChanges();
  });

  it('links to the Episode page', () => {
    const link: HTMLAnchorElement = fixture.nativeElement.querySelector('a.history-item');

    expect(link.getAttribute('href')).toBe('/shows/s/breaking-bad/season/2/episode/5');
  });

  it('falls back to the Trakt titles while TMDB resolves', () => {
    expect(fixture.nativeElement.querySelector('.show-title').textContent.trim()).toBe(
      'Breaking Bad',
    );
    expect(fixture.nativeElement.querySelector('.episode-label').textContent).toContain(
      'S02E05 · Breakage',
    );
  });

  it('shows the local time of the Play', () => {
    expect(fixture.nativeElement.querySelector('time.watched-at').textContent.trim()).toBe('20:15');
  });

  it('renders the Episode still', () => {
    fixture.componentRef.setInput('tmdbEpisode', {
      id: 42,
      name: 'Breakage',
      still_path: '/still.jpg',
    } as TmdbEpisode);
    fixture.detectChanges();

    const image: HTMLImageElement = fixture.nativeElement.querySelector('img.thumb-image');

    expect(image.getAttribute('alt')).toBe('Breakage');
    expect(image.getAttribute('src')).toContain('/still.jpg');
  });

  it('falls back to the Show poster when the Episode has no still', () => {
    fixture.componentRef.setInput('tmdbShow', {
      id: 1399,
      name: 'Breaking Bad',
      poster_path: '/poster.jpg',
    } as TmdbShow);
    fixture.detectChanges();

    const image: HTMLImageElement = fixture.nativeElement.querySelector('img.thumb-image');

    expect(image.getAttribute('alt')).toBe('Poster');
    expect(image.getAttribute('src')).toContain('/poster.jpg');
  });
});
