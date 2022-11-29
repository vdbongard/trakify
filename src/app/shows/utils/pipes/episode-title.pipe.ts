import { Pipe, PipeTransform } from '@angular/core';
import { Episode } from '@type/interfaces/Trakt';

export function episodeTitle(episode?: Episode | null, episodeNumber?: number): string {
  if (!episode) return '';

  const episodeTitle = episode?.title;

  if (episodeTitle) return episodeTitle;

  return episodeNumber ? `Episode ${episodeNumber}` : '';
}

@Pipe({
  name: 'episodeTitle',
  standalone: true,
})
export class EpisodeTitlePipe implements PipeTransform {
  transform(episode?: Episode | null, episodeNumber?: number): string {
    return episodeTitle(episode, episodeNumber);
  }
}
