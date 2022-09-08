import { Pipe, PipeTransform } from '@angular/core';

import type { EpisodeInfo } from '@type/interfaces/Show';

export function episodeTitle(episodeInfo?: EpisodeInfo): string {
  if (
    !episodeInfo ||
    !episodeInfo.episode ||
    !episodeInfo.tmdbEpisode ||
    !episodeInfo.episodeProgress
  )
    return '';
  return (
    episodeInfo.episode.title ??
    episodeInfo.tmdbEpisode.name ??
    'Episode ' + episodeInfo.episodeProgress.number
  );
}

@Pipe({
  name: 'episodeTitle',
})
export class EpisodeTitlePipe implements PipeTransform {
  transform(episodeInfo?: EpisodeInfo): string {
    return episodeTitle(episodeInfo);
  }
}
