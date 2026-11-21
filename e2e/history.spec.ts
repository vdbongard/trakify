import { expect, test, type Locator, type Page } from '@playwright/test';
import {
  blockExternalTraffic,
  mockEpisodeHistoryActions,
  mockShowPageApi,
  mockTmdb,
  mockTmdbImageSize,
  mockTrakt,
  pathEquals,
} from './helpers/api';
import { seedApp } from './helpers/seed';
import {
  recordedNames,
  recordTransitionNames,
  STILL_TRANSITION_NAME as STILL_NAME,
} from './helpers/transitions';
import {
  breakingBad,
  defaultConfig,
  gameOfThrones,
  makeEpisodeFull,
  makeHistoryPlay,
  makeTmdbEpisode,
  makeTmdbShow,
} from './helpers/fixtures';

const IMAGE_DIAGNOSTICS = ['NG02952', 'NG02955'];

function textBox(locator: Locator): Promise<{ left: number; right: number }> {
  return locator.evaluate((node) => {
    const range = document.createRange();
    range.selectNodeContents(node);
    const { left, right } = range.getBoundingClientRect();
    return { left, right };
  });
}

function watchedAt(hours: number, minutes: number, daysAgo = 0): string {
  const date = new Date();
  date.setDate(date.getDate() - daysAgo);
  date.setHours(hours, minutes, 0, 0);
  return date.toISOString();
}

