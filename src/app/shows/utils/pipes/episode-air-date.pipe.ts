import { Pipe, PipeTransform } from '@angular/core';

import type { EpisodeFull } from '@type/interfaces/Trakt';

@Pipe({
  name: 'airDate',
  standalone: true,
})
export class AirDatePipe implements PipeTransform {
  transform(episode: EpisodeFull | undefined): Date {
    return new Date(episode?.first_aired + '');
  }
}
