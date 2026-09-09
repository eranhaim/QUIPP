import { test, expect } from '@playwright/test';
import { snap, uniqueEmail, SMART_OVENS_ANSWERS, scanA11y, type AxeViolationSummary } from './helpers';

test.describe('Full learner flow: signup → onboarding → academy → earn credential → passport → verify', () => {
  test.setTimeout(180_000);

  test('happy path end to end', async ({ page }, info) => {
    const email = uniqueEmail('learner');
    const password = 'Sup3rSecret!12';
    const authedViolations: Array<{ where: string; violations: AxeViolationSummary[] }> = [];
    const scan = async (where: string) => {
      const v = await scanA11y(page);
      if (v.length > 0) authedViolations.push({ where, violations: v });
    };

    // ── SIGN UP ───────────────────────────────────────────────────────
    await page.goto('/signup');
    await page.getByLabel(/first name/i).fill('Ada').catch(() => undefined);
    await page.getByLabel(/email/i).fill(email);
    await page.getByLabel(/password/i).first().fill(password);
    await page.getByRole('button', { name: /sign up|create/i }).click();

    // Signup lands on onboarding.
    await page.waitForURL(/\/onboarding|\/home/, { timeout: 20_000 });
    await snap(page, '01-post-signup', info);

    // ── CONVERSATIONAL ONBOARDING (4 screens) ──────────────────────────
    if (page.url().includes('/onboarding')) {
      // Choose the worker Passport conversation.
      await page.getByRole('button', { name: /my professional passport/i }).click();
      await page.getByRole('button', { name: /this is me/i }).click();
      // Choose a role.
      await page.getByRole('button', { name: /kitchen/i }).click();
      await page.getByRole('button', { name: /keep going/i }).click();
      // Equipment is optional, so continue to the preview without selecting any.
      await page.getByRole('button', { name: /keep going/i }).click();
      await snap(page, '02-onboarding', info);
      await page.getByRole('button', { name: /build my passport/i }).click();
      await page.waitForURL(/\/home/, { timeout: 20_000 });
    }

    // ── HOME ──────────────────────────────────────────────────────────
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    await snap(page, '03-home', info);
    await scan('home');

    // ── ACADEMY ───────────────────────────────────────────────────────
    await page.goto('/academy');
    await expect(page.getByRole('heading', { name: /every credential/i })).toBeVisible();
    // Match by href — the accessible name of each course card includes the
    // provider, title, description and duration, and we specifically want the
    // IN-tier "Smart Ovens" (not "smart-ovens-deep").
    const smartOvensLink = page.locator('a[href="/training/smart-ovens"]');
    await expect(smartOvensLink.first()).toBeVisible({ timeout: 15_000 });
    await smartOvensLink.first().scrollIntoViewIfNeeded();
    await snap(page, '04-academy', info);
    await scan('academy');

    // ── COURSE DETAIL ─────────────────────────────────────────────────
    await smartOvensLink.first().click();
    await page.waitForURL(/\/training\/smart-ovens$/, { timeout: 20_000 });
    await expect(page.getByRole('heading', { name: /smart ovens/i })).toBeVisible();
    await snap(page, '05-course-detail', info);
    await scan('course-detail');

    // ── START EARNING → COURSE PLAYER ────────────────────────────────
    await page.getByRole('button', { name: /start earning/i }).first().click();
    await page.waitForURL(/\/learn\/smart-ovens/, { timeout: 20_000 });

    // Real world → Video → Knowledge → Mastery Check
    // We walk the intro parts by clicking whatever advance button is visible.
    // The video part gates on 90% watched — we simulate by fast-forwarding
    // the <video> element inside the Playwright browser once it exposes metadata.
    for (let i = 0; i < 8; i++) {
      // Let framer-motion animations settle before we inspect the DOM.
      await page.waitForTimeout(700);

      // If we're already at the mastery check, stop walking parts.
      if (await page.getByText(/question 1 of 10/i).count()) break;

      const videoEl = page.locator('video');
      if (await videoEl.count()) {
        // Reach into React's internal props on the <video> element and call
        // onEnded directly. Dispatching a native 'ended' event is unreliable
        // in React because media events don't bubble; delegated listeners
        // may miss synthetic dispatches. Calling the prop function is stable.
        await page.evaluate(() => {
          const v = document.querySelector('video') as (HTMLVideoElement & Record<string, unknown>) | null;
          if (!v) return;
          const key = Object.keys(v).find((k) => k.startsWith('__reactProps$'));
          if (!key) return;
          const props = v[key] as { onEnded?: (e: unknown) => void; onTimeUpdate?: (e: unknown) => void };
          Object.defineProperty(v, 'duration', { configurable: true, get: () => 10 });
          Object.defineProperty(v, 'currentTime', { configurable: true, get: () => 10 });
          props.onTimeUpdate?.({ target: v, currentTarget: v });
          props.onEnded?.({ target: v, currentTarget: v });
        });
        await page.waitForTimeout(300);
      }

      const advance = page.getByRole('button', {
        name: /forward|ready for the check|start the check|keep watching/i,
      });
      if (!(await advance.count())) break;
      await advance.first().waitFor({ state: 'visible', timeout: 15_000 });
      // force:true bypasses "element is stable" which can flap during the
      // AnimatePresence enter/exit animation on framer-motion parts.
      await advance.first().click({ force: true });
    }

    await expect(page.getByText(/question 1 of 10/i)).toBeVisible({ timeout: 20_000 });
    await snap(page, '06-quiz-q1', info);

    // ── ANSWER ALL 10 QUESTIONS CORRECTLY ─────────────────────────────
    for (let i = 0; i < SMART_OVENS_ANSWERS.length; i++) {
      // Wait for the current question to appear.
      await expect(page.getByText(new RegExp(`question ${i + 1} of 10`, 'i'))).toBeVisible();
      // Each option is a button with the option text — the correct one has a known index.
      const options = page.locator('button:has(span.text-sm)').filter({ has: page.locator('span.text-sm') });
      // Fallback: use nth-of role button in the card
      const answerButtons = page.locator('button.w-full.text-left');
      await answerButtons.nth(SMART_OVENS_ANSWERS[i]).click();
    }

    // ── CREDENTIAL AWARDED ────────────────────────────────────────────
    await expect(page.getByText(/10 \/ 10 correct/i)).toBeVisible({ timeout: 15_000 });
    await expect(page.getByText(/QUIPP-/)).toBeVisible();
    await snap(page, '07-credential-awarded', info);
    await scan('credential-awarded');

    // ── PASSPORT (own) ────────────────────────────────────────────────
    await page.getByRole('button', { name: /view passport/i }).click();
    await page.waitForURL(/\/passport\//, { timeout: 20_000 });
    await expect(page.getByRole('heading', { name: /ada|learner/i }).first()).toBeVisible();
    // Credential patch should be visible.
    await expect(page.getByRole('button', { name: /smart ovens/i }).first()).toBeVisible();
    await snap(page, '08-passport-own', info);
    await scan('passport-own');

    // ── PUBLIC VERIFY ─────────────────────────────────────────────────
    // Grab the verification id text from the page (we saw it earlier). Easier:
    // click the patch → Verify link opens the verify page.
    await page.getByRole('button', { name: /smart ovens/i }).first().click();
    const verifyLink = page.getByRole('link', { name: /^verify$/i });
    await verifyLink.first().click();
    await page.waitForURL(/\/verify\//, { timeout: 20_000 });
    await expect(page.getByRole('heading', { name: /credential verified/i })).toBeVisible();
    await snap(page, '09-verify-public', info);
    await scan('verify-success');

    if (authedViolations.length > 0) {
      console.log('AUTHED A11Y VIOLATIONS:\n' + JSON.stringify(authedViolations, null, 2));
    }
    // Hard-fail on serious/critical a11y in authed pages.
    expect(
      authedViolations,
      'One or more authenticated pages have serious/critical a11y violations',
    ).toEqual([]);
  });
});
