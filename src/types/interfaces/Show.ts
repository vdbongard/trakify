import {
  EpisodeFull,
  EpisodeProgress,
  SeasonProgress,
  ShowProgress,
  ShowWatched,
  TraktShow,
  Translation,
} from './Trakt';
import { TmdbEpisode, TmdbShow } from './Tmdb';

export interface ShowInfo {
  show?: TraktShow;
  tmdbShow?: TmdbShow;
  showProgress?: ShowProgress;
  isFavorite?: boolean;
  isWatchlist?: boolean;
  nextEpisode?: EpisodeFull;
  nextEpisodeTranslation?: Translation;
  nextEpisodeProgress?: EpisodeProgress;
  tmdbNextEpisode?: TmdbEpisode;
  showWatched?: ShowWatched;
}

export interface SeasonInfo {
  seasonProgress?: SeasonProgress;
  seasonNumber?: number;
  show?: TraktShow;
  showTranslation?: Translation;
  episodes?: (EpisodeFull | undefined)[];
  episodesTranslations?: (Translation | undefined)[];
}

export interface EpisodeInfo {
  episodeProgress?: EpisodeProgress;
  show?: TraktShow;
  showTranslation?: Translation;
  episode?: EpisodeFull;
  episodeTranslation?: Translation;
  tmdbEpisode?: TmdbEpisode;
}
