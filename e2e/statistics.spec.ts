import { expect, test } from '@playwright/test';
import { blockExternalTraffic, mockTrakt, pathEquals } from './helpers/api';
import { seedApp } from './helpers/seed';
import { breakingBad, gameOfThrones, makeWatchedShowsSeed, type Stats } from './helpers/fixtures';

const stats: Stats = {
  movies: { plays: 0, watched: 0, minutes: 0, collected: 0, ratings: 0, comments: 0 },
  shows: { watched: 2, collected: 0, ratings: 0, comments: 0 },
  seasons: { ratings: 0, comments: 0 },
  episodes: { plays: 2, watched: 2, minutes: 120, collected: 0, ratings: 0, comments: 0 },
  network: { friends: 0, followers: 0, following: 0 },
  ratings: {
    total: 0,
    distribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0, 7: 0, 8: 0, 9: 0, 10: 0 },
  },
};

const watchedSeed = makeWatchedShowsSeed([{ show: breakingBad }, { show: gameOfThrones }]);

test.describe('Statistics', () => {
  test.beforeEach(async ({ page }) => {
    await blockExternalTraffic(page);
    await seedApp(page, watchedSeed);
    void mockTrakt(page, pathEquals('/users/me/stats'), stats);
  });

  test('shows episodes progress for watched shows', async ({ page }) => {
    await page.goto('/statistics');

    await expect(page.getByText('2 / 2')).toBeVisible();
    await expect(page.getByText('0 hidden')).toBeVisible();
    await expect(page.getByText('Watched')).toBeVisible();
  });
});
