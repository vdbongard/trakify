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
  breakingBad,
  gameOfThrones,
  makeEpisodeFull,
  makeHistoryPlay,
  makeTmdbEpisode,
  makeTmdbShow,
} from './helpers/fixtures';

/** NgOptimizedImage diagnostics the History page must not produce. */
const IMAGE_DIAGNOSTICS = ['NG02952', 'NG02955'];

/** The name the Episode still carries in a view transition, on both sides of a History ⇄ Episode
 *  navigation. Must match `EPISODE_STILL_TRANSITION_NAME`. */
const STILL_NAME = 'episode-still';

/**
 * Records the view transition names of every transition the router starts: the old view's before
 * the update, the new view's after it — still before the browser takes its snapshot of the new view,
 * which is the moment a name has to be on the element.
 */
async function recordTransitionNames(page: Page): Promise<void> {
  await page.addInitScript(() => {
    const names = (): string[] =>
      Array.from(document.querySelectorAll('*'))
        .map((element) => (element as HTMLElement).style.getPropertyValue('view-transition-name'))
        .filter((name) => name !== '');

    const recorded: { old: string[][]; new: string[][] } = { old: [], new: [] };
    (window as unknown as { recorded: typeof recorded }).recorded = recorded;

    const documentWithTransitions = document as unknown as {
      startViewTransition: (callback: () => void | Promise<void>) => unknown;
    };
    const startViewTransition = documentWithTransitions.startViewTransition.bind(document);
    documentWithTransitions.startViewTransition = (callback): unknown => {
      recorded.old.push(names());
      return startViewTransition(async () => {
        await callback();
        recorded.new.push(names());
      });
    };
  });
}

/** The names recorded by {@link recordTransitionNames}, without the empty captures. */
function recordedNames(page: Page): Promise<{ old: string[][]; new: string[][] }> {
  return page.evaluate(() => {
    const recorded = (window as unknown as { recorded: { old: string[][]; new: string[][] } })
      .recorded;
    return {
      old: recorded.old.filter((names) => names.length > 0),
      new: recorded.new.filter((names) => names.length > 0),
    };
  });
}

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

/**
 * A History holding one Episode as a rewatch — both Plays list the same Episode, so both rows show
 * the same still — plus everything the Episode page and its still need. The first Play is the one
 * the tests follow. `stillOnItsWay` holds the Episode page's own still back, as a slow connection
 * would.
 */
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
    // NgOptimizedImage reports through console: the aspect-ratio warning (NG02952) and the
    // unprioritised LCP image error (NG02955).
    const imageWarnings: string[] = [];
    page.on('console', (message) => {
      if (message.type() === 'error' || message.type() === 'warning') {
        imageWarnings.push(message.text());
      }
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

    // The row is a link, but only its artwork advertises that: the Play details keep the default
    // cursor, as on the Show list rows (material's non-interactive list item sets the default).
    await expect(episode.getByText('09:00')).toHaveCSS('cursor', 'default');
    await expect(page.getByRole('img', { name: 'Breakage' })).toHaveCSS('cursor', 'pointer');

    // Both kinds of artwork must keep their aspect ratio, and the LCP still must be prioritised,
    // or NgOptimizedImage complains (NG02952 / NG02955).
    for (const name of ['Breakage', 'Poster']) {
      await expect
        .poll(() =>
          page.getByRole('img', { name }).evaluate((img) => (img as HTMLImageElement).naturalWidth),
        )
        .toBeGreaterThan(0);
    }
    expect(
      imageWarnings.filter((text) => IMAGE_DIAGNOSTICS.some((code) => text.includes(code))),
    ).toEqual([]);
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

    // The initial navigation captures nothing; the click names the followed row, and only it: the
    // other Play of the same Episode stays out, or the browser would drop the transition.
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
    // Only the followed Play is named, out of the two rows showing the same Episode, and it is
    // named by the time the browser captures the new view: a back navigation carries no Episode
    // info, so the History reads it from the URL that was left.
    const thumbs = page.locator('t-history-item img.thumb-image');
    await expect(thumbs.first()).toHaveCSS('view-transition-name', STILL_NAME);
    await expect(thumbs.nth(1)).toHaveCSS('view-transition-name', 'none');

    expect((await recordedNames(page)).new).toEqual([[STILL_NAME], [STILL_NAME]]);
    expect(messages.filter((text) => /duplicate view-transition-name/i.test(text))).toEqual([]);
  });

  test('keeps the Play’s artwork on the Episode page until its own still has loaded', async ({
    page,
  }) => {
    // The Episode page asks for a bigger file than the row showed, so on a slow connection the
    // artwork would otherwise vanish into an empty box for as long as that file takes.
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

    // The very file the row showed, already loaded, filling the box the Episode page's still will.
    await expect(standIn).toHaveJSProperty('src', rowArtworkUrl);
    await expect(standIn).toHaveJSProperty('complete', true);
    expect(await standIn.evaluate((image: HTMLImageElement) => image.naturalWidth)).toBe(300);
    await expect(standIn).toHaveCSS('opacity', '1');
    await expect(standIn).toHaveCSS('z-index', '0');
    await expect(ownStill).toHaveCSS('z-index', '1');
    await expect(ownStill).toHaveJSProperty('complete', false);

    // Covering the same box, so trading one for the other cannot shift or clip the artwork.
    const standInBox = await standIn.boundingBox();
    const ownStillBox = await ownStill.boundingBox();
    expect(standInBox?.width).toBeCloseTo(ownStillBox?.width ?? 0, 0);
    expect(standInBox?.height).toBeCloseTo(ownStillBox?.height ?? 0, 0);

    // And it gives way once this page's own still arrives.
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

    // A reload restarts the app, so nothing the History rendered from is left to render from: the
    // row still has to be there when the browser captures the new view of the way back.
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
