import { Pipe, PipeTransform } from '@angular/core';
import { clamp } from '../../shared/helper/clamp';

@Pipe({
  name: 'getEpisodeNumber',
})
export class GetEpisodeNumberPipe implements PipeTransform {
  transform(episodeNumberString: string, counter: number, max?: number): number {
    const episodeNumber = parseInt(episodeNumberString);

    const newEpisodeNumber = episodeNumber + counter;

    return clamp(newEpisodeNumber, 1, max ?? newEpisodeNumber);
  }
}
