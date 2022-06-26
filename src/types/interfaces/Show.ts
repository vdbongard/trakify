import { EpisodeFull, ShowProgress, TraktShow } from './Trakt';
import { TmdbShow } from './Tmdb';

export interface ShowInfo {
  show: TraktShow;
  tmdbShow?: TmdbShow;
  showProgress?: ShowProgress;
  favorite?: boolean;
  nextEpisode?: EpisodeFull;
}
