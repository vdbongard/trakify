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
  nextEpisode?: EpisodeFull;
  nextEpisodeProgress?: EpisodeProgress;
  tmdbNextEpisode?: TmdbEpisode;
  showWatched?: ShowWatched;
}

export interface SeasonInfo {
  seasonProgress?: SeasonProgress;
  seasonNumber?: number;
  show?: TraktShow;
  episodes?: (EpisodeFull | undefined)[];
}

export interface EpisodeInfo {
  episodeProgress?: EpisodeProgress;
  show?: TraktShow;
  episode?: EpisodeFull;
  tmdbEpisode?: TmdbEpisode;
}
