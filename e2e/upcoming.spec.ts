import { expect, test } from '@playwright/test';
import { blockExternalTraffic, mockTrakt, pathStartsWith } from './helpers/api';
import { seedApp } from './helpers/seed';

test.describe('Upcoming', () => {
  test.beforeEach(async ({ page }) => {
    await blockExternalTraffic(page);
    await seedApp(page);
    await mockTrakt(page, pathStartsWith('/calendars/my/shows/'), []);
  });

  test('shows no episodes for an account without upcoming episodes', async ({ page }) => {
    await page.goto('/shows/upcoming');

    await expect(page.getByRole('button', { name: /Load more/ })).toBeVisible();
    await expect(page.getByRole('heading')).toHaveCount(0);
  });
});
