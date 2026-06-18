// Local LLM client — talks to llm-gateway (OpenAI-compatible) which fronts Ollama.
// Gateway routes to small/large model by `tier` or by `capability` map.
// Default target in dev: Ollama directly at http://localhost:11434/v1
import OpenAI from 'openai';
import { env } from '$env/dynamic/private';

const LLM_URL = env.LOCAL_LLM_URL ?? 'http://localhost:11434/v1';
const TIMEOUT_MS = Number(env.LOCAL_LLM_TIMEOUT_MS ?? 60000);
const DEFAULT_TIER = (env.LLM_DEFAULT_TIER ?? 'large') as 'small' | 'large';
const SMALL_MODEL = env.LLM_SMALL_MODEL ?? 'llama3.2:3b';
const LARGE_MODEL = env.LLM_LARGE_MODEL ?? 'qwen2.5:14b';
const TENANT_SLUG = env.TENANT_SLUG ?? 'groundz';

export const LOCAL_LLM_MODEL = LARGE_MODEL;   // legacy export, defaults to large
export const LLM_TIERS = { small: SMALL_MODEL, large: LARGE_MODEL } as const;

export type LlmTier = 'small' | 'large';

let _client: OpenAI | null = null;

export function getLocalLLM(): OpenAI {
  if (_client) return _client;
  _client = new OpenAI({
    baseURL: LLM_URL,
    apiKey: 'gw-' + TENANT_SLUG,
    timeout: TIMEOUT_MS,
    maxRetries: 2,
    defaultHeaders: { 'X-Tenant-Slug': TENANT_SLUG },
  });
  return _client;
}

/**
 * Capability → tier map. Mirrored in llm-gateway/router.ts.
 * Keep in sync. If capability is unknown, falls back to DEFAULT_TIER.
 */
const CAPABILITY_TIER: Record<string, LlmTier> = {
  'seo.audit-page':            'small',
  'seo.generate-cluster':      'large',
  'seo.generate-meta':         'small',
  'seo.rewrite-section':       'large',
  'seo.suggest-links':         'small',
  'seo.setup-analyze':         'large',
  'invest.metric-explain':     'small',
  'invest.portfolio-insight':  'large',
  'invest.pool-chat':          'large',
  'invest.pool-compare':       'large',
  'invest.cashflow-forecast':  'large',
  'invest.risk-narrative':     'large',
  'invest.pipeline-insight':   'large',
  'invest.construction-alert': 'small',
  'market.ai-insight':         'large',
  'chat.public':               'small',
  'chat.classify':             'small',
  'chat.authenticated':        'large',
  'comments.auto-mod':         'small',
  'schema-agent.classify':     'small',
  'schema-agent.infer-fields': 'large',
  'schema-agent.infer-voice':  'large',
  'rag.ask':                   'large',
  'rag.classify-content-type': 'small',
};

export function resolveTier(opts: { tier?: LlmTier; capability?: string }): LlmTier {
  if (opts.tier) return opts.tier;
  if (opts.capability && CAPABILITY_TIER[opts.capability]) return CAPABILITY_TIER[opts.capability];
  return DEFAULT_TIER;
}

export interface LocalChatOptions {
  prompt: string;
  systemPrompt?: string;
  temperature?: number;
  maxTokens?: number;
  jsonMode?: boolean;
  tier?: LlmTier;
  capability?: string;
}

export class LocalAiError extends Error {
  constructor(message: string, public readonly code: 'timeout' | 'unavailable' | 'api_error' | 'queue_full') {
    super(message);
    this.name = 'LocalAiError';
  }
}

export async function localChat(options: LocalChatOptions): Promise<{
  content: string;
  inputTokens: number;
  outputTokens: number;
  tier: LlmTier;
  model: string;
}> {
  const client = getLocalLLM();
  const tier = resolveTier(options);
  const model = LLM_TIERS[tier];
  const system = options.systemPrompt ?? 'You are a helpful assistant for a Cyprus real estate platform.';

  try {
    const response = await client.chat.completions.create({
      model,
      temperature: options.temperature ?? 0.3,
      max_tokens: options.maxTokens ?? (tier === 'small' ? 200 : 1000),
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: options.prompt },
      ],
      ...(options.jsonMode ? { response_format: { type: 'json_object' as const } } : {}),
    }, {
      headers: {
        'X-Tenant-Slug': TENANT_SLUG,
        ...(options.capability ? { 'X-Capability': options.capability } : {}),
        'X-Tier': tier,
      },
    });

    return {
      content: response.choices[0]?.message?.content ?? '',
      inputTokens: response.usage?.prompt_tokens ?? 0,
      outputTokens: response.usage?.completion_tokens ?? 0,
      tier,
      model,
    };
  } catch (err) {
    if (err instanceof OpenAI.APIError) {
      if (err.status === 429) throw new LocalAiError('Gateway queue full', 'queue_full');
      throw new LocalAiError(`Local LLM error ${err.status}: ${err.message}`, 'api_error');
    }
    const msg = err instanceof Error ? err.message : String(err);
    if (msg.includes('ECONNREFUSED') || msg.includes('fetch failed')) {
      throw new LocalAiError(`LLM gateway unreachable at ${LLM_URL}`, 'unavailable');
    }
    throw new LocalAiError(msg, 'api_error');
  }
}
