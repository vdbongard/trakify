import type { EpisodeFull } from './Trakt';
import type { TmdbSeason } from './Tmdb';

export type NextEpisodeState =
  | { state: 'unknown' }
  | { state: 'none' }
  | { state: 'pending'; episode: EpisodeFull }
  | { state: 'episode'; episode: EpisodeFull };

export interface SeasonProgressSummary {
  aired: number;
  remaining: number;
}

export interface ShowProgressSummary {
  aired: number | undefined;
  completed: number | undefined;
  remaining: number | undefined;
  nextEpisode: NextEpisodeState;
  seasons: Map<number, SeasonProgressSummary>;
  tmdbSeason: TmdbSeason | undefined;
}
