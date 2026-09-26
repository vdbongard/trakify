import { expect, test } from '@playwright/test';
import {
  blockExternalTraffic,
  mockEpisodeHistoryActions,
  mockShowPageApi,
  mockWatchlistAdd,
  mockWatchlistRemove,
} from './helpers/api';
import { seedApp } from './helpers/seed';
import {
  breakingBad,
  makeEpisode,
  makeEpisodeFull,
  makeTmdbEpisode,
  makeTmdbSeason,
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

const episodeAfterNext: Episode = makeEpisode(breakingBad, {
  season: 1,
  number: 3,
  title: 'A New Beginning',
});
const seenFlowSeedBase = makeWatchedShowsSeed([
  { show: breakingBad, completed: 1, next: nextEpisode },
]);
const seenFlowSeed = {
  ...seenFlowSeedBase,
  showsEpisodes: {
    ...seenFlowSeedBase.showsEpisodes,
    [`${breakingBad.ids.trakt}-1-2`]: makeEpisodeFull(breakingBad, {
      season: 1,
      number: 2,
      title: 'The Next',
      firstAired: '2020-01-01T20:00:00.000Z',
    }),
    [`${breakingBad.ids.trakt}-1-3`]: makeEpisodeFull(breakingBad, {
      season: 1,
      number: 3,
      title: episodeAfterNext.title ?? 'A New Beginning',
      firstAired: '2020-01-08T20:00:00.000Z',
    }),
  },
  tmdbEpisodes: {
    [`${breakingBad.ids.tmdb}-1-2`]: makeTmdbEpisode(breakingBad, 1, 2),
    [`${breakingBad.ids.tmdb}-1-3`]: makeTmdbEpisode(breakingBad, 1, 3),
  },
  tmdbSeasons: {
    [`${breakingBad.ids.tmdb}-1`]: makeTmdbSeason(breakingBad.ids.tmdb ?? 0, {
      seasonNumber: 1,
      episodes: [makeTmdbEpisode(breakingBad, 1, 2), makeTmdbEpisode(breakingBad, 1, 3)],
    }),
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

  test('marks the next episode as seen and advances to the next episode', async ({ page }) => {
    await seedApp(page, seenFlowSeed);
    await mockShowPageApi(page, breakingBad);
    mockEpisodeHistoryActions(page);

    await page.goto('/shows/s/breaking-bad');

    const markSeen = page.getByRole('button', { name: 'Mark as seen' });
    await expect(markSeen).toBeEnabled();
    const addRequestPromise = page.waitForRequest(
      (request) =>
        request.method() === 'POST' && new URL(request.url()).pathname === '/sync/history',
    );
    await markSeen.click();

    await expect(page.getByText('A New Beginning')).toBeVisible();
    const addRequest = await addRequestPromise;
    expect(addRequest.postDataJSON()).toMatchObject({ episodes: [{ ids: nextEpisode.ids }] });
  });
});
