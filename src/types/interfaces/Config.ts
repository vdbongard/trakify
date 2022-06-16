import { Theme } from '../enum';

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
