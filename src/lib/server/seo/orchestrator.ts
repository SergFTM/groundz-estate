// src/lib/server/seo/orchestrator.ts
// Main SEO audit pipeline: runSeoAudit()

import prisma from '$lib/server/db.js';
import { analyzeStructure } from './analyzer.js';
import { checkBasicSeo } from './rules.js';
import { calculateSeoScore } from './scorer.js';
import { analyzeSemanticsWithAI } from './ai-semantic.js';
import { withAiFallback, FALLBACK_SEMANTICS, FALLBACK_LINKS } from './ai-fallback.js';
import type { SeoAuditInput, SeoAuditResult, LinkSuggestion } from './types.js';

export async function runSeoAudit(input: SeoAuditInput): Promise<SeoAuditResult> {
  // 1. Structural analysis (no AI)
  const structural = analyzeStructure(input.html);

  // 2. Rule engine (deterministic)
  const { issues: ruleIssues, suggestions } = checkBasicSeo(structural);

  // 3. Semantic AI analysis (with fallback)
  const { result: semantics, aiAvailable } = await withAiFallback(
    () => analyzeSemanticsWithAI(input, structural),
    FALLBACK_SEMANTICS
  );

  // 4. Internal links — stub for now (P2: linker.ts)
  const links: LinkSuggestion[] = FALLBACK_LINKS;

  // 5. Score
  const score = calculateSeoScore({ structural, ruleIssues, semantics, links });

  // 6. Persist page profile + audit record
  const profile = await upsertPageProfile(input, score);
  const audit = await prisma.seoAudit.create({
    data: {
      seoPageProfileId: profile.id,
      score,
      issuesJson: JSON.stringify(ruleIssues),
      suggestionsJson: JSON.stringify(suggestions),
      aiSummary: semantics ? buildAiSummary(semantics) : null,
      aiAvailable,
    },
  });

  return {
    score,
    issues: ruleIssues,
    suggestions,
    structural,
    semantics,
    links,
    meta: null, // generated on demand via /api/seo/generate-meta
    auditId: audit.id,
    aiAvailable,
  };
}

async function upsertPageProfile(input: SeoAuditInput, score: number) {
  if (input.pageId) {
    return prisma.seoPageProfile.update({
      where: { id: input.pageId },
      data: { seoScore: score, lastAuditAt: new Date() },
    });
  }

  // Try to find existing profile by articleId or route
  const existing = input.articleId
    ? await prisma.seoPageProfile.findUnique({ where: { articleId: input.articleId } })
    : input.route
      ? await prisma.seoPageProfile.findUnique({ where: { route: input.route } })
      : null;

  if (existing) {
    return prisma.seoPageProfile.update({
      where: { id: existing.id },
      data: { seoScore: score, lastAuditAt: new Date() },
    });
  }

  return prisma.seoPageProfile.create({
    data: {
      route: input.route ?? null,
      articleId: input.articleId ?? null,
      locale: input.locale,
      pageType: input.pageType,
      primaryClusterId: input.clusterId ?? null,
      seoScore: score,
      lastAuditAt: new Date(),
    },
  });
}

function buildAiSummary(s: NonNullable<import('./types.js').SemanticAnalysis>): string {
  const parts: string[] = [];
  if (s.missingTopics.length) parts.push(`Missing topics: ${s.missingTopics.slice(0, 3).join(', ')}`);
  if (s.suggestedH2.length) parts.push(`Suggested headings: ${s.suggestedH2.slice(0, 2).join(', ')}`);
  return parts.join('. ');
}
