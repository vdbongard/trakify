import { computed, inject, Injectable, Signal } from '@angular/core';
import { ShowService } from './show.service';
import { TmdbService } from './tmdb.service';
import { ConfigService } from '@services/config.service';
import { EpisodeService } from './episode.service';
import { isShowFiltered, sortShows } from '@helper/shows';
import type { ShowInfo } from '@type/Show';
import { ShowProgressService } from './show-progress.service';

@Injectable({
  providedIn: 'root',
})
export class InfoService {
  showService = inject(ShowService);
  tmdbService = inject(TmdbService);
  configService = inject(ConfigService);
  episodeService = inject(EpisodeService);
  showProgressService = inject(ShowProgressService);

  getShowsFilteredAndSorted(): Signal<ShowInfo[]> {
    return computed<ShowInfo[]>(() => {
      const episodes = this.episodeService.episodes();
      const showsHidden = this.showService.showsHidden.s();
      const config = this.configService.config.s();
      const showsProgress = this.showService.showsProgress.s();

      const showInfos = this.showService
        .showsWatchedTranslated()
        .filter((showWatched) => {
          const show = showWatched.show;
          const showProgress = showsProgress[show.ids.trakt];
          return !isShowFiltered(config, show, showProgress, showsHidden);
        })
        .map((showWatched) => {
          const show = showWatched.show;
          const showProgress = showsProgress[show.ids.trakt];

          const showInfo = {
            show,
            showWatched,
            showProgress,
            progressView: this.showProgressService.progress(show)(),
            tmdbSeason: this.tmdbService.toTmdbSeason(show, showProgress),
            nextEpisode: this.episodeService.toNextEpisode(showProgress, episodes, show),
            isFavorite: this.showService.isFavorite(show),
            isHidden: this.showService.isHidden(show),
          };

          return showInfo;
        });

      sortShows(config, showInfos, episodes);

      return showInfos;
    });
  }
}
