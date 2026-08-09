import { expect, test } from '@playwright/test';
import { blockExternalTraffic } from './helpers/api';
import { seedApp } from './helpers/seed';

test.describe('Header', () => {
  test.beforeEach(async ({ page }) => {
    await blockExternalTraffic(page);
    await seedApp(page);
  });

  test('navigates to the progress page when tapping the logo', async ({ page }) => {
    await page.goto('/shows/watchlist');

    await page.getByRole('link', { name: 'Trakify' }).first().click();

    await expect(page).toHaveURL(/\/shows\/progress$/);
  });

  test('opens the search page from the top bar', async ({ page }) => {
    await page.goto('/shows/progress');

    await page.getByLabel('Search icon').click();

    await expect(page).toHaveURL(/\/shows\/search$/);
  });

  test('navigates through the authentication sidebar links', async ({ page }) => {
    await page.goto('/shows/progress');

    await page.getByRole('link', { name: 'Lists' }).click();
    await expect(page).toHaveURL(/\/lists$/);

    await page.getByRole('link', { name: 'Shows' }).click();
    await expect(page).toHaveURL(/\/shows\/progress$/);

    await page.getByRole('link', { name: 'Statistics' }).click();
    await expect(page).toHaveURL(/\/statistics$/);
  });

  test('navigates with the top tabs', async ({ page }) => {
    await page.goto('/shows/progress');

    await page.getByRole('tab', { name: 'Upcoming' }).click();
    await expect(page).toHaveURL(/\/shows\/upcoming$/);

    await page.getByRole('tab', { name: 'Watchlist' }).click();
    await expect(page).toHaveURL(/\/shows\/watchlist$/);
  });

  test('switches the theme from the menu', async ({ page }) => {
    await page.goto('/shows/progress');

    await page.getByLabel('Open menu').click();
    await page.getByRole('menuitem', { name: 'Theme' }).click();
    await page.getByRole('menuitem', { name: 'Dark' }).click();

    await expect
      .poll(() => page.evaluate(() => document.documentElement.classList.value))
      .toContain('dark-theme');
  });

  test('logs out from the menu', async ({ page }) => {
    await page.goto('/shows/progress');

    await page.getByLabel('Open menu').click();
    await page.getByRole('menuitem', { name: 'Logout' }).click();

    await expect(page).toHaveURL(/\/login$/);
    await expect(page.getByRole('button', { name: 'Login to Trakt' })).toBeVisible();
  });
});
