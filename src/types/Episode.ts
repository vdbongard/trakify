import { Episode, EpisodeFull, EpisodeProgress, Show } from '@type/Trakt';
import { TmdbEpisode } from '@type/Tmdb';

export type NextEpisode = [EpisodeFull | null, TmdbEpisode | null, EpisodeProgress | null];

export interface CustomEpisode {
  episode: Episode;
  watchedAt?: Date;
}

export interface EpisodeInfo {
  show: Show;
  tmdbEpisode?: TmdbEpisode | null;
}
