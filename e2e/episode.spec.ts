import { expect, test } from '@playwright/test';
import {
  blockExternalTraffic,
  createResponseGate,
  mockEpisodeHistoryActions,
  mockShowPageApi,
  mockTrakt,
  pathEquals,
} from './helpers/api';
import { seedApp } from './helpers/seed';
import {
  breakingBad,
  makeEpisodeFull,
  makeEpisode,
  makeShowProgress,
  makeWatchedShowsSeed,
} from './helpers/fixtures';

const episode1 = makeEpisodeFull(breakingBad, { season: 1, number: 1, title: 'Pilot' });
const episode2 = makeEpisodeFull(breakingBad, {
  season: 1,
  number: 2,
  title: "Cat's in the Bag",
});

test.describe('Episode page', () => {
  test.beforeEach(async ({ page }) => {
    await blockExternalTraffic(page);
    await mockShowPageApi(page, breakingBad);
    await mockTrakt(page, pathEquals('/shows/1/seasons/1'), [episode1, episode2]);
    await mockEpisodeHistoryActions(page);
  });

  test('shows the episode header with breadcrumbs', async ({ page }) => {
    await seedApp(page);

    await page.goto('/shows/s/breaking-bad/season/1/episode/1');

    await expect(page.getByRole('heading', { name: 'Pilot', level: 1 })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Breaking Bad' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Season 1' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Episode 1' })).toBeVisible();
  });

  test('disables previous on the first episode and navigates to the next', async ({ page }) => {
    await seedApp(page);

    await page.goto('/shows/s/breaking-bad/season/1/episode/1');

    await expect(page.getByLabel('Previous episode')).toBeDisabled();
    await expect(page.getByLabel('Next episode')).toHaveAttribute(
      'href',
      '/shows/s/breaking-bad/season/1/episode/2',
    );

    await page.getByLabel('Next episode').click();
    await expect(page).toHaveURL(/\/shows\/s\/breaking-bad\/season\/1\/episode\/2$/);
  });

  test('is reachable without being logged in', async ({ page }) => {
    await seedApp(page, {}, { auth: false });

    await page.goto('/shows/s/breaking-bad/season/1/episode/1');

    await expect(page.getByRole('heading', { name: 'Pilot', level: 1 })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Breaking Bad' })).toBeVisible();
  });

  test('toggles an episode from seen to unseen and back through history actions', async ({
    page,
  }) => {
    const removeGate = createResponseGate();
    const addGate = createResponseGate();
    const watchedNext = makeEpisode(breakingBad, {
      season: 1,
      number: 2,
      title: "Cat's in the Bag",
    });
    await seedApp(
      page,
      makeWatchedShowsSeed([
        {
          show: breakingBad,
          completed: 1,
          next: watchedNext,
        },
      ]),
    );
    // The page refetches the detailed progress on open (syncShowProgress) and the
    // generic beforeEach mock answers `completed: 0`; override it with the seeded
    // progress so episode 1 starts out seen.
    await mockTrakt(
      page,
      pathEquals('/shows/1/progress/watched'),
      makeShowProgress(breakingBad, {
        completed: 1,
        nextEpisode: watchedNext,
        lastEpisodeSeason: 1,
        lastEpisodeNumber: 1,
      }),
    );
    await page.route('https://api.trakt.tv/sync/history/remove', async (route) => {
      await removeGate.wait;
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ deleted: { episodes: [] }, not_found: { episodes: [] } }),
      });
    });
    await page.route('https://api.trakt.tv/sync/history', async (route) => {
      await addGate.wait;
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ added: { episodes: [] }, not_found: { episodes: [] } }),
      });
    });

    await page.goto('/shows/s/breaking-bad/season/1/episode/1');

    const markUnseen = page.getByRole('button', { name: 'Mark as unseen' });
    await expect(markUnseen).toBeEnabled();
    const removeRequestPromise = page.waitForRequest(
      (request) =>
        request.method() === 'POST' && new URL(request.url()).pathname === '/sync/history/remove',
    );
    await markUnseen.click();
    await expect(markUnseen).toBeDisabled();
    await expect(page.locator('t-episode mat-spinner')).toHaveCount(0);
    const removeRequest = await removeRequestPromise;
    expect(removeRequest.postDataJSON()).toMatchObject({ episodes: [{ ids: episode1.ids }] });
    removeGate.release();
    await expect(page.getByRole('button', { name: 'Mark as seen' })).toBeVisible();

    const markSeen = page.getByRole('button', { name: 'Mark as seen' });
    const addRequestPromise = page.waitForRequest(
      (request) =>
        request.method() === 'POST' && new URL(request.url()).pathname === '/sync/history',
    );
    await markSeen.click();
    await expect(markSeen).toBeDisabled();
    await expect(page.locator('t-episode mat-spinner')).toHaveCount(0);
    const addRequest = await addRequestPromise;
    expect(addRequest.postDataJSON()).toMatchObject({ episodes: [{ ids: episode1.ids }] });
    addGate.release();
    await expect(page.getByRole('button', { name: 'Mark as unseen' })).toBeVisible();
  });
});
