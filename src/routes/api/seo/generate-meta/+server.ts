// POST /api/seo/generate-meta
import { json, error } from '@sveltejs/kit';
import { readFileSync } from 'fs';
import { resolve } from 'path';
import { callAI, AiClientError } from '$lib/server/seo/ai-client.js';
import { getCache, setCache, buildCacheKey, contentHash } from '$lib/server/seo/ai-cache.js';
import prisma from '$lib/server/db.js';
import type { RequestHandler } from './$types';

const PROMPT_PATH = resolve('src/lib/server/seo/prompts/meta-generate.txt');

export const POST: RequestHandler = async ({ request }) => {
  const body = await request.json().catch(() => null);
  if (!body) throw error(400, 'Invalid JSON');

  const { pageId, title, content, targetKeywords, locale } = body;
  if (!pageId || !title || !content) throw error(400, 'Missing required fields');

  const hash = contentHash(content);
  const cacheKey = buildCacheKey({ pageId, contentHash: hash, type: 'meta' });

  const cached = getCache<{ metaTitle: string; metaDescription: string; ogTitle: string }>(cacheKey);
  if (cached) return json({ ...cached, cached: true });

  const promptTemplate = readFileSync(PROMPT_PATH, 'utf-8');
  const prompt = promptTemplate
    .replace('{{locale}}', locale ?? 'en')
    .replace('{{primaryKeyword}}', Array.isArray(targetKeywords) ? targetKeywords[0] ?? '' : '')
    .replace('{{title}}', title)
    .replace('{{excerpt}}', content.slice(0, 1500));

  try {
    const { content: raw } = await callAI({ prompt });
    const match = raw.match(/\{[\s\S]*\}/);
    if (!match) throw new Error('Invalid AI response');
    const parsed = JSON.parse(match[0]);

    setCache(cacheKey, parsed, 'meta');

    // Update profile
    await prisma.seoPageProfile.update({
      where: { id: pageId },
      data: {
        metaTitle: parsed.metaTitle,
        metaDescription: parsed.metaDescription,
        lastAiRunAt: new Date(),
      },
    }).catch(() => null);

    return json({ ...parsed, cached: false });
  } catch (err) {
    if (err instanceof AiClientError && err.code === 'rate_limit') throw error(429, 'AI rate limit');
    throw error(500, 'Meta generation failed');
  }
};
