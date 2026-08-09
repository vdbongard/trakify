// Hand-crafted fixture builders for the e2e suite. Shape matches the Trakt / TMDB
// API responses and the objects the app stores in localStorage (see @type/*).

export interface Ids {
  slug: string;
  trakt: number;
  tmdb?: number | null;
  tvdb?: number | null;
  imdb?: string | null;
}

export interface Show {
  ids: Ids;
  title: string;
  year: number | null;
}

export interface ShowWatched {
  last_updated_at: string | null;
  last_watched_at: string | null;
  plays: number;
  reset_at: string | null;
  show: Show;
}

export interface Episode {
  ids: Ids;
  number: number;
  season: number;
  title: string | null;
}

export interface EpisodeFull extends Episode {
  first_aired: string | null;
  overview?: string | null;
}

export interface ShowProgress {
  aired: number;
  completed: number;
  last_episode: Episode | null;
  last_watched_at: string | null;
  next_episode?: Episode | null;
  reset_at: string | null;
  seasons: SeasonProgress[];
}

export interface SeasonProgress {
  aired: number;
  completed: number;
  episodes: EpisodeProgress[];
  number: number;
  title: string | null;
}

export interface EpisodeProgress {
  completed: boolean;
  last_watched_at: string | null;
  number: number;
}

export interface ShowHidden {
  hidden_at: string;
  show: Show;
  type: 'show';
}

export interface Stats {
  movies: {
    plays: number;
    watched: number;
    minutes: number;
    collected: number;
    ratings: number;
    comments: number;
  };
  shows: { watched: number; collected: number; ratings: number; comments: number };
  seasons: { ratings: number; comments: number };
  episodes: {
    plays: number;
    watched: number;
    minutes: number;
    collected: number;
    ratings: number;
    comments: number;
  };
  network: { friends: number; followers: number; following: number };
  ratings: {
    total: number;
    distribution: Record<number, number>;
  };
}

export interface WatchlistItem {
  id: number;
  listed_at: string;
  notes: null;
  show: Show;
  type: 'show';
}

export interface List {
  allow_comments: boolean;
  comment_count: number;
  created_at: string;
  description: string | null;
  display_numbers: boolean;
  ids: { slug: string; trakt: number };
  item_count: number;
  likes: number;
  name: string;
  privacy: 'public' | 'private';
  sort_by: 'rank';
  sort_how: 'asc';
  type: 'personal';
  updated_at: string;
  user: {
    ids: { slug: string };
    name: string;
    private: boolean;
    username: string;
    vip: boolean;
    vip_ep: boolean;
  };
}

export interface ListItem {
  id: number;
  listed_at: string;
  notes: null;
  rank: number;
  show: Show;
  type: 'show';
}

export interface TmdbEpisode {
  air_date?: string;
  episode_number: number;
  id: number;
  name: string;
  season_number: number;
  still_path: string | null;
}

export interface TmdbSeason {
  episode_count?: number;
  episodes?: TmdbEpisode[];
  id: number;
  name: string;
  poster_path: string | null;
  season_number: number;
}

export interface TmdbShow {
  id: number;
  name: string;
  overview: string | null;
  poster_path: string | null;
  seasons: TmdbSeason[];
  status: string;
  first_air_date: string;
  vote_average?: number;
  vote_count?: number;
  number_of_episodes?: number;
  number_of_seasons?: number;
  type?: string;
  genres?: { id: number; name: string }[];
  created_by?: { id: number; name: string }[];
  episode_run_time?: number[];
  networks?: { id: number; name: string }[];
  [key: string]: unknown;
}

export interface Config {
  filters: { category: 'hide' | 'show'; name: string; value: boolean }[];
  sort: { values: string[]; by: string };
  sortOptions: { name: string; value: boolean }[];
  upcomingFilters: { category: 'hide' | 'show'; name: string; value: boolean }[];
  theme: string;
  language: string;
  lastFetchedAt: {
    sync: string | null;
    progress: string | null;
    episodes: string | null;
    showProgress: Record<string, string | undefined>;
  };
}

export function getIds({
  trakt,
  slug,
  tmdb = null,
  tvdb = null,
  imdb = null,
}: {
  trakt: number;
  slug: string;
  tmdb?: number | null;
  tvdb?: number | null;
  imdb?: string | null;
}): Ids {
  return { trakt, slug, tmdb, tvdb, imdb };
}

export function makeShow(show: {
  trakt: number;
  slug: string;
  title: string;
  year?: number | null;
  tmdb?: number | null;
  tvdb?: number | null;
}): Show {
  return {
    ids: getIds({ trakt: show.trakt, slug: show.slug, tmdb: show.tmdb, tvdb: show.tvdb }),
    title: show.title,
    year: show.year ?? 2000,
  };
}

