import { HumanMessage, SystemMessage } from '@langchain/core/messages';
import { ChatAnthropic } from '@langchain/anthropic';
import { END, START, StateGraph } from '@langchain/langgraph';
import { MongoDBSaver } from '@langchain/langgraph-checkpoint-mongodb';
import mongoose from 'mongoose';
import { z } from 'zod';
import { env } from '../../config/env.js';
import { contextIdentityNode } from './context.js';
import {
  responseSystemPrompt,
  responseUserPrompt,
  ROUTER_PROMPT,
} from './prompts.js';
import {
  QUIPPY_INTENTS,
  QuippyState,
  type IntentFilters,
  type ModelUsage,
  type QuippyGraphState,
} from './state.js';
import { getBusinessTrainingStatus } from './tools/getBusinessTrainingStatus.js';
import { getCourseOptions } from './tools/getCourseOptions.js';
import { searchWorkers } from './tools/searchWorkers.js';
import { requestIntroduction } from './tools/requestIntroduction.js';
import { searchProducts } from './tools/searchProducts.js';
import { createConfirmedLead } from './tools/createLead.js';
import {
  deterministicFallback,
  finalizeValidatedResponse,
} from './validators.js';
import {
  deterministicIntent,
  exactIntroductionConfirmation,
  extractIntroduction,
  extractQuoteCommand,
  sameQuote,
} from './router.js';

const routeSchema = z.object({
  intent: z.enum(QUIPPY_INTENTS),
  filters: z.object({
    query: z.string().max(120).optional(),
    location: z.string().max(120).optional(),
    baseRole: z.string().max(80).optional(),
    credentialTier: z.enum(['IN', 'DEEP', 'THERE']).optional(),
    tag: z.string().max(80).optional(),
    equipment: z.string().max(120).optional(),
    candidateUsername: z.string().max(40).optional(),
    purpose: z.string().max(500).optional(),
    category: z.string().max(100).optional(),
    city: z.string().max(120).optional(),
    region: z.string().max(120).optional(),
    budgetMaxCents: z.number().int().min(0).max(1_000_000_000).optional(),
    currency: z.string().length(3).optional(),
    requirements: z.string().max(5000).optional(),
    confirmed: z.boolean().optional(),
  }),
});

let modelInstance: ChatAnthropic | null = null;
function model(): ChatAnthropic {
  if (!env.ANTHROPIC_API_KEY) {
    throw new Error('ANTHROPIC_API_KEY is required for QUIPPY');
  }
  if (!modelInstance) {
    modelInstance = new ChatAnthropic({
      apiKey: env.ANTHROPIC_API_KEY,
      model: env.ANTHROPIC_MODEL,
      maxTokens: 1200,
      temperature: 0.2,
    });
  }
  return modelInstance;
}

type UsageMessage = {
  usage_metadata?: {
    input_tokens?: number;
    output_tokens?: number;
    total_tokens?: number;
  };
};

function usageFromMessage(message: UsageMessage): ModelUsage {
  return {
    model: env.ANTHROPIC_MODEL,
    inputTokens: message.usage_metadata?.input_tokens ?? null,
    outputTokens: message.usage_metadata?.output_tokens ?? null,
    totalTokens: message.usage_metadata?.total_tokens ?? null,
    // Pricing is not stable or discoverable for arbitrary configured model IDs.
    estimatedCostUsd: null,
  };
}

function mergeUsage(first: ModelUsage | null, second: ModelUsage): ModelUsage {
  const sum = (a: number | null, b: number | null) =>
    a === null && b === null ? null : (a ?? 0) + (b ?? 0);
  return {
    model: second.model,
    inputTokens: sum(first?.inputTokens ?? null, second.inputTokens),
    outputTokens: sum(first?.outputTokens ?? null, second.outputTokens),
    totalTokens: sum(first?.totalTokens ?? null, second.totalTokens),
    estimatedCostUsd: null,
  };
}

