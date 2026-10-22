import { ComponentFixture, TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { By } from '@angular/platform-browser';
import { provideRouter } from '@angular/router';
import { provideTanStackQuery, QueryClient } from '@tanstack/angular-query';
import HistoryComponent from './history.component';
import { HistoryService } from '../../data/history.service';
import { TmdbService } from '../../data/tmdb.service';
import { TranslationService } from '../../data/translation.service';
import { ConfigService } from '@services/config.service';
import type { HistoryPlay } from '@type/Trakt';

const now = new Date();
const earlierToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 9, 0, 0);
const yesterday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1, 20, 0, 0);

function makePlay(id: number, watchedAt: Date, episodeNumber = id): HistoryPlay {
  return {
    action: 'watch',
    episode: {
      ids: { trakt: episodeNumber, tmdb: 42 },
      number: episodeNumber,
      season: 2,
      title: 'Breakage',
    },
    id,
    show: {
      ids: { trakt: 1, slug: 'breaking-bad', tmdb: 1399 },
      title: 'Breaking Bad',
      year: 2008,
    },
    type: 'episode',
    watched_at: watchedAt.toISOString(),
  };
}

/** A Play of a Show that Trakt knows only by its own ids — no TMDB id to fetch artwork with. */
function playOfShow(
  traktId: number,
  slug: string,
  title: string,
  watchedAt: Date,
  episodeNumber: number,
): HistoryPlay {
  return {
    ...makePlay(traktId, watchedAt, episodeNumber),
    show: { ids: { trakt: traktId, slug, tmdb: null }, title, year: 2000 },
  };
}

