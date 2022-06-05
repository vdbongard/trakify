/* eslint-disable @typescript-eslint/naming-convention */

export interface WatchedSeries {
  last_updated_at: string;
  last_watched_at: string;
  plays: number;
  reset_at: string;
  seasons: Season[];
  show: Show;
}

export interface Season {
  episodes: Episode[];
  number: number;
}

export interface Episode {
  last_watched_at: string;
  number: number;
  plays: number;
}

export interface Show {
  ids: {
    imdb: string;
    slug: string;
    tmdb: number;
    trakt: number;
    tvdb: number;
    tvrage: number;
  };
  title: string;
  year: number;
}
