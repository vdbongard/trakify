import {
  EpisodeFull,
  EpisodeProgress,
  Show,
  ShowProgress,
  ShowProgressCompact,
  ShowWatched,
} from './Trakt';
import { TmdbEpisode, TmdbSeason, TmdbShow } from './Tmdb';
import { ShowMeta } from '@type/Chip';

export interface ShowInfo {
  show: Show;
  tmdbShow?: TmdbShow | null;
  tmdbSeason?: TmdbSeason | null;
  showProgress?: ShowProgress | ShowProgressCompact;
  isFavorite?: boolean;
  isHidden?: boolean;
  isWatchlist?: boolean;
  nextEpisode?: EpisodeFull;
  nextEpisodeProgress?: EpisodeProgress;
  tmdbNextEpisode?: TmdbEpisode | null;
  showWatched?: ShowWatched;
  showMeta?: ShowMeta[];
}
