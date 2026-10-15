import { expect, test } from '@playwright/test';
import { blockExternalTraffic, mockTmdb, mockTrakt, pathEquals } from './helpers/api';
import { seedApp } from './helpers/seed';
import {
  breakingBad,
  gameOfThrones,
  makeHistoryPlay,
  makeTmdbEpisode,
  makeTmdbShow,
} from './helpers/fixtures';

/** A timestamp at the given local wall-clock time, `daysAgo` days back. */
function watchedAt(hours: number, minutes: number, daysAgo = 0): string {
  const date = new Date();
  date.setDate(date.getDate() - daysAgo);
  date.setHours(hours, minutes, 0, 0);
  return date.toISOString();
}

const todayPlay = makeHistoryPlay(breakingBad, {
  id: 100,
  season: 2,
  number: 5,
  title: 'Breakage',
  watchedAt: watchedAt(9, 0),
});
const yesterdayPlay = makeHistoryPlay(gameOfThrones, {
  id: 101,
  season: 1,
  number: 1,
  title: 'Winter Is Coming',
  watchedAt: watchedAt(20, 0, 1),
});

test.describe('History', () => {
  test.beforeEach(async ({ page }) => {
    await blockExternalTraffic(page);
  });

  test('lists recent Plays grouped by day', async ({ page }) => {
    await seedApp(page);
    await mockTrakt(page, pathEquals('/users/me/history/episodes'), [todayPlay, yesterdayPlay]);
    await mockTmdb(page, pathEquals('/3/tv/1399'), {
      ...makeTmdbShow(breakingBad),
      poster_path: '/poster.jpg',
    });
    await mockTmdb(page, pathEquals('/3/tv/1399/season/2/episode/5'), {
      ...makeTmdbEpisode(breakingBad, 2, 5, 'Breakage'),
      still_path: '/still.jpg',
    });
    await mockTmdb(page, pathEquals('/3/tv/1390'), makeTmdbShow(gameOfThrones));
    await mockTmdb(page, pathEquals('/3/tv/1390/season/1/episode/1'), {
      ...makeTmdbEpisode(gameOfThrones, 1, 1, 'Winter Is Coming'),
      still_path: '/still.jpg',
    });

    await page.goto('/shows/history');

    await expect(page.getByRole('heading', { name: 'Today' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Yesterday' })).toBeVisible();

    const episode = page.locator('a.history-item', { hasText: 'S02E05' });
    await expect(episode).toBeVisible();
    await expect(episode).toHaveAttribute('href', '/shows/s/breaking-bad/season/2/episode/5');
    await expect(episode).toContainText('Breaking Bad');
    await expect(episode).toContainText('Breakage');
    await expect(episode).toContainText('09:00');

    await expect(page.locator('a.history-item', { hasText: 'S01E01' })).toContainText(
      'Winter Is Coming',
    );
  });

  test('shows the empty state for an account with no Plays', async ({ page }) => {
    await seedApp(page);
    await mockTrakt(page, pathEquals('/users/me/history/episodes'), []);

    await page.goto('/shows/history');

    await expect(page.getByText('No episodes watched yet.')).toBeVisible();
  });

  test('is reachable from the bottom tabs', async ({ page }) => {
    await seedApp(page);
    await mockTrakt(page, pathEquals('/users/me/history/episodes'), []);

    await page.goto('/shows/watchlist');

    await page.getByRole('tab', { name: 'History' }).click();

    await expect(page).toHaveURL('/shows/history');
  });
});
