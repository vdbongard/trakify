import { computed, inject, Injectable, Signal } from '@angular/core';
import { ShowService } from '../../shows/data/show.service';
import { sum } from '@helper/sum';
import type { EpisodeStats, ShowStats } from '@type/Stats';
import type { ShowHidden, ShowProgress } from '@type/Trakt';

@Injectable({
  providedIn: 'root',
})
export class StatsService {
  showService = inject(ShowService);

  getEpisodeStats(): Signal<EpisodeStats> {
    return computed(() => {
      const showsProgress = this.showService.showsProgress.s();
      const showsHidden = this.showService.showsHidden.s();

      const allShowsProgress = Object.values(showsProgress).filter((v) => !!v);
      const showsNotHiddenProgress = this.getShowsNotHiddenProgress(showsProgress, showsHidden);

      const showsEpisodesCounts = allShowsProgress.map((progress) =>
        this.getEpisodeCount(progress),
      );
      const showsNotHiddenEpisodesCounts = showsNotHiddenProgress.map((progress) =>
        this.getEpisodeCount(progress),
      );
      const showsWatchedEpisodesCounts = allShowsProgress.map((progress) => progress.completed);
      const showsWatchedNotHiddenEpisodesCounts = showsNotHiddenProgress.map(
        (progress) => progress.completed,
      );

      const episodeStats: EpisodeStats = {
        episodesCount: sum(showsEpisodesCounts),
        watchedEpisodesCount: sum(showsWatchedEpisodesCounts),
        notHiddenEpisodesCount: sum(showsNotHiddenEpisodesCounts),
        notHiddenWatchedEpisodesCount: sum(showsWatchedNotHiddenEpisodesCounts),
      };

      return episodeStats;
    });
  }

  getShowStats(): Signal<ShowStats> {
    return computed(() => {
      const showsWatched = this.showService.showsWatched.s();
      const showsHidden = this.showService.showsHidden.s();

      const showsCount = showsWatched?.length ?? 0;
      const showsHiddenCount = showsHidden?.length ?? 0;

      return {
        showsCount,
        showsHiddenCount,
      } satisfies ShowStats;
    });
  }

  getShowsNotHiddenProgress(
    showsProgress: Record<string, ShowProgress | undefined>,
    showsHidden: ShowHidden[],
  ): ShowProgress[] {
    const showsHiddenIds = showsHidden?.map((showHidden) => showHidden.show.ids.trakt) ?? [];
    const showsNotHiddenProgressEntries = Object.entries(showsProgress).filter(
      ([showProgressId]) => !showsHiddenIds.includes(parseInt(showProgressId)),
    );
    return showsNotHiddenProgressEntries.map((a) => a[1]).filter((v) => !!v);
  }

  getEpisodeCount(progress: ShowProgress | undefined): number {
    const seasonsEpisodesCounts = progress?.seasons.map((season) =>
      season.number === 0 ? 0 : season.episodes.length,
    );
    return sum(seasonsEpisodesCounts);
  }
}
