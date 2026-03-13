// POST /api/invest/risk-narrative
// AI risk narrative for investor's portfolio risk profile, 4h cache
import { json } from '@sveltejs/kit';
import db from '$lib/server/db.js';
import { callAI } from '$lib/server/seo/ai-client.js';
import type { RequestHandler } from './$types';

const CACHE_TTL_MS = 4 * 60 * 60 * 1000;

export const POST: RequestHandler = async ({ request }) => {
  const body = await request.json().catch(() => null);
  if (!body?.investorId) return json({ error: 'investorId required' }, { status: 400 });

  const { investorId, riskData } = body;
  const cacheKey = `risk_narrative:${investorId}:${riskData?.overallScore ?? 0}`;

  const cached = await db.aiResponseCache.findUnique({ where: { cacheKey } });
  if (cached && cached.expiresAt > new Date()) {
    return json({ insight: cached.response, cached: true });
  }

  const { overallScore, metrics, weightedYield, poolCount, geoCount, stratCount } = riskData ?? {};

  const metricLines = metrics
    ?.map((m: { label: string; score: number; detail: string }) =>
      `- ${m.label}: ${m.score}/100 — ${m.detail}`
    ).join('\n') ?? '';

  const prompt = `You are a risk analyst reviewing a real estate investment portfolio.

Portfolio risk profile:
- Overall risk score: ${overallScore}/100 (100 = max risk)
- Pools: ${poolCount}, Countries: ${geoCount}, Strategies: ${stratCount}
- Weighted avg yield: ${weightedYield?.toFixed(1)}%

Risk breakdown:
${metricLines}

Write a concise risk narrative (max 120 words):
1. Overall risk assessment with the headline risk factor
2. Two specific risks the investor should be aware of
3. One concrete action to reduce the top risk

Risk score interpretation: 0–25 = Low, 26–50 = Moderate, 51–75 = Elevated, 76–100 = High.
Be direct, specific, and honest. Write in English.`;

  try {
    const result = await callAI({
      systemPrompt: 'You are a concise, honest real estate risk analyst. Focus on actionable insights.',
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
