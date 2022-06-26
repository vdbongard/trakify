import { Theme } from '../enum';
import { HttpOptions } from './Http';

export interface Config {
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
}

export interface InternalConfig {
  traktBaseUrl: string;
  traktOptions: HttpOptions;
  tmdbBaseUrl: string;
  // eslint-disable-next-line @typescript-eslint/naming-convention
  tmdbOptions: HttpOptions;
}
