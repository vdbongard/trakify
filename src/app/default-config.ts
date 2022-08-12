import { Config } from 'src/types/interfaces/Config';
import { Filter, Sort, SortOptions, Theme } from '../types/enum';

export function defaultConfig(): Config {
  return {
    filters: [
      {
        name: Filter.NO_NEW_EPISODES,
        value: false,
      },
      {
        name: Filter.COMPLETED,
        value: false,
      },
      {
        name: Filter.HIDDEN,
        value: true,
      },
    ],
    sort: {
      values: [Sort.NEWEST_EPISODE, Sort.OLDEST_EPISODE, Sort.LAST_WATCHED, Sort.EPISODE_PROGRESS],
      by: Sort.NEWEST_EPISODE,
    },
    sortOptions: [
      {
        name: SortOptions.FAVORITES_FIRST,
        value: false,
      },
    ],
    theme: Theme.SYSTEM,
    language: 'en-US',
    lastFetchedAt: {
      progress: null,
      episodes: null,
    },
  };
}
