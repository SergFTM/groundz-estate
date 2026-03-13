// POST /api/invest/construction-alert
// Generates AI construction progress alert for a given pool, 4h cache
import { json } from '@sveltejs/kit';
import db from '$lib/server/db.js';
import { callAI } from '$lib/server/seo/ai-client.js';
import type { RequestHandler } from './$types';

const CACHE_TTL_MS = 4 * 60 * 60 * 1000;

export const POST: RequestHandler = async ({ request }) => {
  const body = await request.json().catch(() => null);
  if (!body?.poolId) return json({ error: 'poolId required' }, { status: 400 });

  const { poolId, constructionData } = body;
  const cacheKey = `construction_alert:${poolId}:${constructionData?.overallPct ?? 0}`;

  const cached = await db.aiResponseCache.findUnique({ where: { cacheKey } });
  if (cached && cached.expiresAt > new Date()) {
    return json({ insight: cached.response, cached: true });
  }

  const { poolName, overallPct, budgetVariancePct, delayedMilestones, upcomingMilestones, latestNotes } = constructionData ?? {};

  const prompt = `You are a construction progress analyst reviewing a real estate development project.

Project: ${poolName}
Overall completion: ${overallPct}%
Budget variance: ${budgetVariancePct > 0 ? '+' : ''}${budgetVariancePct?.toFixed(1)}% (positive = over budget)
Delayed milestones: ${delayedMilestones ?? 0}
Upcoming milestones (next 30 days): ${upcomingMilestones ?? 0}
Latest site notes: ${latestNotes || 'No recent notes.'}

Write a concise construction status alert (max 100 words):
1. Overall progress assessment
2. Budget / timeline risk assessment (if any delays or overruns)
3. One key thing the investor should watch for next

Be direct and factual. No marketing language. Write in English.`;

  try {
    const result = await callAI({
      systemPrompt: 'You are a concise, factual construction analyst. Focus on risks and facts.',
      prompt,
    });

    await db.aiResponseCache.upsert({
      where: { cacheKey },
      create: {
        cacheKey,
        response: result.content,
        model: 'gpt-4o',
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
