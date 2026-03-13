// POST /api/invest/pool-compare
// AI side-by-side pool comparison narrative, 4h cache
import { json } from '@sveltejs/kit';
import db from '$lib/server/db.js';
import { callAI } from '$lib/server/seo/ai-client.js';
import type { RequestHandler } from './$types';

const CACHE_TTL_MS = 4 * 60 * 60 * 1000;

export const POST: RequestHandler = async ({ request }) => {
  const body = await request.json().catch(() => null);
  if (!body?.pools || !Array.isArray(body.pools) || body.pools.length < 2) {
    return json({ error: 'At least 2 pools required' }, { status: 400 });
  }

  const pools = body.pools as {
    name: string; irr: number; term: number; minTicket: number;
    status: string; dealType: string | null; country: string;
    progress: number; investors: number;
  }[];

  const cacheKey = `pool_compare:${pools.map(p => p.name).sort().join('+')}`;

  const cached = await db.aiResponseCache.findUnique({ where: { cacheKey } });
  if (cached && cached.expiresAt > new Date()) {
    return json({ insight: cached.response, cached: true });
  }

  const poolLines = pools.map((p, i) =>
    `Pool ${i + 1}: ${p.name}
  - Country: ${p.country} | Deal type: ${p.dealType ?? 'N/A'} | Status: ${p.status}
  - Target IRR: ${p.irr}% | Term: ${p.term}m | Min ticket: €${p.minTicket?.toLocaleString()}
  - Funding: ${p.progress}% raised | ${p.investors} investor${p.investors !== 1 ? 's' : ''}`
  ).join('\n\n');

  const prompt = `You are a real estate investment analyst comparing ${pools.length} investment pools on the Develta platform.

${poolLines}

Write a concise comparison (max 130 words):
1. Which pool offers the best risk-adjusted return and why
2. Key differentiator between the pools (risk, liquidity, stage, geography)
3. Which investor profile suits each pool best

Be specific with numbers. Never guarantee returns. Write in English.`;

  try {
    const result = await callAI({
      systemPrompt: 'You are a concise, honest real estate investment analyst.',
      prompt,
    });

    await db.aiResponseCache.upsert({
      where: { cacheKey },
      create: {
        cacheKey, response: result.content, model: 'gpt-4o',
        tokensUsed: result.inputTokens + result.outputTokens,
        expiresAt: new Date(Date.now() + CACHE_TTL_MS),
      },
      update: {
        response: result.content,
        tokensUsed: result.inputTokens + result.outputTokens,
        expiresAt: new Date(Date.now() + CACHE_TTL_MS),
      },
    });

    return json({ insight: result.content, cached: false });
  } catch {
    return json({ error: 'AI unavailable' }, { status: 503 });
  }
};
