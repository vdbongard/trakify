export enum LocalStorage {
  LAST_ACTIVITY = 'lastActivity',
  SHOWS_WATCHED = 'showsWatched',
  SHOWS_TRANSLATIONS = 'showsTranslations',
  SHOWS_PROGRESS = 'showsProgress',
  SHOWS_HIDDEN = 'showHidden',
  SHOWS_EPISODES = 'showsEpisodes',
  SHOWS_EPISODES_TRANSLATIONS = 'showsEpisodesTranslations',
  TMDB_SHOWS = 'tmdbShows',
  TMDB_SEASONS = 'tmdbSeasons',
  TMDB_EPISODES = 'tmdbEpisodes',
  FAVORITES = 'favorites',
  CONFIG = 'config',
  WATCHLIST = 'watchlist',
  LISTS = 'lists',
  LIST_ITEMS = 'listItems',
}

export enum Theme {
  LIGHT = 'light-theme',
  DARK = 'dark-theme',
  SYSTEM = 'system-theme',
}

export enum Filter {
  NO_NEW_EPISODES = 'No new episodes',
  HIDDEN = 'Hidden',
}

export enum UpcomingFilter {
  WATCHLIST_ITEM = 'Watchlist items',
  SPECIALS = 'Specials',
}

export enum Sort {
  NEWEST_EPISODE = 'Newest episode',
  OLDEST_EPISODE = 'Oldest episode',
  LAST_WATCHED = 'Last watched',
  EPISODE_PROGRESS = 'Episode progress',
  FIRST_AIRED = 'First aired',
}

export enum SortOptions {
  FAVORITES_FIRST = 'Favorites first',
}

export enum LoadingState {
  LOADING,
  ERROR,
  SUCCESS,
}
