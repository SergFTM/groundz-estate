// src/lib/server/seo/aeo-rules.ts
// AEO (Answer Engine Optimization) check-set — deterministic, no AI.
// Measures how citable a page is for ChatGPT / AI search: every financial
// claim must be dated, disclaimed and sourced, authorship must be visible.

import type { AeoSignals, SeoIssue, SeoSuggestion, StructuralAnalysis } from './types.js';
import { scoreFromIssues } from './scorer.js';

const PERCENT_RE = /\d{1,3}(?:[.,]\d+)?\s*%/g;
const FINANCE_CONTEXT_RE =
  /доходност|окупаемост|годовых|аренд|прибыл|рост[ае]?\b|yield|roi|irr|return|rental|income|apprecia|profit/i;
const DISCLAIMER_RE =
  /не\s+гарантир|прогнозн|носит\s+информационный|not\s+guarantee|no\s+guarantee|forecast|projection|estimate[ds]?\s+only|disclaimer/i;
const UPDATED_DATE_RE =
  /обновлено|дата\s+актуализации|актуально\s+на|last\s+updated|updated\s+on|<time[^>]+datetime=/i;
const AUTHOR_RE =
  /автор\s*:|проверено\s+(?:юристом|экспертом)|author\s*:|reviewed\s+by|rel=["']author["']|itemprop=["']author["']/i;

/** Window (chars) around a percent figure searched for financial context. */
const CLAIM_CONTEXT_WINDOW = 80;
/** Pages longer than this are expected to cite external sources. */
const SOURCES_MIN_WORDS = 400;
/** A language is "significantly present" above this share of words. */
const MIXED_LANGUAGE_SHARE = 0.15;
const MIXED_LANGUAGE_MIN_WORDS = 50;

export function analyzeAeoSignals(html: string): AeoSignals {
  const text = html.replace(/<script[\s\S]*?<\/script>/gi, ' ').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ');

  let yieldClaimCount = 0;
  for (const m of text.matchAll(PERCENT_RE)) {
    const start = Math.max(0, (m.index ?? 0) - CLAIM_CONTEXT_WINDOW);
    const end = Math.min(text.length, (m.index ?? 0) + m[0].length + CLAIM_CONTEXT_WINDOW);
    if (FINANCE_CONTEXT_RE.test(text.slice(start, end))) yieldClaimCount++;
  }

  const words = text.split(' ').filter(Boolean);
  const cyrillicWords = words.filter(w => /[а-яёА-ЯЁ]/.test(w)).length;
  const latinWords = words.filter(w => /[a-zA-Z]{2,}/.test(w) && !/[а-яёА-ЯЁ]/.test(w)).length;
  const languageTotal = cyrillicWords + latinWords;
  const mixedLanguage =
    languageTotal >= MIXED_LANGUAGE_MIN_WORDS &&
    Math.min(cyrillicWords, latinWords) / languageTotal > MIXED_LANGUAGE_SHARE;

  const externalSourceCount = (html.match(/href=["']https?:\/\/[^"']+["']/gi) ?? [])
    .filter(l => !/groundz\.estate/i.test(l)).length;

  return {
    yieldClaimCount,
    hasDisclaimer: DISCLAIMER_RE.test(html),
    hasUpdatedDate: UPDATED_DATE_RE.test(html),
    hasAuthorBlock: AUTHOR_RE.test(html),
    externalSourceCount,
    mixedLanguage,
  };
}

export function checkAeo(
  signals: AeoSignals,
  structural: StructuralAnalysis
): { aeoScore: number; issues: SeoIssue[]; suggestions: SeoSuggestion[] } {
  const issues: SeoIssue[] = [];
  const suggestions: SeoSuggestion[] = [];

  if (signals.yieldClaimCount > 0 && !signals.hasDisclaimer) {
    issues.push({
      code: 'yield_claim_no_disclaimer',
      severity: 'critical',
      message: `${signals.yieldClaimCount} financial claim(s) without a forecast disclaimer`,
      details: 'AI assistants avoid citing yield promises that carry no methodology or disclaimer.',
    });
    suggestions.push({ type: 'add_disclaimer', description: 'Add a forecast disclaimer next to yield figures', autoApply: true });
  }

  if (signals.yieldClaimCount > 0 && !signals.hasUpdatedDate) {
    issues.push({
      code: 'undated_financial_claims',
      severity: 'high',
      message: 'Financial figures have no visible "updated" date',
      details: 'Undated figures read as stale to answer engines — add "Обновлено: <date>".',
    });
    suggestions.push({ type: 'add_updated_date', description: 'Add a visible last-updated date', autoApply: true });
  }

  if (!signals.hasAuthorBlock) {
    issues.push({
      code: 'missing_author_block',
      severity: 'medium',
      message: 'No author / reviewed-by block detected',
      details: 'Answer engines weigh visible authorship ("Автор: … Проверено юристом: …") when picking sources.',
    });
  }

  if (signals.externalSourceCount === 0 && structural.wordCount > SOURCES_MIN_WORDS) {
    issues.push({
      code: 'no_external_sources',
      severity: 'medium',
      message: 'Long page cites no external sources',
      details: 'Claims verifiable via independent links are far more likely to be cited.',
    });
  }

  if (signals.mixedLanguage) {
    issues.push({
      code: 'mixed_language_content',
      severity: 'medium',
      message: 'Page mixes Russian and English content',
    });
  }

  if (!structural.hasSchema) {
    issues.push({
      code: 'aeo_missing_schema',
      severity: 'medium',
      message: 'No JSON-LD markup for answer engines (Organization / Article / FAQPage)',
    });
    suggestions.push({ type: 'add_schema', description: 'Add schema.org JSON-LD', autoApply: true });
  }

  if (!structural.hasFaqBlock) {
    issues.push({
      code: 'aeo_no_faq',
      severity: 'low',
      message: 'No FAQ block — question-shaped content is quoted most by AI search',
    });
  }

  return { aeoScore: scoreFromIssues(issues), issues, suggestions };
}
