import type { TmdbSeason } from '@type/Tmdb';
import type { EpisodeFull, SeasonProgress, ShowProgress } from '@type/Trakt';
import { isPast } from 'date-fns';

export function getAiredEpisodes(
  showProgress: ShowProgress,
  episode: EpisodeFull | undefined,
  tmdbSeason: TmdbSeason | undefined | null,
  seasonNumber?: number,
): number {
  let airedEpisodesByProgress = 0;

  if (seasonNumber) {
    const season = showProgress.seasons.find((season) => season.number === seasonNumber);
    if (season) airedEpisodesByProgress = season.aired;
  } else {
    airedEpisodesByProgress = showProgress.aired;
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
  episode: EpisodeFull | undefined,
  tmdbSeason: TmdbSeason | undefined | null,
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
