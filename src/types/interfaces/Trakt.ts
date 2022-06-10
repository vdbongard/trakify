/* eslint-disable @typescript-eslint/naming-convention */

export interface ShowWatched {
  last_updated_at: string;
  last_watched_at: string;
  plays: number;
  reset_at: string;
  seasons: SeasonWatched[];
  show: Show;
}

export interface SeasonWatched {
  episodes: EpisodeWatched[];
  number: number;
}

export interface EpisodeWatched {
  last_watched_at: string;
  number: number;
  plays: number;
}

export interface Show {
  ids: Ids;
  title: string;
  year: number;
}

export interface Ids {
  imdb: string;
  slug: string;
  tmdb: number;
  trakt: number;
  tvdb: number;
  tvrage: number;
}

export interface ShowProgress {
  aired: number;
  completed: number;
  last_episode: Episode;
  last_watched_at: string;
  next_episode: Episode;
  reset_at: string | null;
  seasons: Season[];
}

export interface Episode {
  ids: Ids;
  number: number;
  season: number;
  title: string;
}

export interface Season {
  aired: number;
  completed: number;
  episodes: EpisodeProgress[];
  number: number;
  title: string;
}

export interface EpisodeProgress {
  completed: boolean;
  last_watched_at: string;
  number: number;
}

export interface ShowWatchedHistory {
  action: 'watch';
  episode: Episode;
  id: number;
  show: Show;
  type: 'episode';
  watched_at: string;
}

export interface LastActivity {
  all: string;
  movies: {
    watched_at: string;
    collected_at: string;
    rated_at: string;
    watchlisted_at: string;
    recommendations_at: string;
    commented_at: string;
    paused_at: string;
    hidden_at: string;
  };
  episodes: {
    watched_at: string;
    collected_at: string;
    rated_at: string;
    watchlisted_at: string;
    commented_at: string;
    paused_at: string;
  };
  shows: {
    rated_at: string;
    watchlisted_at: string;
    recommendations_at: string;
    commented_at: string;
    hidden_at: string;
  };
  comments: {
    liked_at: string;
    blocked_at: string;
  };
  lists: {
    liked_at: string;
    updated_at: string;
    commented_at: string;
  };
  watchlist: {
    updated_at: string;
  };
  recommendations: {
    updated_at: string;
  };
  accounts: {
    settings_at: string;
    followed_at: string;
    following_at: string;
    pending_at: string;
    requested_at: string;
  };
}

export interface ShowHidden {
  hidden_at: string;
  show: Show;
  type: 'show';
}
