import { Course, type CourseTier } from '../models/Course.js';
import { Video } from '../models/Video.js';
import { HttpError } from '../middleware/errorHandler.js';
import { presignGet, isS3Configured } from '../config/aws.js';

/**
 * The public shape of a course. Quiz answers (`correctIndex`) are stripped —
 * they must never reach the client. `videoUrl` is a short-lived presigned URL
 * that expires within 1 hour; the raw S3 key never leaves the server.
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
    type: 'real_world' | 'knowledge' | 'video' | 'mastery_check' | 'credential';
    title: string;
    duration: string;
    content: string;
    topics: string[];
    questions: Array<{ question: string; options: string[] }>;
    questionCount: number;
    videoId: string | null;
    videoUrl: string | null;
    videoMimeType: string | null;
    videoDurationSec: number | null;
  }>;
}

interface RawPart {
  partId: string;
  type: 'real_world' | 'knowledge' | 'video' | 'mastery_check' | 'credential';
  title: string;
  duration: string;
  content: string;
  topics: string[];
  questions: Array<{ question: string; options: string[]; correctIndex: number; explanation: string }>;
  videoId?: unknown;
  directVideoUrl?: string | null;
}

interface RawCourse {
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
  parts: RawPart[];
}

async function resolveVideos(parts: RawPart[]): Promise<Map<string, { url: string; mime: string; duration: number | null }>> {
  const ids = Array.from(
    new Set(
      parts
        .filter((p) => p.type === 'video' && p.videoId)
        .map((p) => String(p.videoId)),
    ),
  );
  if (ids.length === 0 || !isS3Configured()) return new Map();

  const videos = await Video.find({ _id: { $in: ids }, status: 'ready' })
    .select({ s3Key: 1, mimeType: 1, durationSec: 1 })
    .lean();

  const urls = await Promise.all(
    videos.map(async (v) => {
      const url = await presignGet((v as unknown as { s3Key: string }).s3Key, 3600);
      return [
        String(v._id),
        {
          url,
          mime: (v as unknown as { mimeType: string }).mimeType,
          duration: (v as unknown as { durationSec: number | null }).durationSec,
        },
      ] as const;
    }),
  );
  return new Map(urls);
}

async function toPublicCourse(doc: RawCourse): Promise<PublicCourse> {
  const videoMap = await resolveVideos(doc.parts);
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
    parts: doc.parts.map((p) => {
      const videoIdStr = p.videoId ? String(p.videoId) : null;
      const video = videoIdStr ? videoMap.get(videoIdStr) ?? null : null;
      const url = video?.url ?? p.directVideoUrl ?? null;
      const mime = video?.mime ?? (p.directVideoUrl ? guessMime(p.directVideoUrl) : null);
      return {
        partId: p.partId,
        type: p.type,
        title: p.title,
        duration: p.duration,
        content: p.content,
        topics: p.topics ?? [],
        questions: p.questions.map((q) => ({ question: q.question, options: q.options })),
        questionCount: p.questions.length,
        videoId: videoIdStr,
        videoUrl: url,
        videoMimeType: mime,
        videoDurationSec: video?.duration ?? null,
      };
    }),
  };
}

function guessMime(url: string): string | null {
  const lower = url.toLowerCase();
  if (lower.endsWith('.mp4')) return 'video/mp4';
  if (lower.endsWith('.webm')) return 'video/webm';
  if (lower.endsWith('.mov')) return 'video/quicktime';
  return null;
}

export async function listCourses(): Promise<PublicCourse[]> {
  const docs = await Course.find({ status: 'published' })
    .sort({ tagName: 1, tier: 1, title: 1 })
    .lean();
  return Promise.all(docs.map((d) => toPublicCourse(d as unknown as RawCourse)));
}

export async function getCourseBySlug(slug: string): Promise<PublicCourse> {
  const doc = await Course.findOne({ slug: slug.toLowerCase() }).lean();
  if (!doc) throw new HttpError(404, 'Course not found');
  return toPublicCourse(doc as unknown as RawCourse);
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

// ─── Admin CRUD ────────────────────────────────────────────────────────────
// The admin variant returns the full raw parts (still without correctIndex/
// explanation stripped) so admins can edit quiz answers. All admin routes
// are behind adminRequired middleware.

export interface AdminCourse extends Omit<PublicCourse, 'parts'> {
  parts: Array<{
    partId: string;
    type: 'real_world' | 'knowledge' | 'video' | 'mastery_check' | 'credential';
    title: string;
    duration: string;
    content: string;
    topics: string[];
    questions: Array<{ question: string; options: string[]; correctIndex: number; explanation: string }>;
    videoId: string | null;
  }>;
}

function toAdminCourse(doc: RawCourse): AdminCourse {
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
      questions: p.questions ?? [],
      videoId: p.videoId ? String(p.videoId) : null,
    })),
  };
}

export async function adminListCourses(): Promise<AdminCourse[]> {
  const docs = await Course.find({}).sort({ tagName: 1, tier: 1, title: 1 }).lean();
  return docs.map((d) => toAdminCourse(d as unknown as RawCourse));
}

export async function adminGetCourse(slug: string): Promise<AdminCourse> {
  const doc = await Course.findOne({ slug: slug.toLowerCase() }).lean();
  if (!doc) throw new HttpError(404, 'Course not found');
  return toAdminCourse(doc as unknown as RawCourse);
}

export interface AdminCourseInput {
  slug: string;
  title: string;
  techFocus: string;
  tagName: string;
  tier: CourseTier;
  duration?: number;
  description?: string;
  provider?: string;
  isManufacturer?: boolean;
  equipmentName?: string | null;
  passMark?: number;
  retakeCooldownHours?: number;
  techScoreContribution?: number;
  status?: 'published' | 'coming_soon';
  technicalCompetencies?: string[];
  parts?: AdminCourse['parts'];
}

export async function adminCreateCourse(input: AdminCourseInput): Promise<AdminCourse> {
  const slug = input.slug.toLowerCase().trim();
  const existing = await Course.findOne({ slug });
  if (existing) throw new HttpError(409, `Course with slug "${slug}" already exists`);

  const doc = await Course.create({
    slug,
    title: input.title,
    techFocus: input.techFocus,
    tagName: input.tagName,
    tier: input.tier,
    duration: input.duration ?? 30,
    description: input.description ?? '',
    provider: input.provider ?? 'quipp',
    isManufacturer: input.isManufacturer ?? false,
    equipmentName: input.equipmentName ?? null,
    passMark: input.passMark ?? 80,
    retakeCooldownHours: input.retakeCooldownHours ?? 24,
    techScoreContribution: input.techScoreContribution ?? 5,
    status: input.status ?? 'coming_soon',
    technicalCompetencies: input.technicalCompetencies ?? [],
    parts: input.parts ?? [],
  });
  return toAdminCourse(doc.toObject() as unknown as RawCourse);
}

export async function adminUpdateCourse(
  slug: string,
  patch: Partial<AdminCourseInput>,
): Promise<AdminCourse> {
  const doc = await Course.findOne({ slug: slug.toLowerCase() });
  if (!doc) throw new HttpError(404, 'Course not found');

  const allowed: Array<keyof AdminCourseInput> = [
    'title',
    'techFocus',
    'tagName',
    'tier',
    'duration',
    'description',
    'provider',
    'isManufacturer',
    'equipmentName',
    'passMark',
    'retakeCooldownHours',
    'techScoreContribution',
    'status',
    'technicalCompetencies',
    'parts',
  ];
  for (const key of allowed) {
    if (patch[key] !== undefined) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (doc as any)[key] = patch[key];
    }
  }
  await doc.save();
  return toAdminCourse(doc.toObject() as unknown as RawCourse);
}

export async function adminSetStatus(
  slug: string,
  status: 'published' | 'coming_soon',
): Promise<AdminCourse> {
  const doc = await Course.findOneAndUpdate(
    { slug: slug.toLowerCase() },
    { status },
    { new: true },
  );
  if (!doc) throw new HttpError(404, 'Course not found');
  return toAdminCourse(doc.toObject() as unknown as RawCourse);
}
