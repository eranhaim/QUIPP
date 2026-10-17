import { Course } from '../models/Course.js';
import {
  WhatsAppCourseLead,
  type WhatsAppCourseLeadDoc,
} from '../models/WhatsAppCourseLead.js';
import { normalizeGreenApiPhone } from './greenApiParsing.js';

const MAX_REPLY_COURSES = 3;
const HUMAN_PATTERNS = /\b(human|person|agent|representative|call me|sales)\b|נציג|אנושי|אדם|שיחה/i;
const HELP_PATTERNS = /\b(help|faq|course|courses|training|price|pricing)\b|עזרה|קורס|קורסים|מחיר/i;
const GREETING_PATTERN = /^(hi|hello|hey|start|שלום|היי|התחל)[!.,\s]*$/i;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const HEBREW_LETTER = /[\u0590-\u05FF]/;
const LATIN_WORD = /[a-z]{2,}/i;

type Language = 'en' | 'he';

type PersistedCourseLead = WhatsAppCourseLeadDoc & {
  save(): Promise<unknown>;
};

// Reply copy is plain text, one entry per language.
const COPY = {
  noCourses: {
    en: 'I could not find a matching published course yet. Tell me what you want to learn, or reply HUMAN to speak with the QUIPP team.',
    he: 'עוד לא מצאתי קורס מתאים. ספרו לי מה תרצו ללמוד, או כתבו "נציג" כדי לדבר עם צוות QUIPP.',
  },
  coursesIntro: {
    en: 'Here are relevant QUIPP courses:',
    he: 'הנה קורסים רלוונטיים ב-QUIPP:',
  },
  coursesOutro: {
    en: 'Reply with a course name, or tell me what you want to learn.',
    he: 'כתבו שם של קורס, או ספרו לי מה תרצו ללמוד.',
  },
  minutes: { en: 'min', he: 'דק׳' },
  goal: {
    en: 'What skill or equipment do you want to learn about?',
    he: 'איזו מיומנות או איזה ציוד תרצו ללמוד?',
  },
  experience: {
    en: 'What is your current experience level: new, some experience, or advanced?',
    he: 'מה רמת הניסיון שלכם: מתחילים, קצת ניסיון, או מתקדמים?',
  },
  name: {
    en: 'What name should the QUIPP team use when they follow up?',
    he: 'באיזה שם צוות QUIPP יפנה אליכם?',
  },
  email: {
    en: 'What email should the QUIPP team use to send course details?',
    he: 'לאיזו כתובת מייל צוות QUIPP ישלח את פרטי הקורס?',
  },
  complete: {
    en: 'Thanks. A QUIPP team member will follow up with relevant course options.',
    he: 'תודה. אחד מצוות QUIPP יחזור אליכם עם אפשרויות קורס מתאימות.',
  },
  invalidEmail: {
    en: 'Please send a valid email address, or reply HUMAN if you prefer a person to contact you another way.',
    he: 'אנא שלחו כתובת מייל תקינה, או כתבו "נציג" אם עדיף שנציג ייצור קשר בדרך אחרת.',
  },
  humanRequested: {
    en: 'I have marked this for a QUIPP team member. They will follow up using the contact details you provide here. You can also tell me which course or skill you are interested in.',
    he: 'סימנתי את הפנייה לצוות QUIPP. הם יחזרו אליכם בפרטי הקשר שתשאירו כאן. אפשר גם לספר לי באיזה קורס או מיומנות אתם מעוניינים.',
  },
  alreadyWithTeam: {
    en: 'Your request is with the QUIPP team. Reply COURSES to see current options, or HUMAN to request a person.',
    he: 'הפנייה שלכם אצל צוות QUIPP. כתבו "קורסים" כדי לראות אפשרויות, או "נציג" כדי לבקש שיחה עם אדם.',
  },
  greeting: {
    en: 'Hi, I am QUIPP’s course assistant. I can help you discover training, answer course questions, and connect you with the QUIPP team. What skill or equipment do you want to learn about?',
    he: 'היי, אני העוזר של QUIPP לקורסים. אפשר לעזור לכם למצוא הכשרה, לענות על שאלות על קורסים ולחבר אתכם לצוות QUIPP. איזו מיומנות או איזה ציוד תרצו ללמוד?',
  },
} as const;

export function isWhatsAppCourseLeadHumanRequest(text: string): boolean {
  return HUMAN_PATTERNS.test(text);
}

