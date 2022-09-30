import { Pipe, PipeTransform } from '@angular/core';
import { clamp } from '@helper/clamp';
import { season } from '../../paths';

@Pipe({
  name: 'seasonLinkWithCounter',
})
export class SeasonLinkWithCounterPipe implements PipeTransform {
  transform(
    params: { show?: string | null; season?: string | null },
    counter: number,
    max?: number
  ): string {
    if (!params.season || !params.show) return '';

    const seasonNumber = parseInt(params.season);

    if (isNaN(seasonNumber)) throw Error('Season number not found (EpisodeLinkWithCounterPipe)');

    const seasonNumberWithCounter = seasonNumber + counter;

    const newSeasonNumber = clamp(
      seasonNumberWithCounter,
      1,
      max ?? (seasonNumberWithCounter || 1)
    );

    return season({
      show: params.show,
      season: newSeasonNumber + '',
    });
  }
}
