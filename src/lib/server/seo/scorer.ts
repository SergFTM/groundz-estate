// src/lib/server/seo/scorer.ts
// Calculates SEO score 0–100

import type { SeoIssue, StructuralAnalysis, SemanticAnalysis, LinkSuggestion } from './types.js';

const SEVERITY_PENALTY: Record<string, number> = {
  critical: 30,
  high: 15,
  medium: 7,
  low: 3,
};

const SEMANTIC_BONUS = 10;
const LINKS_BONUS = 5;

/** Generic 0–100 score from a list of issues (used by the AEO check-set). */
export function scoreFromIssues(issues: SeoIssue[]): number {
  let score = 100;
  for (const issue of issues) {
    score -= SEVERITY_PENALTY[issue.severity] ?? 0;
  }
  return Math.max(0, Math.min(100, Math.round(score)));
}

export function calculateSeoScore(params: {
  structural: StructuralAnalysis;
  ruleIssues: SeoIssue[];
  semantics: SemanticAnalysis | null;
  links: LinkSuggestion[];
}): number {
  let score = 100;

  for (const issue of params.ruleIssues) {
    score -= SEVERITY_PENALTY[issue.severity] ?? 0;
  }

  // Reward semantic completeness (AI analysis available and healthy)
  if (params.semantics) {
    const gaps = params.semantics.missingTopics.length + params.semantics.missingEntities.length;
    if (gaps === 0) score += SEMANTIC_BONUS;
    else score -= Math.min(gaps * 2, SEMANTIC_BONUS);
  }

  // Small bonus for good internal linking (already linked, not just suggested)
  if (params.structural.internalLinkCount >= 4) {
    score += LINKS_BONUS;
  }

  return Math.max(0, Math.min(100, Math.round(score)));
}
