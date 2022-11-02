import { Pipe, PipeTransform } from '@angular/core';
import { Episode, EpisodeProgress } from '@type/interfaces/Trakt';

@Pipe({
  name: 'episodeProgress',
  standalone: true,
})
export class EpisodeProgressPipe implements PipeTransform {
  transform(episodesProgress?: EpisodeProgress[], episode?: Episode): EpisodeProgress | undefined {
    if (!episodesProgress || !episode) return;
    return episodesProgress.find((episodeProgress) => episodeProgress.number === episode.number);
  }
}
