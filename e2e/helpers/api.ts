import { type Page, type Route } from '@playwright/test';
import { makeTmdbEpisode, makeTmdbShow, makeWatchlistItem, type Show } from './fixtures';

export const traktBaseUrl = 'https://api.trakt.tv';
export const tmdbBaseUrl = 'https://api.themoviedb.org/3';
export const tmdbImageBaseUrl = 'https://image.tmdb.org';

export type RequestMatcher = (url: URL) => boolean;

// 1x1 transparent PNG used to answer any stray image.tmdb.org requests.
export const TRANSPARENT_PNG = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
  'base64',
);

/**
 * Intercepts all real Trakt / TMDB API traffic and answers with 404 JSON, so a
 * test never leaves the host. Register this first; then register the specific
 * `mockTrakt` / `mockTmdb` handlers afterwards (Playwright evaluates route
 * handlers in reverse registration order).
 */
export async function blockExternalTraffic(page: Page): Promise<void> {
  const empty = (route: Route): Promise<void> =>
    route.fulfill({ status: 404, contentType: 'application/json', body: '{}' });

  await page.route(`${traktBaseUrl}/**`, empty);
  await page.route(`${tmdbBaseUrl}/**`, empty);
  await page.route(`${tmdbImageBaseUrl}/**`, (route) =>
    route.fulfill({ status: 200, contentType: 'image/png', body: TRANSPARENT_PNG }),
  );
}

/** Returns a matcher for an exact request path. */
export function pathEquals(path: string): RequestMatcher {
  return (url: URL) => url.pathname === path;
}

/** Returns a matcher whose pathname starts with the given prefix. */
export function pathStartsWith(prefix: string): RequestMatcher {
  return (url: URL) => url.pathname.startsWith(prefix);
}

async function fulfillWithJson(route: Route, json: unknown, status = 200): Promise<void> {
  await route.fulfill({
    status,
    contentType: 'application/json',
    body: typeof json === 'string' ? json : JSON.stringify(json),
  });
}

async function mockApi(
  page: Page,
  baseUrl: string,
  matches: RequestMatcher,
  json: unknown,
  { method = 'GET', status = 200 }: { method?: 'GET' | 'POST' | 'DELETE'; status?: number } = {},
): Promise<void> {
  await page.route(`${baseUrl}/**`, async (route) => {
    const url = new URL(route.request().url());
    if (route.request().method() === method && matches(url)) {
      await fulfillWithJson(route, json, status);
    } else {
      await route.fallback();
    }
  });
}

/** Mock a single Trakt endpoint (method + path matcher). */
export function mockTrakt(
  page: Page,
  matches: RequestMatcher,
  json: unknown,
  options: { method?: 'GET' | 'POST' | 'DELETE'; status?: number } = {},
): Promise<void> {
  return mockApi(page, traktBaseUrl, matches, json, options);
}

/** Mock a single TMDB endpoint (method + path matcher). */
export function mockTmdb(
  page: Page,
  matches: RequestMatcher,
  json: unknown,
  options: { method?: 'GET' | 'POST' | 'DELETE'; status?: number } = {},
): Promise<void> {
  return mockApi(page, tmdbBaseUrl, matches, json, options);
}

/** Mocks the first episode of a show (Trakt history + TMDB details). */
export async function mockFirstEpisode(page: Page, show: Show): Promise<void> {
  await mockTrakt(page, pathEquals(`/shows/${show.ids.trakt}/seasons/1/episodes/1`), {
    ids: show.ids,
    season: 1,
    number: 1,
    title: 'Pilot',
    first_aired: '2008-01-20T19:00:00.000Z',
  });
  await mockTmdb(page, pathEquals(`/3/tv/${show.ids.tmdb}/season/1/episode/1`), {
    ...makeTmdbEpisode(show, 1, 1),
    still_path: null,
  });
}

/** Mocks the fetches the show page itself fires (show, TMDB and first episode). */
export async function mockShowPageApi(page: Page, show: Show): Promise<void> {
  await mockTrakt(page, pathEquals(`/shows/${show.ids.slug}`), {
    ...show,
    overview: 'A chemistry teacher turned methamphetamine manufacturer.',
  });
  await mockTmdb(page, pathEquals(`/3/tv/${show.ids.tmdb}`), makeTmdbShow(show));
  await mockFirstEpisode(page, show);
}

/** Mocks adding a show to the watchlist and the resulting watchlist state. */
export function mockWatchlistAdd(page: Page, show: Show): void {
  void mockTrakt(page, pathEquals('/sync/watchlist'), {
    added: { movies: [], episodes: [], shows: [{ ids: show.ids }] },
    not_found: { movies: [], episodes: [], shows: [] },
  });
  void mockTrakt(page, pathEquals('/users/me/watchlist/shows'), [makeWatchlistItem(show)]);
}

/** Mocks removing a show from the watchlist and the resulting watchlist state. */
export function mockWatchlistRemove(page: Page, show: Show): void {
  void mockTrakt(page, pathEquals('/sync/watchlist/remove'), {
    removed: { movies: [], episodes: [], shows: [{ ids: show.ids }] },
    not_found: { movies: [], episodes: [], shows: [] },
  });
  void mockTrakt(page, pathEquals('/users/me/watchlist/shows'), []);
}
