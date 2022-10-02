import { Episode, EpisodeFull, EpisodeProgress, Show, ShowProgress, ShowWatched } from './Trakt';
import { TmdbEpisode, TmdbSeason, TmdbShow } from './Tmdb';

export interface ShowInfo {
  show?: Show;
  tmdbShow?: TmdbShow;
  tmdbSeason?: TmdbSeason | null;
  showProgress?: ShowProgress;
  isFavorite?: boolean;
  isWatchlist?: boolean;
  nextEpisode?: EpisodeFull;
  nextEpisodeProgress?: EpisodeProgress;
  tmdbNextEpisode?: TmdbEpisode | null;
  showWatched?: ShowWatched;
}

export interface AddToHistoryParams {
  episode: Episode | null;
  show: Show | null;
}