export const breakingBad: Show = makeShow({
  trakt: 1,
  slug: 'breaking-bad',
  title: 'Breaking Bad',
  tmdb: 1399,
});

export const theWire: Show = makeShow({
  trakt: 2,
  slug: 'the-wire',
  title: 'The Wire',
  tmdb: 1427,
});

export const gameOfThrones: Show = makeShow({
  trakt: 1390,
  slug: 'game-of-thrones',
  title: 'Game of Thrones',
  tmdb: 1390,
});

export function makeShowWatched(
  show: Show,
  { lastWatchedAt }: { lastWatchedAt?: string } = {},
): ShowWatched {
  return {
    last_updated_at: lastWatchedAt ?? '2024-01-01T12:00:00.000Z',
    last_watched_at: lastWatchedAt ?? '2024-01-01T12:00:00.000Z',
    plays: 1,
    reset_at: null,
    show,
  };
}

export function makeEpisode(
  show: Show,
  params: { season: number; number: number; title: string },
): Episode {
  return {
    ids: { ...show.ids, tmdb: show.ids.tmdb ?? null },
    season: params.season,
    number: params.number,
    title: params.title,
  };
}

export function makeEpisodeFull(
  show: Show,
  params: { season: number; number: number; title: string; firstAired?: string },
): EpisodeFull {
  return {
    ...makeEpisode(show, { season: params.season, number: params.number, title: params.title }),
    first_aired: params.firstAired ?? '2024-01-01T20:00:00.000Z',
    overview: 'Fixture overview.',
  };
}

export function makeShowProgress(
  show: Show,
  params: {
    completed?: number;
    aired?: number;
    nextEpisode?: Episode | null;
    lastEpisodeSeason?: number;
    lastEpisodeNumber?: number;
  } = {},
): ShowProgress {
  const completed = params.completed ?? 0;
  const aired = params.aired ?? completed;
  const lastEpisode: Episode | null =
    params.lastEpisodeSeason === undefined
      ? null
      : makeEpisode(show, {
          season: params.lastEpisodeSeason,
          number: params.lastEpisodeNumber ?? 1,
          title: 'Last watchee',
        });

  const seasonEpisode: EpisodeProgress | undefined =
    completed > 0
      ? { completed: true, last_watched_at: '2024-01-01T12:00:00.000Z', number: 1 }
      : undefined;

  return {
    aired,
    completed,
    last_episode: lastEpisode,
    last_watched_at: completed > 0 ? '2024-01-01T12:00:00.000Z' : null,
    next_episode:
      params.nextEpisode ??
      makeEpisode(show, { season: 1, number: completed + 1, title: 'Next episode' }),
    reset_at: null,
    seasons: [
      {
        aired: aired,
        completed,
        episodes: seasonEpisode !== undefined ? [seasonEpisode] : [],
        number: 1,
        title: null,
      },
    ],
  };
}

export function makeShowHidden(show: Show, hiddenAt = '2024-01-01T12:00:00.000Z'): ShowHidden {
  return { hidden_at: hiddenAt, show, type: 'show' };
}

export interface WatchedShowSeed {
  show: Show;
  completed?: number;
  aired?: number;
  next?: Episode;
}

const FUTURE_FIRST_AIRED = '2030-01-01T20:00:00.000Z';

/** Builds the shared watched-show seed rows (watchlist, progress, episodes, TMDB). */
export function makeWatchedShowsSeed(seeds: WatchedShowSeed[]): {
  showsWatched: ShowWatched[];
  showsProgress: Record<string, ShowProgress>;
  showsEpisodes: Record<string, EpisodeFull>;
  tmdbShows: Record<string, TmdbShow>;
} {
  const showsWatched = seeds.map(({ show }) => makeShowWatched(show));
  const showsProgress: Record<string, ShowProgress> = {};
  const showsEpisodes: Record<string, EpisodeFull> = {};
  const tmdbShows: Record<string, TmdbShow> = {};

  for (const { show, completed = 1, aired = Math.max(completed, 1), next } of seeds) {
    const hasWatched = completed > 0;

    showsProgress[String(show.ids.trakt)] = makeShowProgress(show, {
      completed,
      aired,
      ...(hasWatched ? { lastEpisodeSeason: 1, lastEpisodeNumber: 1 } : {}),
      nextEpisode:
        next ?? makeEpisode(show, { season: 1, number: completed + 1, title: 'Next episode' }),
    });

    showsEpisodes[`${show.ids.trakt}-1-1`] = makeEpisodeFull(show, {
      season: 1,
      number: 1,
      title: 'Pilot',
      ...(completed === 0 ? { firstAired: FUTURE_FIRST_AIRED } : {}),
    });

    if (hasWatched) {
      showsEpisodes[`${show.ids.trakt}-1-2`] = makeEpisodeFull(show, {
        season: 1,
        number: 2,
        title: next?.title ?? 'The Next',
        firstAired: FUTURE_FIRST_AIRED,
      });
    }

    tmdbShows[String(show.ids.tmdb)] = makeTmdbShow(show);
  }

  return { showsWatched, showsProgress, showsEpisodes, tmdbShows };
}

