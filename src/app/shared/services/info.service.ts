import { Injectable } from '@angular/core';
import { combineLatest, map, Observable } from 'rxjs';

import { isShowFiltered, sortShows } from '../helper/shows';
import { episodeId, seasonId } from '../helper/episodeId';
import { ShowService } from './trakt/show.service';
import { TmdbService } from './tmdb.service';
import { ConfigService } from './config.service';
import { EpisodeService } from './trakt/episode.service';

import type { ShowInfo } from 'src/types/interfaces/Show';
import type { ShowProgress } from 'src/types/interfaces/Trakt';
import type { TmdbShow } from 'src/types/interfaces/Tmdb';

@Injectable({
  providedIn: 'root',
})
export class InfoService {
  constructor(
    private showService: ShowService,
    private tmdbService: TmdbService,
    private configService: ConfigService,
    private episodeService: EpisodeService
  ) {}

  getShowsFilteredAndSorted$(): Observable<ShowInfo[]> {
    return combineLatest([
      this.showService.getShowsWatched$(),
      this.showService.showsProgress.$,
      this.episodeService.getEpisodes$(),
      this.showService.showsHidden.$,
      this.showService.favorites.$,
      this.configService.config.$,
      this.tmdbService.tmdbShows.$,
      this.tmdbService.tmdbSeasons.$,
    ]).pipe(
      map(
        ([
          showsWatched,
          showsProgress,
          showsEpisodes,
          showsHidden,
          favorites,
          config,
          tmdbShows,
          tmdbSeasons,
        ]) => {
          if (!showsWatched.length) return [];

          const showsInfos: ShowInfo[] = [];

          showsWatched.forEach((showWatched) => {
            const showProgress: ShowProgress | undefined =
              showsProgress[showWatched.show.ids.trakt];
            const tmdbShow: TmdbShow | undefined = tmdbShows[showWatched.show.ids.tmdb];

            if (isShowFiltered(config, showWatched.show, showProgress, tmdbShow, showsHidden))
              return;

            const tmdbSeason =
              showProgress?.next_episode &&
              tmdbSeasons[seasonId(showWatched.show.ids.tmdb, showProgress.next_episode.season)];

            const nextEpisode =
              showProgress?.next_episode &&
              showsEpisodes[
                episodeId(
                  showWatched.show.ids.trakt,
                  showProgress.next_episode.season,
                  showProgress.next_episode.number
                )
              ];

            showsInfos.push({
              showWatched,
              show: showWatched.show,
              showProgress,
              tmdbShow,
              tmdbSeason,
              nextEpisode,
              isFavorite: favorites?.includes(showWatched.show.ids.trakt),
            });
          });

          sortShows(config, showsInfos, showsEpisodes);

          return showsInfos;
        }
      )
    );
  }
}
