import { Pipe, PipeTransform } from '@angular/core';

import { EpisodeService } from '@services/trakt/episode.service';

import type { EpisodeInfo } from '@type/interfaces/Show';

@Pipe({
  name: 'episodeTitle',
})
export class EpisodeTitlePipe implements PipeTransform {
  constructor(private episodeService: EpisodeService) {}

  transform(episodeInfo?: EpisodeInfo): string {
    return this.episodeService.getEpisodeTitle(episodeInfo);
  }
}
