import { Course } from '../models/Course.js';
import { HttpError } from '../middleware/errorHandler.js';

/**
 * The public shape of a course. Quiz answers (`correctIndex`) are stripped —
 * they must never reach the client.
 */
export interface PublicCourse {
  id: string;
  slug: string;
  title: string;
  techFocus: string;
  tagName: string;
  tier: 'IN' | 'DEEP' | 'THERE';
  duration: number;
  description: string;
  provider: string;
  isManufacturer: boolean;
  equipmentName: string | null;
  passMark: number;
  retakeCooldownHours: number;
  techScoreContribution: number;
  status: 'published' | 'coming_soon';
  technicalCompetencies: string[];
  parts: Array<{
    partId: string;
    type: 'real_world' | 'knowledge' | 'mastery_check' | 'credential';
    title: string;
    duration: string;
    content: string;
    topics: string[];
    questions: Array<{ question: string; options: string[] }>;
    questionCount: number;
  }>;
}

function toPublicCourse(doc: {
  _id: unknown;
  slug: string;
  title: string;
  techFocus: string;
  tagName: string;
  tier: 'IN' | 'DEEP' | 'THERE';
  duration: number;
  description: string;
  provider: string;
  isManufacturer: boolean;
  equipmentName: string | null;
  passMark: number;
  retakeCooldownHours: number;
  techScoreContribution: number;
  status: 'published' | 'coming_soon';
  technicalCompetencies: string[];
  parts: Array<{
    partId: string;
    type: 'real_world' | 'knowledge' | 'mastery_check' | 'credential';
    title: string;
    duration: string;
    content: string;
    topics: string[];
    questions: Array<{ question: string; options: string[]; correctIndex: number; explanation: string }>;
  }>;
}): PublicCourse {
  return {
    id: String(doc._id),
    slug: doc.slug,
    title: doc.title,
    techFocus: doc.techFocus,
    tagName: doc.tagName,
    tier: doc.tier,
    duration: doc.duration,
    description: doc.description,
    provider: doc.provider,
    isManufacturer: doc.isManufacturer,
    equipmentName: doc.equipmentName,
    passMark: doc.passMark,
    retakeCooldownHours: doc.retakeCooldownHours,
    techScoreContribution: doc.techScoreContribution,
    status: doc.status,
    technicalCompetencies: doc.technicalCompetencies,
    parts: doc.parts.map((p) => ({
      partId: p.partId,
      type: p.type,
      title: p.title,
      duration: p.duration,
      content: p.content,
      topics: p.topics ?? [],
      questions: p.questions.map((q) => ({ question: q.question, options: q.options })),
      questionCount: p.questions.length,
    })),
  };
}

export async function listCourses(): Promise<PublicCourse[]> {
  const docs = await Course.find({ status: 'published' })
    .sort({ tagName: 1, tier: 1, title: 1 })
    .lean();
  return docs.map((d) => toPublicCourse(d as never));
}

export async function getCourseBySlug(slug: string): Promise<PublicCourse> {
  const doc = await Course.findOne({ slug: slug.toLowerCase() }).lean();
  if (!doc) throw new HttpError(404, 'Course not found');
  return toPublicCourse(doc as never);
}

/**
 * Grade a submitted quiz for a course. Never called from an untrusted
 * client — always inside a controller that has verified the user.
 */
export interface QuizGrade {
  passed: boolean;
  scorePct: number;
  correctCount: number;
  totalQuestions: number;
  passMark: number;
  review: Array<{
    question: string;
    correctIndex: number;
    yourIndex: number;
    correct: boolean;
    explanation: string;
  }>;
}

export async function gradeQuiz(slug: string, answers: number[]): Promise<QuizGrade> {
  const course = await Course.findOne({ slug: slug.toLowerCase() });
  if (!course) throw new HttpError(404, 'Course not found');

  const masteryPart = course.parts.find((p) => p.type === 'mastery_check');
  if (!masteryPart || masteryPart.questions.length === 0) {
    throw new HttpError(400, 'Course has no mastery check');
  }
  const qs = masteryPart.questions;
  if (answers.length !== qs.length) {
    throw new HttpError(400, `Expected ${qs.length} answers, got ${answers.length}`);
  }

  const review = qs.map((q, i) => {
    const yourIndex = answers[i];
    return {
      question: q.question,
      correctIndex: q.correctIndex,
      yourIndex,
      correct: yourIndex === q.correctIndex,
      explanation: q.explanation,
    };
  });
  const correctCount = review.filter((r) => r.correct).length;
  const scorePct = Math.round((correctCount / qs.length) * 100);
  return {
    passed: scorePct >= course.passMark,
    scorePct,
    correctCount,
    totalQuestions: qs.length,
    passMark: course.passMark,
    review,
  };
}
