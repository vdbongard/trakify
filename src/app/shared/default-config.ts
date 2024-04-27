import type { Config } from '@type/Config';
import { FilterCategory, LanguageShort } from '@type/Config';
import { Filter, Sort, SortOptions, Theme, UpcomingFilter } from '@type/Enum';

export function defaultConfig(): Config {
  return {
    filters: [
      {
        category: FilterCategory.HIDE,
        name: Filter.NO_NEW_EPISODES,
        value: false,
      },
      {
        category: FilterCategory.HIDE,
        name: Filter.COMPLETED,
        value: false,
      },
      {
        category: FilterCategory.HIDE,
        name: Filter.HIDDEN,
        value: true,
      },
      {
        category: FilterCategory.SHOW,
        name: Filter.NO_NEW_EPISODES,
        value: false,
      },
      {
        category: FilterCategory.SHOW,
        name: Filter.COMPLETED,
        value: false,
      },
      {
        category: FilterCategory.SHOW,
        name: Filter.HIDDEN,
        value: false,
      },
    ],
    sort: {
      values: [
        Sort.NEWEST_EPISODE,
        Sort.OLDEST_EPISODE,
        Sort.LAST_WATCHED,
        Sort.EPISODE_PROGRESS,
        Sort.FIRST_AIRED,
      ],
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
        category: FilterCategory.HIDE,
        name: UpcomingFilter.WATCHLIST_ITEM,
        value: false,
      },
      {
        category: FilterCategory.HIDE,
        name: UpcomingFilter.SPECIALS,
        value: false,
      },
      {
        category: FilterCategory.SHOW,
        name: UpcomingFilter.WATCHLIST_ITEM,
        value: false,
      },
      {
        category: FilterCategory.SHOW,
        name: UpcomingFilter.SPECIALS,
        value: false,
      },
    ],
    theme: Theme.SYSTEM,
    language: LanguageShort.EN_US,
    lastFetchedAt: {
      sync: null,
      progress: null,
      episodes: null,
      tmdbShows: null,
      showProgress: {},
    },
  };
}
