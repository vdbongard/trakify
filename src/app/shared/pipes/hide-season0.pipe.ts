import { Pipe, PipeTransform } from '@angular/core';
import { Season } from '../../../types/interfaces/Tmdb';

@Pipe({
  name: 'hideSeason0',
})
export class HideSeason0Pipe implements PipeTransform {
  transform(value: Season[]): Season[] {
    return value.filter((season) => season.season_number !== 0);
  }
}
