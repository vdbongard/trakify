import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'season0AsSpecials',
})
export class Season0AsSpecialsPipe implements PipeTransform {
  transform(seasonString: string | number): string {
    if (seasonString === 'Season 0') return 'Specials';
    return seasonString as string;
  }
}