describe('HistoryComponent', () => {
  async function setup(fetchPlaysImpl: (page: number) => Promise<HistoryPlay[]>): Promise<{
    fixture: ComponentFixture<HistoryComponent>;
    fetchTmdbShowEntry: ReturnType<typeof vi.fn>;
    fetchTmdbEpisode: ReturnType<typeof vi.fn>;
  }> {
    TestBed.resetTestingModule();

    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    const fetchTmdbShowEntry = vi.fn(() =>
      Promise.resolve({ id: 1399, name: 'Breaking Bad', poster_path: '/poster.jpg' }),
    );
    const fetchTmdbEpisode = vi.fn(() =>
      Promise.resolve({ id: 42, name: 'Breakage', still_path: '/still.jpg' }),
    );
    const ensureEpisodeTranslation = vi.fn(() => Promise.resolve(undefined));

    await TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        provideTanStackQuery(() => queryClient),
        { provide: TmdbService, useValue: { fetchTmdbShowEntry, fetchTmdbEpisode } },
        {
          provide: TranslationService,
          useValue: {
            ensureEpisodeTranslation,
            ensureShowTranslation: (): Promise<undefined> => Promise.resolve(undefined),
            ensureShowsTranslations: (): Promise<void> => Promise.resolve(),
            ensureEpisodesTranslations: (): Promise<void> => Promise.resolve(),
            getShowTranslation: (): undefined => undefined,
            getEpisodeTranslation: (): undefined => undefined,
          },
        },
        {
          provide: ConfigService,
          useValue: { config: { s: signal({ language: 'en-US' }) } },
        },
      ],
    }).compileComponents();

    // The real service, so the component reads the same query options the route warms. Only the
    // request itself is stubbed.
    const historyService = TestBed.inject(HistoryService);
    vi.spyOn(historyService, 'fetchPlays').mockImplementation(fetchPlaysImpl);

    const fixture = TestBed.createComponent(HistoryComponent);
    fixture.detectChanges();

    return { fixture, fetchTmdbShowEntry, fetchTmdbEpisode };
  }

  it('shows a spinner while the history loads', async () => {
    const { fixture } = await setup(() => Promise.resolve([]));

    expect(fixture.nativeElement.querySelector('t-spinner')).toBeTruthy();
  });

  it('reads the user history from the first page', async () => {
    const { fixture } = await setup((page) =>
      Promise.resolve(page === 1 ? [makePlay(2, earlierToday)] : []),
    );

    await vi.waitFor(() =>
      expect(fixture.nativeElement.querySelectorAll('t-history-item')).toHaveLength(1),
    );
  });

  it('renders Plays under day headings, newest first', async () => {
    const { fixture } = await setup((page) =>
      Promise.resolve(page === 1 ? [makePlay(2, earlierToday), makePlay(1, yesterday)] : []),
    );

    await vi.waitFor(() =>
      expect(fixture.nativeElement.querySelectorAll('t-history-item')).toHaveLength(2),
    );
    fixture.detectChanges();

    const labels = Array.from(
      fixture.nativeElement.querySelectorAll('.day-label') as NodeListOf<HTMLElement>,
    ).map((label) => label.textContent.trim());
    expect(labels).toEqual(['Today', 'Yesterday']);

    const rows = Array.from(
      fixture.nativeElement.querySelectorAll('t-history-item') as NodeListOf<HTMLElement>,
    );
    const episodeNumbers = rows.map((row) =>
      row.querySelector('.episode-label')!.textContent!.trim().slice(0, 6),
    );
    expect(episodeNumbers).toEqual(['S02E02', 'S02E01']);

    expect(rows[0].querySelector('.show-title')!.textContent!.trim()).toBe('Breaking Bad');
    expect(rows[0].querySelector('.episode-label')!.textContent).toContain('S02E02 Breakage');
  });

  it('links every Play to its Episode page', async () => {
    const { fixture } = await setup((page) =>
      Promise.resolve(page === 1 ? [makePlay(2, earlierToday, 5)] : []),
    );

    await vi.waitFor(() =>
      expect(fixture.nativeElement.querySelectorAll('t-history-item')).toHaveLength(1),
    );

    const link: HTMLAnchorElement = fixture.nativeElement.querySelector('a.episode-link');
    expect(link.getAttribute('href')).toBe('/shows/s/breaking-bad/season/2/episode/5');
  });

  it('fetches a rewatched Episode still once', async () => {
    const { fixture, fetchTmdbEpisode } = await setup((page) =>
      Promise.resolve(page === 1 ? [makePlay(2, earlierToday, 5), makePlay(1, yesterday, 5)] : []),
    );

    await vi.waitFor(() =>
      expect(fixture.nativeElement.querySelectorAll('t-history-item')).toHaveLength(2),
    );

    expect(fetchTmdbEpisode).toHaveBeenCalledTimes(1);
  });

  it('names one row at a time for the view transition to the Episode page', async () => {
    // A rewatch: both rows show the same still, so both would otherwise carry the same name.
    const { fixture } = await setup((page) =>
      Promise.resolve(page === 1 ? [makePlay(2, earlierToday, 5), makePlay(1, yesterday, 5)] : []),
    );

    await vi.waitFor(() =>
      expect(fixture.nativeElement.querySelectorAll('img.thumb-image')).toHaveLength(2),
    );

    const component = fixture.componentInstance;
    const [first, second] = fixture.debugElement
      .queryAll(By.css('t-history-item'))
      .map((row) => row.componentInstance);

    component.prepareViewTransition(first);
    component.prepareViewTransition(second);

    const names = Array.from(
      fixture.nativeElement.querySelectorAll('img.thumb-image') as NodeListOf<HTMLImageElement>,
    ).map((image) => image.style.getPropertyValue('view-transition-name'));
    expect(names).toEqual(['', 'episode-still']);
  });

  it('asks for no artwork for Shows without a TMDB id', async () => {
    const orphanOne = playOfShow(90, 'orphan-one', 'Orphan One', earlierToday, 3);
    const orphanTwo = playOfShow(91, 'orphan-two', 'Orphan Two', yesterday, 4);
    const { fixture, fetchTmdbShowEntry, fetchTmdbEpisode } = await setup((page) =>
      Promise.resolve(page === 1 ? [orphanOne, orphanTwo] : []),
    );

    await vi.waitFor(() =>
      expect(fixture.nativeElement.querySelectorAll('t-history-item')).toHaveLength(2),
    );

    const titles = Array.from(
      fixture.nativeElement.querySelectorAll(
        't-history-item .show-title',
      ) as NodeListOf<HTMLElement>,
    ).map((title) => title.textContent!.trim());
    expect(titles).toEqual(['Orphan One', 'Orphan Two']);
    expect(fetchTmdbShowEntry).not.toHaveBeenCalled();
    expect(fetchTmdbEpisode).not.toHaveBeenCalled();
  });

  it('shows the empty state when the user has watched nothing', async () => {
    const { fixture } = await setup(() => Promise.resolve([]));

    await vi.waitFor(() =>
      expect(fixture.nativeElement.querySelector('.empty-state')?.textContent).toContain(
        'No episodes watched yet',
      ),
    );
  });

  it('shows an error when the history request fails', async () => {
    const { fixture } = await setup(() => Promise.reject(new Error('offline')));

    await vi.waitFor(() =>
      expect(fixture.nativeElement.querySelector('t-error-text')).toBeTruthy(),
    );
  });

  it('keeps the loaded Plays when a later page fails', async () => {
    const fullPage = Array.from({ length: 50 }, (_unused, index) =>
      makePlay(100 + index, earlierToday, index + 1),
    );
    const { fixture } = await setup((page) =>
      page === 1 ? Promise.resolve(fullPage) : Promise.reject(new Error('offline')),
    );

    await vi.waitFor(() =>
      expect(fixture.nativeElement.querySelectorAll('t-history-item')).toHaveLength(50),
    );

    await fixture.componentInstance.loadNextPage();
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelectorAll('t-history-item')).toHaveLength(50);
    expect(fixture.nativeElement.querySelector('t-error-text')).toBeNull();
  });
});
