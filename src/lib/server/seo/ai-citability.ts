// src/lib/server/seo/ai-citability.ts
// AI-powered citability pass for AEO mode — flags claims an answer engine
// could not verify from the page. Same cache + fallback contract as ai-semantic.

import { readFileSync } from 'fs';
import { resolve } from 'path';
import { callAI } from './ai-client.js';
import { getCache, setCache, buildCacheKey, contentHash } from './ai-cache.js';
import type { AeoCitability, SeoAuditInput, StructuralAnalysis } from './types.js';

const PROMPT_PATH = resolve('src/lib/server/seo/prompts/aeo-citability.txt');

export async function analyzeCitabilityWithAI(
  input: SeoAuditInput,
  structural: StructuralAnalysis
): Promise<AeoCitability> {
  const hash = contentHash(input.html);
  const cacheKey = buildCacheKey({ pageId: input.pageId, contentHash: hash, type: 'aeo-citability' });

  const cached = getCache<AeoCitability>(cacheKey);
  if (cached) return cached;

  const promptTemplate = readFileSync(PROMPT_PATH, 'utf-8');
  const content = input.html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').slice(0, 3000);

  const prompt = promptTemplate
    .replace('{{title}}', structural.title ?? '')
    .replace('{{content}}', content);

  type RawResponse = { unverified_claims?: string[]; citability_notes?: string[] };

  const { content: raw } = await callAI({ prompt, capability: 'seo.audit-page' });
  const match = raw.match(/\{[\s\S]*\}/);
  let parsed: RawResponse | null = null;
  try {
    parsed = match ? JSON.parse(match[0]) : null;
  } catch {
    parsed = null;
  }
  if (!parsed) throw new Error('Invalid AI response format');

  const result: AeoCitability = {
    unverifiedClaims: parsed.unverified_claims ?? [],
    citabilityNotes: parsed.citability_notes ?? [],
  };

  setCache(cacheKey, result, 'aeo-citability');
  return result;
}
