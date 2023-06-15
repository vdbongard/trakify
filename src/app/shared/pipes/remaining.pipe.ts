import { Pipe, PipeTransform } from '@angular/core';
import { EpisodeFull, ShowProgress } from '@type/Trakt';
import { TmdbSeason } from '@type/Tmdb';
import { getAiredEpisodes } from '@helper/airedEpisodes';

@Pipe({
  name: 'remaining',
  standalone: true,
})
export class RemainingPipe implements PipeTransform {
  transform(
    showProgress?: ShowProgress | null,
    episode?: EpisodeFull | null,
    tmdbSeason?: TmdbSeason | null
  ): number {
    if (!showProgress || !episode || !tmdbSeason) return -1;
    return getRemainingEpisodes(showProgress, episode, tmdbSeason);
  }
}

export function getRemainingEpisodes(
  showProgress: ShowProgress,
  episode: EpisodeFull,
  tmdbSeason: TmdbSeason
): number {
  if (!showProgress || showProgress.completed <= 0) return -1;

  return getAiredEpisodes(showProgress, episode, tmdbSeason) - showProgress.completed;
}
