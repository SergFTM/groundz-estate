// src/lib/server/seo/rules.ts
// Rule engine — deterministic SEO checks, no AI

import type { StructuralAnalysis, SeoIssue, SeoSuggestion } from './types.js';

const MAX_TITLE_LENGTH = 65;
const MAX_META_DESC_LENGTH = 160;
const MIN_INTERNAL_LINKS = 2;

export function checkBasicSeo(s: StructuralAnalysis): {
  issues: SeoIssue[];
  suggestions: SeoSuggestion[];
} {
  const issues: SeoIssue[] = [];
  const suggestions: SeoSuggestion[] = [];

  if (!s.title) {
    issues.push({ code: 'missing_title', severity: 'critical', message: 'Page has no <title> tag' });
  } else if (s.titleLength > MAX_TITLE_LENGTH) {
    issues.push({
      code: 'title_too_long',
      severity: 'medium',
      message: `Title is ${s.titleLength} chars (max ${MAX_TITLE_LENGTH})`,
    });
  }

  if (!s.metaDescription) {
    issues.push({ code: 'missing_meta_description', severity: 'high', message: 'Missing meta description' });
    suggestions.push({ type: 'generate_meta', description: 'Auto-generate meta description', autoApply: true });
  } else if (s.metaDescriptionLength > MAX_META_DESC_LENGTH) {
    issues.push({
      code: 'meta_description_too_long',
      severity: 'medium',
      message: `Meta description is ${s.metaDescriptionLength} chars (max ${MAX_META_DESC_LENGTH})`,
    });
  }

  if (s.h1Count === 0) {
    issues.push({ code: 'invalid_h1_count', severity: 'high', message: 'No <h1> tag found' });
  } else if (s.h1Count > 1) {
    issues.push({ code: 'invalid_h1_count', severity: 'high', message: `Multiple <h1> tags (${s.h1Count})` });
  }

  if (s.internalLinkCount < MIN_INTERNAL_LINKS) {
    issues.push({
      code: 'low_internal_links',
      severity: 'medium',
      message: `Only ${s.internalLinkCount} internal link(s) — recommend at least ${MIN_INTERNAL_LINKS}`,
    });
    suggestions.push({ type: 'suggest_links', description: 'Add internal links', autoApply: true });
  }

  if (s.imgMissingAlt > 0) {
    issues.push({
      code: 'missing_alt',
      severity: 'medium',
      message: `${s.imgMissingAlt} image(s) missing alt text`,
    });
    suggestions.push({ type: 'fix_alt', description: 'Add alt text to images', autoApply: true });
  }

  if (!s.hasCanonical) {
    issues.push({ code: 'missing_canonical', severity: 'high', message: 'No canonical URL tag' });
    suggestions.push({ type: 'add_canonical', description: 'Add canonical tag', autoApply: true });
  }

  if (!s.hasSchema) {
    issues.push({ code: 'missing_schema', severity: 'medium', message: 'No JSON-LD schema.org markup' });
    suggestions.push({ type: 'add_schema', description: 'Add schema.org JSON-LD', autoApply: true });
  }

  if (!s.hasFaqBlock) {
    issues.push({ code: 'no_faq_block', severity: 'low', message: 'No FAQ section detected' });
  }

  if (s.slugHasCyrillic) {
    issues.push({ code: 'slug_has_cyrillic', severity: 'high', message: 'URL slug contains Cyrillic characters' });
  }

  return { issues, suggestions };
}
