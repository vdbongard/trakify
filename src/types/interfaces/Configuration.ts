import { Theme } from '../enum';

export interface Configuration {
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
