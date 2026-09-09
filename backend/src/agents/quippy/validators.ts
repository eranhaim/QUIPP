import {
  AFFILIATE_DISCLOSURE,
  AFFILIATE_DISCLOSURE_HE,
} from './prompts.js';
import type { QuippyGraphState } from './state.js';

const MAX_RESPONSE_LENGTH = 3500;
const FORBIDDEN_PATTERNS = [
  /\bact now\b/i,
  /\bdon'?t miss out\b/i,
  /\bguaranteed\b/i,
  /\bi am (?:a )?human\b/i,
  /\bI'?m (?:a )?human\b/i,
  /אני (?:בן אדם|אנושי)/u,
];
const CONTACT_PATTERNS = [
  /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/i,
  /(?:https?:\/\/|www\.)\S+/i,
  /(?:\+?\d[\s().-]*){8,}/,
];
const OPTION_INTENTS = new Set([
  'worker_search',
  'professional_search',
  'course_search',
  'product_search',
]);

function resultCount(state: QuippyGraphState): number {
  return Math.max(0, ...state.toolMetadata.map((item) => item.resultCount ?? 0));
}

function appearsToPresentOnlyOneOption(text: string): boolean {
  const markers = text.match(/(?:^|\n)\s*(?:[-•]|\d+[.)])\s+/g);
  return Boolean(markers && markers.length === 1);
}

function mentionedKnownOptions(
  state: QuippyGraphState,
  text: string,
): number {
  const first = state.toolResults[0];
  if (!Array.isArray(first)) return 0;
  const labels = (first as Array<Record<string, unknown>>)
    .map((item) => item.title ?? item.name ?? item.username)
    .filter((label): label is string => typeof label === 'string' && label.length > 1);
  return labels.filter((label) => text.toLowerCase().includes(label.toLowerCase()))
    .length;
}

export function validateResponse(
  state: QuippyGraphState,
  draft: string,
): string[] {
  const issues: string[] = [];
  if (!draft.trim()) issues.push('empty_response');
  if (draft.length > MAX_RESPONSE_LENGTH) issues.push('response_too_long');
  if (draft.includes('!')) issues.push('exclamation_mark');
  if (FORBIDDEN_PATTERNS.some((pattern) => pattern.test(draft))) {
    issues.push('forbidden_vocabulary');
  }
  if (CONTACT_PATTERNS.some((pattern) => pattern.test(draft))) {
    issues.push('contact_details_without_consent');
  }

  const affiliateTagged = state.toolMetadata.some((item) => item.affiliateTagged);
  const requiredDisclosure =
    state.identity?.language === 'he'
      ? AFFILIATE_DISCLOSURE_HE
      : AFFILIATE_DISCLOSURE;
  if (affiliateTagged && !draft.includes(requiredDisclosure)) {
    issues.push('missing_affiliate_disclosure');
  }

  if (
    OPTION_INTENTS.has(state.intent) &&
    resultCount(state) > 1 &&
    (appearsToPresentOnlyOneOption(draft) ||
      mentionedKnownOptions(state, draft) === 1)
  ) {
    issues.push('single_option_recommendation');
  }
  return issues;
}

function firstToolArray(state: QuippyGraphState): Array<Record<string, unknown>> {
  const first = state.toolResults[0];
  return Array.isArray(first) ? (first as Array<Record<string, unknown>>) : [];
}

