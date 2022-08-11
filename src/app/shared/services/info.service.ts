import { Injectable } from '@angular/core';
import { combineLatest, map, Observable } from 'rxjs';
import { ShowInfo } from '../../../types/interfaces/Show';
import { isShowFiltered, sortShows } from '../helper/shows';
import { episodeId, seasonId } from '../helper/episodeId';
import { ShowService } from './trakt/show.service';
import { TmdbService } from './tmdb.service';
import { ConfigService } from './config.service';
import { EpisodeService } from './trakt/episode.service';
import { ShowProgress } from '../../../types/interfaces/Trakt';
import { TmdbShow } from '../../../types/interfaces/Tmdb';

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
    console.debug('getShowsFilteredAndSorted$ start');
    return combineLatest([
      this.showService.getShowsAdded$(),
      this.showService.showsProgress$,
      this.episodeService.getEpisodes$(),
      this.showService.showsHidden$,
      this.showService.favorites$,
      this.configService.config$,
      this.tmdbService.tmdbShows$,
      this.tmdbService.tmdbSeasons$,
    ]).pipe(
      map(
        ([
          shows,
          showsProgress,
          showsEpisodes,
          showsHidden,
          favorites,
          config,
          tmdbShows,
          tmdbSeasons,
        ]) => {
          if (!shows) return [];

          const showsInfos: ShowInfo[] = [];

          shows.forEach((show) => {
            const showProgress: ShowProgress | undefined = showsProgress[show.ids.trakt];
            const tmdbShow: TmdbShow | undefined = tmdbShows[show.ids.tmdb];

            if (isShowFiltered(config, show, showProgress, tmdbShow, showsHidden)) return;

            const tmdbSeason =
              showProgress?.next_episode &&
              tmdbSeasons[seasonId(show.ids.tmdb, showProgress.next_episode.season)];

            const nextEpisode =
              showProgress?.next_episode &&
              showsEpisodes[
                episodeId(
                  show.ids.trakt,
                  showProgress.next_episode.season,
                  showProgress.next_episode.number
                )
              ];

            showsInfos.push({
              show,
              showProgress,
              tmdbShow,
              tmdbSeason,
              nextEpisode,
              isFavorite: favorites?.includes(show.ids.trakt),
              showWatched: this.showService.getShowWatched(show.ids.trakt),
            });
          });

          sortShows(config, showsInfos, showsEpisodes);

          return showsInfos;
        }
      )
    );
  }
}
