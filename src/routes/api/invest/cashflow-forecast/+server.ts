// POST /api/invest/cashflow-forecast
// AI cashflow forecast for investor's projected returns, 4h cache
import { json } from '@sveltejs/kit';
import db from '$lib/server/db.js';
import { callAI } from '$lib/server/seo/ai-client.js';
import type { RequestHandler } from './$types';

const CACHE_TTL_MS = 4 * 60 * 60 * 1000;

export const POST: RequestHandler = async ({ request }) => {
  const body = await request.json().catch(() => null);
  if (!body?.investorId) return json({ error: 'investorId required' }, { status: 400 });

  const { investorId, cashflowData } = body;
  const cacheKey = `cashflow_forecast:${investorId}:${cashflowData?.totalInvested ?? 0}`;

  const cached = await db.aiResponseCache.findUnique({ where: { cacheKey } });
  if (cached && cached.expiresAt > new Date()) {
    return json({ insight: cached.response, cached: true });
  }

  const {
    totalInvested, totalProjectedReturn, weightedYield,
    projections, timeline
  } = cashflowData ?? {};

  const projSummary = projections
    ?.map((p: { poolName: string; amount: number; yieldRate: number; exitDate: string; totalReturn: number; totalPayout: number }) =>
      `- ${p.poolName}: €${p.amount.toLocaleString()} @ ${p.yieldRate.toFixed(1)}% → exits ${new Date(p.exitDate).toLocaleDateString('en-GB', { month: 'short', year: 'numeric' })}, projected return €${p.totalReturn.toLocaleString()}`
    ).join('\n') ?? '';

  const timelineSummary = timeline
    ?.map((t: { year: number; return: number; principal: number; total: number }) =>
      `- ${t.year}: €${t.total.toLocaleString()} (€${t.return.toLocaleString()} return + €${t.principal.toLocaleString()} principal)`
    ).join('\n') ?? '';

  const prompt = `You are a real estate investment cashflow analyst reviewing an investor's projected returns.

Portfolio:
- Total committed: €${totalInvested?.toLocaleString()}
- Total projected return: €${totalProjectedReturn?.toLocaleString()}
- Weighted average yield: ${weightedYield?.toFixed(1)}%

Per-pool projections:
${projSummary}

Exit timeline by year:
${timelineSummary}

Write a concise cashflow forecast (max 110 words):
1. Overall return assessment — realistic given market conditions
2. Concentration risk in the exit timeline (if multiple exits cluster in same year)
3. One recommendation to optimize cashflow timing or reinvestment

Be specific with numbers. Be honest. Write in English.`;

  try {
    const result = await callAI({
      systemPrompt: 'You are a concise, honest real estate cashflow analyst. Never guarantee returns.',
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
