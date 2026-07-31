import { json } from '@sveltejs/kit';
import { readFileSync } from 'fs';
import { resolve } from 'path';
import { callAI } from '$lib/server/seo/ai-client.js';
import { aiGuard } from '$lib/server/ai-guard.js';
import type { RequestHandler } from './$types';

const promptTemplate = readFileSync(
  resolve('src/lib/server/seo/prompts/cluster-generate.txt'),
  'utf-8'
);

export const POST: RequestHandler = async (event) => {
  aiGuard(event, { roles: ['internal_team'], bucket: 'text_ai' });
  const { topic, locale = 'en' } = await event.request.json();
  if (!topic?.trim()) return json({ error: 'topic required' }, { status: 400 });

  const localeName = locale === 'ru' ? 'Russian' : 'English';
  const prompt = promptTemplate
    .replace('{{TOPIC}}', topic)
    .replace(/\{\{LOCALE\}\}/g, locale)
    .replace('{{LOCALE_NAME}}', localeName);

  try {
    const result = await callAI({
      systemPrompt: 'You are an SEO keyword research assistant. Return only valid JSON.',
      prompt,
      capability: 'seo.generate-cluster',
    });

    const clean = result.content.replace(/```json\n?/g, '').replace(/```/g, '').trim();
    const cluster = JSON.parse(clean);
    return json(cluster);
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'AI error';
    return json({ error: msg }, { status: 503 });
  }
};
