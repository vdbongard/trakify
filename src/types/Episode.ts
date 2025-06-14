import { Episode, EpisodeFull, EpisodeProgress } from '@type/Trakt';
import { TmdbEpisode } from '@type/Tmdb';

export type NextEpisode = [
  EpisodeFull | undefined | null,
  TmdbEpisode | undefined | null,
  EpisodeProgress | undefined | null,
];

export interface CustomEpisode {
  episode: Episode;
  watchedAt?: Date;
}
