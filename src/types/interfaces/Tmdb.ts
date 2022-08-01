/* eslint-disable @typescript-eslint/naming-convention */

export interface TmdbConfiguration {
  images: {
    backdrop_sizes: string[];
    base_url: string;
    logo_sizes: string[];
    poster_sizes: string[];
    profile_sizes: string[];
    secure_base_url: string;
    still_sizes: string[];
  };
}

export interface TmdbShow {
  adult: boolean;
  backdrop_path: string;
  created_by: CreatedBy[];
  episode_run_time: number[];
  first_air_date: string;
  genres: Genre[];
  homepage: string;
  id: number;
  in_production: boolean;
  languages: string[];
  last_air_date: string;
  last_episode_to_air: TmdbEpisode;
  name: string;
  networks: Network[];
  next_episode_to_air: null;
  number_of_episodes: number;
  number_of_seasons: number;
  origin_country: string[];
  original_language: string;
  original_name: string;
  overview: string;
  popularity: string;
  poster_path: string;
  production_companies: ProductionCompany[];
  production_countries: ProductionCountry[];
  seasons: Season[];
  spoken_languages: SpokenLanguage[];
  status: 'Ended' | 'Returning Series' | 'Canceled' | 'In production';
  tagline: string;
  type: 'scripted';
  vote_average: number;
  vote_count: number;
}

export interface TmdbSeason {
  air_date: string;
  episodes: TmdbEpisode[];
  name: string;
  overview: string;
  id: number;
  _id: string;
  poster_path: string;
  season_number: number;
}

export interface TmdbEpisode {
  air_date: string;
  episode_number: number;
  id: number;
  name: string;
  overview: string;
  production_code: string;
  runtime: number;
  season_number: number;
  still_path?: string;
  vote_average: number;
  vote_count: number;
}

export interface Network {
  id: number;
  logo_path: string;
  name: string;
  origin_country: string;
}

export interface ProductionCompany {
  id: number;
  logo_path: string;
  name: string;
  origin_country: string;
}

export interface ProductionCountry {
  iso_3166_1: string;
  name: string;
}

export interface Season {
  air_date: string;
  episode_count: number;
  id: number;
  name: string;
  overview: string;
  poster_path: string;
  season_number: number;
}

export interface SpokenLanguage {
  english_name: string;
  iso_639_1: string;
  name: string;
}

export interface Genre {
  id: number;
  name: string;
}

export interface CreatedBy {
  credit_id: string;
  gender: number;
  id: number;
  name: string;
  profile_path: string;
}
