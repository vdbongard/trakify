import { Pipe, PipeTransform } from '@angular/core';

export function seasonTitle(seasonTitleOrNumber: string | null): string {
  if (!seasonTitleOrNumber) throw Error('Empty season title');
  if (seasonTitleOrNumber === 'Season 0') return 'Specials';
  return seasonTitleOrNumber;
}

@Pipe({
  name: 'seasonTitle',
})
export class SeasonTitlePipe implements PipeTransform {
  transform(seasonTitleOrNumber: string | null): string {
    return seasonTitle(seasonTitleOrNumber);
  }
}
