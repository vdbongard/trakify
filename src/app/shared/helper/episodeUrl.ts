import { getShowSlug } from '@helper/getShowSlug';
import type { Episode, Show } from '@type/Trakt';

const EPISODE_URL = /\/shows\/s\/([^/]+)\/season\/(\d+)\/episode\/(\d+)/;

export interface EpisodeUrlTarget {
  showSlug: string;
  season: number;
  number: number;
}

/** The Episode an Episode page URL points at, if it points at one. */
export function episodeUrlTarget(url: string): EpisodeUrlTarget | undefined {
  const match = EPISODE_URL.exec(url);
  if (!match) return undefined;

  const [, showSlug, season, number] = match;
  return { showSlug, season: Number(season), number: Number(number) };
}

/**
 * Whether `url` is the Episode page of this Episode of this Show. Used to name the artwork of the
 * view a navigation came back to: a back navigation carries no Episode, so the URL that was left is
 * the only record of where the reader came from.
 */
export function isEpisodeUrl(
  url: string,
  show: Show | undefined,
  episode: Pick<Episode, 'season' | 'number'> | undefined,
): boolean {
  const target = episodeUrlTarget(url);
  if (!target || !episode) return false;

  return (
    target.showSlug === getShowSlug(show) &&
    target.season === episode.season &&
    target.number === episode.number
  );
}
