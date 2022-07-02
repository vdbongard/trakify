/* eslint-disable @typescript-eslint/naming-convention */

export interface ShowWatched {
  last_updated_at: string | null;
  last_watched_at: string | null;
  plays: number;
  reset_at: string | null;
  seasons: SeasonWatched[];
  show: TraktShow;
}

export interface SeasonWatched {
  episodes: EpisodeWatched[];
  number: number;
}

export interface EpisodeWatched {
  last_watched_at: string | null;
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

export interface AddToListResponse {
  added: {
    movies: number;
    shows: number;
    seasons: number;
    episodes: number;
    people: number;
  };
  existing: {
    movies: number;
    shows: number;
    seasons: number;
    episodes: number;
    people: number;
  };
  not_found: {
    movies: { ids: Partial<Ids> }[];
    shows: { ids: Partial<Ids> }[];
    seasons: { ids: Partial<Ids> }[];
    episodes: { ids: Partial<Ids> }[];
    people: { ids: Partial<Ids> }[];
  };
  list: {
    updated_at: string;
    item_count: number;
  };
}

export interface RemoveFromListResponse {
  deleted: {
    movies: number;
    shows: number;
    seasons: number;
    episodes: number;
    people: number;
  };
  not_found: {
    movies: { ids: Partial<Ids> }[];
    shows: { ids: Partial<Ids> }[];
    seasons: { ids: Partial<Ids> }[];
    episodes: { ids: Partial<Ids> }[];
    people: { ids: Partial<Ids> }[];
  };
  list: {
    updated_at: string;
    item_count: number;
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

export interface EpisodeAiring {
  episode: Episode;
  first_aired: string;
  show: TraktShow;
}

export interface WatchlistItem {
  id: number;
  listed_at: string;
  notes: null;
  show: TraktShow;
  type: 'show';
}

export interface ListIds {
  slug: string;
  trakt: number;
}

export interface List {
  allow_comments: boolean;
  comment_count: number;
  created_at: string;
  description: string | null;
  display_numbers: boolean;
  ids: ListIds;
  item_count: number;
  likes: number;
  name: string;
  privacy: 'private';
  sort_by: 'rank';
  sort_how: 'asc';
  type: 'personal';
  updated_at: string;
  user: User;
}

export interface UserIds {
  slug: string;
}

export interface User {
  ids: UserIds;
  name: string;
  private: boolean;
  username: string;
  vip: boolean;
  vip_ep: boolean;
}

export interface ListItem {
  id: number;
  listed_at: string;
  notes: null;
  rank: number;
  show: TraktShow;
  type: 'show';
}

export interface AddToWatchlistResponse {
  added: {
    movies: number;
    shows: number;
    seasons: number;
    episodes: number;
  };
  existing: {
    movies: number;
    shows: number;
    seasons: number;
    episodes: number;
  };
  not_found: {
    movies: { ids: Partial<Ids> }[];
    shows: { ids: Partial<Ids> }[];
    seasons: { ids: Partial<Ids> }[];
    episodes: { ids: Partial<Ids> }[];
  };
  list: {
    updated_at: string;
    item_count: number;
  };
}

export interface RemoveFromWatchlistResponse {
  deleted: {
    movies: number;
    shows: number;
    seasons: number;
    episodes: number;
  };
  not_found: {
    movies: { ids: Partial<Ids> }[];
    shows: { ids: Partial<Ids> }[];
    seasons: { ids: Partial<Ids> }[];
    episodes: { ids: Partial<Ids> }[];
  };
  list: {
    updated_at: string;
    item_count: number;
  };
}
