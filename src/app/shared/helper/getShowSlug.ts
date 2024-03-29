import { Show } from '@type/Trakt';

export function getShowSlug(show: Show | null | undefined): string {
  if (!show) return '';
  if (isNaN(show.ids.slug as unknown as number)) return show.ids.slug;
  return show.ids.trakt + '';
}
