import { Pipe, PipeTransform } from '@angular/core';
import { SeasonService } from '../../shared/services/trakt/season.service';

@Pipe({
  name: 'seasonTitle',
})
export class SeasonTitlePipe implements PipeTransform {
  constructor(private seasonService: SeasonService) {}

  transform(seasonTitleOrNumber: string | null): string {
    return this.seasonService.getSeasonTitle(seasonTitleOrNumber);
  }
}