async function intentRoutingNode(
  state: QuippyGraphState,
): Promise<Partial<QuippyGraphState>> {
  const confirmedUsername = exactIntroductionConfirmation(state.content.trim());
  if (confirmedUsername) {
    const priorRequest = [...state.history]
      .reverse()
      .filter((turn) => turn.role === 'user')
      .map((turn) => extractIntroduction(turn.content))
      .find((filters) => filters.candidateUsername === confirmedUsername && filters.purpose);
    const retainedPurpose =
      state.filters.candidateUsername === confirmedUsername
        ? state.filters.purpose
        : undefined;
    return {
      intent: 'introduction',
      filters: {
        candidateUsername: confirmedUsername,
        purpose: retainedPurpose ?? priorRequest?.purpose,
        confirmed: true,
      },
    };
  }
  const quote = extractQuoteCommand(state.content.trim());
  if (quote) {
    const asksConfirmation = /^CONFIRM\s+QUOTE\b/i.test(state.content.trim());
    const priorPreview = [...state.history]
      .reverse()
      .filter((turn) => turn.role === 'user')
      .map((turn) => extractQuoteCommand(turn.content))
      .find((item): item is IntentFilters => Boolean(item && sameQuote(item, quote)));
    return {
      intent: 'lead',
      filters: {
        ...quote,
        confirmed: asksConfirmation && Boolean(priorPreview),
      },
    };
  }
  try {
    const router = model().withStructuredOutput(routeSchema, {
      name: 'quippy_intent_route',
      includeRaw: true,
    });
    const routed = await router.invoke([
      new SystemMessage(ROUTER_PROMPT),
      new HumanMessage(
        `<untrusted_user_content>\n${state.content}\n</untrusted_user_content>`,
      ),
    ]);
    if (!routed.parsed) throw new Error('QUIPPY intent route was not parsed');
    return {
      intent: routed.parsed.intent,
      filters: { ...routed.parsed.filters, confirmed: false },
      modelUsage: usageFromMessage(routed.raw as UsageMessage),
    };
  } catch {
    return deterministicIntent(state.content);
  }
}

async function authorizedToolExecutionNode(
  state: QuippyGraphState,
): Promise<Partial<QuippyGraphState>> {
  if (state.intent === 'worker_search' || state.intent === 'professional_search') {
    const results = await searchWorkers(state.filters, 5);
    return {
      toolResults: [results],
      toolMetadata: [
        {
          tool: 'searchWorkers',
          resultCount: results.length,
          authorized: true,
        },
      ],
    };
  }
  if (state.intent === 'introduction') {
    const username = state.filters.candidateUsername;
    if (state.filters.confirmed) {
      if (!state.userId) {
        return {
          toolResults: [{ ok: false, error: 'linked_identity_required' }],
          toolMetadata: [{
            tool: 'requestIntroduction',
            authorized: false,
            note: 'A linked authenticated identity is required.',
          }],
        };
      }
      if (!username || !state.filters.purpose) {
        return {
          toolResults: [{ ok: false, error: 'preview_context_missing' }],
          toolMetadata: [{
            tool: 'requestIntroduction',
            authorized: false,
            note: 'Repeat the introduction request with a purpose before confirming.',
          }],
        };
      }
      const result = await requestIntroduction(
        state.userId,
        username,
        state.filters.purpose,
      );
      return {
        toolResults: [result],
        toolMetadata: [{
          tool: 'requestIntroduction',
          authorized: result.ok,
          resultCount: result.ok ? 1 : 0,
          note: result.error,
        }],
      };
    }
    const results = await searchWorkers(state.filters, 5);
    return {
      toolResults: [results],
      toolMetadata: [{
        tool: 'searchWorkers',
        authorized: true,
        resultCount: results.length,
        note: username && state.filters.purpose
          ? `Preview only. Require exact confirmation: CONFIRM INTRO @${username}`
          : 'Preview only. Candidate username and purpose are required before confirmation.',
      }],
    };
  }
  if (state.intent === 'course_search') {
    const results = await getCourseOptions(state.userId, state.filters);
    return {
      toolResults: [results],
      toolMetadata: [
        {
          tool: 'getCourseOptions',
          resultCount: results.length,
          authorized: true,
        },
      ],
    };
  }
  if (state.intent === 'business_training_status') {
    try {
      const result = await getBusinessTrainingStatus(state.userId);
      return {
        toolResults: [result],
        toolMetadata: [
          { tool: 'getBusinessTrainingStatus', authorized: true, resultCount: 1 },
        ],
      };
    } catch (error) {
      return {
        toolResults: [{ error: 'operator_access_required' }],
        toolMetadata: [
          {
            tool: 'getBusinessTrainingStatus',
            authorized: false,
            note: error instanceof Error ? error.message : 'Access denied',
          },
        ],
      };
    }
  }
  if (state.intent === 'product_search') {
    const results = await searchProducts(state.filters);
    return {
      toolResults: [results],
      toolMetadata: [{
        tool: 'searchProducts',
        authorized: true,
        resultCount: results.length,
        affiliateTagged: results.some((result) => Boolean(result.offer)),
      }],
    };
  }
  if (state.intent === 'lead') {
    if (!state.filters.confirmed) {
      return {
        toolResults: [],
        toolMetadata: [{
          tool: 'createLead',
          authorized: false,
          note:
            state.filters.category && state.filters.city && state.filters.requirements
              ? 'Preview only. Exact matching confirmation command is required.'
              : 'Preview fields are incomplete.',
        }],
      };
    }
    if (!state.userId) {
      return {
        toolResults: [{ ok: false, error: 'linked_identity_required' }],
        toolMetadata: [{
          tool: 'createLead',
          authorized: false,
          note: 'A linked authenticated identity is required.',
        }],
      };
    }
    const result = await createConfirmedLead(state.userId, state.filters);
    return {
      toolResults: [result],
      toolMetadata: [{
        tool: 'createLead',
        authorized: result.ok,
        resultCount: result.ok ? 1 : 0,
        note: result.ok ? undefined : result.error,
      }],
    };
  }
  return { toolResults: [], toolMetadata: [] };
}

