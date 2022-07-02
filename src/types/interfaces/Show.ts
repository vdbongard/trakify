import { EpisodeFull, ShowProgress, ShowWatched, TraktShow } from './Trakt';
import { TmdbShow } from './Tmdb';

export interface ShowInfo {
  show: TraktShow;
  tmdbShow?: TmdbShow;
  showProgress?: ShowProgress;
  isFavorite?: boolean;
  isWatchlist?: boolean;
  nextEpisode?: EpisodeFull;
  showWatched?: ShowWatched;
}
