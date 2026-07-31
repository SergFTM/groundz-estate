// src/lib/server/seo/types.ts
// Server-side TypeScript types for the SEO module

export type SeoLocale = 'en' | 'ru';
export type SeoPageType = 'landing' | 'article' | 'faq' | 'project';
export type IssueSeverity = 'critical' | 'high' | 'medium' | 'low';

export interface SeoIssue {
  code: string;
  severity: IssueSeverity;
  message: string;
  details?: string;
}

export interface SeoSuggestion {
  type: string;
  description: string;
  autoApply: boolean; // safe auto-apply vs review-required
}

export interface StructuralAnalysis {
  title: string | null;
  titleLength: number;
  metaDescription: string | null;
  metaDescriptionLength: number;
  h1Count: number;
  h2Count: number;
  h3Count: number;
  imgCount: number;
  imgMissingAlt: number;
  internalLinkCount: number;
  hasCanonical: boolean;
  hasSchema: boolean;
  hasFaqBlock: boolean;
  wordCount: number;
  slug: string | null;
  slugHasCyrillic: boolean;
}

export interface SemanticAnalysis {
  missingTopics: string[];
  missingEntities: string[];
  weakSections: string[];
  suggestedH2: string[];
  faqQuestions: string[];
  internalLinkOpportunities: string[];
  rewriteSuggestions: { section: string; reason: string }[];
}

export interface MetaSuggestion {
  metaTitle: string;
  metaDescription: string;
  ogTitle: string;
  cached: boolean;
}

export interface LinkSuggestion {
  toRoute: string;
  anchorText: string;
  confidence: number;
  context: string;
}

export interface AeoSignals {
  yieldClaimCount: number;
  hasDisclaimer: boolean;
  hasUpdatedDate: boolean;
  hasAuthorBlock: boolean;
  externalSourceCount: number;
  mixedLanguage: boolean;
}

export interface AeoCitability {
  unverifiedClaims: string[];
  citabilityNotes: string[];
}

export interface AeoResult {
  aeoScore: number;
  issues: SeoIssue[];
  suggestions: SeoSuggestion[];
  signals: AeoSignals;
  citability: AeoCitability | null;
}

export interface SeoAuditInput {
  pageId?: string;
  route?: string;
  articleId?: string;
  html: string;
  locale: SeoLocale;
  pageType: SeoPageType;
  clusterId?: string;
}

export interface SeoAuditResult {
  score: number;
  issues: SeoIssue[];
  suggestions: SeoSuggestion[];
  structural: StructuralAnalysis;
  semantics: SemanticAnalysis | null;
  links: LinkSuggestion[];
  meta: MetaSuggestion | null;
  aeo: AeoResult;
  auditId: string;
  aiAvailable: boolean;
}
