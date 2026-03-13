// src/lib/server/seo/analyzer.ts
// Structural HTML analysis — no AI, deterministic

import type { StructuralAnalysis } from './types.js';

const CYRILLIC_RE = /[а-яёА-ЯЁ]/;

export function analyzeStructure(html: string): StructuralAnalysis {
  const title = extractTag(html, 'title');
  const metaDescription = extractMeta(html, 'description');
  const slug = extractSlug(html);

  return {
    title,
    titleLength: title?.length ?? 0,
    metaDescription,
    metaDescriptionLength: metaDescription?.length ?? 0,
    h1Count: countTags(html, 'h1'),
    h2Count: countTags(html, 'h2'),
    h3Count: countTags(html, 'h3'),
    imgCount: countImgTags(html),
    imgMissingAlt: countImgMissingAlt(html),
    internalLinkCount: countInternalLinks(html),
    hasCanonical: /<link[^>]+rel=["']canonical["']/i.test(html),
    hasSchema: /<script[^>]+type=["']application\/ld\+json["']/i.test(html),
    hasFaqBlock: /itemtype=["']https?:\/\/schema\.org\/FAQPage["']|class=["'][^"']*faq/i.test(html),
    wordCount: countWords(html),
    slug,
    slugHasCyrillic: slug ? CYRILLIC_RE.test(slug) : false,
  };
}

function extractTag(html: string, tag: string): string | null {
  const m = html.match(new RegExp(`<${tag}[^>]*>([^<]*)</${tag}>`, 'i'));
  return m ? m[1].trim() : null;
}

function extractMeta(html: string, name: string): string | null {
  const m = html.match(
    new RegExp(`<meta[^>]+name=["']${name}["'][^>]+content=["']([^"']*)["']`, 'i')
  ) ?? html.match(
    new RegExp(`<meta[^>]+content=["']([^"']*)["'][^>]+name=["']${name}["']`, 'i')
  );
  return m ? m[1].trim() : null;
}

function countTags(html: string, tag: string): number {
  return (html.match(new RegExp(`<${tag}[\\s>]`, 'gi')) ?? []).length;
}

function countImgTags(html: string): number {
  return (html.match(/<img[\s>]/gi) ?? []).length;
}

function countImgMissingAlt(html: string): number {
  const imgs = html.match(/<img[^>]*>/gi) ?? [];
  return imgs.filter(img => !/alt=["'][^"']*["']/i.test(img) || /alt=["']\s*["']/i.test(img)).length;
}

function countInternalLinks(html: string): number {
  const links = html.match(/href=["']([^"']*)["']/gi) ?? [];
  return links.filter(l => {
    const href = l.replace(/href=["']/, '').replace(/["']$/, '');
    return href.startsWith('/') && !href.startsWith('//');
  }).length;
}

function countWords(html: string): number {
  const text = html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
  return text.split(' ').filter(Boolean).length;
}

function extractSlug(html: string): string | null {
  const m = html.match(/<link[^>]+rel=["']canonical["'][^>]+href=["']([^"']*)["']/i)
    ?? html.match(/<meta[^>]+property=["']og:url["'][^>]+content=["']([^"']*)["']/i);
  if (!m) return null;
  try {
    return new URL(m[1]).pathname.replace(/\/$/, '');
  } catch {
    return m[1];
  }
}
