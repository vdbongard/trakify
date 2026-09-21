import { mockShow } from './mockShow';
import type { Show, ShowProgressCompact } from '@type/Trakt';

/** Builds a minimal watched/hidden show entry with a predictable trakt id. */
export function makeShow(id: number, title: string): Show {
  return {
    ...mockShow,
    title,
    ids: { ...mockShow.ids, trakt: id, slug: `show-${id}`, tmdb: id },
  };
}

/** Builds a minimal overview (compact) progress entry. */
export function makeCompact(aired: number, completed: number): ShowProgressCompact {
  return {
    aired,
    completed,
    last_episode: null,
    last_watched_at: null,
    next_episode: null,
    reset_at: null,
  };
}
