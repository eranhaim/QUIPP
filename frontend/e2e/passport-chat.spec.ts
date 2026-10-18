import { test, expect } from '@playwright/test';
import { snap } from './helpers';

test.describe('Passport public page', () => {
  test('passport 404 shows "not found" heading', async ({ page }, info) => {
    await page.goto('/passport/nonexistent-user-passport-test');
    await expect(page.getByRole('heading', { name: /passport not found/i })).toBeVisible();
    await snap(page, 'passport-not-found', info);
  });

  test('passport short URL /p/ also works', async ({ page }, info) => {
    await page.goto('/p/nonexistent-user-passport-test');
    await expect(page.getByRole('heading', { name: /passport not found/i })).toBeVisible();
    await snap(page, 'passport-short-url-404', info);
  });
});

test.describe('QUIPPY web chat', () => {
  test('chat button is not visible on landing (unauthenticated)', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle').catch(() => undefined);
    await page.waitForTimeout(500);
    const chatButton = page.locator('button[aria-label*="QUIPPY"]');
    await expect(chatButton).toHaveCount(0);
  });
});
