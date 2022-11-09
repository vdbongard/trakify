import { Pipe, PipeTransform } from '@angular/core';
import { clamp } from '@helper/clamp';
import { season } from '../paths';

@Pipe({
  name: 'seasonLinkWithCounter',
  standalone: true,
})
export class SeasonLinkWithCounterPipe implements PipeTransform {
  transform(
    params: { show?: string | null; season?: string | null },
    counter: number,
    numbers: { number: number }[]
  ): string {
    if (!params.season || !params.show || !numbers[0]) return '';

    const seasonNumber = parseInt(params.season);

    if (isNaN(seasonNumber)) throw Error('Season number not found (EpisodeLinkWithCounterPipe)');

    const seasonNumberWithCounter = seasonNumber + counter;

    const newSeasonNumber = clamp(
      seasonNumberWithCounter,
      numbers.at(0)!.number,
      numbers.at(-1)!.number
    );

    return season({
      show: params.show,
      season: newSeasonNumber + '',
    });
  }
}
