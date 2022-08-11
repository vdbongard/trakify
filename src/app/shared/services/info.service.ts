import { Injectable } from '@angular/core';
import { combineLatest, Observable, of, switchMap } from 'rxjs';
import { ShowInfo } from '../../../types/interfaces/Show';
import { filterShows, isShowMissing, sortShows } from '../helper/shows';
import { episodeId, seasonId } from '../helper/episodeId';
import { ShowService } from './trakt/show.service';
import { TmdbService } from './tmdb.service';
import { ConfigService } from './config.service';
import { EpisodeService } from './trakt/episode.service';

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

  getShowsFilteredAndSorted$(): Observable<ShowInfo[] | never> {
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
      switchMap(
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
          if (isShowMissing(shows, showsProgress, showsEpisodes, tmdbShows, tmdbSeasons))
            return of([]);

          const showsInfos: ShowInfo[] = [];

          shows.forEach((show) => {
            const showProgress = showsProgress[show.ids.trakt];
            const tmdbShow = tmdbShows[show.ids.tmdb];

            if (filterShows(config, showProgress, tmdbShow, showsHidden, show)) return;

            const tmdbSeason =
              showProgress.next_episode &&
              tmdbSeasons[seasonId(show.ids.tmdb, showProgress.next_episode.season)];

            const nextEpisode =
              showProgress.next_episode &&
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
              isFavorite: favorites.includes(show.ids.trakt),
              showWatched: this.showService.getShowWatched(show.ids.trakt),
            });
          });

          sortShows(config, showsInfos, showsEpisodes);

          return showsInfos.length ? of(showsInfos) : of([]);
        }
      )
    );
  }
}
