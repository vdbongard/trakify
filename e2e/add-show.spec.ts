import { expect, test, type Page } from '@playwright/test';
import {
  blockExternalTraffic,
  mockFirstEpisode,
  mockTmdb,
  mockTrakt,
  mockWatchlistAdd,
  pathEquals,
} from './helpers/api';
import { seedApp } from './helpers/seed';
import {
  breakingBad,
  makeTmdbShow,
  makeWatchlistItem,
  theWire,
  type Show,
} from './helpers/fixtures';

function searchResult(show: Show): { score: number; type: 'show'; show: Show } {
  return { score: 0.5, type: 'show', show };
}

function mockShows(page: Page, shows: Show[]): void {
  for (const show of shows) {
    void mockTmdb(page, pathEquals(`/3/tv/${show.ids.tmdb}`), makeTmdbShow(show));
  }
}

function mockSearch(page: Page, shows: Show[]): void {
  void mockTrakt(page, pathEquals('/search/show'), shows.map(searchResult));
}

test.describe('Add show', () => {
  test.beforeEach(async ({ page }) => {
    await blockExternalTraffic(page);
    await seedApp(page);
  });

  test('shows the most watched shows', async ({ page }) => {
    void mockTrakt(page, pathEquals('/shows/watched/weekly'), [
      {
        watcher_count: 1000,
        play_count: 1200,
        collected_count: 0,
        collector_count: 0,
        show: breakingBad,
      },
      {
        watcher_count: 900,
        play_count: 1000,
        collected_count: 0,
        collector_count: 0,
        show: theWire,
      },
    ]);
    mockShows(page, [breakingBad, theWire]);

    await page.goto('/shows/add-show');

    await expect(page.getByRole('heading', { name: 'Breaking Bad' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'The Wire' })).toBeVisible();
  });

  test('loads trending shows from the trending chip', async ({ page }) => {
    void mockTrakt(page, pathEquals('/shows/trending'), [
      { watchers: 200, show: breakingBad },
      { watchers: 100, show: theWire },
    ]);
    mockShows(page, [breakingBad, theWire]);

    await page.goto('/shows/add-show');
    await page.getByText('Trending').click();

    await expect(page).toHaveURL(/slug=trending/);
    await expect(page.getByRole('heading', { name: 'Breaking Bad' })).toBeVisible();
  });

  test('searches for a show', async ({ page }) => {
    mockSearch(page, [breakingBad]);
    mockShows(page, [breakingBad]);

    await page.goto('/shows/add-show');
    await page.getByLabel('Search shows...').fill('Breaking');
    await page.getByLabel('Search shows...').press('Enter');

    await expect(page).toHaveURL(/q=Breaking/);
    await expect(page.getByRole('heading', { name: 'Breaking Bad' })).toBeVisible();
  });

  test('adds the searched show to the watchlist', async ({ page }) => {
    mockSearch(page, [breakingBad]);
    mockShows(page, [breakingBad]);
    mockWatchlistAdd(page, breakingBad);
    await mockFirstEpisode(page, breakingBad);

    await page.goto('/shows/add-show');
    await page.getByLabel('Search shows...').fill('Breaking');
    await page.getByLabel('Search shows...').press('Enter');

    await expect(page.getByLabel('Add show')).toBeVisible();
    await page.getByLabel('Add show').click();

    await expect(page.getByLabel('Remove show')).toBeVisible();
  });

  test('removes the searched show from the watchlist', async ({ page }) => {
    await seedApp(page, { watchlist: [makeWatchlistItem(breakingBad)] });
    mockSearch(page, [breakingBad]);
    mockShows(page, [breakingBad]);
    void mockTrakt(page, pathEquals('/sync/watchlist/remove'), {
      removed: { movies: [], episodes: [], shows: [{ ids: breakingBad.ids }] },
      not_found: { movies: [], episodes: [], shows: [] },
    });
    void mockTrakt(page, pathEquals('/users/me/watchlist/shows'), []);

    await page.goto('/shows/add-show');
    await page.getByLabel('Search shows...').fill('Breaking');
    await page.getByLabel('Search shows...').press('Enter');

    await expect(page.getByLabel('Remove show')).toBeVisible();
    await page.getByLabel('Remove show').click();

    await expect(page.getByLabel('Add show')).toBeVisible();
  });

  test('loads popular shows from the popular chip', async ({ page }) => {
    void mockTrakt(page, pathEquals('/shows/popular'), [breakingBad, theWire]);
    mockShows(page, [breakingBad, theWire]);

    await page.goto('/shows/add-show');
    await page.getByText('Popular').click();

    await expect(page).toHaveURL(/slug=popular/);
    await expect(page.getByRole('heading', { name: 'Breaking Bad' })).toBeVisible();
  });

  test('loads recommended shows from the recommended chip', async ({ page }) => {
    void mockTrakt(page, pathEquals('/shows/recommended'), [{ user_count: 8, show: breakingBad }]);
    mockShows(page, [breakingBad]);

    await page.goto('/shows/add-show');
    await page.getByText('Recommended').click();

    await expect(page).toHaveURL(/slug=recommended/);
    await expect(page.getByRole('heading', { name: 'Breaking Bad' })).toBeVisible();
  });

  test('opens a show from the search results', async ({ page }) => {
    mockSearch(page, [breakingBad]);
    mockShows(page, [breakingBad]);

    await page.goto('/shows/add-show');
    await page.getByLabel('Search shows...').fill('Breaking');
    await page.getByLabel('Search shows...').press('Enter');

    await page.getByRole('heading', { name: 'Breaking Bad' }).click();

    await expect(page).toHaveURL(/\/shows\/s\/breaking-bad$/);
  });
});
