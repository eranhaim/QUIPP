import { QuippyProfile } from '../models/QuippyProfile.js';

export interface SaveQuippyProfileInput {
  audience?: 'unknown' | 'worker' | 'operator' | 'supplier';
  language?: string;
  onboardingStage?: string;
  completed?: boolean;
  facts?: Record<string, string | number | string[] | null>;
}

function publicProfile(profile: InstanceType<typeof QuippyProfile>) {
  return {
    id: String(profile._id),
    principalKey: profile.principalKey,
    audience: profile.audience,
    language: profile.language,
    onboardingStage: profile.onboardingStage,
    onboardingCompletedAt: profile.onboardingCompletedAt?.toISOString() ?? null,
    facts: profile.facts
      .filter((fact) => !fact.deletedAt)
      .map((fact) => ({
        key: fact.key,
        value: fact.value,
        source: fact.source,
        confidence: fact.confidence,
        sensitivity: fact.sensitivity,
        expiresAt: fact.expiresAt?.toISOString() ?? null,
      })),
  };
}

async function getOrCreate(userId: string) {
  const principalKey = `user:${userId}`;
  return QuippyProfile.findOneAndUpdate(
    { principalKey },
    {
      $setOnInsert: {
        principalKey,
        userId,
        language: 'en',
        onboardingStage: 'new',
      },
    },
    { upsert: true, new: true, runValidators: true },
  );
}

export async function getQuippyProfile(userId: string) {
  return publicProfile(await getOrCreate(userId));
}

export async function saveQuippyProfile(userId: string, input: SaveQuippyProfileInput) {
  const profile = await getOrCreate(userId);
  if (input.audience !== undefined) profile.audience = input.audience;
  if (input.language !== undefined) profile.language = input.language;
  if (input.onboardingStage !== undefined) profile.onboardingStage = input.onboardingStage;
  if (input.completed) profile.onboardingCompletedAt = new Date();

  for (const [key, value] of Object.entries(input.facts ?? {})) {
    const existing = profile.facts.find((fact) => fact.key === key && !fact.deletedAt);
    if (existing) {
      existing.value = value;
      existing.source = 'user';
      existing.confidence = 1;
      existing.sensitivity = 'personal';
      existing.deletedAt = null;
    } else {
      profile.facts.push({
        key,
        value,
        source: 'user',
        confidence: 1,
        sensitivity: 'personal',
        expiresAt: null,
        deletedAt: null,
      });
    }
  }

  await profile.save();
  return publicProfile(profile);
}
