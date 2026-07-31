// src/lib/modules/seo/types/seoTypes.ts
// Client-side TypeScript types (mirrors server types, safe to import in browser)

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
  autoApply: boolean;
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

export interface AeoResult {
  aeoScore: number;
  issues: SeoIssue[];
  suggestions: SeoSuggestion[];
  signals: {
    yieldClaimCount: number;
    hasDisclaimer: boolean;
    hasUpdatedDate: boolean;
    hasAuthorBlock: boolean;
    externalSourceCount: number;
    mixedLanguage: boolean;
  };
  citability: { unverifiedClaims: string[]; citabilityNotes: string[] } | null;
}

export interface SeoAuditResult {
  score: number;
  issues: SeoIssue[];
  suggestions: SeoSuggestion[];
  auditId: string;
  aiAvailable: boolean;
  meta: { metaTitle: string; metaDescription: string; ogTitle: string; cached: boolean } | null;
  semantics: SemanticAnalysis | null;
  aeo: AeoResult;
}

export interface SeoContentRevision {
  id: string;
  seoPageProfileId: string;
  originalText: string;
  proposedText: string;
  changeType: string;
  status: 'pending' | 'approved' | 'rejected' | 'applied';
  createdAt: string;
}
