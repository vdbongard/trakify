import { episodeId } from './episodeId';

import { Filter, Sort, SortOptions } from '@type/enum';

import type { EpisodeFull, Show, ShowHidden, ShowProgress } from '@type/interfaces/Trakt';
import type { TmdbShow } from '@type/interfaces/Tmdb';
import type { ShowInfo } from '@type/interfaces/Show';
import type { Config } from '@type/interfaces/Config';
import { isShowEnded } from '../shared/pipes/is-show-ended.pipe';

export function isShowFiltered(
  config: Config,
  show: Show,
  showProgress: ShowProgress | undefined,
  tmdbShow: TmdbShow | undefined,
  showsHidden: ShowHidden[] | undefined
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
  config: Config,
  shows: ShowInfo[],
  showsEpisodes: { [episodeId: string]: EpisodeFull | undefined }
): void {
  switch (config.sort.by) {
    case Sort.NEWEST_EPISODE:
      shows.sort((a, b) => sortByNewestEpisode(a, b, showsEpisodes));
      break;
    case Sort.OLDEST_EPISODE:
      shows.sort((a, b) => sortByOldestEpisode(a, b, showsEpisodes));
      break;
    case Sort.EPISODE_PROGRESS:
      shows.sort(sortByShowProgress);
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

function hideHidden(showsHidden: ShowHidden[] | undefined, showId: number): boolean {
  return !!showsHidden?.find((show) => show.show.ids.trakt === showId);
}

function hideNoNewEpisodes(showProgress: ShowProgress | undefined): boolean {
  return !!showProgress && showProgress.aired === showProgress.completed;
}

function hideCompleted(
  showProgress: ShowProgress | undefined,
  tmdbShow: TmdbShow | undefined
): boolean {
  return !!showProgress && showProgress.aired === showProgress.completed && isShowEnded(tmdbShow);
}

function sortByNewestEpisode(
  a: ShowInfo,
  b: ShowInfo,
  showsEpisodes: { [episodeId: string]: EpisodeFull | undefined }
): number {
  const nextEpisodeA =
    a.nextEpisode &&
    showsEpisodes[episodeId(a.show?.ids.trakt, a.nextEpisode.season, a.nextEpisode.number)];
  if (!nextEpisodeA?.first_aired) return 1;
  const nextEpisodeB =
    b.nextEpisode &&
    showsEpisodes[episodeId(b.show?.ids.trakt, b.nextEpisode.season, b.nextEpisode.number)];
  if (!nextEpisodeB?.first_aired) return -1;
  return (
    new Date(nextEpisodeB.first_aired).getTime() - new Date(nextEpisodeA.first_aired).getTime()
  );
}

function sortByOldestEpisode(
  a: ShowInfo,
  b: ShowInfo,
  showsEpisodes: { [episodeId: string]: EpisodeFull | undefined }
): number {
  const nextEpisodeA =
    a.nextEpisode &&
    showsEpisodes[episodeId(a.show?.ids.trakt, a.nextEpisode.season, a.nextEpisode.number)];
  if (!nextEpisodeA?.first_aired) return 1;
  const nextEpisodeB =
    b.nextEpisode &&
    showsEpisodes[episodeId(b.show?.ids.trakt, b.nextEpisode.season, b.nextEpisode.number)];
  if (!nextEpisodeB?.first_aired) return -1;
  return (
    new Date(nextEpisodeA.first_aired).getTime() - new Date(nextEpisodeB.first_aired).getTime()
  );
}

function sortByShowProgress(a: ShowInfo, b: ShowInfo): number {
  const progressA = a.showProgress && a.showProgress.completed / a.showProgress.aired;
  if (!progressA) return 1;
  const progressB = b.showProgress && b.showProgress.completed / b.showProgress.aired;
  if (!progressB) return -1;
  return progressA - progressB;
}

function sortFavoritesFirst(a: ShowInfo, b: ShowInfo): number {
  return a.isFavorite && !b.isFavorite ? -1 : 1;
}
