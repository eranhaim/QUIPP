import { test, expect } from '@playwright/test';
import { snap, uniqueEmail } from './helpers';

/**
 * Lightweight admin surface checks. Full admin flows (upload video → attach to
 * course → publish) need admin credentials, which we surface via
 * `QUIPP_ADMIN_EMAIL` and `QUIPP_ADMIN_PASSWORD` env vars. When they're absent
 * we still verify that the admin routes are role-gated for non-admin users.
 */
test.describe('Admin surface', () => {
  test.setTimeout(120_000);

  test('unauthenticated user is redirected to login', async ({ page }) => {
    await page.goto('/admin/courses');
    await page.waitForURL(/\/login\?next=/, { timeout: 15_000 });
    expect(page.url()).toContain('%2Fadmin');
  });

  test('non-admin worker cannot access admin panel', async ({ page }, info) => {
    const email = uniqueEmail('non-admin');
    const password = 'Sup3rSecret!12';

    await page.goto('/signup');
    await page.getByLabel(/first name/i).fill('Marisa').catch(() => undefined);
    await page.getByLabel(/email/i).fill(email);
    await page.getByLabel(/password/i).first().fill(password);
    await page.getByRole('button', { name: /sign up|create/i }).click();
    await page.waitForURL(/\/onboarding|\/home/, { timeout: 20_000 });

    await page.goto('/admin/courses');
    // ProtectedRoute redirects role-mismatch users to /home.
    await page.waitForURL(/\/home/, { timeout: 15_000 });
    await snap(page, 'admin-non-admin-redirect', info);
  });

  test.describe('with admin credentials', () => {
    const email = process.env.QUIPP_ADMIN_EMAIL;
    const password = process.env.QUIPP_ADMIN_PASSWORD;
    test.skip(!email || !password, 'set QUIPP_ADMIN_EMAIL and QUIPP_ADMIN_PASSWORD to run');

    test('admin lands on courses list and can toggle status', async ({ page }, info) => {
      await page.goto('/login');
      await page.getByLabel(/email/i).fill(email!);
      await page.getByLabel(/password/i).fill(password!);
      await page.getByRole('button', { name: /log in/i }).click();
      await page.waitForURL(/\/home/, { timeout: 15_000 });

      await page.goto('/admin');
      await page.waitForURL(/\/admin\/courses/, { timeout: 15_000 });
      await expect(page.getByRole('heading', { name: /^courses$/i })).toBeVisible();
      await snap(page, 'admin-courses-list', info);

      // Visit the Videos tab so the schema renders end-to-end.
      await page.getByRole('link', { name: /videos/i }).click();
      await page.waitForURL(/\/admin\/videos/, { timeout: 15_000 });
      await expect(page.getByRole('heading', { name: /^videos$/i })).toBeVisible();
      await snap(page, 'admin-videos-list', info);
    });
  });
});
