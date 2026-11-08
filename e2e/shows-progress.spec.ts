import { expect, test } from '@playwright/test';
import {
  blockExternalTraffic,
  mockShowPageApi,
  mockTmdb,
  mockTrakt,
  pathEquals,
} from './helpers/api';
import { seedApp } from './helpers/seed';
import {
  breakingBad,
  gameOfThrones,
  makeEpisode,
  makeEpisodeFull,
  makeShowProgress,
  makeTmdbEpisode,
  makeTmdbSeason,
  makeTmdbShow,
  makeTmdbShowSeason,
  makeWatchedShowsSeed,
} from './helpers/fixtures';

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

  test('keeps the remaining Episode count after visiting a Show', async ({ page }) => {
    const nextEpisode = makeEpisode(breakingBad, { season: 1, number: 2, title: 'The Next' });
    const progress = makeShowProgress(breakingBad, {
      completed: 1,
      aired: 3,
      nextEpisode,
      lastEpisodeSeason: 1,
      lastEpisodeNumber: 1,
    });
    const seasonEpisodes = [1, 2, 3].map((number) =>
      makeEpisodeFull(breakingBad, { season: 1, number, title: `Episode ${number}` }),
    );

    await seedApp(page, {
      ...makeWatchedShowsSeed([{ show: breakingBad, completed: 1, aired: 3, next: nextEpisode }]),
      tmdbShows: {
        [String(breakingBad.ids.tmdb)]: makeTmdbShow(breakingBad, {
          seasons: [makeTmdbShowSeason(1)],
        }),
      },
    });
    await mockShowPageApi(page, breakingBad, progress);
    await mockTmdb(
      page,
      pathEquals(`/3/tv/${breakingBad.ids.tmdb}`),
      makeTmdbShow(breakingBad, { seasons: [makeTmdbShowSeason(1)] }),
    );
    // The Show page caches this whole season list while also persisting its Next Episode detail.
    await mockTrakt(page, pathEquals(`/shows/${breakingBad.ids.trakt}/seasons/1`), seasonEpisodes);
    await mockTrakt(
      page,
      pathEquals(`/shows/${breakingBad.ids.trakt}/seasons/1/episodes/2`),
      seasonEpisodes[1],
    );
    await mockTmdb(
      page,
      pathEquals(`/3/tv/${breakingBad.ids.tmdb}/season/1`),
      makeTmdbSeason(breakingBad.ids.tmdb ?? 0, {
        seasonNumber: 1,
        episodes: [makeTmdbEpisode(breakingBad, 1, 2)],
      }),
    );
    await mockTmdb(
      page,
      pathEquals(`/3/tv/${breakingBad.ids.tmdb}/season/1/episode/2`),
      makeTmdbEpisode(breakingBad, 1, 2),
    );

    await page.goto('/shows/progress');
    await expect(page.getByText('2 remaining')).toBeVisible();

    await page.locator('t-show-list-item-wrapper a').first().click();
    await expect(page.getByRole('heading', { name: 'Breaking Bad' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Next episode' })).toBeVisible();

    await page.goBack();

    await expect(page.getByRole('heading', { name: 'Breaking Bad' })).toBeVisible();
    await expect(page.getByText('2 remaining')).toBeVisible();
  });
});
