import { ComponentFixture, TestBed } from '@angular/core/testing';
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

const tmdbEpisode: TmdbEpisode = {
  id: 42,
  name: 'Breakage',
  still_path: '/still.jpg',
} as TmdbEpisode;

function thumbImage(fixture: ComponentFixture<HistoryItemComponent>): HTMLImageElement {
  return fixture.nativeElement.querySelector('img.thumb-image');
}

/** The priority the browser gets for the row's artwork. */
function artworkPriority(fixture: ComponentFixture<HistoryItemComponent>): string {
  return thumbImage(fixture).fetchPriority;
}

/** The name the artwork carries in a view transition. */
function transitionName(fixture: ComponentFixture<HistoryItemComponent>): string {
  return thumbImage(fixture).style.getPropertyValue('view-transition-name');
}

/** A row rendered the way the History page renders it: every input set before the first render. */
function renderRow(index: number): ComponentFixture<HistoryItemComponent> {
  const fixture = TestBed.createComponent(HistoryItemComponent);
  fixture.componentRef.setInput('play', play);
  fixture.componentRef.setInput('tmdbEpisode', tmdbEpisode);
  fixture.componentRef.setInput('i', index);
  fixture.detectChanges();
  return fixture;
}

describe('HistoryItemComponent', () => {
  let fixture: ComponentFixture<HistoryItemComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({}).compileComponents();

    fixture = TestBed.createComponent(HistoryItemComponent);
    fixture.componentRef.setInput('play', play);
    fixture.detectChanges();
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
    fixture.componentRef.setInput('tmdbEpisode', tmdbEpisode);
    fixture.detectChanges();

    expect(thumbImage(fixture).getAttribute('alt')).toBe('Breakage');
    expect(thumbImage(fixture).getAttribute('src')).toContain('/still.jpg');
  });

  it('falls back to the Show poster when the Episode has no still', () => {
    fixture.componentRef.setInput('tmdbShow', {
      id: 1399,
      name: 'Breaking Bad',
      poster_path: '/poster.jpg',
    } as TmdbShow);
    fixture.detectChanges();

    expect(thumbImage(fixture).getAttribute('alt')).toBe('Poster');
    expect(thumbImage(fixture).getAttribute('src')).toContain('/poster.jpg');
  });

  it('asks the browser to prioritise the artwork of the first Plays', () => {
    expect(artworkPriority(renderRow(0))).toBe('high');
  });

  it('leaves the artwork of later Plays to load as usual', () => {
    expect(artworkPriority(renderRow(5))).toBe('auto');
  });

  it('keeps that choice when a refetch shifts the Play down the list', () => {
    const row = renderRow(0);

    row.componentRef.setInput('i', 5);
    row.detectChanges();

    expect(artworkPriority(row)).toBe('high');
  });

  it('names the artwork for the view transition to the Episode page', () => {
    const row = renderRow(0);

    row.componentInstance.prepareViewTransition();

    expect(transitionName(row)).toBe('episode-still');
  });

  it('leaves the Show poster fallback out of the view transition', () => {
    fixture.componentRef.setInput('tmdbShow', {
      id: 1399,
      name: 'Breaking Bad',
      poster_path: '/poster.jpg',
    } as TmdbShow);
    fixture.detectChanges();

    fixture.componentInstance.prepareViewTransition();

    expect(transitionName(fixture)).toBe('');
  });

  it('clears the name again', () => {
    const row = renderRow(0);
    row.componentInstance.prepareViewTransition();

    row.componentInstance.clearViewTransition();

    expect(transitionName(row)).toBe('');
  });
});
