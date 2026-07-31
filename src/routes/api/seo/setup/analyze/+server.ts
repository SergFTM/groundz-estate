import { json } from '@sveltejs/kit';
import { readFileSync } from 'fs';
import { resolve } from 'path';
import db from '$lib/server/db.js';
import { callAI } from '$lib/server/seo/ai-client.js';
import { aiGuard } from '$lib/server/ai-guard.js';
import type { RequestHandler } from './$types';

const promptTemplate = readFileSync(
  resolve('src/lib/server/seo/prompts/setup-analyze.txt'),
  'utf-8'
);

export const POST: RequestHandler = async (event) => {
  aiGuard(event, { roles: ['internal_team'], bucket: 'text_ai' });
  const articles = await db.article.findMany({
    select: { id: true, title: true, category: true, excerpt: true, slug: true },
    orderBy: { publishedAt: 'desc' },
  });

  if (articles.length === 0) {
    return json({ error: 'No content found' }, { status: 400 });
  }

  const catalog = articles
    .map(a => `- [${a.category}] ${a.title}${a.excerpt ? `: ${a.excerpt.slice(0, 120)}` : ''}`)
    .join('\n');

  const prompt = promptTemplate.replace('{{CONTENT_CATALOG}}', catalog);

  try {
    const result = await callAI({
      systemPrompt: 'You are an SEO keyword research assistant. Return only valid JSON array.',
      prompt,
      capability: 'seo.setup-analyze',
    });

    const clean = result.content.replace(/```json\n?/g, '').replace(/```/g, '').trim();
    const clusters = JSON.parse(clean);
    return json({ clusters, articleCount: articles.length });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'AI error';
    return json({ error: msg }, { status: 503 });
  }
};
