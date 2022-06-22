import { ShowProgress, ShowWatched } from './Trakt';
import { TmdbShow } from './Tmdb';

export interface ShowInfo {
  showWatched: ShowWatched;
  showProgress: ShowProgress;
  tmdbShow: TmdbShow;
  favorite: boolean;
}
