import { expect, test } from '@playwright/test';
import {
  blockExternalTraffic,
  mockShowPageApi,
  mockWatchlistAdd,
  mockWatchlistRemove,
} from './helpers/api';
import { seedApp } from './helpers/seed';
import {
  breakingBad,
  makeEpisode,
  makeTmdbEpisode,
  makeWatchedShowsSeed,
  makeWatchlistItem,
  type Episode,
} from './helpers/fixtures';

const nextEpisode: Episode = makeEpisode(breakingBad, { season: 1, number: 2, title: 'The Next' });

const watchedSeed = {
  ...makeWatchedShowsSeed([{ show: breakingBad, completed: 1, next: nextEpisode }]),
  tmdbEpisodes: {
    [`${breakingBad.ids.tmdb}-1-2`]: makeTmdbEpisode(breakingBad, 1, 2),
  },
};

test.describe('Show page', () => {
  test.beforeEach(async ({ page }) => {
    await blockExternalTraffic(page);
  });

  test('shows the show header and the next episode', async ({ page }) => {
    await seedApp(page, watchedSeed);
    await mockShowPageApi(page, breakingBad);

    await page.goto('/shows/s/breaking-bad');

    await expect(page.getByRole('heading', { name: 'Breaking Bad' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Next episode' })).toBeVisible();
    await expect(page.getByText('The Next')).toBeVisible();
  });

  test('adds the show to the watchlist from the header', async ({ page }) => {
    await seedApp(page);
    await mockShowPageApi(page, breakingBad);
    mockWatchlistAdd(page, breakingBad);

    await page.goto('/shows/s/breaking-bad');

    await page.getByRole('button', { name: 'Add to watchlist' }).click();
    await expect(page.getByRole('button', { name: 'Remove from watchlist' })).toBeVisible();
  });

  test('removes the show from the watchlist from the header', async ({ page }) => {
    await seedApp(page, { watchlist: [makeWatchlistItem(breakingBad)] });
    await mockShowPageApi(page, breakingBad);
    mockWatchlistRemove(page, breakingBad);

    await page.goto('/shows/s/breaking-bad');

    await page.getByRole('button', { name: 'Remove from watchlist' }).click();
    await expect(page.getByRole('button', { name: 'Add to watchlist' })).toBeVisible();
  });
});
