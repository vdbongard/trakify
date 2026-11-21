import { type Page, type Route } from '@playwright/test';
import {
  makeShowProgress,
  makeTmdbEpisode,
  makeTmdbShow,
  makeWatchlistItem,
  type Show,
} from './fixtures';

export const traktBaseUrl = 'https://api.trakt.tv';
export const tmdbBaseUrl = 'https://api.themoviedb.org/3';
export const tmdbImageBaseUrl = 'https://image.tmdb.org';

export type RequestMatcher = (url: URL) => boolean;

export interface ResponseGate {
  wait: Promise<void>;
  release(): void;
}

export function createResponseGate(): ResponseGate {
  let release = (): void => undefined;
  const wait = new Promise<void>((resolve) => {
    release = resolve;
  });
  return { wait, release };
}

export const TRANSPARENT_PNG = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
  'base64',
);

export async function blockExternalTraffic(page: Page): Promise<void> {
  const empty = (route: Route): Promise<void> =>
    route.fulfill({ status: 404, contentType: 'application/json', body: '{}' });

  await page.route(`${traktBaseUrl}/**`, empty);
  await page.route(`${tmdbBaseUrl}/**`, empty);
  await page.route(`${tmdbImageBaseUrl}/**`, (route) =>
    route.fulfill({ status: 200, contentType: 'image/png', body: TRANSPARENT_PNG }),
  );
}

export async function mockTmdbImageSize(
  page: Page,
  size: string,
  width: number,
  height: number,
  gate?: Promise<void>,
): Promise<void> {
  const body = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}"></svg>`;

  await page.route(`${tmdbImageBaseUrl}/t/p/${size}/**`, async (route) => {
    await gate;
    await route.fulfill({ status: 200, contentType: 'image/svg+xml', body });
  });
}

export function pathEquals(path: string): RequestMatcher {
  return (url: URL) => url.pathname === path;
}

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
  {
    method = 'GET',
    status = 200,
    delayMs = 0,
  }: { method?: 'GET' | 'POST' | 'DELETE'; status?: number; delayMs?: number } = {},
): Promise<void> {
  await page.route(`${baseUrl}/**`, async (route) => {
    const url = new URL(route.request().url());
    if (route.request().method() === method && matches(url)) {
      if (delayMs) await new Promise((resolve) => setTimeout(resolve, delayMs));
      await fulfillWithJson(route, json, status);
    } else {
      await route.fallback();
    }
  });
}

export function mockTrakt(
  page: Page,
  matches: RequestMatcher,
  json: unknown,
  options: { method?: 'GET' | 'POST' | 'DELETE'; status?: number; delayMs?: number } = {},
): Promise<void> {
  return mockApi(page, traktBaseUrl, matches, json, options);
}

export function mockTmdb(
  page: Page,
  matches: RequestMatcher,
  json: unknown,
  options: { method?: 'GET' | 'POST' | 'DELETE'; status?: number; delayMs?: number } = {},
): Promise<void> {
  return mockApi(page, tmdbBaseUrl, matches, json, options);
}

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

export async function mockShowPageApi(page: Page, show: Show, progress?: unknown): Promise<void> {
  await mockTrakt(page, pathEquals(`/shows/${show.ids.slug}`), {
    ...show,
    overview: 'A chemistry teacher turned methamphetamine manufacturer.',
  });
  await mockTrakt(
    page,
    pathEquals(`/shows/${show.ids.trakt}/progress/watched`),
    progress ?? makeShowProgress(show, { completed: 0 }),
  );
  await mockTmdb(page, pathEquals(`/3/tv/${show.ids.tmdb}`), makeTmdbShow(show));
  await mockFirstEpisode(page, show);
}

export function mockWatchlistAdd(page: Page, show: Show): void {
  void mockTrakt(
    page,
    pathEquals('/sync/watchlist'),
    {
      added: { movies: [], episodes: [], shows: [{ ids: show.ids }] },
      not_found: { movies: [], episodes: [], shows: [] },
    },
    { method: 'POST' },
  );
  void mockTrakt(page, pathEquals('/users/me/watchlist/shows'), [makeWatchlistItem(show)]);
}

export function mockWatchlistRemove(page: Page, show: Show): void {
  void mockTrakt(
    page,
    pathEquals('/sync/watchlist/remove'),
    {
      removed: { movies: [], episodes: [], shows: [{ ids: show.ids }] },
      not_found: { movies: [], episodes: [], shows: [] },
    },
    { method: 'POST' },
  );
  void mockTrakt(page, pathEquals('/users/me/watchlist/shows'), []);
}

export function mockEpisodeHistoryActions(page: Page): void {
  void mockTrakt(
    page,
    pathEquals('/sync/history'),
    { added: { episodes: [] }, not_found: { episodes: [] } },
    { method: 'POST' },
  );
  void mockTrakt(
    page,
    pathEquals('/sync/history/remove'),
    { deleted: { episodes: [] }, not_found: { episodes: [] } },
    { method: 'POST' },
  );
}
