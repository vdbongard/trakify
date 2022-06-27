/* eslint-disable @typescript-eslint/naming-convention */

export interface ShowWatched {
  last_updated_at: string;
  last_watched_at: string;
  plays: number;
  reset_at: string;
  seasons: SeasonWatched[];
  show: TraktShow;
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

export interface TraktShow {
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
  last_episode: Episode | null;
  last_watched_at: string | null;
  next_episode: Episode;
  reset_at: string | null;
  seasons: SeasonProgress[];
}

export interface Episode {
  ids: Ids;
  number: number;
  season: number;
  title: string;
}

export interface EpisodeFull extends Episode {
  number_abs: null;
  overview: string;
  first_aired: string;
  updated_at: string;
  rating: number;
  votes: number;
  comment_count: number;
  available_translations: string[];
  runtime: number;
}

export interface SeasonProgress {
  aired: number;
  completed: number;
  episodes: EpisodeProgress[];
  number: number;
  title: string;
}

export interface EpisodeProgress {
  completed: boolean;
  last_watched_at: string | null;
  number: number;
}

export interface ShowWatchedHistory {
  action: 'watch';
  episode: Episode;
  id: number;
  show: TraktShow;
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
  show: TraktShow;
  type: 'show';
}

export interface AddToHistoryResponse {
  added: {
    movies: number;
    episodes: number;
  };
  not_found: {
    movies: { ids: Partial<Ids> }[];
    shows: { ids: Partial<Ids> }[];
    seasons: { ids: Partial<Ids> }[];
    episodes: { ids: Partial<Ids> }[];
  };
}

export interface RemoveFromHistoryResponse {
  deleted: {
    movies: number;
    episodes: number;
  };
  not_found: {
    movies: { ids: Partial<Ids> }[];
    shows: { ids: Partial<Ids> }[];
    seasons: { ids: Partial<Ids> }[];
    episodes: { ids: Partial<Ids> }[];
    ids: number[];
  };
}

export interface ShowSearch {
  score: number;
  show: TraktShow;
  type: 'show';
}

export interface TrendingShow {
  watchers: number;
  show: TraktShow;
}

export interface RecommendedShow {
  user_count: number;
  show: TraktShow;
}
