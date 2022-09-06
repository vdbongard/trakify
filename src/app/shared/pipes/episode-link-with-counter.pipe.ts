import { Pipe, PipeTransform } from '@angular/core';
import { Params } from '@angular/router';

import { clamp } from '@helper/clamp';

@Pipe({
  name: 'episodeLinkWithCounter',
})
export class EpisodeLinkWithCounterPipe implements PipeTransform {
  transform(params: Params, counter: number, max?: number): string {
    const episodeNumber = parseInt(params['episode'] ?? '');

    if (isNaN(episodeNumber)) throw Error('Episode number not found');

    const episodeNumberWithCounter = episodeNumber + counter;

    const newEpisodeNumber = clamp(
      episodeNumberWithCounter,
      1,
      max ?? (episodeNumberWithCounter || 1)
    );

    return `/series/s/${params['slug']}/season/${params['season']}/episode/${newEpisodeNumber}`;
  }
}