function englishFallback(state: QuippyGraphState): string {
  const results = firstToolArray(state);
  if (state.intent === 'worker_search' || state.intent === 'professional_search') {
    if (!results.length) {
      return 'I’m QUIPPY, an AI assistant. I found no public Passports matching those filters. Try a broader location, credential tier, or equipment filter.';
    }
    const options = results.slice(0, 5).map((item, index) => {
      const location = item.location ? ` — ${String(item.location)}` : '';
      return `${index + 1}. ${String(item.username)}${location}`;
    });
    return `I found these public Passport matches:\n${options.join('\n')}\nContact details stay hidden until both sides consent. Which match should I summarize?`;
  }
  if (state.intent === 'course_search') {
    if (!results.length) {
      return 'I found no published course available to this account with those filters. Which equipment or skill should the training cover?';
    }
    const options = results
      .slice(0, 5)
      .map(
        (item, index) =>
          `${index + 1}. ${String(item.title)} — ${String(item.tier)}, ${String(item.durationMinutes)} minutes`,
      );
    return `Available course options:\n${options.join('\n')}\nWhich course should I explain?`;
  }
  if (state.intent === 'business_training_status') {
    const status = state.toolResults[0] as
      | { organization?: string; assignments?: Record<string, number> }
      | undefined;
    if (!status?.assignments) {
      return 'I could not verify operator access for that training status. Sign in with an authorized operator account and try again.';
    }
    return `${status.organization ?? 'Your organization'} has ${status.assignments.total ?? 0} assigned courses: ${status.assignments.assigned ?? 0} not started, ${status.assignments.inProgress ?? 0} in progress, and ${status.assignments.completed ?? 0} completed. Which location or course should I narrow this to?`;
  }
  if (state.intent === 'product_search') {
    if (!results.length) {
      return 'I’m QUIPPY, an AI assistant. I found no approved catalog options for those filters. What category, region, and maximum budget should I use?';
    }
    const options = results.slice(0, 5).map((item, index) => {
      const price =
        typeof item.priceMinCents === 'number'
          ? ` — from ${(item.priceMinCents / 100).toLocaleString()} ${String(item.currency)}`
          : '';
      return `${index + 1}. ${String(item.name)} by ${String(item.brand)}${price}`;
    });
    return `Approved demo catalog options, ranked by fit only:\n${options.join('\n')}\nPrices, compatibility, stock, and service coverage are unverified; confirm them with the supplier.`;
  }
  if (state.intent === 'introduction') {
    const result = state.toolResults[0] as
      | { ok?: boolean; error?: string; candidateUsername?: string }
      | Array<Record<string, unknown>>
      | undefined;
    if (!Array.isArray(result) && result?.ok) {
      return `Your introduction request to @${result.candidateUsername ?? state.filters.candidateUsername} is pending. Their email remains private unless they accept, at which point both of you can see each other’s email.`;
    }
    if (state.filters.confirmed && !Array.isArray(result)) {
      if (result?.error === 'preview_context_missing') {
        return 'I could not recover the approved purpose. Restate the request with @username and a clear purpose, then confirm the preview.';
      }
      return `I could not create that introduction request${result?.error ? `: ${result.error}` : '.'}`;
    }
    const matches = Array.isArray(result) ? result : [];
    const username = state.filters.candidateUsername;
    const purpose = state.filters.purpose;
    if (!username || !purpose) {
      if (matches.length) {
        const options = matches
          .slice(0, 5)
          .map((item, index) => `${index + 1}. @${String(item.username)}${item.location ? ` — ${String(item.location)}` : ''}`);
        return `I found these open public Passports:\n${options.join('\n')}\nChoose one @username and give a specific professional purpose. Email remains hidden until both people consent.`;
      }
      return 'Tell me the candidate’s @username and a specific professional purpose. I will show a consent preview before creating anything.';
    }
    if (!matches.length) {
      return `I could not find an open public Passport for @${username}. No introduction request was created.`;
    }
    return `Preview: request an introduction to @${username} for “${purpose}” using email. No contact details are shared now. If they accept, each of you will see the other’s email. To consent and send this request, reply exactly: CONFIRM INTRO @${username}`;
  }
  if (state.intent === 'lead') {
    const result = state.toolResults[0] as
      | { ok?: boolean; lead?: { id?: string }; error?: string }
      | undefined;
    if (result?.ok) {
      return `Your quote request was created as ${result.lead?.id ?? 'an active lead'}. Approved matching suppliers see only the fields you confirmed. Your email is released only to the supplier whose proposal you accept.`;
    }
    if (
      state.filters.category &&
      state.filters.city &&
      state.filters.budgetMaxCents !== undefined &&
      state.filters.requirements
    ) {
      const budget = (state.filters.budgetMaxCents / 100).toLocaleString();
      return `Preview only. A private conversation does not become a lead.\nFields shared with approved matching suppliers: category “${state.filters.category}”, city/region “${state.filters.city}”, maximum budget ${budget} ${state.filters.currency ?? 'USD'}, requirements “${state.filters.requirements}”, and normal urgency. Your email is shared only with the supplier whose proposal you accept.\nTo consent and create this request, reply exactly: CONFIRM QUOTE | ${state.filters.category} | ${state.filters.city} | ${budget.replace(/,/g, '')} | ${state.filters.requirements}`;
    }
    return 'A private conversation does not become a lead. To preview exact shared fields, use: QUOTE | category | city | maximum budget in USD | requirements. Nothing is created until you then send the matching CONFIRM QUOTE command.';
  }
  if (state.intent === 'equipment') {
    return 'I’m QUIPPY, an AI assistant. Stop using the equipment if there is gas odor, smoke, exposed wiring, abnormal pressure, or a defeated safety interlock. Otherwise, share the manufacturer, exact model, and the exact displayed code; I will not guess an unknown code.';
  }
  return 'I’m QUIPPY, QUIPP’s AI assistant for hospitality work, equipment, people, products, and training. What would you like help with?';
}

