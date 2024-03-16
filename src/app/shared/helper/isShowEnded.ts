import type { TmdbShow } from '@type/Tmdb';

export function isShowEnded(tmdbShow: TmdbShow | null | undefined): boolean {
  if (!tmdbShow) return false;
  return ['Ended', 'Canceled'].includes(tmdbShow.status);
}
