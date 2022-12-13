import { Pipe, PipeTransform } from '@angular/core';
import { Episode } from '@type/interfaces/Trakt';
import { TmdbEpisode } from '@type/interfaces/Tmdb';

export function episodeTitle(
  episode?: Episode | null,
  episodeNumber?: number,
  tmdbEpisode?: TmdbEpisode | null
): string {
  if (episode?.title) return episode.title;
  if (tmdbEpisode?.name) return tmdbEpisode.name;
  if (episodeNumber) return `Episode ${episodeNumber}`;
  return '';
}

@Pipe({
  name: 'episodeTitle',
  standalone: true,
})
export class EpisodeTitlePipe implements PipeTransform {
  transform(
    episode?: Episode | null,
    episodeNumber?: number,
    tmdbEpisode?: TmdbEpisode | null
  ): string {
    return episodeTitle(episode, episodeNumber, tmdbEpisode);
  }
}
