import { TAG_NAMES } from '../models/TechnologyTag.js';
import type { CredentialDoc } from '../models/Credential.js';

const TAG_COUNT = TAG_NAMES.length;
const TWELVE_MONTHS_MS = 365 * 24 * 60 * 60 * 1000;

/**
 * Derive a 0-100 tech proficiency score from a user's credentials.
 *
 *   score = 30*breadth + 30*depth + 20*recency + 20*endorsement
 *
 * - breadth: fraction of 5 tags covered by at least one credential
 * - depth: fraction of credentials at DEEP or THERE tier
 * - recency: fraction of credentials earned in the past 12 months
 * - endorsement: fraction of credentials at THERE tier (endorsement-gated)
 */
export function computeTechScore(
  credentials: Pick<CredentialDoc, 'tagName' | 'tier' | 'earnedDate'>[],
): number {
  const total = credentials.length;
  if (total === 0) return 0;

  const tagsCovered = new Set(credentials.map((c) => c.tagName));
  const breadth = Math.min(1, tagsCovered.size / TAG_COUNT);

  const deepOrThere = credentials.filter((c) => c.tier === 'DEEP' || c.tier === 'THERE').length;
  const depth = deepOrThere / total;

  const now = Date.now();
  const recentCount = credentials.filter(
    (c) => now - new Date(c.earnedDate).getTime() <= TWELVE_MONTHS_MS,
  ).length;
  const recency = recentCount / total;

  const thereCount = credentials.filter((c) => c.tier === 'THERE').length;
  const endorsement = thereCount / total;

  const raw = 30 * breadth + 30 * depth + 20 * recency + 20 * endorsement;
  return Math.max(0, Math.min(100, Math.round(raw)));
}

export function getTechScoreLabel(score: number): 'Building' | 'Growing' | 'Recognised' | 'Authority' {
  if (score <= 24) return 'Building';
  if (score <= 49) return 'Growing';
  if (score <= 74) return 'Recognised';
  return 'Authority';
}

/**
 * Derive a tech role title from primary tag focus. Rough MVP mapping.
 */
export function deriveTechRole(baseRole: string | null, primaryTag: string | null): string | null {
  if (!baseRole) return null;
  const map: Record<string, string> = {
    Kitchen: 'TechChef',
    Bar: 'TechBartender',
    Floor: 'TechServer',
    Management: 'TechManager',
    Ownership: 'TechOperator',
    Other: 'TechPro',
  };
  const role = map[baseRole] ?? 'TechPro';
  if (primaryTag === 'BEVERAGE') return baseRole === 'Bar' ? 'TechBartender' : 'TechBarista';
  return role;
}
