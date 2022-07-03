import { EpisodeFull, ShowProgress, ShowWatched, TraktShow } from './Trakt';
import { TmdbEpisode, TmdbShow } from './Tmdb';

export interface ShowInfo {
  show?: TraktShow;
  tmdbShow?: TmdbShow;
  showProgress?: ShowProgress;
  isFavorite?: boolean;
  isWatchlist?: boolean;
  nextEpisode?: EpisodeFull;
  tmdbNextEpisode?: TmdbEpisode;
  showWatched?: ShowWatched;
}
