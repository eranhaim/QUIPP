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

type PersistedCourseLead = WhatsAppCourseLeadDoc & {
  save(): Promise<unknown>;
};

export function isWhatsAppCourseLeadHumanRequest(text: string): boolean {
  return HUMAN_PATTERNS.test(text);
}

export function isWhatsAppCourseLeadEmail(text: string): boolean {
  return EMAIL_PATTERN.test(text);
}

function courseSummary(course: { title: string; slug: string; duration: number; description: string }) {
  const description = course.description.trim();
  const suffix = description ? ` — ${description.slice(0, 110)}` : '';
  return `• ${course.title} (${course.duration} min)${suffix}\n${course.slug}`;
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

async function courseReply(query?: string) {
  const courses = await findCourses(query);
  if (courses.length === 0) {
    return 'I could not find a matching published course yet. Tell me what you want to learn, or reply HUMAN to speak with the QUIPP team.';
  }
  return `Here are relevant QUIPP courses:\n${courses.map(courseSummary).join('\n\n')}\n\nReply with a course name, or tell me what you want to learn.`;
}

function nextQuestion(lead: PersistedCourseLead): string {
  switch (lead.qualificationStep) {
    case 'goal':
      return 'What skill or equipment do you want to learn about?';
    case 'experience':
      return 'What is your current experience level: new, some experience, or advanced?';
    case 'name':
      return 'What name should the QUIPP team use when they follow up?';
    case 'email':
      return 'What email should the QUIPP team use to send course details?';
    default:
      return 'Thanks. A QUIPP team member will follow up with relevant course options.';
  }
}

async function updateQualification(lead: PersistedCourseLead, message: string) {
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
      return 'Please send a valid email address, or reply HUMAN if you prefer a person to contact you another way.';
    }
    lead.email = message;
    lead.qualificationStep = 'complete';
    lead.stage = 'qualified';
  }
  await lead.save();
  return nextQuestion(lead);
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

  if (isWhatsAppCourseLeadHumanRequest(text)) {
    lead.stage = 'human_requested';
    lead.escalationRequestedAt = new Date();
    await lead.save();
    return 'I have marked this for a QUIPP team member. They will follow up using the contact details you provide here. You can also tell me which course or skill you are interested in.';
  }

  if (lead.qualificationStep === 'complete') {
    await lead.save();
    return HELP_PATTERNS.test(text)
      ? courseReply(text)
      : 'Your request is with the QUIPP team. Reply COURSES to see current options, or HUMAN to request a person.';
  }

  if (lead.qualificationStep === 'goal' && GREETING_PATTERN.test(text)) {
    await lead.save();
    return 'Hi, I am QUIPP’s course assistant. I can help you discover training, answer course questions, and connect you with the QUIPP team. What skill or equipment do you want to learn about?';
  }

  if (lead.qualificationStep === 'goal' && HELP_PATTERNS.test(text)) {
    await lead.save();
    return courseReply(text);
  }

  lead.stage = 'qualifying';
  return updateQualification(lead, text);
}
