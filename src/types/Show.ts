import type { ShowMeta } from '@type/Chip';
import type { TmdbEpisode, TmdbSeason, TmdbShow } from './Tmdb';
import type { EpisodeFull, EpisodeProgress, Show, ShowProgress, ShowWatched } from './Trakt';

export interface ShowInfo {
  show: Show;
  tmdbShow?: TmdbShow | null;
  tmdbSeason?: TmdbSeason | null;
  showProgress?: ShowProgress;
  isFavorite?: boolean;
  isHidden?: boolean;
  isWatchlist?: boolean;
  nextEpisode?: EpisodeFull;
  nextEpisodeProgress?: EpisodeProgress;
  tmdbNextEpisode?: TmdbEpisode | null;
  showWatched?: ShowWatched;
  showMeta?: ShowMeta[];
}