function messageText(content: unknown): string {
  if (typeof content === 'string') return content;
  if (!Array.isArray(content)) return '';
  return content
    .map((block) => {
      if (
        typeof block === 'object' &&
        block !== null &&
        'text' in block &&
        typeof block.text === 'string'
      ) {
        return block.text;
      }
      return '';
    })
    .join('');
}

async function responseGenerationNode(
  state: QuippyGraphState,
): Promise<Partial<QuippyGraphState>> {
  if (state.intent === 'introduction' || state.intent === 'lead') {
    return { draft: deterministicFallback(state) };
  }
  const reply = await model().invoke([
    new SystemMessage(responseSystemPrompt(state)),
    new HumanMessage(responseUserPrompt(state)),
  ]);
  return {
    draft: messageText(reply.content),
    modelUsage: mergeUsage(
      state.modelUsage,
      usageFromMessage(reply as UsageMessage),
    ),
  };
}

async function responseValidationNode(
  state: QuippyGraphState,
): Promise<Partial<QuippyGraphState>> {
  return finalizeValidatedResponse(state);
}

let graphPromise: Promise<ReturnType<typeof buildGraph>> | null = null;

function buildGraph(checkpointer: MongoDBSaver) {
  return new StateGraph(QuippyState)
    .addNode('context_identity', contextIdentityNode)
    .addNode('intent_routing', intentRoutingNode)
    .addNode('authorized_tool_execution', authorizedToolExecutionNode)
    .addNode('response_generation', responseGenerationNode)
    .addNode('response_validation', responseValidationNode)
    .addEdge(START, 'context_identity')
    .addEdge('context_identity', 'intent_routing')
    .addEdge('intent_routing', 'authorized_tool_execution')
    .addEdge('authorized_tool_execution', 'response_generation')
    .addEdge('response_generation', 'response_validation')
    .addEdge('response_validation', END)
    .compile({ checkpointer, name: 'quippy-controlled-agent' });
}

async function initializeGraph(): Promise<ReturnType<typeof buildGraph>> {
  if (mongoose.connection.readyState !== 1) {
    throw new Error('MongoDB must be connected before initializing QUIPPY');
  }
  type CheckpointMongoClient =
    ConstructorParameters<typeof MongoDBSaver>[0]['client'];
  // Mongoose and the checkpoint package may resolve different compatible
  // mongodb package versions, so bridge their nominal client types here.
  const client =
    mongoose.connection.getClient() as unknown as CheckpointMongoClient;
  const checkpointer = new MongoDBSaver({
    client,
    dbName: mongoose.connection.db?.databaseName,
    checkpointCollectionName: 'quippy_checkpoints',
    checkpointWritesCollectionName: 'quippy_checkpoint_writes',
    enableTimestamps: true,
  });
  const setupErrors = await checkpointer.setup();
  if (setupErrors.length) {
    throw new AggregateError(
      setupErrors,
      'QUIPPY MongoDB checkpoint setup failed',
    );
  }
  return buildGraph(checkpointer);
}

export async function getQuippyGraph(): Promise<ReturnType<typeof buildGraph>> {
  if (!graphPromise) {
    graphPromise = initializeGraph().catch((error) => {
      graphPromise = null;
      throw error;
    });
  }
  return graphPromise;
}
