import { ComponentFixture, TestBed } from '@angular/core/testing';
import UpcomingComponent from './upcoming.component';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideTanStackQuery, QueryClient } from '@tanstack/angular-query-experimental';
import { signal } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { addDays } from 'date-fns';
import { UpcomingFilter } from '@type/Enum';
import { format, formatForTraktApi } from './upcoming.component';
import { mockShow } from '@shared/mocks/mockShow';
import type { EpisodeAiring } from '@type/Trakt';
import type { Config } from '@type/Config';
import { EpisodeService } from '../../data/episode.service';
import { TranslationService } from '../../data/translation.service';
import { TmdbService } from '../../data/tmdb.service';
import { ConfigService } from '@services/config.service';
import { ListService } from '../../../lists/data/list.service';

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

  describe('show infos join', () => {
    const createAiring = (
      id: number,
      firstAired: string,
      tmdbId: number | null = id,
    ): EpisodeAiring => ({
      first_aired: firstAired,
      show: {
        ...mockShow,
        title: `Show ${id}`,
        ids: {
          ...mockShow.ids,
          trakt: id,
          slug: `show-${id}`,
          tmdb: tmdbId,
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

    async function setupJoinComponent(
      airings: EpisodeAiring[],
      fetchTmdbShowEntryImpl: (show: { ids: { tmdb: number } }) => Promise<unknown> = (show) =>
        Promise.resolve({ id: show.ids.tmdb, name: `TMDB ${show.ids.tmdb}` }),
    ): Promise<{
      component: UpcomingComponent;
      fetchCalendar: ReturnType<typeof vi.fn>;
      getShowTranslation: ReturnType<typeof vi.fn>;
      ensureEpisodeTranslation: ReturnType<typeof vi.fn>;
      fetchTmdbShowEntry: ReturnType<typeof vi.fn>;
    }> {
      TestBed.resetTestingModule();

      const queryClient = new QueryClient({
        defaultOptions: { queries: { retry: false } },
      });
      const fetchCalendar = vi.fn(() => Promise.resolve(airings));
      const getShowTranslation = vi.fn((show: { title: string }) => ({
        title: `Localized ${show.title}`,
      }));
      const ensureEpisodeTranslation = vi.fn(() => Promise.resolve({ title: 'Localized episode' }));
      const fetchTmdbShowEntry = vi.fn(fetchTmdbShowEntryImpl);

      await TestBed.configureTestingModule({
        providers: [
          provideTanStackQuery(queryClient),
          { provide: ActivatedRoute, useValue: { snapshot: {} } },
          { provide: EpisodeService, useValue: { fetchCalendar } },
          {
            provide: TranslationService,
            useValue: { getShowTranslation, ensureEpisodeTranslation },
          },
          { provide: TmdbService, useValue: { fetchTmdbShowEntry } },
          {
            provide: ConfigService,
            useValue: { config: { s: signal({ language: 'en-US', upcomingFilters: [] }) } },
          },
          {
            provide: ListService,
            useValue: { watchlistItems: signal([]), isWatchlistItem: vi.fn(() => false) },
          },
          { provide: Router, useValue: { url: '/upcoming' } },
        ],
      }).compileComponents();

      const joinFixture = TestBed.createComponent(UpcomingComponent);
      return {
        component: joinFixture.componentInstance,
        fetchCalendar,
        getShowTranslation,
        ensureEpisodeTranslation,
        fetchTmdbShowEntry,
      };
    }

    it('builds a show info with translated show and episode', () => {
      const component = Object.create(UpcomingComponent.prototype) as UpcomingComponent;

      const airing = createAiring(1, '2030-01-01T00:00:00.000Z');
      const info = component.toShowInfo(
        airing,
        { title: 'Localized show' },
        { title: 'Localized episode' },
        { id: 1, name: 'TMDB 1' } as never,
      );

      expect(info.show.title).toBe('Localized show');
      expect(info.nextEpisode?.title).toBe('Localized episode');
      expect(info.nextEpisode?.first_aired).toBe('2030-01-01T00:00:00.000Z');
      expect(info.tmdbShow).toEqual({ id: 1, name: 'TMDB 1' });
    });

    it('joins calendar airings with translations and tmdb artwork', async () => {
      const { component, ensureEpisodeTranslation, fetchTmdbShowEntry } = await setupJoinComponent([
        createAiring(1, addDays(new Date(), 1).toISOString()),
      ]);

      await vi.waitFor(() => {
        expect(component.showInfos()?.[0]?.[0]?.show.title).toBe('Localized Show 1');
      });

      const info = component.showInfos()?.[0]?.[0];
      expect(info?.nextEpisode?.title).toBe('Localized episode');
      expect(info?.tmdbShow).toEqual({ id: 1, name: 'TMDB 1' });
      expect(ensureEpisodeTranslation).toHaveBeenCalledWith(expect.anything(), 1, 1, {
        persist: true,
      });
      expect(fetchTmdbShowEntry).toHaveBeenCalledWith(expect.anything(), { force: true });
    });

    it('filters past airings from calendar pages', async () => {
      const { component } = await setupJoinComponent([
        createAiring(10, addDays(new Date(), 2).toISOString()),
        createAiring(20, addDays(new Date(), -2).toISOString()),
      ]);

      await vi.waitFor(() => {
        expect(component.showInfos()?.[0]).toHaveLength(1);
      });
      expect(component.showInfos()?.[0]?.[0]?.show.title).toBe('Localized Show 10');
    });

    it('keeps airings whose tmdb fetch fails', async () => {
      const { component } = await setupJoinComponent(
        [
          createAiring(10, addDays(new Date(), 2).toISOString()),
          createAiring(20, addDays(new Date(), 3).toISOString()),
        ],
        (show: { ids: { tmdb: number } }) =>
          show.ids.tmdb === 10
            ? Promise.reject(new Error('tmdb down'))
            : Promise.resolve({ id: show.ids.tmdb, name: `TMDB ${show.ids.tmdb}` }),
      );

      await vi.waitFor(() => {
        expect(component.showInfos()?.[0]).toHaveLength(2);
      });
      expect(component.showInfos()?.[0]?.[0]?.tmdbShow).toBeUndefined();
      expect(component.showInfos()?.[0]?.[1]?.tmdbShow).toEqual({
        id: 20,
        name: 'TMDB 20',
      });
    });

    it('skips the tmdb query for shows without a tmdb id', async () => {
      const { component, fetchTmdbShowEntry } = await setupJoinComponent([
        createAiring(1, addDays(new Date(), 1).toISOString(), null),
      ]);

      await vi.waitFor(() => {
        expect(component.showInfos()?.[0]).toHaveLength(1);
      });

      expect(fetchTmdbShowEntry).not.toHaveBeenCalled();
      expect(component.showInfos()?.[0]?.[0]?.tmdbShow).toBeUndefined();
      expect(component.showInfos()?.[0]?.[0]?.show.title).toBe('Localized Show 1');
    });
  });
});
