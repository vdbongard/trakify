import { Pipe, PipeTransform } from '@angular/core';

import type { TmdbShow } from '@type/interfaces/Tmdb';

export function isShowEnded(tmdbShow?: TmdbShow): boolean {
  if (!tmdbShow) return false;
  return ['Ended', 'Canceled'].includes(tmdbShow.status);
}

@Pipe({
  name: 'isShowEnded',
})
export class IsShowEndedPipe implements PipeTransform {
  transform(tmdbShow?: TmdbShow): boolean {
    return isShowEnded(tmdbShow);
  }
}
