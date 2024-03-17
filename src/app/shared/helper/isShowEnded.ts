import type { TmdbShow } from '@type/Tmdb';

export function isShowEnded(tmdbShow: TmdbShow): boolean {
  return ['Ended', 'Canceled'].includes(tmdbShow.status);
}
