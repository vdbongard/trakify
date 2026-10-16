import { EpisodeFull, Show } from '@type/Trakt';

export function getShowId(show?: Show): string {
  return 'show-' + (show?.ids.slug ?? '');
}

export function getShowWithEpisodeId(show?: Show, episode?: EpisodeFull): string {
  return 'show-' + (show?.ids.slug ?? '') + (episode?.ids.trakt ?? '');
}
