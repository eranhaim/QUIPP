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

// QUIPPY voice: "we" language, kitchen partner tone. Plain text, one entry per language.
const COPY = {
  noCourses: {
    en: 'I could not find a matching published course yet. Tell me what we should focus on, or reply HUMAN to speak with the QUIPP team.',
    he: '\u05e2\u05d5\u05d3 \u05dc\u05d0 \u05de\u05e6\u05d0\u05ea\u05d9 \u05e7\u05d5\u05e8\u05e1 \u05de\u05ea\u05d0\u05d9\u05dd. \u05e1\u05e4\u05e8\u05d5 \u05dc\u05d9 \u05de\u05d4 \u05ea\u05e8\u05e6\u05d5 \u05dc\u05dc\u05de\u05d5\u05d3, \u05d0\u05d5 \u05db\u05ea\u05d1\u05d5 "\u05e0\u05e6\u05d9\u05d2" \u05db\u05d3\u05d9 \u05dc\u05d3\u05d1\u05e8 \u05e2\u05dd \u05e6\u05d5\u05d5\u05ea QUIPP.',
  },
  coursesIntro: {
    en: 'Here are relevant QUIPP courses:',
    he: '\u05d4\u05e0\u05d4 \u05e7\u05d5\u05e8\u05e1\u05d9\u05dd \u05e8\u05dc\u05d5\u05d5\u05e0\u05d8\u05d9\u05d9\u05dd \u05d1-QUIPP:',
  },
  coursesOutro: {
    en: 'Reply with a course name, or tell me what we should work on.',
    he: '\u05db\u05ea\u05d1\u05d5 \u05e9\u05dd \u05e9\u05dc \u05e7\u05d5\u05e8\u05e1, \u05d0\u05d5 \u05e1\u05e4\u05e8\u05d5 \u05dc\u05d9 \u05de\u05d4 \u05ea\u05e8\u05e6\u05d5 \u05dc\u05dc\u05de\u05d5\u05d3.',
  },
  minutes: { en: 'min', he: '\u05d3\u05e7\u05f3' },
  goal: {
    en: 'What skill or equipment are we looking at together?',
    he: '\u05d0\u05d9\u05d6\u05d5 \u05de\u05d9\u05d5\u05de\u05e0\u05d5\u05ea \u05d0\u05d5 \u05d0\u05d9\u05d6\u05d4 \u05e6\u05d9\u05d5\u05d3 \u05ea\u05e8\u05e6\u05d5 \u05dc\u05dc\u05de\u05d5\u05d3?',
  },
  experience: {
    en: 'Where are we starting from \u2014 new to this, some experience, or been at it a while?',
    he: '\u05de\u05d4 \u05e8\u05de\u05ea \u05d4\u05e0\u05d9\u05e1\u05d9\u05d5\u05df \u05e9\u05dc\u05db\u05dd: \u05de\u05ea\u05d7\u05d9\u05dc\u05d9\u05dd, \u05e7\u05e6\u05ea \u05e0\u05d9\u05e1\u05d9\u05d5\u05df, \u05d0\u05d5 \u05de\u05ea\u05e7\u05d3\u05de\u05d9\u05dd?',
  },
  name: {
    en: 'What name should the QUIPP team use when we follow up?',
    he: '\u05d1\u05d0\u05d9\u05d6\u05d4 \u05e9\u05dd \u05e6\u05d5\u05d5\u05ea QUIPP \u05d9\u05e4\u05e0\u05d4 \u05d0\u05dc\u05d9\u05db\u05dd?',
  },
  email: {
    en: 'What email works for us to send course details?',
    he: '\u05dc\u05d0\u05d9\u05d6\u05d5 \u05db\u05ea\u05d5\u05d1\u05ea \u05de\u05d9\u05d9\u05dc \u05e6\u05d5\u05d5\u05ea QUIPP \u05d9\u05e9\u05dc\u05d7 \u05d0\u05ea \u05e4\u05e8\u05d8\u05d9 \u05d4\u05e7\u05d5\u05e8\u05e1?',
  },
  complete: {
    en: 'We are all set. A QUIPP team member will follow up with the right course options for you. Looking forward to building this together.',
    he: '\u05d4\u05db\u05dc \u05de\u05e1\u05d5\u05d3\u05e8. \u05d0\u05d7\u05d3 \u05de\u05e6\u05d5\u05d5\u05ea QUIPP \u05d9\u05d7\u05d6\u05d5\u05e8 \u05d0\u05dc\u05d9\u05db\u05dd \u05e2\u05dd \u05d0\u05e4\u05e9\u05e8\u05d5\u05d9\u05d5\u05ea \u05e7\u05d5\u05e8\u05e1 \u05de\u05ea\u05d0\u05d9\u05de\u05d5\u05ea.',
  },
  invalidEmail: {
    en: 'Please send a valid email address, or reply HUMAN if you prefer we have a person reach out another way.',
    he: '\u05d0\u05e0\u05d0 \u05e9\u05dc\u05d7\u05d5 \u05db\u05ea\u05d5\u05d1\u05ea \u05de\u05d9\u05d9\u05dc \u05ea\u05e7\u05d9\u05e0\u05d4, \u05d0\u05d5 \u05db\u05ea\u05d1\u05d5 "\u05e0\u05e6\u05d9\u05d2" \u05d0\u05dd \u05e2\u05d3\u05d9\u05e3 \u05e9\u05e0\u05e6\u05d9\u05d2 \u05d9\u05d9\u05e6\u05d5\u05e8 \u05e7\u05e9\u05e8 \u05d1\u05d3\u05e8\u05da \u05d0\u05d7\u05e8\u05ea.',
  },
  humanRequested: {
    en: 'I have flagged this for a QUIPP team member. We will follow up using the contact details you share here. In the meantime, tell me what skill or equipment you are interested in \u2014 we can start looking at options together.',
    he: '\u05e1\u05d9\u05de\u05e0\u05ea\u05d9 \u05d0\u05ea \u05d4\u05e4\u05e0\u05d9\u05d9\u05d4 \u05dc\u05e6\u05d5\u05d5\u05ea QUIPP. \u05d4\u05dd \u05d9\u05d7\u05d6\u05e8\u05d5 \u05d0\u05dc\u05d9\u05db\u05dd \u05d1\u05e4\u05e8\u05d8\u05d9 \u05d4\u05e7\u05e9\u05e8 \u05e9\u05ea\u05e9\u05d0\u05d9\u05e8\u05d5 \u05db\u05d0\u05df. \u05d0\u05e4\u05e9\u05e8 \u05d2\u05dd \u05dc\u05e1\u05e4\u05e8 \u05dc\u05d9 \u05d1\u05d0\u05d9\u05d6\u05d4 \u05e7\u05d5\u05e8\u05e1 \u05d0\u05d5 \u05de\u05d9\u05d5\u05de\u05e0\u05d5\u05ea \u05d0\u05ea\u05dd \u05de\u05e2\u05d5\u05e0\u05d9\u05d9\u05e0\u05d9\u05dd.',
  },
  alreadyWithTeam: {
    en: 'We have got your details with the QUIPP team. Reply COURSES to explore current options, or HUMAN to connect with a person.',
    he: '\u05d4\u05e4\u05e0\u05d9\u05d9\u05d4 \u05e9\u05dc\u05db\u05dd \u05d0\u05e6\u05dc \u05e6\u05d5\u05d5\u05ea QUIPP. \u05db\u05ea\u05d1\u05d5 "\u05e7\u05d5\u05e8\u05e1\u05d9\u05dd" \u05db\u05d3\u05d9 \u05dc\u05e8\u05d0\u05d5\u05ea \u05d0\u05e4\u05e9\u05e8\u05d5\u05d9\u05d5\u05ea, \u05d0\u05d5 "\u05e0\u05e6\u05d9\u05d2" \u05db\u05d3\u05d9 \u05dc\u05d1\u05e7\u05e9 \u05e9\u05d9\u05d7\u05d4 \u05e2\u05dd \u05d0\u05d3\u05dd.',
  },
  greeting: {
    en: 'Good to meet you. I am QUIPPY, your kitchen partner at QUIPP. I can help us find the right training, answer equipment questions, and connect you with the team. What skill or equipment are we looking at?',
    he: '\u05e0\u05e2\u05d9\u05dd \u05dc\u05d4\u05db\u05d9\u05e8. \u05d0\u05e0\u05d9 QUIPPY, \u05d4\u05e9\u05d5\u05ea\u05e3 \u05e9\u05dc\u05db\u05dd \u05d1\u05de\u05d8\u05d1\u05d7 \u05de\u05d1\u05d9\u05ea QUIPP. \u05d0\u05e4\u05e9\u05e8 \u05dc\u05e2\u05d6\u05d5\u05e8 \u05dc\u05db\u05dd \u05dc\u05de\u05e6\u05d5\u05d0 \u05d4\u05db\u05e9\u05e8\u05d4, \u05dc\u05e2\u05e0\u05d5\u05ea \u05e2\u05dc \u05e9\u05d0\u05dc\u05d5\u05ea \u05e2\u05dc \u05e6\u05d9\u05d5\u05d3, \u05d5\u05dc\u05d7\u05d1\u05e8 \u05d0\u05ea\u05db\u05dd \u05dc\u05e6\u05d5\u05d5\u05ea. \u05d0\u05d9\u05d6\u05d5 \u05de\u05d9\u05d5\u05de\u05e0\u05d5\u05ea \u05d0\u05d5 \u05d0\u05d9\u05d6\u05d4 \u05e6\u05d9\u05d5\u05d3 \u05ea\u05e8\u05e6\u05d5 \u05dc\u05dc\u05de\u05d5\u05d3?',
  },
} as const;

export function isWhatsAppCourseLeadHumanRequest(text: string): boolean {
  return HUMAN_PATTERNS.test(text);
}

export function isWhatsAppCourseLeadEmail(text: string): boolean {
  return EMAIL_PATTERN.test(text);
}

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
  const suffix = description ? ` \u2014 ${description.slice(0, 110)}` : '';
  return `\u2022 ${course.title} (${course.duration} ${COPY.minutes[language]})${suffix}\n${course.slug}`;
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
