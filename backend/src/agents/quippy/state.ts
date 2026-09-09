import { Annotation } from '@langchain/langgraph';

export const QUIPPY_INTENTS = [
  'onboarding',
  'equipment',
  'worker_search',
  'professional_search',
  'course_search',
  'business_training_status',
  'product_search',
  'introduction',
  'lead',
  'general',
] as const;

export type QuippyIntent = (typeof QUIPPY_INTENTS)[number];
export type QuippyChannel = 'web' | 'greenapi';
export type QuippyMode = 'general' | 'equipment';

export interface ConversationTurn {
  role: 'user' | 'assistant';
  content: string;
}

export interface IntentFilters {
  query?: string;
  location?: string;
  baseRole?: string;
  credentialTier?: 'IN' | 'DEEP' | 'THERE';
  tag?: string;
  equipment?: string;
  candidateUsername?: string;
  purpose?: string;
  category?: string;
  city?: string;
  region?: string;
  budgetMaxCents?: number;
  currency?: string;
  requirements?: string;
  confirmed?: boolean;
}

export interface IdentityContext {
  firstName: string | null;
  audience: 'unknown' | 'worker' | 'operator' | 'supplier';
  language: 'en' | 'he';
  onboardingComplete: boolean;
  declaredEquipment: Array<{ equipmentName: string; brand: string | null }>;
  credentials: Array<{ title: string; tier: string; tag: string }>;
}

export interface ToolMetadata {
  tool: string;
  resultCount?: number;
  authorized: boolean;
  affiliateTagged?: boolean;
  note?: string;
}

export interface ModelUsage {
  model: string;
  inputTokens: number | null;
  outputTokens: number | null;
  totalTokens: number | null;
  estimatedCostUsd: number | null;
}

export const QuippyState = Annotation.Root({
  principalKey: Annotation<string>,
  userId: Annotation<string | null>,
  channel: Annotation<QuippyChannel>,
  mode: Annotation<QuippyMode>,
  content: Annotation<string>,
  history: Annotation<ConversationTurn[]>({ default: () => [], reducer: (_left, right) => right }),
  identity: Annotation<IdentityContext | null>({
    default: () => null,
    reducer: (_left, right) => right,
  }),
  intent: Annotation<QuippyIntent>({ default: () => 'general', reducer: (_left, right) => right }),
  filters: Annotation<IntentFilters>({ default: () => ({}), reducer: (_left, right) => right }),
  toolResults: Annotation<unknown[]>({ default: () => [], reducer: (_left, right) => right }),
  toolMetadata: Annotation<ToolMetadata[]>({ default: () => [], reducer: (_left, right) => right }),
  modelUsage: Annotation<ModelUsage | null>({
    default: () => null,
    reducer: (_left, right) => right,
  }),
  draft: Annotation<string>({ default: () => '', reducer: (_left, right) => right }),
  response: Annotation<string>({ default: () => '', reducer: (_left, right) => right }),
  validationIssues: Annotation<string[]>({
    default: () => [],
    reducer: (_left, right) => right,
  }),
});

export type QuippyGraphState = typeof QuippyState.State;
