import { expect, test } from '@playwright/test';
import { scanA11y, uniqueEmail } from './helpers';

test.describe('Operator onboarding and workspace', () => {
  test.setTimeout(90_000);

  test('creates a business and loads live empty workspace counts', async ({ page }) => {
    const email = uniqueEmail('operator');
    const company = `E2E Kitchen ${Date.now().toString(36)}`;

    await page.goto('/signup');
    await page.getByLabel(/first name/i).fill('Olivia').catch(() => undefined);
    await page.getByLabel(/email/i).fill(email);
    await page.getByLabel(/password/i).first().fill('Sup3rSecret!12');
    await page.getByRole('button', { name: /sign up|create/i }).click();
    await page.waitForURL(/\/onboarding/, { timeout: 20_000 });

    await page.getByRole('button', { name: /my business team/i }).click();
    await page.getByRole('button', { name: /this is me/i }).click();
    await page.getByLabel(/business name/i).fill(company);
    await page.getByLabel(/business type/i).selectOption('Restaurant');
    await page.getByLabel(/team size/i).fill('12');
    await page.getByRole('button', { name: /keep going/i }).click();
    await page.getByLabel(/^city$/i).fill('Toronto');
    await page.getByLabel(/^country$/i).fill('Canada');
    await page.getByRole('button', { name: /keep going/i }).click();
    await page.getByRole('button', { name: /open my workspace/i }).click();

    await page.waitForURL(/\/operator\/overview/, { timeout: 25_000 });
    await expect(page.getByRole('heading', { level: 1, name: company })).toBeVisible();
    await expect(page.getByRole('heading', { level: 2, name: /overview/i })).toBeVisible();
    await expect(page.getByRole('alert')).toHaveCount(0);

    for (const label of [
      'Active staff',
      'Pending invites',
      'Completed training',
      'In progress',
      'Assigned',
    ]) {
      const metric = page.locator('article').filter({ hasText: label });
      await expect(metric).toContainText('0');
    }
    await expect(page.locator('article').filter({ hasText: 'Locations' })).toContainText('1');

    expect(
      await scanA11y(page),
      'operator overview has serious/critical accessibility violations',
    ).toEqual([]);
  });
});
