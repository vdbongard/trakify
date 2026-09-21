import { TestBed } from '@angular/core/testing';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { InfoService } from './info.service';
import { ShowService } from './show.service';
import { EpisodeService } from './episode.service';
import { ConfigService } from '@services/config.service';
import { makeCompact, makeShow } from '@shared/mocks/mockProgress';
import { Filter, Sort } from '@type/Enum';
import { FilterCategory } from '@type/Config';
import type { EpisodeFull, ShowProgress, ShowWatched } from '@type/Trakt';
import { toEpisodeId } from '@helper/toShowId';

describe('InfoService', () => {
  async function setup(): Promise<{
    service: InfoService;
    showService: ShowService;
    episodeService: EpisodeService;
    configService: ConfigService;
  }> {
    await TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();
    return {
      service: TestBed.inject(InfoService),
      showService: TestBed.inject(ShowService),
      episodeService: TestBed.inject(EpisodeService),
      configService: TestBed.inject(ConfigService),
    };
  }

  function setConfig(
    configService: ConfigService,
    overrides: { filters?: boolean; sort?: string } = {},
  ): void {
    const config = configService.config.s();
    config.filters = [
      ...(overrides.filters
        ? [{ category: FilterCategory.HIDE, name: Filter.NO_NEW_EPISODES, value: true }]
        : []),
    ];
    config.sort = { ...config.sort, by: overrides.sort ?? Sort.LAST_WATCHED };
    config.sortOptions = [];
    configService.config.s.set({ ...config });
  }

  it('should be created', async () => {
    const { service } = await setup();
    expect(service).toBeTruthy();
  });

  it('builds show info from the overview store, not the seasonal detail store', async () => {
    const { service, showService } = await setup();
    const show = makeShow(1, 'Alpha');
    showService.showsWatched.s.set([{ show } as ShowWatched]);
    showService.showsHidden.s.set([]);
    showService.favorites.s.set([]);
    showService.showsProgressOverview.s.set({ [show.ids.trakt]: makeCompact(10, 4) });
    showService.showsProgress.s.set({
      [show.ids.trakt]: {
        aired: 99,
        completed: 99,
        last_episode: null,
        last_watched_at: null,
        reset_at: null,
        seasons: [],
      } as ShowProgress,
    });

    const showInfos = service.getShowsFilteredAndSorted()();
    expect(showInfos).toHaveLength(1);
    expect(showInfos[0]?.showProgress?.aired).toBe(10);
    expect(showInfos[0]?.showProgress?.completed).toBe(4);
  });

  it('hides no-new-episodes shows based on overview aired/completed', async () => {
    const { service, showService, configService } = await setup();
    setConfig(configService, { filters: true });

    const showA = makeShow(1, 'NoMore');
    const showB = makeShow(2, 'HasNew');
    showService.showsWatched.s.set([
      { show: showA } as ShowWatched,
      { show: showB } as ShowWatched,
    ]);
    showService.showsHidden.s.set([]);
    showService.favorites.s.set([]);
    showService.showsProgressOverview.s.set({
      [showA.ids.trakt]: makeCompact(5, 5),
      [showB.ids.trakt]: makeCompact(5, 2),
    });

    const showInfos = service.getShowsFilteredAndSorted()();
    expect(showInfos.map((showInfo) => showInfo.show.ids.trakt)).toEqual([2]);
  });

  it('sorts by episode progress computed from overview completed/aired', async () => {
    const { service, showService, configService } = await setup();
    setConfig(configService, { sort: Sort.EPISODE_PROGRESS });

    const showA = makeShow(1, 'AlmostDone');
    const showB = makeShow(2, 'JustStarted');
    showService.showsWatched.s.set([
      { show: showA } as ShowWatched,
      { show: showB } as ShowWatched,
    ]);
    showService.showsHidden.s.set([]);
    showService.favorites.s.set([]);
    showService.showsProgressOverview.s.set({
      [showA.ids.trakt]: makeCompact(10, 9),
      [showB.ids.trakt]: makeCompact(10, 1),
    });

    const showInfos = service.getShowsFilteredAndSorted()();
    expect(showInfos.map((showInfo) => showInfo.show.ids.trakt)).toEqual([2, 1]);
  });

  it('resolves the next-episode line from the overview next episode', async () => {
    const { service, showService, episodeService, configService } = await setup();
    setConfig(configService);

    const show = makeShow(1, 'Alpha');
    const episodeFull = {
      ids: { trakt: 21, tmdb: 21, tvdb: 21, tvrage: 21, imdb: 'tt21' },
      season: 2,
      number: 1,
      title: 'Next One',
      first_aired: '2026-01-01T00:00:00.000Z',
    } as EpisodeFull;
    showService.showsWatched.s.set([{ show } as ShowWatched]);
    showService.showsHidden.s.set([]);
    showService.favorites.s.set([]);
    showService.showsProgressOverview.s.set({
      [show.ids.trakt]: {
        ...makeCompact(12, 3),
        next_episode: {
          ids: { trakt: 21, tmdb: 21 },
          season: 2,
          number: 1,
          title: 'Next One',
        },
      },
    });
    episodeService.showsEpisodes.s.set({ [toEpisodeId(show.ids.trakt, 2, 1)]: episodeFull });
    TestBed.flushEffects();

    const showInfos = service.getShowsFilteredAndSorted()();
    expect(showInfos[0]?.nextEpisode?.first_aired).toBe('2026-01-01T00:00:00.000Z');
  });
});
