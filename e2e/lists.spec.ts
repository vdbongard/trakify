import { expect, test } from '@playwright/test';
import { blockExternalTraffic, mockTrakt, pathEquals } from './helpers/api';
import { seedApp } from './helpers/seed';
import {
  breakingBad,
  makeList,
  makeListItem,
  makeShowWatched,
  makeTmdbShow,
  theWire,
} from './helpers/fixtures';

test.describe('Lists', () => {
  test.beforeEach(async ({ page }) => {
    await blockExternalTraffic(page);
    await seedApp(page);
  });

  test('shows the empty state for an account without lists', async ({ page }) => {
    await page.goto('/lists');

    await expect(page.getByText('No list added.')).toBeVisible();
  });

  test('lists the shows inside a personal list', async ({ page }) => {
    await seedApp(page, {
      lists: [
        {
          ...makeList(breakingBad),
          name: 'Keep watching',
          ids: { slug: 'keep-watching', trakt: 11 },
        },
      ],
      listItems: {
        'keep-watching': [makeListItem(breakingBad, 1)],
      },
      tmdbShows: {
        [breakingBad.ids.tmdb!]: makeTmdbShow(breakingBad),
      },
    });

    await page.goto('/lists');

    await expect(page.getByRole('tab', { name: 'Keep watching' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Breaking Bad' })).toBeVisible();
  });

  test('navigates between lists', async ({ page }) => {
    await seedApp(page, {
      lists: [
        {
          ...makeList(breakingBad),
          name: 'First list',
          ids: { slug: 'first-list', trakt: 11 },
        },
        {
          ...makeList(theWire),
          name: 'Second list',
          ids: { slug: 'second-list', trakt: 12 },
        },
      ],
      listItems: {
        'first-list': [makeListItem(breakingBad, 1)],
        'second-list': [makeListItem(theWire, 2)],
      },
      tmdbShows: {
        [breakingBad.ids.tmdb!]: makeTmdbShow(breakingBad),
        [theWire.ids.tmdb!]: makeTmdbShow(theWire),
      },
    });

    await page.goto('/lists');

    await expect(page.getByRole('tab', { name: 'First list' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Breaking Bad' })).toBeVisible();

    await page.getByRole('tab', { name: 'Second list' }).click();

    await expect(page).toHaveURL(/slug=second-list/);
    await expect(page.getByRole('heading', { name: 'The Wire' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Breaking Bad' })).toHaveCount(0);
  });

  test('adds and removes list items through the dialog', async ({ page }) => {
    await seedApp(page, {
      showsWatched: [makeShowWatched(breakingBad), makeShowWatched(theWire)],
      lists: [
        {
          ...makeList(breakingBad),
          name: 'Keep watching',
          ids: { slug: 'keep-watching', trakt: 11 },
        },
      ],
      listItems: {
        'keep-watching': [makeListItem(breakingBad, 9)],
      },
    });
    void mockTrakt(
      page,
      pathEquals('/users/me/lists/11/items'),
      {
        added: { movies: [], episodes: [], shows: [{ ids: theWire.ids }] },
        already_in_list: { movies: [], episodes: [], shows: [] },
        not_found: { movies: [], episodes: [], shows: [] },
      },
      { method: 'POST' },
    );
    void mockTrakt(
      page,
      pathEquals('/users/me/lists/11/items/remove'),
      {
        removed: { movies: [], episodes: [], shows: [{ ids: breakingBad.ids }] },
        not_found: { movies: [], episodes: [], shows: [] },
      },
      { method: 'POST' },
    );

    await page.goto('/lists');

    await page.getByRole('button', { name: 'Add list items' }).click();

    const dialog = page.getByRole('dialog');
    await expect(dialog.getByText('Manage list items')).toBeVisible();
    await expect(dialog.getByRole('checkbox', { name: /Breaking Bad/ })).toBeChecked();
    await expect(dialog.getByRole('checkbox', { name: /The Wire/ })).not.toBeChecked();

    const addResponsePromise = page.waitForResponse(
      (res) => res.request().method() === 'POST' && res.url().endsWith('/users/me/lists/11/items'),
    );
    const removeResponsePromise = page.waitForResponse(
      (res) =>
        res.request().method() === 'POST' && res.url().endsWith('/users/me/lists/11/items/remove'),
    );

    await dialog.getByRole('checkbox', { name: /The Wire/ }).check();
    await dialog.getByRole('checkbox', { name: /Breaking Bad/ }).uncheck();
    await dialog.getByRole('button', { name: 'Ok' }).click();

    const [addResponse, removeResponse] = await Promise.all([
      addResponsePromise,
      removeResponsePromise,
    ]);
    expect(addResponse.ok()).toBe(true);
    expect(removeResponse.ok()).toBe(true);
  });
});
