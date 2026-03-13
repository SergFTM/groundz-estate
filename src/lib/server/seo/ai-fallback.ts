// src/lib/server/seo/ai-fallback.ts
// Defines fallback behaviour when AI API is unavailable.
// The system MUST work without AI — this ensures that contract.

import type { SemanticAnalysis, MetaSuggestion, LinkSuggestion } from './types.js';
import { AiClientError } from './ai-client.js';

export function isAiError(err: unknown): boolean {
  return err instanceof AiClientError || (err instanceof Error && err.name === 'AbortError');
}

export const FALLBACK_SEMANTICS: SemanticAnalysis | null = null;
export const FALLBACK_META: MetaSuggestion | null = null;
export const FALLBACK_LINKS: LinkSuggestion[] = [];

/** Wraps an AI call, returns null on any AI failure — never throws. */
export async function withAiFallback<T>(
  fn: () => Promise<T>,
  fallback: T
): Promise<{ result: T; aiAvailable: boolean }> {
  try {
    const result = await fn();
    return { result, aiAvailable: true };
  } catch {
    return { result: fallback, aiAvailable: false };
  }
}
