import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { combineLatest, map, Observable } from 'rxjs';

import { ShowService } from './trakt/show.service';
import { EpisodeService } from './trakt/episode.service';
import { TmdbService } from './tmdb.service';
import { Config } from '../../config';
import { sum, sumBoolean } from '@helper/sum';
import { episodeId } from '@helper/episodeId';

import type { EpisodeStats, ShowStats } from '@type/interfaces/Stats';
import type { Stats } from '@type/interfaces/Trakt';
import { statsSchema } from '@type/interfaces/Trakt';
import { isShowEnded } from '../pipes/is-show-ended.pipe';
import { parseResponse } from '@helper/parseResponse.operator';

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
    return this.http
      .get<Stats>(`${Config.traktBaseUrl}/users/${userId}/stats`)
      .pipe(parseResponse(statsSchema));
  }

  getStats$(): Observable<[EpisodeStats, ShowStats]> {
    const episodeStats: Observable<EpisodeStats> = this.showService.showsProgress.$.pipe(
      map((showsProgress) => {
        const showsEpisodesCounts = Object.values(showsProgress).map((progress) => {
          const seasonsEpisodesCounts = progress?.seasons.map((season) =>
            season.number === 0 ? 0 : season.episodes.length
          );
          return sum(seasonsEpisodesCounts);
        });

        const showsWatchedEpisodesCounts = Object.values(showsProgress).map((progress) => {
          const seasonsWatchedEpisodesCounts = progress?.seasons.map((season) =>
            season.number === 0 ? 0 : season.episodes.filter((episode) => episode.completed).length
          );
          return sum(seasonsWatchedEpisodesCounts);
        });

        return {
          episodesCount: sum(showsEpisodesCounts),
          watchedEpisodesCount: sum(showsWatchedEpisodesCounts),
        };
      })
    );

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

    return combineLatest([episodeStats, showStats]);
  }
}
