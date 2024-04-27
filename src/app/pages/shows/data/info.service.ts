import { inject, Injectable, Injector } from '@angular/core';
import { combineLatest, map, type Observable } from 'rxjs';
import { ShowService } from './show.service';
import { TmdbService } from './tmdb.service';
import { ConfigService } from '@services/config.service';
import { EpisodeService } from './episode.service';
import { isShowFiltered, sortShows } from '@helper/shows';
import { episodeId, seasonId } from '@helper/episodeId';
import type { ShowInfo } from '@type/Show';
import type { ShowProgress } from '@type/Trakt';
import type { TmdbShow } from '@type/Tmdb';
import { toObservable } from '@angular/core/rxjs-interop';

@Injectable({
  providedIn: 'root',
})
export class InfoService {
  showService = inject(ShowService);
  tmdbService = inject(TmdbService);
  configService = inject(ConfigService);
  episodeService = inject(EpisodeService);
  injector = inject(Injector);

  getShowsFilteredAndSorted$(): Observable<ShowInfo[]> {
    return combineLatest([
      this.showService.getShowsWatched$(),
      toObservable(this.showService.showsProgress.s, { injector: this.injector }),
      this.episodeService.getEpisodes$(),
      toObservable(this.showService.showsHidden.s, { injector: this.injector }),
      toObservable(this.showService.favorites.s, { injector: this.injector }),
      toObservable(this.configService.config.s, { injector: this.injector }),
      this.tmdbService.getTmdbShows$(),
      toObservable(this.tmdbService.tmdbSeasons.s, { injector: this.injector }),
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
            const tmdbShow: TmdbShow | undefined = showWatched.show.ids.tmdb
              ? tmdbShows[showWatched.show.ids.tmdb]
              : undefined;

            const nextEpisode = showProgress?.next_episode
              ? showsEpisodes[
                  episodeId(
                    showWatched.show.ids.trakt,
                    showProgress.next_episode.season,
                    showProgress.next_episode.number,
                  )
                ]
              : undefined;

            if (isShowFiltered(config, showWatched.show, showProgress, tmdbShow, showsHidden))
              return;

            const tmdbSeason =
              showProgress?.next_episode &&
              tmdbSeasons[seasonId(showWatched.show.ids.tmdb, showProgress.next_episode.season)];

            showsInfos.push({
              showWatched,
              show: showWatched.show,
              showProgress,
              tmdbShow,
              tmdbSeason,
              nextEpisode,
              isFavorite: this.showService.isFavorite(showWatched.show, favorites),
              isHidden: this.showService.isHidden(showWatched.show),
            });
          });

          sortShows(config, showsInfos, showsEpisodes);

          return showsInfos;
        },
      ),
    );
  }
}
