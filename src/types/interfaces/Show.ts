import {
  EpisodeFull,
  EpisodeProgress,
  SeasonProgress,
  ShowProgress,
  ShowWatched,
  TraktShow,
} from './Trakt';
import { TmdbEpisode, TmdbShow } from './Tmdb';

export interface ShowInfo {
  show?: TraktShow;
  tmdbShow?: TmdbShow;
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
  show?: TraktShow;
  episodes?: EpisodeFull[];
}

export interface EpisodeInfo {
  episodeProgress?: EpisodeProgress;
  show?: TraktShow;
  episode?: EpisodeFull | null;
  tmdbEpisode?: TmdbEpisode | null;
}
