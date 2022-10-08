import { Filter, Sort, SortOptions, Theme, UpcomingFilter } from '@type/enum';

import type { Config } from '@type/interfaces/Config';

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
    upcomingFilters: [
      {
        name: UpcomingFilter.WATCHLIST_ITEM,
        value: false,
      },
      {
        name: UpcomingFilter.SPECIALS,
        value: false,
      },
    ],
    theme: Theme.SYSTEM,
    language: 'en-US',
    lastFetchedAt: {
      progress: null,
      episodes: null,
      tmdbShows: null,
      showProgress: {},
    },
  };
}