async function mockFollowedRewatch(page: Page, stillOnItsWay?: Promise<void>): Promise<void> {
  const episode = makeEpisodeFull(breakingBad, { season: 1, number: 1, title: 'Pilot' });
  const plays = [
    makeHistoryPlay(breakingBad, {
      id: 100,
      season: 1,
      number: 1,
      title: 'Pilot',
      watchedAt: watchedAt(9, 0),
    }),
    makeHistoryPlay(breakingBad, {
      id: 99,
      season: 1,
      number: 1,
      title: 'Pilot',
      watchedAt: watchedAt(20, 0, 1),
    }),
  ];

  await seedApp(page);
  await mockTmdbImageSize(page, 'w300', 300, 169);
  await mockTmdbImageSize(page, 'original', 1920, 1080, stillOnItsWay);
  await mockTrakt(page, pathEquals('/users/me/history/episodes'), plays);
  await mockShowPageApi(page, breakingBad);
  await mockTrakt(page, pathEquals('/shows/1/seasons/1'), [episode]);
  await mockTmdb(page, pathEquals('/3/tv/1399/season/1/episode/1'), {
    ...makeTmdbEpisode(breakingBad, 1, 1, 'Pilot'),
    still_path: '/still.jpg',
  });
  await mockEpisodeHistoryActions(page);
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
    const imageWarnings: string[] = [];
    page.on('console', (message) => {
      if (message.type() === 'error' || message.type() === 'warning') {
        imageWarnings.push(message.text());
      }
    });

    await seedApp(page);
    await mockTmdbImageSize(page, 'w300', 300, 169);
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

    const [labelBox, timeBox, rowBox] = await Promise.all([
      textBox(episode.getByText('S02E05 Breakage')),
      textBox(episode.getByText('09:00')),
      episode.boundingBox(),
    ]);
    expect(timeBox.left).toBeCloseTo(labelBox.left, 0);
    expect(rowBox!.x + rowBox!.width - timeBox.right).toBeGreaterThan(100);

    await expect(page.getByRole('img', { name: 'Breakage' })).toHaveAttribute(
      'src',
      /\/t\/p\/w300\/still\.jpg$/,
    );
    await expect(page.getByRole('link', { name: /S01E01/ }).getByRole('img')).toHaveCount(0);

    await expect(episode.getByText('09:00')).toHaveCSS('cursor', 'default');
    await expect(page.getByRole('img', { name: 'Breakage' })).toHaveCSS('cursor', 'pointer');

    await expect
      .poll(() =>
        page
          .getByRole('img', { name: 'Breakage' })
          .evaluate((img) => (img as HTMLImageElement).naturalWidth),
      )
      .toBeGreaterThan(0);
    expect(
      imageWarnings.filter((text) => IMAGE_DIAGNOSTICS.some((code) => text.includes(code))),
    ).toEqual([]);
  });

  test("shows the Show and Episode titles in the viewer's language", async ({ page }) => {
    await seedApp(page, { config: { ...defaultConfig(), language: 'de-DE' } });
    await mockTrakt(page, pathEquals('/users/me/history/episodes'), [todayPlay]);
    await mockTrakt(page, pathEquals('/shows/1/translations/de'), [{ title: 'Breaking Bad (DE)' }]);
    await mockTrakt(page, pathEquals('/shows/1/seasons/2/episodes/5/translations/de'), [
      { title: 'Bruch (DE)' },
    ]);

    await page.goto('/shows/history');

    const row = page.getByRole('link', { name: /S02E05/ });
    await expect(row).toContainText('Breaking Bad (DE)');
    await expect(row).toContainText('Bruch (DE)');
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

  test('morphs the followed Play into the still on the Episode page', async ({ page }) => {
    const messages: string[] = [];
    page.on('console', (message) => {
      if (message.type() === 'error' || message.type() === 'warning') {
        messages.push(message.text());
      }
    });

    await recordTransitionNames(page);
    await mockFollowedRewatch(page);

    await page.goto('/shows/history');

    await expect(page.getByRole('img', { name: 'Pilot' }).first()).toBeVisible();

    await page
      .getByRole('link', { name: /S01E01/ })
      .first()
      .click();

    await expect(page).toHaveURL('/shows/s/breaking-bad/season/1/episode/1');
    await expect(page.locator('t-episode-still .still-wrapper')).toHaveCSS(
      'view-transition-name',
      STILL_NAME,
    );

    expect((await recordedNames(page)).old).toEqual([[STILL_NAME]]);
    expect(messages.filter((text) => /duplicate view-transition-name/i.test(text))).toEqual([]);
  });

  test('morphs the still back into the Play it was followed from', async ({ page }) => {
    const messages: string[] = [];
    page.on('console', (message) => {
      if (message.type() === 'error' || message.type() === 'warning') {
        messages.push(message.text());
      }
    });

    await recordTransitionNames(page);
    await mockFollowedRewatch(page);

    await page.goto('/shows/history');
    await expect(page.getByRole('img', { name: 'Pilot' }).first()).toBeVisible();

    await page
      .getByRole('link', { name: /S01E01/ })
      .first()
      .click();
    await expect(page).toHaveURL('/shows/s/breaking-bad/season/1/episode/1');

    await page.goBack();

    await expect(page).toHaveURL('/shows/history');
    const thumbs = page.locator('t-history-item img.thumb-image');
    await expect(thumbs.first()).toHaveCSS('view-transition-name', STILL_NAME);
    await expect(thumbs.nth(1)).toHaveCSS('view-transition-name', 'none');

    expect((await recordedNames(page)).new).toEqual([[STILL_NAME], [STILL_NAME]]);
    expect(messages.filter((text) => /duplicate view-transition-name/i.test(text))).toEqual([]);
  });

  test('takes the still name off the Play again once the morph back has run', async ({ page }) => {
    await mockFollowedRewatch(page);

    await page.goto('/shows/history');
    await expect(page.getByRole('img', { name: 'Pilot' }).first()).toBeVisible();

    await page
      .getByRole('link', { name: /S01E01/ })
      .first()
      .click();
    await expect(page).toHaveURL('/shows/s/breaking-bad/season/1/episode/1');

    await page.goBack();

    const thumb = page.locator('t-history-item img.thumb-image').first();
    await expect(thumb).toHaveCSS('view-transition-name', STILL_NAME);
    await expect(thumb).not.toHaveCSS('view-transition-name', STILL_NAME);
  });

  test('keeps the Play’s artwork on the Episode page until its own still has loaded', async ({
    page,
  }) => {
    let releaseStill = (): void => undefined;
    const stillOnItsWay = new Promise<void>((resolve) => {
      releaseStill = resolve;
    });

    await mockFollowedRewatch(page, stillOnItsWay);

    await page.goto('/shows/history');
    const rowArtwork = page.locator('t-history-item img.thumb-image').first();
    await expect(rowArtwork).toBeVisible();
    const rowArtworkUrl = await rowArtwork.getAttribute('src');

    await page
      .getByRole('link', { name: /S01E01/ })
      .first()
      .click();
    await expect(page).toHaveURL('/shows/s/breaking-bad/season/1/episode/1');

    const ownStill = page.locator('t-episode-still img[alt="Episode still"]');
    const standIn = page.locator('t-episode-still img.still-stand-in');

    await expect(standIn).toHaveJSProperty('src', rowArtworkUrl);
    await expect(standIn).toHaveJSProperty('complete', true);
    expect(await standIn.evaluate((image: HTMLImageElement) => image.naturalWidth)).toBe(300);
    await expect(standIn).toHaveCSS('opacity', '1');
    await expect(standIn).toHaveCSS('z-index', '0');
    await expect(ownStill).toHaveCSS('z-index', '1');
    await expect(ownStill).toHaveJSProperty('complete', false);

    const standInBox = await standIn.boundingBox();
    const ownStillBox = await ownStill.boundingBox();
    expect(standInBox?.width).toBeCloseTo(ownStillBox?.width ?? 0, 0);
    expect(standInBox?.height).toBeCloseTo(ownStillBox?.height ?? 0, 0);

    releaseStill();
    await expect(ownStill).toHaveJSProperty('complete', true);
  });

  test('morphs the still back after the Episode page was reloaded', async ({ page }) => {
    await recordTransitionNames(page);
    await mockFollowedRewatch(page);

    await page.goto('/shows/history');
    await expect(page.getByRole('img', { name: 'Pilot' }).first()).toBeVisible();

    await page
      .getByRole('link', { name: /S01E01/ })
      .first()
      .click();
    await expect(page).toHaveURL('/shows/s/breaking-bad/season/1/episode/1');

    await page.reload();
    await expect(page.locator('t-episode-still .still-wrapper')).toHaveCSS(
      'view-transition-name',
      STILL_NAME,
    );

    await page.goBack();

    await expect(page).toHaveURL('/shows/history');
    await expect(page.locator('t-history-item img.thumb-image').first()).toHaveCSS(
      'view-transition-name',
      STILL_NAME,
    );
    expect((await recordedNames(page)).new.at(-1)).toEqual([STILL_NAME]);
  });
});
