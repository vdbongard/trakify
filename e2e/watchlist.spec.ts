import { expect, test } from '@playwright/test';
import { blockExternalTraffic } from './helpers/api';
import { seedApp } from './helpers/seed';
import {
  breakingBad,
  gameOfThrones,
  makeWatchlistItem,
  makeWatchedShowsSeed,
} from './helpers/fixtures';

const watchlistSeed = {
  watchlist: [makeWatchlistItem(breakingBad, 100), makeWatchlistItem(gameOfThrones, 101)],
  ...makeWatchedShowsSeed([{ show: breakingBad }, { show: gameOfThrones }]),
};

test.describe('Watchlist', () => {
  test.beforeEach(async ({ page }) => {
    await blockExternalTraffic(page);
    await seedApp(page);
  });

  test('shows the empty state for a fresh account', async ({ page }) => {
    await page.goto('/shows/watchlist');

    await expect(page.getByRole('link', { name: 'Add show to watchlist' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Breaking Bad' })).toHaveCount(0);
  });

  test('lists watchlist shows with their next episode', async ({ page }) => {
    await seedApp(page, watchlistSeed);

    await page.goto('/shows/watchlist');

    await expect(page.getByRole('heading', { name: 'Breaking Bad' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Game of Thrones' })).toBeVisible();
    await expect(page.getByText('S01E01').first()).toBeVisible();
  });
});
