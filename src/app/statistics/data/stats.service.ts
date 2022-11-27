import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { combineLatest, map, Observable } from 'rxjs';

import { ShowService } from '../../shows/data/show.service';
import { EpisodeService } from '../../shows/data/episode.service';
import { TmdbService } from '../../shows/data/tmdb.service';
import { sum, sumBoolean } from '@helper/sum';
import { episodeId } from '@helper/episodeId';

import type { EpisodeStats, ShowStats } from '@type/interfaces/Stats';
import type { ShowHidden, ShowProgress, Stats } from '@type/interfaces/Trakt';
import { statsSchema } from '@type/interfaces/Trakt';
import { isShowEnded } from '@shared/pipes/is-show-ended.pipe';
import { parseResponse } from '@operator/parseResponse';
import { urlReplace } from '@helper/urlReplace';
import { api } from '@shared/api';

@Injectable({
  providedIn: 'root',
})
export class StatsService {
  constructor(
    private showService: ShowService,
    private episodeService: EpisodeService,
    private tmdbService: TmdbService,
    private http: HttpClient
  ) {}

  fetchStats(userId = 'me'): Observable<Stats> {
    return this.http.get<Stats>(urlReplace(api.stats, [userId])).pipe(parseResponse(statsSchema));
  }

  getStats$(): Observable<[ShowStats, EpisodeStats]> {
    const showStats: Observable<ShowStats> = combineLatest([
      this.showService.showsWatched.$,
      this.showService.showsProgress.$,
      this.episodeService.showsEpisodes.$,
      this.showService.showsHidden.$,
      this.tmdbService.tmdbShows.$,
    ]).pipe(
      map(([showsWatched, showsProgress, showsEpisodes, showsHidden, tmdbShows]) => {
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
      })
    );

    const episodeStats: Observable<EpisodeStats> = combineLatest([
      this.showService.showsProgress.$,
      this.showService.showsHidden.$,
    ]).pipe(
      map(([showsProgress, showsHidden]) => {
        const allShowsProgress = Object.values(showsProgress);
        const showsNotHiddenProgress = this.getShowsNotHiddenProgress(showsProgress, showsHidden);

        const showsEpisodesCounts = allShowsProgress.map((progress) =>
          this.getEpisodeCount(progress)
        );
        const showsNotHiddenEpisodesCounts = showsNotHiddenProgress.map((progress) =>
          this.getEpisodeCount(progress)
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
      })
    );

    return combineLatest([showStats, episodeStats]);
  }

  getShowsNotHiddenProgress(
    showsProgress: { [id: string]: ShowProgress | undefined },
    showsHidden?: ShowHidden[] | undefined
  ): (ShowProgress | undefined)[] {
    const showsHiddenIds = showsHidden?.map((showHidden) => showHidden.show.ids.trakt) ?? [];
    const showsNotHiddenProgressEntries = Object.entries(showsProgress).filter(
      ([showProgressId]) => !showsHiddenIds.includes(parseInt(showProgressId))
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
      season.number === 0 ? 0 : season.episodes.length
    );
    return sum(seasonsEpisodesCounts);
  }
}
