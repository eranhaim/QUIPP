export type TagName = 'THERMAL' | 'COLD' | 'BEVERAGE' | 'DIGITAL' | 'SERVICE';
export type Tier = 'IN' | 'DEEP' | 'THERE';
export type VisibilityStatus = 'open' | 'employed' | 'private';
export type BaseRole = 'Kitchen' | 'Bar' | 'Floor' | 'Management' | 'Ownership' | 'Other';
export type CourseStatus =
  | 'draft'
  | 'submitted'
  | 'changes_requested'
  | 'approved'
  | 'published'
  | 'coming_soon';
export type CourseReviewStatus = 'draft' | 'submitted' | 'changes_requested' | 'approved';
export type CourseVisibility = 'public' | 'organization';

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

export type CoursePartType = 'real_world' | 'knowledge' | 'video' | 'mastery_check' | 'credential';

export interface CoursePart {
  partId: string;
  type: CoursePartType;
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
  status: CourseStatus;
  priceCents: number;
  ownerType: 'quipp' | 'operator';
  visibility: CourseVisibility;
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

export interface DiscoveredWorker {
  username: string;
  avatarUrl: string | null;
  techProficiencyScore: number;
  location: string | null;
  baseRole: string | null;
  techRole: string | null;
  specialty: string | null;
  yearsExperience: number;
  credentials: Array<{ title: string; tier: Tier; tag: string }>;
  equipment: Array<{ name: string; brand: string | null; verified: boolean }>;
}

export type IntroductionStatus =
  | 'pending'
  | 'connected'
  | 'declined'
  | 'cancelled'
  | 'expired'
  | 'reported';

export interface Introduction {
  id: string;
  direction: 'incoming' | 'outgoing';
  purpose: string;
  approvedChannel: 'email';
  status: IntroductionStatus;
  requesterConsentedAt: string;
  candidateConsentedAt: string | null;
  respondedAt: string | null;
  expiresAt: string;
  outcome: string | null;
  helpful: boolean | null;
  reportReason: string | null;
  createdAt: string;
  counterpart: {
    username: string;
    firstName: string | null;
    lastName: string | null;
    avatarUrl: string | null;
    email?: string;
  };
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
  credentialPendingReason: string | null;
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

export interface AdminCoursePart {
  partId: string;
  type: CoursePartType;
  title: string;
  duration: string;
  content: string;
  topics: string[];
  questions: Array<{
    question: string;
    options: string[];
    correctIndex: number;
    explanation: string;
  }>;
  videoId: string | null;
}

export interface AdminCourse extends Omit<Course, 'parts'> {
  stripePriceId: string | null;
  ownerOperatorId: string | null;
  createdByUserId: string | null;
  reviewStatus: CourseReviewStatus;
  reviewNotes: string;
  reviewedBy: string | null;
  reviewedAt: string | null;
  approvedVersion: number;
  parts: AdminCoursePart[];
}

export interface Payment {
  _id: string;
  operatorId: string;
  userId: string;
  amountCents: number;
  currency: string;
  status: 'pending' | 'paid' | 'failed' | 'expired';
  quantity: number;
  courseId: string;
  stripeCheckoutSessionId?: string;
  stripePaymentIntentId?: string;
  paidAt: string | null;
  failureReason: string;
  createdAt: string;
  updatedAt: string;
}

export interface CourseAccessPack {
  _id: string;
  operatorId: string;
  courseId: Pick<Course, 'slug' | 'title' | 'priceCents' | 'status' | 'visibility'> & {
    _id: string;
    id?: string;
  };
  paymentId: Pick<Payment, '_id' | 'amountCents' | 'currency' | 'status' | 'paidAt'>;
  quantity: number;
  assignedCount: number;
  status: 'active' | 'exhausted' | 'expired' | 'cancelled';
  expiresAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface SeatAssignment {
  _id: string;
  packId: string;
  operatorId: string;
  courseId: string;
  workerId: string;
  assignedBy: string;
  status: 'assigned' | 'consumed' | 'revoked';
  assignedAt: string;
  consumedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Video {
  id: string;
  title: string;
  originalFilename: string;
  mimeType: string;
  sizeBytes: number;
  durationSec: number | null;
  status: 'pending' | 'ready' | 'failed';
  createdAt: string;
}

export interface DeepSubmission {
  id: string;
  userId: string;
  courseId: string;
  courseSlug: string;
  courseTitle: string;
  inCredentialId: string;
  supervisorName: string;
  supervisorEmail: string;
  supervisorText: string;
  status: 'pending' | 'approved' | 'rejected';
  reviewNotes: string | null;
  reviewedBy: string | null;
  reviewedAt: string | null;
  submittedAt: string;
  worker?: {
    id: string;
    username: string;
    firstName: string | null;
    lastName: string | null;
  };
}

export interface QuippyMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  createdAt: string;
}

export interface Operator {
  _id: string;
  ownerUserId: string;
  companyName: string;
  businessType: string;
  staffSize: number;
  hqLocation: string;
  logoUrl: string | null;
  onboardingCompletedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface OperatorLocation {
  _id: string;
  operatorId: string;
  name: string;
  code: string;
  address: string | null;
  city: string;
  country: string;
  timezone: string;
  createdAt: string;
  updatedAt: string;
}

export interface OperatorOverview {
  operatorId: string;
  staff: {
    pending: number;
    active: number;
    declined: number;
    unlinked: number;
    total: number;
  };
  locations: number;
  assignments: {
    assigned: number;
    inProgress: number;
    completed: number;
    total: number;
  };
}

export interface OperatorRosterMember {
  link: {
    id: string;
    workerId: string;
    locationId: string | null;
    status: 'active';
    linkedAt: string;
  };
  worker: {
    firstName: string | null;
    lastName: string | null;
    email: string | null;
    profile: {
      username: string;
      avatarUrl: string | null;
      techProficiencyScore: number;
      techRole: string | null;
      baseRole: BaseRole | null;
      specialty: string | null;
      yearsExperience: number;
    } | null;
    credentials: Array<{
      courseSlug: string;
      courseName: string;
      tier: Tier;
      tagName: TagName;
      provider: string;
      earnedDate: string;
      status: Credential['status'];
    }>;
  };
}

export interface OperatorCourseReference {
  _id: string;
  slug: string;
  title: string;
  tier: Tier;
  tagName: TagName;
  status: Course['status'];
}

export interface TrainingRequirement {
  _id: string;
  operatorId: string;
  locationId: string | null;
  baseRole: BaseRole | null;
  courseId: OperatorCourseReference;
  required: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CourseAssignment {
  _id: string;
  operatorId: string;
  locationId: string | null;
  workerId: {
    _id: string;
    firstName: string | null;
    lastName: string | null;
    email: string;
  };
  courseId: OperatorCourseReference;
  courseSlug: string;
  assignedBy: string;
  status: 'assigned' | 'in_progress' | 'completed';
  assignedAt: string;
  startedAt: string | null;
  completedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface WorkplaceLink {
  _id: string;
  workerId: string;
  operatorId: {
    _id: string;
    companyName: string;
    businessType: string;
    hqLocation: string;
  };
  locationId: {
    _id: string;
    name: string;
    code: string;
    city: string;
    country: string;
  } | null;
  status: 'pending' | 'active' | 'declined' | 'unlinked';
  invitedBy: string;
  operatorVisibilityEndsAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Endorsement {
  id: string;
  workerId: string;
  operatorId: string;
  thereCourseId: string;
  deepCredentialId: string;
  statement: string;
  status: 'pending' | 'approved' | 'rejected';
  requestedAt: string;
  reviewedBy: string | null;
  reviewedAt: string | null;
  reviewNotes: string | null;
  worker: {
    firstName: string | null;
    lastName: string | null;
    email: string;
  } | null;
  operator: { companyName: string } | null;
  thereCourse: {
    slug: string;
    title: string;
    tagName: TagName;
    techFocus: string;
    equipmentName: string | null;
  } | null;
  deepCredential: {
    courseName: string;
    tagName: TagName;
    techFocus: string;
  } | null;
}

export interface MarketplaceProduct {
  id: string;
  slug: string;
  name: string;
  category: string;
  brand: string;
  model: string;
  description: string;
  specifications: Record<string, string>;
  regions: string[];
  priceMinCents: number | null;
  priceMaxCents: number | null;
  currency: string;
  sourceUrl: string;
  sourceUpdatedAt: string;
  dataNotice: string;
  supplier: { id: string; companyName: string; slug: string };
  offer: { id: string; disclosureLabel: string; trackedUrl: string } | null;
  fitScore: number;
}

export interface LeadProposal {
  id: string;
  leadId: string;
  supplier: {
    id: string;
    companyName: string;
    slug: string;
    contactEmail?: string | null;
    websiteUrl?: string | null;
  };
  message: string;
  priceEstimateMinCents: number | null;
  priceEstimateMaxCents: number | null;
  currency: string;
  status: 'submitted' | 'accepted' | 'declined' | 'withdrawn';
  submittedAt: string;
}

export interface LeadOpportunity {
  id: string;
  category: string;
  city: string;
  region: string;
  budgetMinCents: number | null;
  budgetMaxCents: number | null;
  currency: string;
  requirements: string;
  urgency: 'low' | 'normal' | 'high';
  consentedFields: string[];
  status: 'draft' | 'open' | 'matched' | 'closed' | 'cancelled';
  expiresAt: string;
  createdAt: string;
  proposals: LeadProposal[];
}

export interface SupplierLead {
  id: string;
  anonymousRef: string;
  category: string;
  city: string;
  region: string;
  budgetMinCents: number | null;
  budgetMaxCents: number | null;
  currency: string;
  requirements: string;
  urgency: 'low' | 'normal' | 'high';
  expiresAt: string;
  createdAt: string;
}
