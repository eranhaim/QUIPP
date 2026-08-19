import { CourseEnrollment } from '../models/CourseEnrollment.js';
import { Course } from '../models/Course.js';
import { Credential } from '../models/Credential.js';
import { HttpError } from '../middleware/errorHandler.js';
import { randomToken } from '../lib/crypto.js';
import { gradeQuiz } from './course.service.js';
import { refreshTechScore } from './profile.service.js';

export interface PublicEnrollment {
  id: string;
  courseSlug: string;
  courseTitle: string;
  tagName: string;
  tier: 'IN' | 'DEEP' | 'THERE';
  status: 'in_progress' | 'completed' | 'failed';
  progressPct: number;
  startedAt: string;
  completedAt: string | null;
  lastScore: number | null;
  lastAttemptAt: string | null;
  cooldownEndsAt: string | null;
}

export async function enrollInCourse(userId: string, slug: string): Promise<PublicEnrollment> {
  const course = await Course.findOne({ slug: slug.toLowerCase() });
  if (!course) throw new HttpError(404, 'Course not found');
  if (course.status !== 'published') throw new HttpError(400, 'Course is not open for enrollment');

  const existing = await CourseEnrollment.findOne({ userId, courseSlug: course.slug });
  if (existing) return toPublicEnrollment(existing, course);

  const enrollment = await CourseEnrollment.create({
    userId,
    courseId: course._id,
    courseSlug: course.slug,
    sourceType: 'free',
  });
  return toPublicEnrollment(enrollment, course);
}

export async function listMyEnrollments(userId: string): Promise<PublicEnrollment[]> {
  const enrollments = await CourseEnrollment.find({ userId }).sort({ updatedAt: -1 });
  if (enrollments.length === 0) return [];
  const courseIds = enrollments.map((e) => e.courseId);
  const courses = await Course.find({ _id: { $in: courseIds } });
  const courseMap = new Map(courses.map((c) => [String(c._id), c]));
  return enrollments
    .map((e) => {
      const c = courseMap.get(String(e.courseId));
      if (!c) return null;
      return toPublicEnrollment(e, c);
    })
    .filter((x): x is PublicEnrollment => x !== null);
}

export interface CompleteQuizInput {
  answers: number[];
}

export interface CompleteQuizResult {
  passed: boolean;
  scorePct: number;
  correctCount: number;
  totalQuestions: number;
  passMark: number;
  cooldownEndsAt: string | null;
  credentialId: string | null;
  verificationId: string | null;
  review: Array<{
    question: string;
    correctIndex: number;
    yourIndex: number;
    correct: boolean;
    explanation: string;
  }>;
}

export async function completeQuiz(
  userId: string,
  slug: string,
  input: CompleteQuizInput,
): Promise<CompleteQuizResult> {
  const course = await Course.findOne({ slug: slug.toLowerCase() });
  if (!course) throw new HttpError(404, 'Course not found');

  const enrollment = await CourseEnrollment.findOne({ userId, courseSlug: course.slug });
  if (!enrollment) throw new HttpError(400, 'Enroll before submitting a quiz');

  if (enrollment.status === 'completed') {
    throw new HttpError(400, 'Course already completed');
  }

  const cooldownMs = course.retakeCooldownHours * 60 * 60 * 1000;
  if (enrollment.lastAttemptAt) {
    const nextAllowed = enrollment.lastAttemptAt.getTime() + cooldownMs;
    if (nextAllowed > Date.now()) {
      throw new HttpError(429, 'Retake cooldown in effect', {
        cooldownEndsAt: new Date(nextAllowed).toISOString(),
      });
    }
  }

  const grade = await gradeQuiz(course.slug, input.answers);

  enrollment.lastAttemptAt = new Date();
  enrollment.lastScore = grade.scorePct;

  let credentialId: string | null = null;
  let verificationId: string | null = null;

  if (grade.passed) {
    enrollment.status = 'completed';
    enrollment.completedAt = new Date();
    enrollment.progressPct = 100;

    const existingCred = await Credential.findOne({ userId, courseSlug: course.slug });
    if (existingCred) {
      credentialId = String(existingCred._id);
      verificationId = existingCred.verificationId;
    } else {
      const cred = await Credential.create({
        userId,
        courseId: course._id,
        courseSlug: course.slug,
        courseName: course.title,
        tier: course.tier,
        tagName: course.tagName,
        provider: course.provider,
        isManufacturer: course.isManufacturer,
        techFocus: course.techFocus,
        verificationId: `QUIPP-${randomToken(4).toUpperCase()}`,
        quizScore: grade.scorePct,
        skillsDemonstrated: course.technicalCompetencies,
        techScoreContribution: course.techScoreContribution,
      });
      credentialId = String(cred._id);
      verificationId = cred.verificationId;
      await refreshTechScore(userId);
    }
  } else {
    enrollment.status = 'failed';
    enrollment.progressPct = Math.max(enrollment.progressPct, 50);
  }

  await enrollment.save();

  const cooldownEndsAt = enrollment.lastAttemptAt
    ? new Date(enrollment.lastAttemptAt.getTime() + cooldownMs).toISOString()
    : null;

  return {
    passed: grade.passed,
    scorePct: grade.scorePct,
    correctCount: grade.correctCount,
    totalQuestions: grade.totalQuestions,
    passMark: grade.passMark,
    cooldownEndsAt: grade.passed ? null : cooldownEndsAt,
    credentialId,
    verificationId,
    review: grade.review,
  };
}

interface EnrollmentDocLike {
  _id: unknown;
  courseSlug: string;
  status: 'in_progress' | 'completed' | 'failed';
  progressPct: number;
  startedAt: Date;
  completedAt?: Date | null;
  lastAttemptAt?: Date | null;
  lastScore?: number | null;
}

function toPublicEnrollment(
  e: EnrollmentDocLike,
  c: { title: string; tagName: string; tier: 'IN' | 'DEEP' | 'THERE'; retakeCooldownHours: number },
): PublicEnrollment {
  const cooldownEndsAt = e.lastAttemptAt
    ? new Date(e.lastAttemptAt.getTime() + c.retakeCooldownHours * 60 * 60 * 1000).toISOString()
    : null;
  return {
    id: String(e._id),
    courseSlug: e.courseSlug,
    courseTitle: c.title,
    tagName: c.tagName,
    tier: c.tier,
    status: e.status,
    progressPct: e.progressPct,
    startedAt: e.startedAt.toISOString(),
    completedAt: e.completedAt ? e.completedAt.toISOString() : null,
    lastScore: e.lastScore ?? null,
    lastAttemptAt: e.lastAttemptAt ? e.lastAttemptAt.toISOString() : null,
    cooldownEndsAt,
  };
}
