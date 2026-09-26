import {
  Episode,
  EpisodeFull,
  SeasonProgress,
  ShowProgress,
  ShowProgressCompact,
} from '@type/Trakt';
import { TmdbSeason } from '@type/Tmdb';
import { isPast } from 'date-fns';
import { isNextEpisodeOrLater } from '@helper/shows';

/**
 * Sentinel trakt id used by the synthetic episode produced by {@link advanceNextEpisode}.
 * A synthetic episode is a network-free approximation with no real Trakt entry, so its id
 * can never match a real episode; consumers must fall back to season/number when matching.
 */
export const SYNTHETIC_EPISODE_TRAKT_ID = 0;

/**
 * The progress fields shared by the detailed (`ShowProgress`) and overview
 * (`ShowProgressCompact`) stores so mark/unmark mutations apply to both.
 */
export interface MarkWatchedProgress {
  aired: number;
  completed: number;
  next_episode?: Episode | null;
}

export function isDetailedProgress(
  progress: ShowProgress | ShowProgressCompact | undefined,
): progress is ShowProgress {
  return !!progress && 'seasons' in progress;
}

export function advanceNextEpisode(nextEpisode: Episode): Episode {
  return {
    ids: { trakt: SYNTHETIC_EPISODE_TRAKT_ID },
    number: nextEpisode.number + 1,
    season: nextEpisode.season,
    title: null,
  };
}

/** True when `episode` is the same as or earlier than `next` (by season, then number). */
function isSameEpisodeOrEarlier(episode: Episode, next: Episode): boolean {
  return (
    episode.season < next.season ||
    (episode.season === next.season && episode.number <= next.number)
  );
}

export function markEpisodeWatched(progress: MarkWatchedProgress, episode: Episode): void {
  progress.completed++;
  if (progress.completed > progress.aired) progress.aired = progress.completed;
  if (isNextEpisodeOrLater(progress, episode) && progress.next_episode) {
    progress.next_episode = advanceNextEpisode(progress.next_episode);
  }
}

export function unmarkEpisodeWatched(progress: MarkWatchedProgress, episode: Episode): void {
  progress.completed = Math.max(progress.completed - 1, 0);

  // Un-watching the earliest unwatched episode makes it the next episode again; restoring
  // the real episode (with its own metadata) undoes the synthetic advance from
  // `markEpisodeWatched`. Un-watching a later episode leaves the next episode untouched.
  if (progress.next_episode && isSameEpisodeOrEarlier(episode, progress.next_episode)) {
    progress.next_episode = episode;
  }
}

export function getAiredEpisodes(
  showProgress: ShowProgress,
  episode?: EpisodeFull,
  tmdbSeason?: TmdbSeason | null,
  seasonNumber?: number,
): number {
  let airedEpisodesByProgress = 0;

  if (seasonNumber) {
    const season = showProgress.seasons.find((season) => season.number === seasonNumber);
    if (season) airedEpisodesByProgress = season.aired;
  } else {
    // filter out specials season
    for (const season of showProgress.seasons) {
      if (season.number !== 0) airedEpisodesByProgress += season.aired;
    }
  }

  const airedEpisodesByDate = getAiredEpisodesByDate(
    showProgress,
    episode,
    tmdbSeason,
    seasonNumber,
  );

  return Math.max(airedEpisodesByProgress, airedEpisodesByDate);
}

function getAiredEpisodesByDate(
  showProgress: ShowProgress,
  episode?: EpisodeFull,
  tmdbSeason?: TmdbSeason | null,
  seasonNumber?: number,
): number {
  let overallAired = 0;

  let seasonsProgress: SeasonProgress[] = [];
  if (seasonNumber) {
    const seasonProgress = showProgress.seasons.find((season) => season.number === seasonNumber);
    if (seasonProgress) seasonsProgress = [seasonProgress];
  } else {
    // filter out specials season
    seasonsProgress = showProgress.seasons.filter((season) => season.number !== 0);
  }

  for (const seasonProgress of seasonsProgress) {
    // if current episode season
    if (episode?.season === seasonProgress.number && tmdbSeason) {
      const currentSeasonEpisodesAired = tmdbSeason.episodes.filter((episode) =>
        episode.air_date ? isPast(episode.air_date) : false,
      ).length;

      overallAired += currentSeasonEpisodesAired;
      continue;
    }

    // else season progress episode count
    overallAired += seasonProgress.episodes.length;
  }

  return overallAired;
}

export function getAiredEpisodesInSeason(
  seasonEpisodes: EpisodeFull[] | undefined | null,
  seasonProgress: SeasonProgress | undefined | null,
): number {
  const airedEpisodesByDate = seasonEpisodes
    ? seasonEpisodes.filter((seasonEpisode) =>
        seasonEpisode.first_aired ? isPast(seasonEpisode.first_aired) : false,
      ).length
    : 0;

  const airedEpisodesByProgress = seasonProgress ? seasonProgress.aired : 0;

  return Math.max(airedEpisodesByProgress, airedEpisodesByDate);
}

export function getRemainingEpisodes(
  showProgress: ShowProgress | undefined,
  episode: EpisodeFull | undefined,
  tmdbSeason: TmdbSeason | null | undefined,
): number {
  if (!showProgress || showProgress.completed <= 0) return -1;

  return getAiredEpisodes(showProgress, episode, tmdbSeason) - showProgress.completed;
}
