import { computed, inject, Injectable, Injector, Signal } from '@angular/core';
import { ShowService } from './show.service';
import { TmdbService } from './tmdb.service';
import { ConfigService } from '@services/config.service';
import { EpisodeService } from './episode.service';
import { isShowFiltered, sortShows } from '@helper/shows';
import { toEpisodeId, toSeasonId } from '@helper/toEpisodeId';
import type { ShowInfo } from '@type/Show';
import { EpisodeFull, Show, ShowProgress } from '@type/Trakt';
import type { TmdbSeason } from '@type/Tmdb';

@Injectable({
  providedIn: 'root',
})
export class InfoService {
  showService = inject(ShowService);
  tmdbService = inject(TmdbService);
  configService = inject(ConfigService);
  episodeService = inject(EpisodeService);
  injector = inject(Injector);

  getShowsFilteredAndSorted(): Signal<ShowInfo[]> {
    return computed<ShowInfo[]>(() => {
      const episodes = this.episodeService.getEpisodes();
      const showsHidden = this.showService.showsHidden.s();
      const favorites = this.showService.favorites.s();
      const config = this.configService.config.s();

      const showInfos = this.showService.showsWatched
        .s()
        .filter((showWatched) => {
          const show = showWatched.show;
          const showProgress = this.showService.showsProgress.s()[show.ids.trakt];
          return !isShowFiltered(config, show, showProgress, showsHidden);
        })
        .map((showWatched) => {
          const show = showWatched.show;
          const showProgress = this.showService.showsProgress.s()[show.ids.trakt];

          const showInfo = {
            show,
            showWatched,
            showProgress,
            tmdbSeason: this.getTmdbSeason(show, showProgress),
            nextEpisode: this.getNextEpisode(showProgress, episodes, show),
            isFavorite: this.showService.isFavorite(show, favorites),
            isHidden: this.showService.isHidden(show),
          };

          return showInfo;
        });

      sortShows(config, showInfos, episodes);

      return showInfos;
    });
  }

  getTmdbSeason(show: Show, showProgress: ShowProgress | undefined): TmdbSeason | undefined {
    if (!showProgress?.next_episode) return;

    const seasonId = toSeasonId(show.ids.tmdb, showProgress.next_episode.season);
    const tmdbSeason = this.tmdbService.tmdbSeasons.s()[seasonId];
    return tmdbSeason;
  }

  getNextEpisode(
    showProgress: ShowProgress | undefined,
    showEpisodes: Record<string, EpisodeFull | undefined> | undefined,
    show: Show,
  ): EpisodeFull | undefined {
    if (!showProgress?.next_episode || !showEpisodes) return;

    const nextEpisode = showProgress.next_episode;
    const episodeId = toEpisodeId(show.ids.trakt, nextEpisode.season, nextEpisode.number);
    const nextEpisodeFull = showEpisodes[episodeId];
    return nextEpisodeFull;
  }
}
