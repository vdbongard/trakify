import { Pipe, PipeTransform } from '@angular/core';
import { clamp } from '../../shared/helper/clamp';

@Pipe({
  name: 'getEpisodeNumber',
})
export class GetEpisodeNumberPipe implements PipeTransform {
  transform(episodeNumberString: string | null, counter: number, max?: number): number {
    const episodeNumber = parseInt(episodeNumberString ?? '');

    if (isNaN(episodeNumber)) throw Error('Episode number not found');

    const newEpisodeNumber = episodeNumber + counter;

    return clamp(newEpisodeNumber, 1, max ?? newEpisodeNumber);
  }
}
