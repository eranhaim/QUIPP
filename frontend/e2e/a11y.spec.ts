import { test, expect } from '@playwright/test';
import { scanA11y } from './helpers';

const PUBLIC_ROUTES: Array<{ path: string; name: string }> = [
  { path: '/', name: 'landing' },
  { path: '/login', name: 'login' },
  { path: '/signup', name: 'signup' },
  { path: '/verify/DOES-NOT-EXIST', name: 'verify-404' },
];

test.describe('Accessibility — WCAG 2 A/AA (serious + critical only)', () => {
  for (const route of PUBLIC_ROUTES) {
    test(`no serious/critical violations on ${route.name}`, async ({ page }) => {
      await page.goto(route.path);
      // let deferred content settle
      await page.waitForLoadState('networkidle').catch(() => undefined);
      const violations = await scanA11y(page);
      if (violations.length > 0) {
        console.log(`${route.name} a11y violations:`, JSON.stringify(violations, null, 2));
      }
      expect(violations, `${route.name} has serious/critical a11y violations`).toEqual([]);
    });
  }
});
