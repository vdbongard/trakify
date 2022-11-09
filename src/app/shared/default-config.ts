import { Filter, Sort, SortOptions, Theme, UpcomingFilter } from '@type/enum';

import type { Config } from '@type/interfaces/Config';

export function defaultConfig(): Config {
  return {
    filters: [
      {
        category: 'hide',
        name: Filter.NO_NEW_EPISODES,
        value: false,
      },
      {
        category: 'hide',
        name: Filter.COMPLETED,
        value: false,
      },
      {
        category: 'hide',
        name: Filter.HIDDEN,
        value: true,
      },
      {
        category: 'show',
        name: Filter.NO_NEW_EPISODES,
        value: false,
      },
      {
        category: 'show',
        name: Filter.COMPLETED,
        value: false,
      },
      {
        category: 'show',
        name: Filter.HIDDEN,
        value: false,
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
    upcomingFilters: [
      {
        category: 'hide',
        name: UpcomingFilter.WATCHLIST_ITEM,
        value: false,
      },
      {
        category: 'hide',
        name: UpcomingFilter.SPECIALS,
        value: false,
      },
      {
        category: 'show',
        name: UpcomingFilter.WATCHLIST_ITEM,
        value: false,
      },
      {
        category: 'show',
        name: UpcomingFilter.SPECIALS,
        value: false,
      },
    ],
    theme: Theme.SYSTEM,
    language: 'en-US',
    lastFetchedAt: {
      sync: null,
      progress: null,
      episodes: null,
      tmdbShows: null,
      showProgress: {},
    },
  };
}
