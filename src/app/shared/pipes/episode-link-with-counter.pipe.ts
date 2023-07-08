import { Pipe, PipeTransform } from '@angular/core';

import { clamp } from '@helper/clamp';
import { episode } from '@shared/paths';

@Pipe({
  name: 'episodeLinkWithCounter',
  standalone: true,
})
export class EpisodeLinkWithCounterPipe implements PipeTransform {
  transform(
    params: { show?: string; season?: string; episode?: string },
    counter: number,
    max?: number,
  ): string {
    if (!params.episode || !params.season || !params.show) return '';

    const episodeNumber = parseInt(params.episode);

    if (isNaN(episodeNumber)) throw Error('Episode number not found (EpisodeLinkWithCounterPipe)');

    const episodeNumberWithCounter = episodeNumber + counter;

    const newEpisodeNumber = clamp(
      episodeNumberWithCounter,
      1,
      max ?? (Math.abs(episodeNumberWithCounter) || 1),
    );

    return episode({
      show: params.show,
      season: params.season,
      episode: newEpisodeNumber + '',
    });
  }
}
