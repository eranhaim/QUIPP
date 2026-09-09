import type { IntentFilters, QuippyIntent } from './state.js';

const PROMPT_INJECTION_PATTERN =
  /(?:ignore|disregard|forget)\s+(?:all\s+)?(?:previous|prior|system|developer)\s+(?:instructions?|messages?)|(?:reveal|show|print)\s+(?:the\s+)?(?:system|developer)\s+prompt|system\s+prompt|developer\s+message|התעלם\s+(?:מכל\s+)?(?:ההוראות|הנחיות)|פרומפט\s+ה?(?:מערכת|מפתח)/iu;

export interface DeterministicRoute {
  intent: QuippyIntent;
  filters: IntentFilters;
}

export function extractIntroduction(
  content: string,
): Pick<IntentFilters, 'candidateUsername' | 'purpose'> {
  const username = content.match(/@([a-z0-9][a-z0-9-]{1,39})\b/i)?.[1]?.toLowerCase();
  const purpose = content
    .match(/(?:\bfor\b|\babout\b|\bregarding\b|למטרת|בנושא)\s+(.+)$/iu)?.[1]
    ?.trim()
    .slice(0, 500);
  return {
    ...(username ? { candidateUsername: username } : {}),
    ...(purpose ? { purpose } : {}),
  };
}

export function exactIntroductionConfirmation(content: string): string | null {
  return content.match(/^CONFIRM INTRO @([a-z0-9][a-z0-9-]{1,39})$/i)?.[1]?.toLowerCase() ?? null;
}

export function extractQuoteCommand(content: string): IntentFilters | null {
  const parts = content.split('|').map((part) => part.trim());
  if (parts.length !== 5 || !/^(?:CONFIRM\s+)?QUOTE$/i.test(parts[0])) return null;
  const budgetMajor = Number(parts[3].replace(/[$,\s]/g, ''));
  if (
    !parts[1] ||
    !parts[2] ||
    !parts[4] ||
    !Number.isFinite(budgetMajor) ||
    budgetMajor <= 0 ||
    budgetMajor > 10_000_000
  ) {
    return null;
  }
  return {
    category: parts[1].slice(0, 100),
    city: parts[2].slice(0, 120),
    region: parts[2].slice(0, 120),
    budgetMaxCents: Math.round(budgetMajor * 100),
    currency: 'USD',
    requirements: parts[4].slice(0, 5000),
  };
}

export function sameQuote(a: IntentFilters, b: IntentFilters): boolean {
  return (
    a.category === b.category &&
    a.city === b.city &&
    a.budgetMaxCents === b.budgetMaxCents &&
    a.requirements === b.requirements
  );
}

export function deterministicIntent(content: string): DeterministicRoute {
  const lower = content.toLowerCase();
  if (PROMPT_INJECTION_PATTERN.test(content)) {
    return { intent: 'general', filters: {} };
  }

  const quote = extractQuoteCommand(content);
  if (quote) return { intent: 'lead', filters: quote };

  const introduction = extractIntroduction(content);
  if (/introduc|connect me|חבר|היכרות/u.test(lower) || introduction.candidateUsername) {
    return { intent: 'introduction', filters: { ...introduction, confirmed: false } };
  }
  const courseRelated = /course|training|credential|academy|קורס|הכשר|הסמכ/u.test(lower);
  if (
    courseRelated &&
    /team|staff|assigned|completion|status|צוות|הוקצ|סטטוס|השלימ/u.test(lower)
  ) {
    return { intent: 'business_training_status', filters: {} };
  }
  if (/worker|candidate|hire|employee|עובד|מועמד|לגייס/u.test(lower)) {
    return { intent: 'worker_search', filters: {} };
  }
  if (/technician|expert|professional|mentor|specialist|טכנאי|מומחה|מקצוען|מנטור/u.test(lower)) {
    return { intent: 'professional_search', filters: {} };
  }
  if (courseRelated) {
    return { intent: 'course_search', filters: { query: content.slice(0, 120) } };
  }
  if (/quote|lead|proposal|estimate|הצעת מחיר|(?:צור|ליצור|פתח)\s+ליד|אומדן/u.test(lower)) {
    return { intent: 'lead', filters: {} };
  }
  if (/buy|compare|price|product|catalog|supplier|לקנות|השוו|השווא|מחיר|מוצר|קטלוג|ספק/u.test(lower)) {
    return { intent: 'product_search', filters: { query: content.slice(0, 120) } };
  }
  if (/error|fault|oven|machine|equipment|alarm|smoke|gas odor|exposed wiring|interlock|תקלה|קוד|תנור|מכונה|ציוד|אזעקה|עשן|ריח גז|חיווט חשוף|מעקף בטיחות/u.test(lower)) {
    return { intent: 'equipment', filters: {} };
  }
  if (/hello|hi\b|hey\b|who are you|get started|sign up|register|create (?:an? |my )?account|שלום|היי|מי את|מי אתה|להתחיל|הרשמה|לפתוח חשבון/u.test(lower)) {
    return { intent: 'onboarding', filters: {} };
  }
  return { intent: 'general', filters: {} };
}
