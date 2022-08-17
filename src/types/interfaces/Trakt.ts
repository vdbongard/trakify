/* eslint-disable @typescript-eslint/naming-convention */

export interface ShowWatched {
  last_updated_at: string | null;
  last_watched_at: string | null;
  plays: number;
  reset_at: string | null;
  seasons: SeasonWatched[];
  show: Show;
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

export interface Show {
  ids: Ids;
  title: string;
  year: number | null;
}

export interface Ids {
  imdb: string | null;
  slug: string;
  tmdb: number;
  trakt: number;
  tvdb: number | null;
  tvrage: number | null;
}

export interface ShowProgress {
  aired: number;
  completed: number;
  last_episode: Episode | null;
  last_watched_at: string | null;
  next_episode: Episode | null | undefined;
  reset_at: string | null;
  seasons: SeasonProgress[];
}

export interface Season {
  number: number;
  ids: Ids;
}

export interface Episode {
  ids: Ids;
  number: number;
  season: number;
  title: string;
}

export interface EpisodeFull extends Episode {
  number_abs: null;
  overview: string | null;
  first_aired: string | null;
  updated_at: string;
  rating: number;
  votes: number;
  comment_count: number;
  available_translations: string[];
  runtime: number;
  translations?: {
    language: string; // two-digits e.g. 'en'
    overview: string;
    title: string;
  }[];
}

export interface Translation {
  title: string;
  overview: string;
  language: string; // two-digits e.g. 'en'
  country: string; // two-digits e.g. 'us'
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
  collaborations: {
    updated_at: string;
  };
  saved_filters: {
    updated_at: string;
  };
  seasons: {
    rated_at: string;
    watchlisted_at: string;
    commented_at: string;
    hidden_at: string;
  };
}

export interface ShowHidden {
  hidden_at: string;
  show: Show;
  type: 'show';
}

export interface ShowSearch {
  score: number;
  show: Show;
  type: 'show';
}

export interface TrendingShow {
  watchers: number;
  show: Show;
}

export interface RecommendedShow {
  user_count: number;
  show: Show;
}

export interface EpisodeAiring {
  episode: Episode;
  first_aired: string;
  show: Show;
}

export interface User {
  ids: UserIds;
  name: string;
  private: boolean;
  username: string;
  vip: boolean;
  vip_ep: boolean;
}

export type UserIds = Pick<Ids, 'slug'>;

export interface Stats {
  movies: {
    plays: number;
    watched: number;
    minutes: number;
    collected: number;
    ratings: number;
    comments: number;
  };
  shows: {
    watched: number;
    collected: number;
    ratings: number;
    comments: number;
  };
  seasons: {
    ratings: number;
    comments: number;
  };
  episodes: {
    plays: number;
    watched: number;
    minutes: number;
    collected: number;
    ratings: number;
    comments: number;
  };
  network: {
    fiends: number;
    followers: number;
    following: number;
  };
  ratings: {
    total: number;
    distribution: {
      1: number;
      2: number;
      3: number;
      4: number;
      5: number;
      6: number;
      7: number;
      8: number;
      9: number;
      10: number;
    };
  };
}
