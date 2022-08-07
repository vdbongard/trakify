import { Injectable } from '@angular/core';
import { combineLatest, forkJoin, map, Observable, take } from 'rxjs';
import { ShowInfo } from '../../../types/interfaces/Show';
import { filterShows, isShowMissing, sortShows } from '../helper/shows';
import { episodeId, seasonId } from '../helper/episodeId';
import { ShowService } from './trakt/show.service';
import { TmdbService } from './tmdb.service';
import { ConfigService } from './config.service';
import { EpisodeService } from './trakt/episode.service';
import {
  Episode,
  EpisodeFull,
  Ids,
  SeasonProgress,
  SeasonWatched,
  TraktShow,
} from '../../../types/interfaces/Trakt';
import { setLocalStorage } from '../helper/localStorage';
import { LocalStorage } from '../../../types/enum';
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
    return combineLatest([
      this.showService.getShowsAdded$(),
      this.showService.getShowsProgress$(),
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
          if (isShowMissing(shows, showsProgress, showsEpisodes, tmdbShows, tmdbSeasons)) return [];

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

          return showsInfos;
        }
      )
    );
  }

  addNewShow(ids: Ids | undefined, episode?: Episode): void {
    if (!ids || (episode && !(episode.season === 1 && episode.number === 1))) return;

    forkJoin([
      this.showService.getShow$(ids).pipe(take(1)),
      this.tmdbService.getTmdbShow$(ids, false, true).pipe(take(1)),
      this.episodeService.getEpisode$(ids, 1, 1, false, true).pipe(take(1)),
    ]).subscribe(([show, tmdbShow, nextEpisode]) => {
      if (!show) return;

      const showInfo = this.getFakeShowInfoForNewShow(show, tmdbShow, nextEpisode);
      if (!showInfo) return;

      const showInfos = this.showService.addedShowInfos$.value;
      showInfos[show.ids.trakt] = showInfo;
      setLocalStorage<{ [showId: number]: ShowInfo }>(LocalStorage.ADDED_SHOW_INFO, showInfos);
      this.showService.addedShowInfos$.next(showInfos);
    });
  }

  removeNewShow(showId: number): void {
    const addedShow = this.showService.addedShowInfos$.value[showId];
    if (!addedShow) return;

    delete this.showService.addedShowInfos$.value[showId];
    setLocalStorage<{ [showId: number]: ShowInfo }>(
      LocalStorage.ADDED_SHOW_INFO,
      this.showService.addedShowInfos$.value
    );
    this.showService.addedShowInfos$.next(this.showService.addedShowInfos$.value);
    this.showService.removeFavorite(showId);
  }

  private getFakeShowInfoForNewShow(
    show: TraktShow | undefined,
    tmdbShow: TmdbShow | undefined,
    nextEpisode: EpisodeFull | undefined | null
  ): ShowInfo | undefined {
    if (!show || !tmdbShow || !nextEpisode) throw Error('Argument is empty');
    return {
      show,
      nextEpisode,
      showProgress: {
        aired: tmdbShow.number_of_episodes,
        completed: 0,
        // eslint-disable-next-line @typescript-eslint/naming-convention
        last_episode: null,
        // eslint-disable-next-line @typescript-eslint/naming-convention
        last_watched_at: null,
        // eslint-disable-next-line @typescript-eslint/naming-convention
        next_episode: {
          ids: {
            imdb: '',
            slug: '',
            tmdb: 0,
            trakt: 0,
            tvdb: 0,
            tvrage: 0,
          },
          number: 1,
          season: 1,
          title: nextEpisode.title,
        },
        // eslint-disable-next-line @typescript-eslint/naming-convention
        reset_at: null,
        seasons: tmdbShow.seasons
          .map((tmdbSeason) => {
            if (tmdbSeason.season_number === 0) return;
            return {
              aired: tmdbSeason.episode_count,
              completed: 0,
              episodes: Array(tmdbSeason.episode_count)
                .fill(0)
                .map((_, index) => {
                  return {
                    completed: false,
                    // eslint-disable-next-line @typescript-eslint/naming-convention
                    last_watched_at: null,
                    number: index + 1,
                  };
                }),
              number: tmdbSeason.season_number,
              title: tmdbSeason.name,
            };
          })
          .filter(Boolean) as SeasonProgress[],
      },
      showWatched: {
        // eslint-disable-next-line @typescript-eslint/naming-convention
        last_updated_at: null,
        // eslint-disable-next-line @typescript-eslint/naming-convention
        last_watched_at: null,
        plays: 0,
        // eslint-disable-next-line @typescript-eslint/naming-convention
        reset_at: null,
        seasons: tmdbShow.seasons
          .map((tmdbSeason) => {
            if (tmdbSeason.season_number === 0) return;
            return {
              number: tmdbSeason.season_number,
              episodes: Array(tmdbSeason.episode_count)
                .fill(0)
                .map((_, index) => {
                  return {
                    // eslint-disable-next-line @typescript-eslint/naming-convention
                    last_watched_at: null,
                    number: index + 1,
                    plays: 0,
                  };
                }),
            };
          })
          .filter(Boolean) as SeasonWatched[],
        show,
      },
    };
  }
}
