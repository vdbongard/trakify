import { Pipe, PipeTransform } from '@angular/core';
import { Episode, EpisodeProgress } from '@type/interfaces/Trakt';
import { TmdbEpisode } from '@type/interfaces/Tmdb';

export function episodeTitle(
  episode?: Episode | null,
  tmdbEpisode?: TmdbEpisode | null,
  episodeProgress?: EpisodeProgress
): string {
  const episodeTitle = episode?.title ?? tmdbEpisode?.name;

  if (episodeTitle) return episodeTitle;

  return episodeProgress ? `Episode ${episodeProgress.number}` : '';
}

@Pipe({
  name: 'episodeTitle',
})
export class EpisodeTitlePipe implements PipeTransform {
  transform(
    episode?: Episode | null,
    tmdbEpisode?: TmdbEpisode | null,
    episodeProgress?: EpisodeProgress
  ): string {
    return episodeTitle(episode, tmdbEpisode, episodeProgress);
  }
}
