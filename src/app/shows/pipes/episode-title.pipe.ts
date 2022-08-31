import { Pipe, PipeTransform } from '@angular/core';
import { EpisodeInfo } from '../../../types/interfaces/Show';
import { EpisodeService } from '../../shared/services/trakt/episode.service';

@Pipe({
  name: 'episodeTitle',
})
export class EpisodeTitlePipe implements PipeTransform {
  constructor(private episodeService: EpisodeService) {}

  transform(episodeInfo: EpisodeInfo): string {
    return this.episodeService.getEpisodeTitle(episodeInfo);
  }
}
