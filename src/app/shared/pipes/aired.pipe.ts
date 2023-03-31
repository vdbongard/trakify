import { Pipe, PipeTransform } from '@angular/core';
import { EpisodeFull, SeasonProgress, ShowProgress } from '@type/Trakt';
import { TmdbSeason } from '@type/Tmdb';
import { isPast } from 'date-fns';

@Pipe({
  name: 'aired',
  standalone: true,
})
export class AiredPipe implements PipeTransform {
  transform(
    showProgress?: ShowProgress | null,
    episode?: EpisodeFull | null,
    tmdbSeason?: TmdbSeason | null
  ): number {
    if (!showProgress || !episode || !tmdbSeason) return -1;
    return getAiredEpisodes(showProgress, episode, tmdbSeason);
  }
}

export function getAiredEpisodes(
  showProgress: ShowProgress,
  episode: EpisodeFull,
  tmdbSeason: TmdbSeason,
  seasonNumber?: number
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
    seasonNumber
  );

  return Math.max(airedEpisodesByProgress, airedEpisodesByDate);
}

function getAiredEpisodesByDate(
  showProgress: ShowProgress,
  episode: EpisodeFull,
  tmdbSeason: TmdbSeason,
  seasonNumber?: number
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
    if (episode.season === seasonProgress.number) {
      const currentSeasonEpisodesAired = tmdbSeason.episodes.filter((episode) =>
        episode.air_date ? isPast(new Date(episode.air_date)) : false
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
  seasonProgress: SeasonProgress | undefined
): number {
  const airedEpisodesByDate = seasonEpisodes
    ? seasonEpisodes.filter((seasonEpisode) =>
        seasonEpisode.first_aired ? isPast(new Date(seasonEpisode.first_aired)) : false
      ).length
    : 0;

  const airedEpisodesByProgress = seasonProgress ? seasonProgress.aired : 0;

  return Math.max(airedEpisodesByProgress, airedEpisodesByDate);
}
