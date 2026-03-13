// src/lib/server/seo/ai-client.ts
// OpenAI wrapper for SEO module — reuses same client/key pattern as src/lib/server/ai.ts

import OpenAI from 'openai';
import { OPENAI_API_KEY } from '$env/static/private';
import { getSetting } from '$lib/server/settings.js';

const AI_CONFIG = {
  model: 'gpt-4o',
  maxTokens: 1000,
  temperature: 0.3,
  maxRetries: 3,
  retryDelayMs: 1000,
  timeoutMs: 15000,
} as const;

export interface AiCallOptions {
  prompt: string;
  systemPrompt?: string;
}

export interface AiCallResult {
  content: string;
  inputTokens: number;
  outputTokens: number;
}

export class AiClientError extends Error {
  constructor(
    message: string,
    public readonly code: 'timeout' | 'rate_limit' | 'api_error' | 'no_key'
  ) {
    super(message);
    this.name = 'AiClientError';
  }
}

async function getClient(): Promise<OpenAI> {
  const dbKey = await getSetting('openai_api_key');
  const apiKey = dbKey || OPENAI_API_KEY;
  if (!apiKey) throw new AiClientError('OpenAI API key not configured', 'no_key');
  return new OpenAI({ apiKey, timeout: AI_CONFIG.timeoutMs, maxRetries: AI_CONFIG.maxRetries });
}

export async function callAI(options: AiCallOptions): Promise<AiCallResult> {
  const openai = await getClient();

  const system = options.systemPrompt ?? 'You are an SEO specialist for a Cyprus real estate platform.';

  try {
    const response = await openai.chat.completions.create({
      model: AI_CONFIG.model,
      temperature: AI_CONFIG.temperature,
      max_tokens: AI_CONFIG.maxTokens,
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: options.prompt },
      ],
    });

    const content = response.choices[0]?.message?.content ?? '';

    return {
      content,
      inputTokens: response.usage?.prompt_tokens ?? 0,
      outputTokens: response.usage?.completion_tokens ?? 0,
    };
  } catch (err) {
    if (err instanceof OpenAI.APIError) {
      if (err.status === 429) throw new AiClientError('Rate limit exceeded', 'rate_limit');
      throw new AiClientError(`API error ${err.status}: ${err.message}`, 'api_error');
    }
    throw new AiClientError((err as Error).message ?? 'Unknown error', 'api_error');
  }
}
