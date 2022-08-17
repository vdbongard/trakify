import {
  EpisodeFull,
  EpisodeProgress,
  Season,
  SeasonProgress,
  ShowProgress,
  ShowWatched,
  Show,
} from './Trakt';
import { TmdbEpisode, TmdbSeason, TmdbShow } from './Tmdb';

export interface ShowInfo {
  show?: Show;
  tmdbShow?: TmdbShow;
  tmdbSeason?: TmdbSeason | null;
  showProgress?: ShowProgress;
  isFavorite?: boolean;
  isWatchlist?: boolean;
  nextEpisode?: EpisodeFull | null;
  nextEpisodeProgress?: EpisodeProgress;
  tmdbNextEpisode?: TmdbEpisode | null;
  showWatched?: ShowWatched;
}

export interface SeasonInfo {
  seasonProgress?: SeasonProgress;
  show?: Show;
  seasons?: Season[];
  episodes?: EpisodeFull[];
}

export interface EpisodeInfo {
  episodeProgress?: EpisodeProgress;
  show?: Show;
  episode?: EpisodeFull | null;
  tmdbEpisode?: TmdbEpisode | null;
}
