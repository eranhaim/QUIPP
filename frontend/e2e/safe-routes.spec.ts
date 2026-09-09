import { expect, test } from '@playwright/test';
import { scanA11y, uniqueEmail } from './helpers';

test.describe('Safe public, product, and discovery routes', () => {
  test('private catalog and discovery routes redirect signed-out visitors', async ({ page }) => {
    for (const path of ['/products', '/discover']) {
      await page.goto(path);
      await page.waitForURL(/\/login/, { timeout: 20_000 });
      await expect(page.getByLabel(/email/i)).toBeVisible();
    }

    await page.goto('/route-that-does-not-exist');
    await expect(page.getByRole('heading', { name: /not found|404/i })).toBeVisible();
  });

  test('worker onboarding reaches home and safe data routes load without integrations', async ({ page }) => {
    await page.goto('/signup');
    await page.getByLabel(/first name/i).fill('Willa').catch(() => undefined);
    await page.getByLabel(/email/i).fill(uniqueEmail('worker'));
    await page.getByLabel(/password/i).first().fill('Sup3rSecret!12');
    await page.getByRole('button', { name: /sign up|create/i }).click();
    await page.waitForURL(/\/onboarding/, { timeout: 20_000 });

    await page.getByRole('button', { name: /my professional passport/i }).click();
    await page.getByRole('button', { name: /this is me/i }).click();
    await page.getByRole('button', { name: /kitchen/i }).click();
    await page.getByRole('button', { name: /keep going/i }).click();
    await page.getByRole('button', { name: /combi oven/i }).click();
    await page.getByRole('button', { name: /keep going/i }).click();
    await page.getByRole('button', { name: /build my passport/i }).click();
    await page.waitForURL(/\/home/, { timeout: 25_000 });
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();

    await page.goto('/products');
    await expect(page.getByRole('heading', { name: /equipment options/i })).toBeVisible();
    await expect(page.getByLabel(/affiliate disclosure/i)).toContainText(/commission/i);
    expect(
      await scanA11y(page),
      'products has serious/critical accessibility violations',
    ).toEqual([]);

    await page.goto('/discover');
    await expect(page.getByRole('heading', { name: /discover professionals/i })).toBeVisible();
    await expect(page.getByText(/open professional|searching open passports/i)).toBeVisible();
    expect(
      await scanA11y(page),
      'discover has serious/critical accessibility violations',
    ).toEqual([]);
  });
});
