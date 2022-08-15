/* eslint-disable @typescript-eslint/naming-convention */
import { Theme } from '../enum';
import { HttpOptions } from './Http';

export interface Config extends Record<string, unknown> {
  filters: {
    name: string;
    value: boolean;
  }[];
  sort: {
    values: string[];
    by: string;
  };
  sortOptions: {
    name: string;
    value: boolean;
  }[];
  theme: Theme;
  language: string;
  lastFetchedAt: {
    progress: string | null;
    episodes: string | null;
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
