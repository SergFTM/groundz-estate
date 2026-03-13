// src/lib/modules/seo/api/seoApi.ts
// fetch wrappers for /api/seo/* endpoints

import type { SeoLocale, SeoPageType, SeoAuditResult } from '../types/seoTypes.js';

export async function auditPage(params: {
  html: string;
  locale: SeoLocale;
  pageType: SeoPageType;
  route?: string;
  pageId?: string;
  clusterId?: string;
}): Promise<SeoAuditResult> {
  const res = await fetch('/api/seo/audit-page', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });
  if (!res.ok) throw new Error(`Audit failed: ${res.status}`);
  return res.json();
}

export async function generateMeta(params: {
  pageId: string;
  title: string;
  content: string;
  targetKeywords: string[];
  locale: SeoLocale;
}) {
  const res = await fetch('/api/seo/generate-meta', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });
  if (!res.ok) throw new Error(`Meta generation failed: ${res.status}`);
  return res.json();
}

export async function suggestLinks(params: {
  fromRoute: string;
  content: string;
  topN?: number;
}) {
  const res = await fetch('/api/seo/suggest-links', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });
  if (!res.ok) throw new Error(`Link suggestion failed: ${res.status}`);
  return res.json();
}

export async function rewriteSection(params: {
  pageId: string;
  sectionType: string;
  originalText: string;
  targetIntent: string;
  targetKeywords: string[];
}) {
  const res = await fetch('/api/seo/rewrite-section', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });
  if (!res.ok) throw new Error(`Rewrite failed: ${res.status}`);
  return res.json();
}

export async function getPageProfile(id: string) {
  const res = await fetch(`/api/seo/page/${id}`);
  if (!res.ok) throw new Error(`Profile fetch failed: ${res.status}`);
  return res.json();
}
