import { expect, test } from '@playwright/test';
import { blockExternalTraffic } from './helpers/api';
import { seedApp } from './helpers/seed';
import { breakingBad, gameOfThrones, makeEpisode, makeWatchedShowsSeed } from './helpers/fixtures';

const watchedSeed = makeWatchedShowsSeed([
  {
    show: breakingBad,
    completed: 1,
    next: makeEpisode(breakingBad, { season: 1, number: 2, title: 'The Next' }),
  },
  {
    show: gameOfThrones,
    completed: 0,
    aired: 1,
    next: makeEpisode(gameOfThrones, { season: 1, number: 1, title: 'Pilot' }),
  },
]);

test.describe('Shows progress', () => {
  test.beforeEach(async ({ page }) => {
    await blockExternalTraffic(page);
    await seedApp(page);
  });

  test('shows the empty state for a fresh account', async ({ page }) => {
    await page.goto('/shows/progress');

    await expect(page.getByRole('link', { name: 'Add show to watchlist' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Breaking Bad' })).toHaveCount(0);
  });

  test('lists watched shows with their next episode', async ({ page }) => {
    await seedApp(page, watchedSeed);

    await page.goto('/shows/progress');

    await expect(page.getByRole('heading', { name: 'Breaking Bad' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Game of Thrones' })).toBeVisible();
    await expect(page.getByText('S01E02')).toBeVisible();
    await expect(page.getByText('S01E01')).toBeVisible();
    await expect(page.getByText(/S01E\d{2}/)).toHaveCount(2);
  });
});
