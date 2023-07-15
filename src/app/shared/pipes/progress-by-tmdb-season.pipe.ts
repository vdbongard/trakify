import { Pipe, PipeTransform } from '@angular/core';
import { SeasonProgress, ShowProgress } from '@type/Trakt';

@Pipe({
  name: 'seasonProgressBySeasonNumber',
  standalone: true,
})
export class SeasonProgressBySeasonNumberPipe implements PipeTransform {
  transform(
    showProgress: ShowProgress | null | undefined,
    seasonNumber: number,
  ): SeasonProgress | undefined {
    return showProgress?.seasons.find((season) => season.number === seasonNumber);
  }
}
