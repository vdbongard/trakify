import { Config } from './config';

export const api = {
  showsWatched: `${Config.traktBaseUrl}/sync/watched/shows?extended=noseasons`,
  showProgress: `${Config.traktBaseUrl}/shows/%/progress/watched?specials=true&count_specials=false`,
  showsHidden: `${Config.traktBaseUrl}/users/hidden/progress_watched?type=show`,
  show: `${Config.traktBaseUrl}/shows/%`,
  showsWatchedHistory: `${Config.traktBaseUrl}/sync/history/shows`,
  showSearch: `${Config.traktBaseUrl}/search/show?query=%`,
  showsTrending: `${Config.traktBaseUrl}/shows/trending`,
  showsPopular: `${Config.traktBaseUrl}/shows/popular`,
  showsRecommended: `${Config.traktBaseUrl}/shows/recommended`,
  showAdd: `${Config.traktBaseUrl}/sync/history`,
  showRemove: `${Config.traktBaseUrl}/sync/history/remove`,

  seasons: `${Config.traktBaseUrl}/shows/%/seasons`,
  seasonEpisodes: `${Config.traktBaseUrl}/shows/%/seasons/%`,
  seasonAdd: `${Config.traktBaseUrl}/sync/history`,

  episode: `${Config.traktBaseUrl}/shows/%/seasons/%/episodes/%?extended=full`,
  calendar: `${Config.traktBaseUrl}/calendars/my/shows/%/%`,
  episodeAdd: `${Config.traktBaseUrl}/sync/history`,
  episodeRemove: `${Config.traktBaseUrl}/sync/history/remove`,

  lists: `${Config.traktBaseUrl}/users/me/lists`,
  listItems: `${Config.traktBaseUrl}/users/me/lists/%/items/show`,
  listAdd: `${Config.traktBaseUrl}/users/%/lists`,
  listRemove: `${Config.traktBaseUrl}/users/%/lists/%`,
  listAddShow: `${Config.traktBaseUrl}/users/%/lists/%/items`,
  listRemoveShow: `${Config.traktBaseUrl}/users/%/lists/%/items/remove`,
  watchlist: `${Config.traktBaseUrl}/users/me/watchlist/shows`,
  watchlistAdd: `${Config.traktBaseUrl}/sync/watchlist`,
  watchlistRemove: `${Config.traktBaseUrl}/sync/watchlist/remove`,

  translationShow: `${Config.traktBaseUrl}/shows/%/translations/%`,
  translationEpisode: `${Config.traktBaseUrl}/shows/%/seasons/%/episodes/%/translations/%`,

  stats: `${Config.traktBaseUrl}/users/%/stats`,

  lastActivities: `${Config.traktBaseUrl}/sync/last_activities`,

  tmdbShow: `${Config.tmdbBaseUrl}/tv/%`,
  tmdbSeason: `${Config.tmdbBaseUrl}/tv/%/season/%`,
  tmdbEpisode: `${Config.tmdbBaseUrl}/tv/%/season/%/episode/%`,
};
