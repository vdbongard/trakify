import { Episode, EpisodeFull, EpisodeProgress } from '@type/Trakt';
import { TmdbEpisode } from '@type/Tmdb';

export type NextEpisode = [EpisodeFull | null, TmdbEpisode | null, EpisodeProgress | null];

export interface CustomEpisode {
  episode: Episode;
  watchedAt?: Date;
}
