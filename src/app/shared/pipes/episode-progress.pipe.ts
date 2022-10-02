import { Pipe, PipeTransform } from '@angular/core';
import { Episode, EpisodeProgress } from '@type/interfaces/Trakt';

@Pipe({
  name: 'episodeProgress',
})
export class EpisodeProgressPipe implements PipeTransform {
  transform(episodesProgress?: EpisodeProgress[], episode?: Episode): EpisodeProgress | undefined {
    if (!episodesProgress || !episode) return;
    return episodesProgress.find((episodeProgress) => episodeProgress.number === episode.number);
  }
}
