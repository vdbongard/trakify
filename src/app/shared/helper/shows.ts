import { toEpisodeId } from './toShowId';
import { Filter, Sort, SortOptions } from '@type/Enum';
import type { EpisodeFull, Show, ShowHidden, ShowProgress, ShowProgressCompact } from '@type/Trakt';
import { Episode } from '@type/Trakt';
import type { ShowInfo } from '@type/Show';
import type { Config } from '@type/Config';
import type { MarkWatchedProgress } from '@helper/episodes';

export function isShowFiltered(
  config: Config,
  show: Show,
  showProgress: ShowProgress | ShowProgressCompact | undefined,
  showsHidden: ShowHidden[],
): boolean {
  for (const filter of config.filters.filter((filter) => filter.value)) {
    switch (filter.name) {
      case Filter.NO_NEW_EPISODES:
        if (
          filter.category === 'hide'
            ? hasNoNewEpisodes(showProgress)
            : !hasNoNewEpisodes(showProgress)
        )
          return true;
        break;
      case Filter.HIDDEN:
        if (
          filter.category === 'hide'
            ? isHidden(showsHidden, show.ids.trakt)
            : !isHidden(showsHidden, show.ids.trakt)
        )
          return true;
        break;
    }
  }
  return false;
}

export function sortShows(
  config: Config,
  shows: ShowInfo[],
  showsEpisodes: Record<string, EpisodeFull | undefined>,
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
    case Sort.FIRST_AIRED:
      shows.sort(sortByFirstAired);
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

function isHidden(showsHidden: ShowHidden[], showId: number): boolean {
  return showsHidden.some((show) => show.show.ids.trakt === showId);
}

function hasNoNewEpisodes(showProgress: ShowProgress | ShowProgressCompact | undefined): boolean {
  if (!showProgress) return false;
  if (showProgress.next_episode?.season === 0) return true;
  return showProgress.aired <= showProgress.completed;
}

function sortByNewestEpisode(
  a: ShowInfo,
  b: ShowInfo,
  showsEpisodes: Record<string, EpisodeFull | undefined>,
): number {
  const nextEpisodeA = getNextEpisode(a, showsEpisodes);
  if (!nextEpisodeA?.first_aired) return 1;
  const nextEpisodeB = getNextEpisode(b, showsEpisodes);
  if (!nextEpisodeB?.first_aired) return -1;
  return (
    new Date(nextEpisodeB.first_aired).getTime() - new Date(nextEpisodeA.first_aired).getTime()
  );
}

function sortByOldestEpisode(
  a: ShowInfo,
  b: ShowInfo,
  showsEpisodes: Record<string, EpisodeFull | undefined>,
): number {
  const nextEpisodeA = getNextEpisode(a, showsEpisodes);
  if (!nextEpisodeA?.first_aired) return 1;
  const nextEpisodeB = getNextEpisode(b, showsEpisodes);
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

function sortByFirstAired(a: ShowInfo, b: ShowInfo): number {
  const firstAiredA = a.tmdbShow?.first_air_date && new Date(a.tmdbShow.first_air_date);
  if (!firstAiredA) return 1;
  const firstAiredB = b.tmdbShow?.first_air_date && new Date(b.tmdbShow.first_air_date);
  if (!firstAiredB) return -1;
  return firstAiredA < firstAiredB ? 1 : -1;
}

function sortFavoritesFirst(a: ShowInfo, b: ShowInfo): number {
  return a.isFavorite && !b.isFavorite ? -1 : 1;
}

export function isNextEpisodeOrLater(showProgress: MarkWatchedProgress, episode: Episode): boolean {
  if (!showProgress.next_episode) return false;

  const nextEpisode = showProgress.next_episode;
  const isDirectlyNextEpisode =
    nextEpisode.ids?.trakt === episode.ids?.trakt ||
    (nextEpisode.season === episode.season && nextEpisode.number === episode.number);
  const isLaterThanNextEpisode =
    (episode.season === nextEpisode.season && episode.number > nextEpisode.number) ||
    episode.season > nextEpisode.season;

  return isDirectlyNextEpisode || isLaterThanNextEpisode;
}

function getNextEpisode(
  showInfo: ShowInfo,
  showsEpisodes: Record<string, EpisodeFull | undefined>,
): EpisodeFull | undefined {
  return (
    showInfo.nextEpisode &&
    showsEpisodes[
      toEpisodeId(
        showInfo.show?.ids.trakt,
        showInfo.nextEpisode.season,
        showInfo.nextEpisode.number,
      )
    ]
  );
}
