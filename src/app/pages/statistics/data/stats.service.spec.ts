import { TestBed } from '@angular/core/testing';
import { StatsService } from './stats.service';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { ShowService } from '../../shows/data/show.service';
import { makeCompact, makeShow } from '@shared/mocks/mockProgress';
import type { ShowHidden, ShowWatched } from '@type/Trakt';

describe('StatsService', () => {
  async function setup(): Promise<{ service: StatsService; showService: ShowService }> {
    await TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();
    return {
      service: TestBed.inject(StatsService),
      showService: TestBed.inject(ShowService),
    };
  }

  describe('getShowStats', () => {
    it('counts every watched and every hidden show', async () => {
      const { service, showService } = await setup();
      showService.showsWatched.s.set([
        { show: makeShow(1, 'A') } as ShowWatched,
        { show: makeShow(2, 'B') } as ShowWatched,
      ]);
      showService.showsHidden.s.set([{ show: makeShow(3, 'C') } as ShowHidden]);

      expect(service.getShowStats()()).toEqual({ showsCount: 2, showsHiddenCount: 1 });
    });
  });

  describe('getEpisodeStats', () => {
    it('counts aired and completed from the overview store for every watched show', async () => {
      const { service, showService } = await setup();
      showService.showsProgressOverview.s.set({
        '1': makeCompact(10, 4),
        '2': makeCompact(8, 8),
      });

      const stats = service.getEpisodeStats()();
      expect(stats.episodesCount).toBe(18);
      expect(stats.watchedEpisodesCount).toBe(12);
      expect(stats.notHiddenEpisodesCount).toBe(18);
      expect(stats.notHiddenWatchedEpisodesCount).toBe(12);
    });

    it('keeps hidden shows in the totals but excludes them from the not-hidden counts', async () => {
      const { service, showService } = await setup();
      showService.showsProgressOverview.s.set({
        '1': makeCompact(10, 4),
        '2': makeCompact(8, 3),
      });
      showService.showsHidden.s.set([{ show: makeShow(2, 'Hidden') } as ShowHidden]);

      const stats = service.getEpisodeStats()();
      expect(stats.episodesCount).toBe(18);
      expect(stats.watchedEpisodesCount).toBe(7);
      expect(stats.notHiddenEpisodesCount).toBe(10);
      expect(stats.notHiddenWatchedEpisodesCount).toBe(4);
    });
  });
});
