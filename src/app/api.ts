import { Config } from './config';

export const api = {
  syncLastActivities: `${Config.traktBaseUrl}/sync/last_activities`,
  syncHistory: `${Config.traktBaseUrl}/sync/history`,
  syncHistoryRemove: `${Config.traktBaseUrl}/sync/history/remove`,
  syncHistoryShows: `${Config.traktBaseUrl}/sync/history/shows`,
  syncHistoryShowsNoSeasons: `${Config.traktBaseUrl}/sync/watched/shows?extended=noseasons`,
  syncWatchlist: `${Config.traktBaseUrl}/sync/watchlist`,
  syncWatchlistRemove: `${Config.traktBaseUrl}/sync/watchlist/remove`,

  showProgress: `${Config.traktBaseUrl}/shows/%/progress/watched?specials=true&count_specials=false`,
  showsHidden: `${Config.traktBaseUrl}/users/hidden/progress_watched?type=show`,
  show: `${Config.traktBaseUrl}/shows/%`,
  showSearch: `${Config.traktBaseUrl}/search/show?query=%`,
  showsTrending: `${Config.traktBaseUrl}/shows/trending`,
  showsPopular: `${Config.traktBaseUrl}/shows/popular`,
  showsRecommended: `${Config.traktBaseUrl}/shows/recommended`,
  showAddHidden: `${Config.traktBaseUrl}/users/hidden/progress_watched`,
  showRemoveHidden: `${Config.traktBaseUrl}/users/hidden/progress_watched/remove`,

  seasons: `${Config.traktBaseUrl}/shows/%/seasons`,
  seasonEpisodes: `${Config.traktBaseUrl}/shows/%/seasons/%`,

  episode: `${Config.traktBaseUrl}/shows/%/seasons/%/episodes/%?extended=full`,
  calendar: `${Config.traktBaseUrl}/calendars/my/shows/%/%`,

  lists: `${Config.traktBaseUrl}/users/me/lists`,
  listItems: `${Config.traktBaseUrl}/users/me/lists/%/items/show`,
  listAdd: `${Config.traktBaseUrl}/users/%/lists`,
  listRemove: `${Config.traktBaseUrl}/users/%/lists/%`,
  listAddShow: `${Config.traktBaseUrl}/users/%/lists/%/items`,
  listRemoveShow: `${Config.traktBaseUrl}/users/%/lists/%/items/remove`,
  watchlist: `${Config.traktBaseUrl}/users/me/watchlist/shows`,

  translationShow: `${Config.traktBaseUrl}/shows/%/translations/%`,
  translationEpisode: `${Config.traktBaseUrl}/shows/%/seasons/%/episodes/%/translations/%`,

  stats: `${Config.traktBaseUrl}/users/%/stats`,

  tmdbShow: `${Config.tmdbBaseUrl}/tv/%?append_to_response=videos`,
  tmdbSeason: `${Config.tmdbBaseUrl}/tv/%/season/%`,
  tmdbEpisode: `${Config.tmdbBaseUrl}/tv/%/season/%/episode/%`,
};
