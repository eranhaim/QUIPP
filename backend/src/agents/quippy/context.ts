import { Credential } from '../../models/Credential.js';
import { QuippyProfile } from '../../models/QuippyProfile.js';
import { User } from '../../models/User.js';
import { WorkerTechDeclaration } from '../../models/WorkerTechDeclaration.js';
import type { IdentityContext, QuippyGraphState } from './state.js';

function detectLanguage(content: string, savedLanguage?: string): 'en' | 'he' {
  if (/[\u0590-\u05ff]/u.test(content)) return 'he';
  if (/[a-z]/i.test(content)) return 'en';
  return savedLanguage?.toLowerCase().startsWith('he') ? 'he' : 'en';
}

export async function loadIdentityContext(
  userId: string | null,
  principalKey: string,
  content: string,
): Promise<IdentityContext> {
  const [profile, user, declarations, credentials] = await Promise.all([
    QuippyProfile.findOne({ principalKey }).lean(),
    userId ? User.findById(userId).select({ firstName: 1 }).lean() : null,
    userId
      ? WorkerTechDeclaration.find({ userId })
          .select({ equipmentName: 1, brand: 1 })
          .limit(20)
          .lean()
      : [],
    userId
      ? Credential.find({ userId, status: 'active' })
          .select({ courseName: 1, tier: 1, tagName: 1 })
          .limit(20)
          .lean()
      : [],
  ]);

  return {
    firstName: user?.firstName ?? null,
    audience:
      (profile?.audience as IdentityContext['audience'] | undefined) ?? 'unknown',
    language: detectLanguage(content, profile?.language),
    onboardingComplete: Boolean(profile?.onboardingCompletedAt),
    declaredEquipment: declarations.map((item) => ({
      equipmentName: item.equipmentName,
      brand: item.brand ?? null,
    })),
    credentials: credentials.map((item) => ({
      title: item.courseName,
      tier: item.tier,
      tag: item.tagName,
    })),
  };
}

export async function contextIdentityNode(
  state: QuippyGraphState,
): Promise<Partial<QuippyGraphState>> {
  const identity = await loadIdentityContext(
    state.userId,
    state.principalKey,
    state.content,
  );
  return {
    identity,
    intent: 'general',
    filters: {},
    toolResults: [],
    toolMetadata: [],
    modelUsage: null,
    draft: '',
    response: '',
    validationIssues: [],
  };
}
