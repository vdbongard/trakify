import { Pipe, PipeTransform } from '@angular/core';
import { EpisodeFull, ShowProgress } from '@type/Trakt';
import { TmdbSeason } from '@type/Tmdb';
import { isPast } from 'date-fns';

@Pipe({
  name: 'remaining',
  standalone: true,
})
export class RemainingPipe implements PipeTransform {
  transform(showProgress: ShowProgress, episode: EpisodeFull, tmdbSeason: TmdbSeason): number {
    return getRemainingEpisodes(showProgress, episode, tmdbSeason);
  }
}

export function getRemainingEpisodes(
  showProgress: ShowProgress,
  episode: EpisodeFull,
  tmdbSeason: TmdbSeason
): number {
  if (!showProgress || showProgress.completed <= 0) return 0;

  const airedEpisodesByProgress = showProgress.aired;
  const airedEpisodesByDate = getAiredEpisodesByDate(showProgress, episode, tmdbSeason);

  const airedEpisodes = Math.max(airedEpisodesByProgress, airedEpisodesByDate);

  return airedEpisodes - showProgress.completed;
}

export function getAiredEpisodesByDate(
  showProgress: ShowProgress,
  episode: EpisodeFull,
  tmdbSeason: TmdbSeason
): number {
  let overallAired = 0;

  // filter out specials season
  const seasonsProgress = showProgress.seasons.filter((season) => season.number !== 0);

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
