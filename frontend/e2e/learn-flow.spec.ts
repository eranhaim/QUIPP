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

    // ── ONBOARDING (5 screens) ─────────────────────────────────────────
    if (page.url().includes('/onboarding')) {
      // Screen 1: welcome → "Start"
      await page.getByRole('button', { name: /^start$/i }).click();
      // Screen 2: value props → "Forward →"
      await page.getByRole('button', { name: /forward/i }).click();
      // Screen 3: role select → click "Kitchen" → "This is me"
      await page.getByRole('button', { name: /^kitchen$/i }).click();
      await page.getByRole('button', { name: /this is me/i }).click();
      // Screen 4: equipment → "These are mine" (skip picking any for speed)
      await page.getByRole('button', { name: /these are mine/i }).click();
      // Screen 5: preview → "Start earning"
      await snap(page, '02-onboarding', info);
      await page.getByRole('button', { name: /start earning/i }).click();
      await page.waitForURL(/\/home/, { timeout: 20_000 });
    }

    // ── HOME ──────────────────────────────────────────────────────────
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    await snap(page, '03-home', info);
    await scan('home');

    // ── ACADEMY ───────────────────────────────────────────────────────
    await page.goto('/academy');
    await expect(page.getByRole('heading', { name: /every credential/i })).toBeVisible();
    await expect(page.getByRole('link', { name: /smart ovens/i }).first()).toBeVisible({ timeout: 15_000 });
    await snap(page, '04-academy', info);
    await scan('academy');

    // ── COURSE DETAIL ─────────────────────────────────────────────────
    await page.getByRole('link', { name: /smart ovens/i }).first().click();
    await page.waitForURL(/\/training\/smart-ovens/);
    await expect(page.getByRole('heading', { name: /smart ovens/i })).toBeVisible();
    await snap(page, '05-course-detail', info);
    await scan('course-detail');

    // ── START EARNING → COURSE PLAYER ────────────────────────────────
    await page.getByRole('button', { name: /start earning/i }).first().click();
    await page.waitForURL(/\/learn\/smart-ovens/, { timeout: 20_000 });

    // Real world → Knowledge → Mastery Check
    const forward = page.getByRole('button', { name: /forward|ready for the check/i });
    // Walk two intro parts.
    for (let i = 0; i < 2; i++) {
      await forward.first().waitFor({ state: 'visible', timeout: 10_000 });
      await forward.first().click();
    }
    await expect(page.getByText(/question 1 of 10/i)).toBeVisible({ timeout: 10_000 });
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
