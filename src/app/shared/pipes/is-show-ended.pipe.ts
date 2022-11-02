import { Pipe, PipeTransform } from '@angular/core';

import type { TmdbShow } from '@type/interfaces/Tmdb';

export function isShowEnded(tmdbShow?: TmdbShow | null): boolean {
  if (!tmdbShow) return false;
  return ['Ended', 'Canceled'].includes(tmdbShow.status);
}

@Pipe({
  name: 'isShowEnded',
  standalone: true,
})
export class IsShowEndedPipe implements PipeTransform {
  transform(tmdbShow?: TmdbShow | null): boolean {
    return isShowEnded(tmdbShow);
  }
}