export function isWhatsAppCourseLeadEmail(text: string): boolean {
  return EMAIL_PATTERN.test(text);
}

// Hebrew letters win. Emails and one-word answers keep the language already stored.
export function detectLanguage(text: string, current: Language): Language {
  if (HEBREW_LETTER.test(text)) return 'he';
  if (LATIN_WORD.test(text) && !EMAIL_PATTERN.test(text)) return 'en';
  return current;
}

function courseSummary(
  course: { title: string; slug: string; duration: number; description: string },
  language: Language,
) {
  const description = course.description.trim();
  const suffix = description ? ` — ${description.slice(0, 110)}` : '';
  return `• ${course.title} (${course.duration} ${COPY.minutes[language]})${suffix}\n${course.slug}`;
}

async function findCourses(query?: string) {
  const filter: Record<string, unknown> = {
    status: 'published',
    reviewStatus: 'approved',
    visibility: 'public',
  };
  if (query && query.length >= 2) {
    const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const match = new RegExp(escaped, 'i');
    filter.$or = [
      { title: match },
      { description: match },
      { techFocus: match },
      { tagName: match },
      { equipmentName: match },
    ];
  }
  return Course.find(filter)
    .select({ title: 1, slug: 1, duration: 1, description: 1 })
    .sort({ title: 1 })
    .limit(MAX_REPLY_COURSES)
    .lean();
}

async function courseReply(language: Language, query?: string) {
  const courses = await findCourses(query);
  if (courses.length === 0) {
    return COPY.noCourses[language];
  }
  return `${COPY.coursesIntro[language]}\n${courses.map((course) => courseSummary(course, language)).join('\n\n')}\n\n${COPY.coursesOutro[language]}`;
}

function nextQuestion(lead: PersistedCourseLead, language: Language): string {
  switch (lead.qualificationStep) {
    case 'goal':
      return COPY.goal[language];
    case 'experience':
      return COPY.experience[language];
    case 'name':
      return COPY.name[language];
    case 'email':
      return COPY.email[language];
    default:
      return COPY.complete[language];
  }
}

async function updateQualification(
  lead: PersistedCourseLead,
  message: string,
  language: Language,
) {
  if (lead.qualificationStep === 'goal') {
    lead.learningGoal = message;
    lead.qualificationStep = 'experience';
  } else if (lead.qualificationStep === 'experience') {
    lead.experience = message;
    lead.qualificationStep = 'name';
  } else if (lead.qualificationStep === 'name') {
    lead.contactName = message;
    lead.qualificationStep = 'email';
  } else if (lead.qualificationStep === 'email') {
    if (!isWhatsAppCourseLeadEmail(message)) {
      await lead.save();
      return COPY.invalidEmail[language];
    }
    lead.email = message;
    lead.qualificationStep = 'complete';
    lead.stage = 'qualified';
  }
  await lead.save();
  return nextQuestion(lead, language);
}

export async function replyToWhatsAppCourseLead(input: {
  chatId: string;
  senderName: string | null;
  text: string;
}) {
  const text = input.text.trim();
  let lead = await WhatsAppCourseLead.findOne({ chatId: input.chatId });
  if (!lead) {
    lead = await WhatsAppCourseLead.create({
      chatId: input.chatId,
      phone: normalizeGreenApiPhone(input.chatId),
      senderName: input.senderName,
    });
  }
  lead.lastInboundAt = new Date();
  if (input.senderName && !lead.senderName) lead.senderName = input.senderName;
  const language = detectLanguage(text, lead.language === 'he' ? 'he' : 'en');
  lead.language = language;

  if (isWhatsAppCourseLeadHumanRequest(text)) {
    lead.stage = 'human_requested';
    lead.escalationRequestedAt = new Date();
    await lead.save();
    return COPY.humanRequested[language];
  }

  if (lead.qualificationStep === 'complete') {
    await lead.save();
    return HELP_PATTERNS.test(text)
      ? courseReply(language, text)
      : COPY.alreadyWithTeam[language];
  }

  if (lead.qualificationStep === 'goal' && GREETING_PATTERN.test(text)) {
    await lead.save();
    return COPY.greeting[language];
  }

  if (lead.qualificationStep === 'goal' && HELP_PATTERNS.test(text)) {
    await lead.save();
    return courseReply(language, text);
  }

  lead.stage = 'qualifying';
  return updateQualification(lead, text, language);
}
