import { EpisodeFull, EpisodeProgress, Show, ShowProgress, ShowWatched } from './Trakt';
import { TmdbEpisode, TmdbSeason, TmdbShow } from './Tmdb';

export interface ShowInfo {
  show?: Show;
  tmdbShow?: TmdbShow;
  tmdbSeason?: TmdbSeason | null;
  showProgress?: ShowProgress;
  isFavorite?: boolean;
  isHidden?: boolean;
  isWatchlist?: boolean;
  nextEpisode?: EpisodeFull;
  nextEpisodeProgress?: EpisodeProgress;
  tmdbNextEpisode?: TmdbEpisode | null;
  showWatched?: ShowWatched;
}
