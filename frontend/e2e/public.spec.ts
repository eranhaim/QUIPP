import { test, expect } from '@playwright/test';
import { snap, scanA11y } from './helpers';

test.describe('Public routes', () => {
  test('landing page renders hero + CTAs', async ({ page }, info) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/quipp/i);
    // At least one primary CTA is visible.
    const cta = page.getByRole('link', { name: /get quipp'd|start free|sign up|start/i }).first();
    await expect(cta).toBeVisible();
    await snap(page, 'landing', info);

    const violations = await scanA11y(page);
    // Log rather than fail immediately — we want to see the whole grid of
    // problems first; the a11y.spec.ts file gates on severity.
    if (violations.length > 0) {
      console.log('landing a11y:', JSON.stringify(violations, null, 2));
    }
  });

  test('login page loads and shows email/password form', async ({ page }, info) => {
    await page.goto('/login');
    await expect(page.getByLabel(/email/i)).toBeVisible();
    await expect(page.getByLabel(/password/i)).toBeVisible();
    await expect(page.getByRole('button', { name: /log in|sign in/i })).toBeVisible();
    await snap(page, 'login', info);
  });

  test('signup page loads and shows email/password form', async ({ page }, info) => {
    await page.goto('/signup');
    await expect(page.getByLabel(/email/i)).toBeVisible();
    await expect(page.getByLabel(/password/i).first()).toBeVisible();
    await expect(page.getByRole('button', { name: /sign up|create/i })).toBeVisible();
    await snap(page, 'signup', info);
  });

  test('verify page shows 404 for unknown verification id', async ({ page }, info) => {
    await page.goto('/verify/DOES-NOT-EXIST');
    await expect(page.getByRole('heading', { name: /credential not found|verification failed/i })).toBeVisible();
    await snap(page, 'verify-404', info);
  });

  test('passport shows not-found for unknown username', async ({ page }, info) => {
    await page.goto('/passport/definitely-not-a-real-username-1234');
    await expect(page.getByRole('heading', { name: /passport not found/i })).toBeVisible();
    await snap(page, 'passport-404', info);
  });
});
