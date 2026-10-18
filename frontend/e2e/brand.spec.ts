import { test, expect } from '@playwright/test';
import { snap } from './helpers';

test.describe('Brand: Midnight Navy + Lime (no purple, no orange)', () => {
  test('landing page uses Midnight Navy hero, no purple or orange', async ({ page }, info) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle').catch(() => undefined);
    await page.waitForTimeout(800);

    const html = await page.content();
    expect(html).not.toContain('#36186b');
    expect(html).not.toContain('#38286b');
    expect(html).not.toContain('#F39005');
    expect(html).not.toContain('#f39005');
    expect(html).not.toContain('#1d123c');

    const hero = page.locator('section').first();
    const bg = await hero.evaluate((el) => getComputedStyle(el).backgroundColor);
    expect(bg).not.toContain('54, 24, 107');

    await snap(page, 'brand-landing', info);
  });

  test('login page has no purple or orange', async ({ page }, info) => {
    await page.goto('/login');
    await page.waitForLoadState('networkidle').catch(() => undefined);
    const html = await page.content();
    expect(html).not.toContain('#36186b');
    expect(html).not.toContain('#F39005');
    await snap(page, 'brand-login', info);
  });

  test('signup page has no purple or orange', async ({ page }, info) => {
    await page.goto('/signup');
    await page.waitForLoadState('networkidle').catch(() => undefined);
    const html = await page.content();
    expect(html).not.toContain('#36186b');
    expect(html).not.toContain('#F39005');
    await snap(page, 'brand-signup', info);
  });

  test('passport 404 page has no purple', async ({ page }, info) => {
    await page.goto('/passport/test-no-such-user-brand-check');
    await page.waitForLoadState('networkidle').catch(() => undefined);
    const html = await page.content();
    expect(html).not.toContain('#36186b');
    expect(html).not.toContain('#1d123c');
    await snap(page, 'brand-passport-404', info);
  });
});
