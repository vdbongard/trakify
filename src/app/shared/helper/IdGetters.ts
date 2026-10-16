import { Episode, Show } from '@type/Trakt';

export function getShowId(show?: Show): string {
  return 'show-' + (show?.ids.slug ?? '');
}

/** The identity of an Episode within its Show. Also used as a view transition name, which is why it
 *  takes any Episode shape: it only reads the ids, and both sides of a navigation must agree. */
export function getShowWithEpisodeId(show?: Show, episode?: Episode): string {
  return 'show-' + (show?.ids.slug ?? '') + (episode?.ids.trakt ?? '');
}
