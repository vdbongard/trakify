/* eslint-disable @typescript-eslint/naming-convention */
import { Theme } from './Enum';
import { HttpOptions } from './Http';

export interface Config extends Record<string, unknown> {
  filters: Filter[];
  sort: { values: string[]; by: string };
  sortOptions: { name: string; value: boolean }[];
  upcomingFilters: Filter[];
  theme: Theme;
  language: string;
  lastFetchedAt: {
    sync: string | null;
    progress: string | null;
    episodes: string | null;
    tmdbShows: string | null;
    showProgress: { [showId: number]: string | undefined };
  };
}

export interface InternalConfig {
  traktBaseUrl: string;
  traktOptions: HttpOptions;
  tmdbBaseUrl: string;
  tmdbOptions: HttpOptions;
}

export interface Language {
  name: string;
  short: string;
}

export interface Filter {
  category: 'hide' | 'show';
  name: string;
  value: boolean;
}