function hebrewFallback(state: QuippyGraphState): string {
  if (state.intent === 'equipment') {
    return 'אני QUIPPY, עוזר AI. אם יש ריח גז, עשן, חיווט חשוף, לחץ חריג או מעקף בטיחות — יש להפסיק להשתמש בציוד ולפנות לגורם מוסמך. אחרת, מה היצרן, הדגם המדויק והקוד שמופיע בצג?';
  }
  if (state.intent === 'introduction' || state.intent === 'lead') {
    if (state.intent === 'lead') {
      const result = state.toolResults[0] as
        | { ok?: boolean; lead?: { id?: string } }
        | undefined;
      if (result?.ok) {
        return `בקשת הצעת המחיר נוצרה כמזהה ${result.lead?.id ?? 'פעיל'}. ספקים מאושרים ומתאימים רואים רק את השדות שאושרו. האימייל ייחשף רק לספק שהצעתו תתקבל.`;
      }
      if (
        state.filters.category &&
        state.filters.city &&
        state.filters.budgetMaxCents !== undefined &&
        state.filters.requirements
      ) {
        const budget = String(state.filters.budgetMaxCents / 100);
        return `תצוגה מקדימה בלבד. שיחה פרטית אינה הופכת לליד.\nהשדות שיוצגו לספקים מאושרים ומתאימים: קטגוריה „${state.filters.category}”, עיר/אזור „${state.filters.city}”, תקציב מרבי ${budget} ${state.filters.currency ?? 'USD'}, דרישות „${state.filters.requirements}” ודחיפות רגילה. האימייל ייחשף רק לספק שהצעתו תתקבל.\nליצירה בהסכמה יש להשיב בדיוק: CONFIRM QUOTE | ${state.filters.category} | ${state.filters.city} | ${budget} | ${state.filters.requirements}`;
      }
      return 'שיחה פרטית אינה הופכת לליד. לתצוגה מקדימה של השדות יש לכתוב: QUOTE | קטגוריה | עיר | תקציב מרבי בדולר | דרישות. דבר לא נוצר לפני פקודת CONFIRM QUOTE תואמת.';
    }
    const result = state.toolResults[0] as { ok?: boolean; candidateUsername?: string; error?: string } | undefined;
    if (result?.ok) {
      return `בקשת ההיכרות עם @${result.candidateUsername ?? state.filters.candidateUsername} נשלחה וממתינה לאישור. כתובות האימייל ייחשפו לשני הצדדים רק לאחר אישור.`;
    }
    const username = state.filters.candidateUsername;
    const purpose = state.filters.purpose;
    if (!username || !purpose) {
      return 'כדי להכין תצוגה מקדימה להיכרות, צריך @username ומטרה מקצועית ברורה. כתובת האימייל נשארת מוסתרת עד להסכמה של שני הצדדים.';
    }
    return `תצוגה מקדימה: בקשת היכרות עם @${username} למטרה „${purpose}” באמצעות אימייל. פרטי קשר לא נחשפים כעת. לשליחה בהסכמה מפורשת, יש להשיב בדיוק: CONFIRM INTRO @${username}`;
  }
  if (state.intent === 'product_search') {
    const results = firstToolArray(state);
    if (!results.length) {
      return 'אני QUIPPY, עוזר AI. לא נמצאו אפשרויות בקטלוג המאושר לפי הסינון. מה הקטגוריה, האזור והתקציב המרבי?';
    }
    const options = results
      .slice(0, 5)
      .map((item, index) => `${index + 1}. ${String(item.name)} של ${String(item.brand)}`);
    return `אפשרויות מקטלוג ההדגמה המאושר, בדירוג לפי התאמה בלבד:\n${options.join('\n')}\nהמחיר, התאימות, המלאי ואזור השירות אינם מאומתים ויש לאשר אותם מול הספק.`;
  }
  return 'אני QUIPPY, עוזר ה-AI של QUIPP לעבודה, ציוד והכשרות באירוח. במה לעזור?';
}

export function deterministicFallback(state: QuippyGraphState): string {
  let response =
    state.identity?.language === 'he'
      ? hebrewFallback(state)
      : englishFallback(state);
  if (state.toolMetadata.some((item) => item.affiliateTagged)) {
    response += `\n\n${
      state.identity?.language === 'he'
        ? AFFILIATE_DISCLOSURE_HE
        : AFFILIATE_DISCLOSURE
    }`;
  }
  return response.slice(0, MAX_RESPONSE_LENGTH);
}

export function finalizeValidatedResponse(
  state: QuippyGraphState,
): Pick<QuippyGraphState, 'response' | 'validationIssues'> {
  const normalized = state.draft.trim().replace(/!+/g, '.');
  const issues = validateResponse(state, normalized);
  return {
    response: issues.length ? deterministicFallback(state) : normalized,
    validationIssues: issues,
  };
}
