import { expect, test, type Locator } from '@playwright/test';
import {
  blockExternalTraffic,
  mockTmdb,
  mockTmdbImageSize,
  mockTrakt,
  pathEquals,
} from './helpers/api';
import { seedApp } from './helpers/seed';
import {
  breakingBad,
  gameOfThrones,
  makeHistoryPlay,
  makeTmdbEpisode,
  makeTmdbShow,
} from './helpers/fixtures';

/**
 * Left and right edges of the text rendered inside `locator`. The element's own box is misleading
 * here: a column flex item stretches to the full width even when its text is short.
 */
function textBox(locator: Locator): Promise<{ left: number; right: number }> {
  return locator.evaluate((node) => {
    const range = document.createRange();
    range.selectNodeContents(node);
    const { left, right } = range.getBoundingClientRect();
    return { left, right };
  });
}

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
    const warnings: string[] = [];
    page.on('console', (message) => {
      if (message.type() === 'warning') warnings.push(message.text());
    });

    await seedApp(page);
    // 16:9 still for one Play, 2:3 poster fallback (no still) for the other, both at real TMDB sizes.
    await mockTmdbImageSize(page, 'w300', 300, 169);
    await mockTmdbImageSize(page, 'w185', 185, 278);
    await mockTrakt(page, pathEquals('/users/me/history/episodes'), [todayPlay, yesterdayPlay]);
    await mockTmdb(page, pathEquals('/3/tv/1399'), {
      ...makeTmdbShow(breakingBad),
      poster_path: '/poster.jpg',
    });
    await mockTmdb(page, pathEquals('/3/tv/1399/season/2/episode/5'), {
      ...makeTmdbEpisode(breakingBad, 2, 5, 'Breakage'),
      still_path: '/still.jpg',
    });
    await mockTmdb(page, pathEquals('/3/tv/1390'), {
      ...makeTmdbShow(gameOfThrones),
      poster_path: '/poster.jpg',
    });
    await mockTmdb(page, pathEquals('/3/tv/1390/season/1/episode/1'), {
      ...makeTmdbEpisode(gameOfThrones, 1, 1, 'Winter Is Coming'),
      still_path: null,
    });

    await page.goto('/shows/history');

    await expect(page.getByRole('heading', { name: 'Today' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Yesterday' })).toBeVisible();

    const episode = page.getByRole('link', { name: /S02E05/ });
    await expect(episode).toBeVisible();
    await expect(episode).toHaveAttribute('href', '/shows/s/breaking-bad/season/2/episode/5');
    await expect(episode).toContainText('Breaking Bad');
    await expect(episode).toContainText('Breakage');
    await expect(episode).toContainText('09:00');

    await expect(page.getByRole('link', { name: /S01E01/ })).toContainText('Winter Is Coming');

    // The Play time reads as part of the Episode details, not pinned to the right edge of the row.
    const [labelBox, timeBox, rowBox] = await Promise.all([
      textBox(episode.getByText('S02E05 · Breakage')),
      textBox(episode.getByText('09:00')),
      episode.boundingBox(),
    ]);
    expect(timeBox.left).toBeCloseTo(labelBox.left, 0);
    expect(rowBox!.x + rowBox!.width - timeBox.right).toBeGreaterThan(100);

    await expect(page.getByRole('img', { name: 'Breakage' })).toHaveAttribute(
      'src',
      /\/t\/p\/w300\/still\.jpg$/,
    );
    await expect(page.getByRole('img', { name: 'Poster' })).toHaveAttribute(
      'src',
      /\/t\/p\/w185\/poster\.jpg$/,
    );

    // Both kinds of artwork must keep their aspect ratio, or NgOptimizedImage warns (NG02952).
    for (const name of ['Breakage', 'Poster']) {
      await expect
        .poll(() =>
          page.getByRole('img', { name }).evaluate((img) => (img as HTMLImageElement).naturalWidth),
        )
        .toBeGreaterThan(0);
    }
    expect(warnings.filter((text) => text.includes('NG02952'))).toEqual([]);
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
