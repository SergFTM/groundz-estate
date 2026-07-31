// SEO AI client — routes through llm-gateway by capability.
import { localChat, LocalAiError, type LlmTier } from '$lib/server/local-llm.js';

export interface AiCallOptions {
  prompt: string;
  systemPrompt?: string;
  capability?: string;
  tier?: LlmTier;
}

export interface AiCallResult {
  content: string;
  inputTokens: number;
  outputTokens: number;
}

export class AiClientError extends Error {
  constructor(
    message: string,
    public readonly code: 'timeout' | 'rate_limit' | 'api_error' | 'no_key' | 'queue_full'
  ) {
    super(message);
    this.name = 'AiClientError';
  }
}

export async function callAI(options: AiCallOptions): Promise<AiCallResult> {
  try {
    const result = await localChat({
      prompt: options.prompt,
      systemPrompt: options.systemPrompt ?? 'You are an SEO specialist for a Cyprus real estate platform.',
      temperature: 0.3,
      capability: options.capability,
      tier: options.tier,
    });
    return result;
  } catch (err) {
    if (err instanceof LocalAiError) {
      const code = err.code === 'unavailable'  ? 'no_key'
                 : err.code === 'timeout'      ? 'timeout'
                 : err.code === 'queue_full'   ? 'queue_full'
                 : 'api_error';
      throw new AiClientError(err.message, code);
    }
    throw new AiClientError((err as Error).message ?? 'Unknown error', 'api_error');
  }
}
