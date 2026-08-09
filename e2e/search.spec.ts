import { expect, test } from '@playwright/test';
import { blockExternalTraffic, mockTmdb, pathEquals } from './helpers/api';
import { seedApp } from './helpers/seed';
import { breakingBad, makeShowWatched, makeTmdbShow } from './helpers/fixtures';

test.describe('Search', () => {
  test.beforeEach(async ({ page }) => {
    await blockExternalTraffic(page);
    await seedApp(page, {
      showsWatched: [makeShowWatched(breakingBad)],
    });
    void mockTmdb(page, pathEquals(`/3/tv/${breakingBad.ids.tmdb}`), makeTmdbShow(breakingBad));
  });

  test('focuses the search input on load', async ({ page }) => {
    await page.goto('/shows/search');

    await expect(page.getByLabel('Search added shows...')).toBeFocused();
  });

  test('shows no results for an empty query', async ({ page }) => {
    await page.goto('/shows/search');

    await expect(page.getByRole('heading', { name: 'Breaking Bad' })).toHaveCount(0);
  });

  test('finds an added show by title', async ({ page }) => {
    await page.goto('/shows/search?q=Breaking');

    await expect(page.getByRole('heading', { name: 'Breaking Bad' })).toBeVisible();
  });

  test('shows no results when nothing matches', async ({ page }) => {
    await page.goto('/shows/search?q=zzzz');

    await expect(page.getByRole('heading', { name: 'Breaking Bad' })).toHaveCount(0);
  });
});
