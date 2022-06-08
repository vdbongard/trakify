/* eslint-disable @typescript-eslint/naming-convention */

export interface Configuration {
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

export interface Series {
  number_of_episodes: number;
  poster_path: string;
  name: string;
}
