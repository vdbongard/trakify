/* eslint-disable @typescript-eslint/naming-convention */
import type { Theme } from './Enum';
import type { HttpOptions } from './Http';

export interface Config extends Record<string, unknown> {
  filters: Filter[];
  sort: { values: string[]; by: string };
  sortOptions: { name: string; value: boolean }[];
  upcomingFilters: Filter[];
  theme: Theme;
  language: LanguageShort;
  lastFetchedAt: {
    sync: string | null;
    progress: string | null;
    episodes: string | null;
    tmdbShows: string | null;
    showProgress: Record<number, string | undefined>;
  };
}

export interface InternalConfig {
  traktBaseUrl: string;
  traktOptions: HttpOptions;
  tmdbBaseUrl: string;
  tmdbOptions: HttpOptions;
}

export interface Language {
  name: LanguageName;
  short: LanguageShort;
}

export interface Filter {
  category: FilterCategory;
  name: string;
  value: boolean;
}

export enum FilterCategory {
  HIDE = 'hide',
  SHOW = 'show',
}

export enum LanguageShort {
  EN_US = 'en-US',
  DE_DE = 'de-DE',
}

export enum LanguageName {
  EN_US = 'English',
  DE_DE = 'Deutsch',
}