export function makeWatchlistItem(show: Show, id = show.ids.trakt): WatchlistItem {
  return {
    id,
    listed_at: '2024-01-01T12:00:00.000Z',
    notes: null,
    show,
    type: 'show',
  };
}

export function makeListItem(show: Show, id = show.ids.trakt, rank = 1): ListItem {
  return {
    id,
    listed_at: '2024-01-01T12:00:00.000Z',
    notes: null,
    rank,
    show,
    type: 'show',
  };
}

export function makeTmdbShow(
  show: Show,
  params: { name?: string; status?: string; seasons?: TmdbSeason[]; firstAirDate?: string } = {},
): TmdbShow {
  return {
    id: show.ids.tmdb ?? 0,
    name: params.name ?? show.title,
    overview: 'Fixture TMDB overview.',
    homepage: 'https://example.com',
    poster_path: null,
    seasons: params.seasons ?? [],
    status: params.status ?? 'Returning Series',
    first_air_date: params.firstAirDate ?? '2008-01-20',
    vote_average: 8,
    vote_count: 100,
    number_of_episodes: 10,
    number_of_seasons: 1,
    type: 'Scripted',
    genres: [],
    created_by: [],
    episode_run_time: [],
    networks: [],
  };
}

export function makeTmdbEpisode(
  show: Show,
  season: number,
  number: number,
  name = `Episode ${number}`,
): TmdbEpisode {
  return {
    id: (show.ids.tmdb ?? 0) * 1000 + season * 10 + number,
    name,
    season_number: season,
    episode_number: number,
    still_path: null,
    air_date: '2024-01-01',
  };
}

export function makeTmdbSeason(
  tmdbId: number,
  params: { seasonNumber?: number; episodes?: TmdbEpisode[]; name?: string } = {},
): TmdbSeason {
  const seasonNumber = params.seasonNumber ?? 1;
  return {
    id: tmdbId + seasonNumber,
    name: params.name ?? `Season ${seasonNumber}`,
    poster_path: null,
    season_number: seasonNumber,
    episodes: params.episodes ?? ([] as TmdbEpisode[]),
  };
}

export function makeList(
  show: Show,
  params: { id?: number; slug?: string; name?: string } = {},
): List {
  return {
    allow_comments: false,
    comment_count: 0,
    created_at: '2024-01-01T12:00:00.000Z',
    description: null,
    display_numbers: false,
    ids: { slug: params.slug ?? show.ids.slug, trakt: params.id ?? show.ids.trakt },
    item_count: 0,
    likes: 0,
    name: params.name ?? `${show.title}, favorites`,
    privacy: 'private',
    sort_by: 'rank',
    sort_how: 'asc',
    type: 'personal',
    updated_at: '2024-01-01T12:00:00.000Z',
    user: {
      ids: { slug: 'me' },
      name: 'Trakify E2E',
      private: false,
      username: 'trakify-e2e',
      vip: false,
      vip_ep: false,
    },
  };
}

export function defaultConfig(): Config {
  const syncAt = new Date(Date.now() - 5000).toISOString();
  return {
    filters: [
      { category: 'hide', name: 'No new episodes', value: false },
      { category: 'hide', name: 'Hidden', value: true },
      { category: 'show', name: 'No new episodes', value: false },
      { category: 'show', name: 'Hidden', value: false },
    ],
    sort: {
      values: [
        'Newest episode',
        'Oldest episode',
        'Last watched',
        'Episode progress',
        'First aired',
      ],
      by: 'Newest episode',
    },
    sortOptions: [{ name: 'Favorites first', value: false }],
    upcomingFilters: [
      { category: 'hide', name: 'Watchlist items', value: false },
      { category: 'hide', name: 'Specials', value: false },
      { category: 'show', name: 'Watchlist items', value: false },
      { category: 'show', name: 'Specials', value: false },
    ],
    theme: 'system-theme',
    language: 'en-US',
    lastFetchedAt: {
      sync: syncAt,
      progress: null,
      episodes: null,
      showProgress: {},
    },
  };
}
