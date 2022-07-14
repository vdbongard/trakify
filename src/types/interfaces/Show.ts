import {
  EpisodeFull,
  SeasonProgress,
  ShowProgress,
  ShowWatched,
  TraktShow,
  Translation,
} from './Trakt';
import { TmdbEpisode, TmdbShow } from './Tmdb';

export interface ShowInfo {
  show?: TraktShow;
  showTranslation?: Translation;
  tmdbShow?: TmdbShow;
  showProgress?: ShowProgress;
  isFavorite?: boolean;
  isWatchlist?: boolean;
  nextEpisode?: EpisodeFull;
  nextEpisodeTranslation?: Translation;
  tmdbNextEpisode?: TmdbEpisode;
  showWatched?: ShowWatched;
}

export interface SeasonInfo {
  show?: TraktShow;
  showTranslation?: Translation;
  seasonProgress?: SeasonProgress;
  episodes?: EpisodeFull[];
  episodesTranslations?: Translation[];
}
