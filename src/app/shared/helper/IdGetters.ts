import { EpisodeFull, Show } from '@type/Trakt';

export function getShowId(show: Show | null | undefined): string {
  return 'show-' + (show?.ids.slug ?? '');
}

export function getShowWithEpisodeId(
  show: Show | null | undefined,
  episode: EpisodeFull | null | undefined,
): string {
  return 'show-' + (show?.ids.slug ?? '') + (episode?.ids.trakt ?? '');
}
