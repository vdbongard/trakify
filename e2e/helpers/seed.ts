import type { Page } from '@playwright/test';
import { LocalStorage } from '../../src/types/Enum';
import { defaultConfig } from './fixtures';

// OAuth storage keys angular-oauth2-oidc reads directly from localStorage.
export const AUTH_STORAGE_KEYS: Record<string, string> = {
  access_token: 'e2e-access-token',
  id_token: 'e2e-id-token',
  refresh_token: 'e2e-refresh-token',
  token_type: 'Bearer',
  expires_at: String(Number.MAX_SAFE_INTEGER),
  access_token_stored_at: String(Date.now()),
};

export interface SeedData {
  lastActivity?: unknown;
  showsWatched?: unknown;
  showsHidden?: unknown;
  showsProgress?: Record<string, unknown>;
  showsEpisodes?: Record<string, unknown>;
  tmdbShows?: Record<string, unknown>;
  tmdbSeasons?: Record<string, unknown>;
  tmdbEpisodes?: Record<string, unknown>;
  favorites?: number[];
  watchlist?: unknown[];
  lists?: unknown[];
  listItems?: Record<string, unknown[]>;
  config?: unknown;
}

/**
 * Writes the given app data (plus the OAuth token and a freshly-synced config)
 * into localStorage before any app code runs. Applying the injection script
 * again on the same page replaces the seeded values.
 */
export async function seedApp(
  page: Page,
  data: SeedData = {},
  options: { auth?: boolean } = {},
): Promise<void> {
  const payload: Record<string, string> = {};

  if (options.auth !== false) {
    for (const [key, value] of Object.entries(AUTH_STORAGE_KEYS)) {
      payload[key] = value;
    }
  }

  const config = (data.config as Record<string, unknown> | undefined) ?? defaultConfig();
  payload[LocalStorage.CONFIG] = JSON.stringify(config);

  const entries: [string, unknown][] = [
    [LocalStorage.SHOWS_WATCHED, data.showsWatched],
    [LocalStorage.SHOWS_HIDDEN, data.showsHidden],
    [LocalStorage.SHOWS_PROGRESS, data.showsProgress],
    [LocalStorage.SHOWS_EPISODES, data.showsEpisodes],
    [LocalStorage.TMDB_SHOWS, data.tmdbShows],
    [LocalStorage.TMDB_SEASONS, data.tmdbSeasons],
    [LocalStorage.TMDB_EPISODES, data.tmdbEpisodes],
    [LocalStorage.FAVORITES, data.favorites],
    [LocalStorage.WATCHLIST, data.watchlist],
    [LocalStorage.LISTS, data.lists],
    [LocalStorage.LIST_ITEMS, data.listItems],
    [LocalStorage.LAST_ACTIVITY, data.lastActivity],
  ];

  for (const [key, value] of entries) {
    if (value !== undefined) payload[key] = JSON.stringify(value);
  }

  await page.addInitScript((storage) => {
    for (const [key, value] of Object.entries(storage)) {
      localStorage.setItem(key, value);
    }
  }, payload);
}
