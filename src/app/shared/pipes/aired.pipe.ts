import { Pipe, PipeTransform } from '@angular/core';
import { EpisodeFull, ShowProgress } from '@type/Trakt';
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
  tmdbSeason: TmdbSeason
): number {
  const airedEpisodesByProgress = showProgress.aired;
  const airedEpisodesByDate = getAiredEpisodesByDate(showProgress, episode, tmdbSeason);

  return Math.max(airedEpisodesByProgress, airedEpisodesByDate);
}

function getAiredEpisodesByDate(
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
