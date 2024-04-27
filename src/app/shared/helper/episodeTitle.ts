import type { TmdbEpisode } from '@type/Tmdb';
import type { Episode } from '@type/Trakt';

export function episodeTitle(
  episode?: Episode | null,
  episodeNumber?: number,
  tmdbEpisode?: TmdbEpisode | null,
): string {
  if (episode?.title) return episode.title;
  if (tmdbEpisode?.name) return tmdbEpisode.name;
  if (episodeNumber) return `Episode ${episodeNumber}`;
  return '';
}
