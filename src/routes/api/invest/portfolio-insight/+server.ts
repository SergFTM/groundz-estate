// POST /api/invest/portfolio-insight
// Generates personalized AI portfolio insight with 4h cache per investor
import { json, error } from '@sveltejs/kit';
import db from '$lib/server/db.js';
import { callAI } from '$lib/server/seo/ai-client.js';
import { aiGuard } from '$lib/server/ai-guard.js';
import type { RequestHandler } from './$types';

const CACHE_TTL_MS = 4 * 60 * 60 * 1000; // 4 hours

export const POST: RequestHandler = async (event) => {
  const user = aiGuard(event, { roles: ['investor', 'internal_team'], bucket: 'text_ai' });
  const body = await event.request.json().catch(() => null);
  if (!body?.investorId) return json({ error: 'investorId required' }, { status: 400 });

  const { investorId, portfolioData } = body;
  if (user!.role === 'investor' && investorId !== user!.id) throw error(403, 'Forbidden');
  const cacheKey = `portfolio_insight:${investorId}:${JSON.stringify(portfolioData).slice(0, 100)}`;

  const cached = await db.aiResponseCache.findUnique({ where: { cacheKey } });
  if (cached && cached.expiresAt > new Date()) {
    return json({ insight: cached.response, cached: true });
  }

  const { totalInvested, activePools, avgYield, poolCount, investments } = portfolioData;

  // Build pool performance summary (anonymized)
  const poolSummary = investments
    ?.map((inv: { pool: { name: string; status: string; targetYield: number; raisedAmount: number; goalAmount: number }; amount: number }) =>
      `- ${inv.pool.name}: €${inv.amount.toLocaleString()} invested, ${inv.pool.targetYield}% yield target, pool ${Math.round((inv.pool.raisedAmount / inv.pool.goalAmount) * 100)}% funded, status: ${inv.pool.status}`
    )
    .join('\n') ?? '';

  const prompt = `You are an investment advisor reviewing a real estate portfolio on the Groundz platform.

Portfolio summary:
- Total committed: €${totalInvested?.toLocaleString()}
- Number of pools: ${poolCount}
- Active pools: ${activePools}
- Weighted avg yield target: ${avgYield?.toFixed(1)}%
- Platform benchmark: ~9% avg IRR

Pool details:
${poolSummary}

Write a concise portfolio insight (max 120 words):
1. Overall performance assessment vs platform benchmark
2. One key observation (positive or risk-related) specific to their portfolio
3. One actionable recommendation

Be specific with numbers. Be honest about risks. No fluff. Write in English.`;

  try {
    const result = await callAI({
      systemPrompt: 'You are a concise, honest real estate investment advisor. Never guarantee returns.',
      prompt,
      capability: 'invest.portfolio-insight',
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
