import { Pipe, PipeTransform } from '@angular/core';

import type { Episode } from '@type/interfaces/Trakt';

@Pipe({
  name: 'episodeTitleWithIndex',
})
export class EpisodeTitleWithIndexPipe implements PipeTransform {
  transform(episode: Episode | undefined, i: number): string {
    return episode?.title && episode?.number !== undefined
      ? episode.title + ' (' + episode.number + ')'
      : 'Episode ' + (i + 1);
  }
}
