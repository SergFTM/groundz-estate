// src/lib/server/seo/ai-semantic.ts
// AI-powered semantic gap analysis using Claude API

import { readFileSync } from 'fs';
import { resolve } from 'path';
import { callAI } from './ai-client.js';
import { getCache, setCache, buildCacheKey, contentHash } from './ai-cache.js';
import type { SeoAuditInput, StructuralAnalysis, SemanticAnalysis } from './types.js';

const PROMPT_PATH = resolve('src/lib/server/seo/prompts/semantic-gap.txt');

export async function analyzeSemanticsWithAI(
  input: SeoAuditInput,
  structural: StructuralAnalysis
): Promise<SemanticAnalysis> {
  const hash = contentHash(input.html);
  const cacheKey = buildCacheKey({ pageId: input.pageId, contentHash: hash, clusterId: input.clusterId, type: 'semantic' });

  const cached = getCache<SemanticAnalysis>(cacheKey);
  if (cached) return cached;

  const promptTemplate = readFileSync(PROMPT_PATH, 'utf-8');
  const content = input.html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').slice(0, 3000);

  const prompt = promptTemplate
    .replace('{{targetCluster}}', input.clusterId ?? 'Cyprus real estate')
    .replace('{{intent}}', 'commercial')
    .replace('{{targetKeywords}}', '')
    .replace('{{entities}}', 'Cyprus, Limassol, VAT 5%, residency')
    .replace('{{title}}', structural.title ?? '')
    .replace('{{content}}', content);

  type RawResponse = {
    missing_topics?: string[];
    missing_entities?: string[];
    weak_sections?: string[];
    suggested_h2?: string[];
    faq_questions?: string[];
    internal_link_opportunities?: string[];
    rewrite_suggestions?: { section: string; reason: string }[];
  };

  const { content: raw } = await callAI({ prompt });
  const parsed = parseJson<RawResponse>(raw);
  if (!parsed) throw new Error('Invalid AI response format');

  const result: SemanticAnalysis = {
    missingTopics: parsed.missing_topics ?? [],
    missingEntities: parsed.missing_entities ?? [],
    weakSections: parsed.weak_sections ?? [],
    suggestedH2: parsed.suggested_h2 ?? [],
    faqQuestions: parsed.faq_questions ?? [],
    internalLinkOpportunities: parsed.internal_link_opportunities ?? [],
    rewriteSuggestions: parsed.rewrite_suggestions ?? [],
  };

  setCache(cacheKey, result, 'semantic');
  return result;
}

function parseJson<T>(raw: string): T | null {
  try {
    const match = raw.match(/\{[\s\S]*\}/);
    return match ? JSON.parse(match[0]) : null;
  } catch {
    return null;
  }
}
