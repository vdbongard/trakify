import { Pipe, PipeTransform } from '@angular/core';

import type { Episode } from '@type/Trakt';

@Pipe({
  name: 'episodeTitleWithIndex',
  standalone: true,
})
export class EpisodeTitleWithIndexPipe implements PipeTransform {
  transform(episode: Episode | undefined, i: number): string {
    return episode?.title && episode?.number !== undefined
      ? episode.title + ' (' + episode.number + ')'
      : 'Episode ' + ((episode?.number ?? i) + 1);
  }
}
