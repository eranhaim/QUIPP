import type { Page, TestInfo } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import fs from 'node:fs';
import path from 'node:path';

/**
 * Ensure the screenshots folder exists then snap the full page into it
 * with a stable, human-readable name. Attaches the file to the test report.
 */
export async function snap(page: Page, name: string, info: TestInfo) {
  const dir = path.join(info.project.outputDir, 'screenshots');
  fs.mkdirSync(dir, { recursive: true });
  const safeProject = info.project.name.replace(/[^a-z0-9-]/gi, '_');
  const safe = `${safeProject}__${name.replace(/[^a-z0-9-]/gi, '_')}.png`;
  const filePath = path.join(dir, safe);
  await page.screenshot({ path: filePath, fullPage: true });
  await info.attach(safe, { path: filePath, contentType: 'image/png' });
  return filePath;
}

export interface AxeViolationSummary {
  id: string;
  impact: string | null;
  help: string;
  nodes: number;
  targets: string[];
}

/**
 * Run an axe accessibility scan restricted to WCAG 2 A/AA rules and return
 * a compact summary of any serious/critical violations.
 *
 * Waits briefly for framer-motion opacity/transform animations to finish
 * before scanning, since axe otherwise sees transient low-opacity elements
 * as contrast failures.
 */
export async function scanA11y(page: Page): Promise<AxeViolationSummary[]> {
  await page.waitForLoadState('networkidle').catch(() => undefined);
  await page.waitForTimeout(900);
  const result = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa'])
    .analyze();
  return result.violations
    .filter((v) => v.impact === 'serious' || v.impact === 'critical')
    .map((v) => ({
      id: v.id,
      impact: v.impact ?? null,
      help: v.help,
      nodes: v.nodes.length,
      targets: v.nodes.slice(0, 3).map((n) => n.target.join(' > ')),
    }));
}

export function uniqueEmail(prefix = 'e2e'): string {
  const t = Date.now().toString(36);
  const r = Math.floor(Math.random() * 1e6).toString(36);
  return `${prefix}-${t}-${r}@quipp.test`;
}

/**
 * Correct answer indexes for the seeded "Smart Ovens" course (10 questions).
 * Kept in the test suite because the API deliberately hides correctIndex
 * from clients. Sourced from backend/src/services/seed.service.ts.
 */
export const SMART_OVENS_ANSWERS = [1, 2, 0, 2, 1, 1, 1, 2, 1, 1];
