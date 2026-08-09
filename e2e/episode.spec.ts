import { expect, test } from '@playwright/test';
import { blockExternalTraffic, mockShowPageApi, mockTrakt, pathEquals } from './helpers/api';
import { seedApp } from './helpers/seed';
import { breakingBad, makeEpisodeFull } from './helpers/fixtures';

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
});
