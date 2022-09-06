import { Pipe, PipeTransform } from '@angular/core';

import type { EpisodeFull } from '@type/interfaces/Trakt';

@Pipe({
  name: 'airDate',
})
export class AirDatePipe implements PipeTransform {
  transform(episode: EpisodeFull | undefined): Date {
    if (!episode?.first_aired) return new Date(0);
    return new Date(episode.first_aired);
  }
}
