import { ComponentFixture, TestBed } from '@angular/core/testing';
import UpcomingComponent from './upcoming.component';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideTanStackQuery, QueryClient } from '@tanstack/angular-query-experimental';
import { firstValueFrom, of } from 'rxjs';
import { addDays } from 'date-fns';
import { UpcomingFilter } from '@type/Enum';
import { format, formatForTraktApi } from './upcoming.component';
import { mockShow } from '@shared/mocks/mockShow';
import type { EpisodeAiring } from '@type/Trakt';
import type { Config } from '@type/Config';

describe('UpcomingComponent', () => {
  let fixture: ComponentFixture<UpcomingComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideTanStackQuery(new QueryClient()),
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(UpcomingComponent);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('should show spinner while loading', () => {
    const spinner = fixture.nativeElement.querySelector('t-spinner');
    const shows = fixture.nativeElement.querySelector('t-shows');
    const loadMoreButton = fixture.nativeElement.querySelector('button[matbutton]');
    const errorText = fixture.nativeElement.querySelector('t-error-text');

    expect(spinner).toBeTruthy();
    expect(shows).toBeFalsy();
    expect(loadMoreButton).toBeFalsy();
    expect(errorText).toBeFalsy();
  });

  describe('filters and formatting', () => {
    const createConfig = (filters: Config['upcomingFilters']): Config =>
      ({ upcomingFilters: filters }) as Config;

    it('hides specials based on config filters', () => {
      const component = Object.create(UpcomingComponent.prototype) as UpcomingComponent;

      const specialShowInfo = { nextEpisode: { season: 0 } } as never;
      const regularShowInfo = { nextEpisode: { season: 1 } } as never;

      const hideSpecials = createConfig([
        { category: 'hide', name: UpcomingFilter.SPECIALS, value: true },
      ] as never);
      const showOnlySpecials = createConfig([
        { category: 'show', name: UpcomingFilter.SPECIALS, value: true },
      ] as never);

      expect(component.isSpecial(specialShowInfo, hideSpecials)).toBe(true);
      expect(component.isSpecial(regularShowInfo, hideSpecials)).toBe(false);
      expect(component.isSpecial(regularShowInfo, showOnlySpecials)).toBe(true);
    });

    it('hides watchlist items based on watchlist filter behavior', () => {
      const component = Object.create(UpcomingComponent.prototype) as UpcomingComponent;
      component.listService = {
        isWatchlistItem: vi.fn(() => true),
      } as never;

      const config = createConfig([
        { category: 'hide', name: UpcomingFilter.WATCHLIST_ITEM, value: true },
      ] as never);

      const showInfo = { show: mockShow } as never;

      expect(component.isWatchlistItem(showInfo, config, [])).toBe(true);
      expect(component.isWatchlistItem({ show: undefined } as never, config, [])).toBe(true);
    });

    it('formats dates for UI and trakt api', () => {
      const date = new Date('2026-06-15T00:00:00.000Z');

      expect(format(date)).toBe('15-06-2026');
      expect(formatForTraktApi(date)).toBe('2026-06-15');
    });
  });

  describe('data fetch helpers', () => {
    const createAiring = (id: number, firstAired: string): EpisodeAiring => ({
      first_aired: firstAired,
      show: {
        ...mockShow,
        title: `Show ${id}`,
        ids: {
          ...mockShow.ids,
          trakt: id,
          slug: `show-${id}`,
          tmdb: id,
          tvdb: id,
          tvrage: id,
          imdb: `tt${id}`,
        },
      },
      episode: {
        ids: {
          trakt: id,
          tmdb: id,
          tvdb: id,
          tvrage: id,
          imdb: `tt${id}`,
        },
        season: 1,
        number: 1,
        title: `Episode ${id}`,
      },
    });

    it('returns empty arrays quickly for translation/tmdb helpers', async () => {
      const component = Object.create(UpcomingComponent.prototype) as UpcomingComponent;
      component.translationService = {
        getShowTranslation$: vi.fn(),
        getEpisodeTranslation$: vi.fn(),
      } as never;
      component.tmdbService = { getTmdbShow$: vi.fn() } as never;

      await expect(firstValueFrom(component.getShowsTranslations$([]))).resolves.toEqual([]);
      await expect(firstValueFrom(component.getEpisodesTranslations$([]))).resolves.toEqual([]);
      await expect(firstValueFrom(component.getTmdbShows$([]))).resolves.toEqual([]);

      expect(component.translationService.getShowTranslation$).not.toHaveBeenCalled();
      expect(component.translationService.getEpisodeTranslation$).not.toHaveBeenCalled();
      expect(component.tmdbService.getTmdbShow$).not.toHaveBeenCalled();
    });

    it('requests show/episode translations and tmdb shows for airing entries', async () => {
      const component = Object.create(UpcomingComponent.prototype) as UpcomingComponent;
      component.translationService = {
        getShowTranslation$: vi.fn(() => of({ title: 'Localized show' })),
        getEpisodeTranslation$: vi.fn(() => of({ title: 'Localized episode' })),
      } as never;
      component.tmdbService = {
        getTmdbShow$: vi.fn((show: { ids: { tmdb: number } }) =>
          of({ id: show.ids.tmdb, name: `TMDB ${show.ids.tmdb}` }),
        ),
      } as never;

      const airings = [createAiring(1, addDays(new Date(), 1).toISOString())];

      const showTranslations = await firstValueFrom(component.getShowsTranslations$(airings));
      const episodeTranslations = await firstValueFrom(component.getEpisodesTranslations$(airings));
      const tmdbShows = await firstValueFrom(component.getTmdbShows$(airings));

      expect(component.translationService.getShowTranslation$).toHaveBeenCalledTimes(1);
      expect(component.translationService.getEpisodeTranslation$).toHaveBeenCalledWith(
        airings[0].show,
        1,
        1,
        { sync: true, fetch: true },
      );
      expect(component.tmdbService.getTmdbShow$).toHaveBeenCalledWith(airings[0].show, false, {
        fetchAlways: true,
      });
      expect(showTranslations).toEqual([{ title: 'Localized show' }]);
      expect(episodeTranslations).toEqual([{ title: 'Localized episode' }]);
      expect(tmdbShows[0]).toEqual({ id: 1, name: 'TMDB 1' });
    });

    it('builds upcoming episode infos with translated show and episode', () => {
      const component = Object.create(UpcomingComponent.prototype) as UpcomingComponent;

      const airing = createAiring(1, '2030-01-01T00:00:00.000Z');
      const infos = component.getUpcomingEpisodeInfos(
        [airing],
        [{ title: 'Localized show' }],
        [{ title: 'Localized episode' }],
        [{ id: 1, name: 'TMDB 1' } as never],
      );

      expect(infos[0]?.show.title).toBe('Localized show');
      expect(infos[0]?.nextEpisode?.title).toBe('Localized episode');
      expect(infos[0]?.nextEpisode?.first_aired).toBe('2030-01-01T00:00:00.000Z');
      expect(infos[0]?.tmdbShow).toEqual({ id: 1, name: 'TMDB 1' });
    });

    it('returns only non-past episodes from getUpcomingEpisodes$', async () => {
      const component = Object.create(UpcomingComponent.prototype) as UpcomingComponent;

      const futureAiring = createAiring(10, addDays(new Date(), 2).toISOString());
      const pastAiring = createAiring(20, addDays(new Date(), -2).toISOString());

      component.episodeService = {
        fetchCalendar: vi.fn(() => of([pastAiring, futureAiring])),
      } as never;
      component.translationService = {
        getShowTranslation$: vi.fn((show: { ids: { trakt: number } }) =>
          of({ title: `Localized show ${show.ids.trakt}` }),
        ),
        getEpisodeTranslation$: vi.fn((show: { ids: { trakt: number } }) =>
          of({ title: `Localized episode ${show.ids.trakt}` }),
        ),
      } as never;
      component.tmdbService = {
        getTmdbShow$: vi.fn((show: { ids: { tmdb: number } }) =>
          of({ id: show.ids.tmdb, name: `TMDB ${show.ids.tmdb}` }),
        ),
      } as never;

      const result = await firstValueFrom(component.getUpcomingEpisodes$(0));

      expect(component.episodeService.fetchCalendar).toHaveBeenCalledTimes(1);
      expect(result).toHaveLength(1);
      expect(result[0]?.show.title).toBe('Localized show 10');
      expect(result[0]?.nextEpisode?.title).toBe('Localized episode 10');
    });
  });
});
