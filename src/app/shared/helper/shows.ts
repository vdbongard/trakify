import { EpisodeFull, ShowHidden, ShowProgress, TraktShow } from '../../../types/interfaces/Trakt';
import { TmdbShow } from '../../../types/interfaces/Tmdb';
import { episodeId } from './episodeId';
import { ShowInfo } from '../../../types/interfaces/Show';
import { Config as IConfig } from '../../../types/interfaces/Config';
import { Filter, Sort, SortOptions } from '../../../types/enum';

export function filterShows(
  config: IConfig,
  showProgress: ShowProgress | undefined,
  tmdbShow: TmdbShow | undefined,
  showsHidden: ShowHidden[],
  show: TraktShow
): boolean {
  for (const filter of config.filters.filter((filter) => filter.value)) {
    switch (filter.name) {
      case Filter.NO_NEW_EPISODES:
        if (hideNoNewEpisodes(showProgress)) return true;
        break;
      case Filter.COMPLETED:
        if (hideCompleted(showProgress, tmdbShow)) return true;
        break;
      case Filter.HIDDEN:
        if (hideHidden(showsHidden, show.ids.trakt)) return true;
        break;
    }
  }
  return false;
}

export function sortShows(
  config: IConfig,
  shows: ShowInfo[],
  showsEpisodes: { [episodeId: string]: EpisodeFull }
): void {
  switch (config.sort.by) {
    case Sort.NEWEST_EPISODE:
      shows.sort((a, b) => sortByNewestEpisode(a, b, showsEpisodes));
      break;
    case Sort.LAST_WATCHED:
      break;
  }

  switch (config.sortOptions.find((sortOption) => sortOption.value)?.name) {
    case SortOptions.FAVORITES_FIRST:
      shows.sort((a, b) => sortFavoritesFirst(a, b));
      break;
  }
}

function hideHidden(showsHidden: ShowHidden[], showId: number): boolean {
  return !!showsHidden.find((show) => show.show.ids.trakt === showId);
}

function hideNoNewEpisodes(showProgress: ShowProgress | undefined): boolean {
  return !!showProgress && showProgress.aired === showProgress.completed;
}

function hideCompleted(
  showProgress: ShowProgress | undefined,
  tmdbShow: TmdbShow | undefined
): boolean {
  return (
    !!showProgress &&
    !!tmdbShow &&
    ['Ended', 'Canceled'].includes(tmdbShow.status) &&
    showProgress.aired === showProgress.completed
  );
}

function sortByNewestEpisode(
  a: ShowInfo,
  b: ShowInfo,
  showsEpisodes: { [episodeId: string]: EpisodeFull }
): number {
  const nextEpisodeA =
    a.nextEpisode &&
    showsEpisodes[episodeId(a.show?.ids.trakt, a.nextEpisode.season, a.nextEpisode.number)];
  const nextEpisodeB =
    b.nextEpisode &&
    showsEpisodes[episodeId(b.show?.ids.trakt, b.nextEpisode.season, b.nextEpisode.number)];
  if (!nextEpisodeA) return 1;
  if (!nextEpisodeB) return -1;
  return (
    new Date(nextEpisodeB.first_aired).getTime() - new Date(nextEpisodeA.first_aired).getTime()
  );
}

function sortFavoritesFirst(a: ShowInfo, b: ShowInfo): number {
  return a.isFavorite && !b.isFavorite ? -1 : 1;
}
