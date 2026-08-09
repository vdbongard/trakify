import { expect, test } from '@playwright/test';
import { blockExternalTraffic } from './helpers/api';
import { seedApp } from './helpers/seed';

test.describe('Authentication', () => {
  test.beforeEach(async ({ page }) => {
    await blockExternalTraffic(page);
  });

  test('shows the login page for anonymous visitors', async ({ page }) => {
    await page.goto('/login');

    await expect(page.getByRole('button', { name: 'Login to Trakt' })).toBeVisible();
  });

  test('shows an error snackbar when the OAuth redirect fails', async ({ page }) => {
    await page.goto('/redirect?code=invalid');

    await expect(page.getByText('Something went wrong')).toBeVisible();
  });

  test('redirects logged-in users from the login page to the app', async ({ page }) => {
    await seedApp(page);
    await page.goto('/login');

    await expect(page).toHaveURL(/\/shows\/progress$/);
  });
});
