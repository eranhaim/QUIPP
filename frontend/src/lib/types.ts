export type TagName = 'THERMAL' | 'COLD' | 'BEVERAGE' | 'DIGITAL' | 'SERVICE';
export type Tier = 'IN' | 'DEEP' | 'THERE';
export type VisibilityStatus = 'open' | 'employed' | 'private';
export type BaseRole = 'Kitchen' | 'Bar' | 'Floor' | 'Management' | 'Ownership' | 'Other';

export interface Profile {
  id: string;
  userId: string;
  username: string;
  firstName: string | null;
  lastName: string | null;
  avatarUrl: string | null;
  techProficiencyScore: number;
  techScoreLabel: 'Building' | 'Growing' | 'Recognised' | 'Authority';
  techRole: string | null;
  baseRole: BaseRole | null;
  specialty: string | null;
  yearsExperience: number;
  location: string | null;
  visibilityStatus: VisibilityStatus;
}

export interface CoursePart {
  partId: string;
  type: 'real_world' | 'knowledge' | 'mastery_check' | 'credential';
  title: string;
  duration: string;
  content: string;
  topics: string[];
  questions: Array<{ question: string; options: string[] }>;
  questionCount: number;
}

export interface Course {
  id: string;
  slug: string;
  title: string;
  techFocus: string;
  tagName: TagName;
  tier: Tier;
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
  parts: CoursePart[];
}

export interface Enrollment {
  id: string;
  courseSlug: string;
  courseTitle: string;
  tagName: TagName;
  tier: Tier;
  status: 'in_progress' | 'completed' | 'failed';
  progressPct: number;
  startedAt: string;
  completedAt: string | null;
  lastScore: number | null;
  lastAttemptAt: string | null;
  cooldownEndsAt: string | null;
}

export interface Credential {
  id: string;
  userId: string;
  courseId: string;
  courseSlug: string;
  courseName: string;
  tier: Tier;
  tagName: TagName;
  provider: string;
  isManufacturer: boolean;
  techFocus: string;
  earnedDate: string;
  verificationId: string;
  quizScore: number | null;
  skillsDemonstrated: string[];
  techScoreContribution: number;
  status: 'active' | 'update_available';
}

export interface TechDeclaration {
  id: string;
  equipmentName: string;
  brand: string | null;
  tagName: TagName | null;
  verified: boolean;
  declaredAt: string;
}

export interface QuizResult {
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

export interface VerifyResult {
  credential: Credential;
  holder: {
    username: string;
    firstName: string | null;
    lastName: string | null;
  };
}

export interface TechTag {
  tagName: TagName;
  label: string;
  icon: string;
  description: string;
}
