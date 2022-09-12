import { Pipe, PipeTransform } from '@angular/core';

import type { EpisodeInfo } from '@type/interfaces/Show';

export function episodeTitle(episodeInfo?: EpisodeInfo): string {
  if (!episodeInfo) return '';

  const episodeTitle = episodeInfo.episode?.title ?? episodeInfo.tmdbEpisode?.name;

  if (episodeTitle) return episodeTitle;

  return episodeInfo.episodeProgress ? `Episode ${episodeInfo.episodeProgress.number}` : '';
}

@Pipe({
  name: 'episodeTitle',
})
export class EpisodeTitlePipe implements PipeTransform {
  transform(episodeInfo?: EpisodeInfo): string {
    return episodeTitle(episodeInfo);
  }
}
