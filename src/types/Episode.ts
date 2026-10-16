import { Episode, EpisodeFull, EpisodeProgress, Show } from '@type/Trakt';
import { TmdbEpisode } from '@type/Tmdb';

export type NextEpisode = [EpisodeFull | null, TmdbEpisode | null, EpisodeProgress | null];

export interface CustomEpisode {
  episode: Episode;
  watchedAt?: Date;
}

/** What a view that links to the Episode page already knows about the Episode, passed through the
 *  navigation state. It lets the page render its header and the still's slot on the first pass,
 *  before its own requests land — and so before a view transition captures the new view. */
export interface EpisodeInfo {
  episode: Episode;
  show: Show;
  tmdbEpisode?: TmdbEpisode | null;
}
