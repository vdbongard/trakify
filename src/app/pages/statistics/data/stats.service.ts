import { computed, inject, Injectable, Injector, Signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ShowService } from '../../shows/data/show.service';
import { EpisodeService } from '../../shows/data/episode.service';
import { TmdbService } from '../../shows/data/tmdb.service';
import { sum, sumBoolean } from '@helper/sum';
import { episodeId } from '@helper/episodeId';
import type { EpisodeStats, ShowStats } from '@type/Stats';
import type { ShowHidden, ShowProgress, Stats } from '@type/Trakt';
import { statsSchema } from '@type/Trakt';
import { parseResponse } from '@operator/parseResponse';
import { urlReplace } from '@helper/urlReplace';
import { API } from '@shared/api';
import { isShowEnded } from '@helper/isShowEnded';

@Injectable({
  providedIn: 'root',
})
export class StatsService {
  showService = inject(ShowService);
  episodeService = inject(EpisodeService);
  tmdbService = inject(TmdbService);
  http = inject(HttpClient);
  injector = inject(Injector);

  fetchStats(userId = 'me'): Observable<Stats> {
    return this.http.get<Stats>(urlReplace(API.stats, [userId])).pipe(parseResponse(statsSchema));
  }

  getEpisodeStats(): Signal<EpisodeStats> {
    return computed(() => {
      const showsProgress = this.showService.showsProgress.s();
      const showsHidden = this.showService.showsHidden.s();

      const allShowsProgress = Object.values(showsProgress);
      const showsNotHiddenProgress = this.getShowsNotHiddenProgress(showsProgress, showsHidden);

      const showsEpisodesCounts = allShowsProgress.map((progress) =>
        this.getEpisodeCount(progress),
      );
      const showsNotHiddenEpisodesCounts = showsNotHiddenProgress.map((progress) =>
        this.getEpisodeCount(progress),
      );
      const showsWatchedEpisodesCounts = allShowsProgress.map((progress) => {
        if (!progress) return 0;
        const watchedProgress = this.getWatchedEpisodes(progress);
        return this.getEpisodeCount(watchedProgress);
      });
      const showsWatchedNotHiddenEpisodesCounts = showsNotHiddenProgress.map((progress) => {
        if (!progress) return 0;
        const watchedProgress = this.getWatchedEpisodes(progress);
        return this.getEpisodeCount(watchedProgress);
      });

      return {
        episodesCount: sum(showsEpisodesCounts),
        watchedEpisodesCount: sum(showsWatchedEpisodesCounts),
        notHiddenEpisodesCount: sum(showsNotHiddenEpisodesCounts),
        notHiddenWatchedEpisodesCount: sum(showsWatchedNotHiddenEpisodesCounts),
      };
    });
  }

  getShowStats(): Signal<ShowStats> {
    return computed(() => {
      const showsWatched = this.showService.showsWatched.s();
      const showsProgress = this.showService.showsProgress.s();
      const showsEpisodes = this.episodeService.showsEpisodes.s();
      const showsHidden = this.showService.showsHidden.s();
      const tmdbShows = this.tmdbService.tmdbShows.s();

      const showsHiddenIds = showsHidden?.map((showHidden) => showHidden.show.ids.trakt) ?? [];

      // [showEnded, showWithNextEpisode]
      const showsStats: [boolean, boolean][] =
        showsWatched?.map((showWatched) => {
          const isShowHidden = showsHiddenIds.includes(showWatched.show.ids.trakt);
          if (isShowHidden) return [true, false];

          const showProgress = showsProgress[showWatched.show.ids.trakt];
          if (!showProgress) return [true, false];

          const nextEpisode = showProgress.next_episode;
          const nextEpisodeFull =
            nextEpisode &&
            showsEpisodes[
              episodeId(showWatched.show.ids.trakt, nextEpisode.season, nextEpisode.number)
            ];
          const withNextEpisode =
            !!nextEpisodeFull?.first_aired && new Date(nextEpisodeFull.first_aired) < new Date();

          const tmdbShow = showWatched.show.ids.tmdb
            ? tmdbShows[showWatched.show.ids.tmdb]
            : undefined;
          if (!tmdbShow) return [true, false];

          return [isShowEnded(tmdbShow), withNextEpisode];
        }) ?? [];

      const showsEnded = showsStats.map((showStats) => showStats[0]);
      const showsWithNextEpisode = showsStats.map((showStats) => showStats[1]);

      const showsCount = showsWatched?.length ?? 0;
      const showsEndedCount = sumBoolean(showsEnded);
      const showsReturningCount = showsCount - showsEndedCount;
      const showsWithNextEpisodeCount = sumBoolean(showsWithNextEpisode);

      return {
        showsCount,
        showsEndedCount,
        showsReturningCount,
        showsWithNextEpisodeCount,
      };
    });
  }

  getShowsNotHiddenProgress(
    showsProgress: Record<string, ShowProgress | undefined>,
    showsHidden?: ShowHidden[] | undefined,
  ): (ShowProgress | undefined)[] {
    const showsHiddenIds = showsHidden?.map((showHidden) => showHidden.show.ids.trakt) ?? [];
    const showsNotHiddenProgressEntries = Object.entries(showsProgress).filter(
      ([showProgressId]) => !showsHiddenIds.includes(parseInt(showProgressId)),
    );
    return showsNotHiddenProgressEntries.map((a) => a[1]);
  }

  getWatchedEpisodes(progress: ShowProgress): ShowProgress {
    return {
      ...progress,
      seasons: progress.seasons.map((season) => ({
        ...season,
        episodes: season.episodes.filter((episode) => episode.completed),
      })),
    };
  }

  getEpisodeCount(progress: ShowProgress | undefined): number {
    const seasonsEpisodesCounts = progress?.seasons.map((season) =>
      season.number === 0 ? 0 : season.episodes.length,
    );
    return sum(seasonsEpisodesCounts);
  }
}
