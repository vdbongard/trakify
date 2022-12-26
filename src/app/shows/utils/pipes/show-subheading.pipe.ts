import { Pipe, PipeTransform } from '@angular/core';
import { TmdbShow } from '@type/Tmdb';

@Pipe({
  name: 'showSubheading',
  standalone: true,
})
export class ShowSubheadingPipe implements PipeTransform {
  transform(tmdbShow: TmdbShow | undefined | null): string {
    if (!tmdbShow) return ' ';
    let heading = tmdbShow.status;
    if (tmdbShow.networks?.[0]) heading += ' · ' + tmdbShow.networks[0].name;
    return heading;
  }
}
