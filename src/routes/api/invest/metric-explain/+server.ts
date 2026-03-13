// POST /api/invest/metric-explain
// Returns AI explanation of an investment metric with 24h DB cache
import { json } from '@sveltejs/kit';
import db from '$lib/server/db.js';
import { callAI } from '$lib/server/seo/ai-client.js';
import type { RequestHandler } from './$types';

const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

// Static fallbacks for when AI is unavailable
const METRIC_FALLBACKS: Record<string, string> = {
  targetIrr: 'Target IRR (Internal Rate of Return) is the annualized return forecast, accounting for the timing of cash flows. It represents the expected annual return on your investment.',
  preferredReturn: 'The preferred return is the priority yield investors receive before profits are shared with the developer. It acts as a floor return and a protective mechanism for investors.',
  ltv: 'Loan-to-Value ratio shows how much of the asset value is financed by debt. Lower LTV means less leverage and generally lower risk.',
  ltc: 'Loan-to-Cost ratio measures debt relative to total development cost. It indicates how much of the project is debt-financed.',
  developerCoinvestPct: "Developer co-investment shows the developer's own capital in the deal. Higher skin-in-the-game aligns their incentives with investors.",
  minTicket: 'The minimum investment ticket is the smallest amount you can commit to this pool.',
  termMonths: 'The investment term is the expected duration from funding to exit. Your capital is typically illiquid for this period.',
  targetYield: 'Target yield is the annual return percentage the pool aims to deliver to investors.',
};

export const POST: RequestHandler = async ({ request }) => {
  const body = await request.json().catch(() => null);
  if (!body?.metric) return json({ error: 'metric required' }, { status: 400 });

  const { metric, value, poolContext, language = 'en' } = body;
  const cacheKey = `metric:${metric}:${JSON.stringify(value)}:${poolContext?.id ?? 'global'}:${language}`;

  // Check DB cache
  const cached = await db.aiResponseCache.findUnique({ where: { cacheKey } });
  if (cached && cached.expiresAt > new Date()) {
    return json({ explanation: cached.response, cached: true });
  }

  const poolSummary = poolContext
    ? `${poolContext.name} — ${poolContext.country ?? 'Cyprus'}, ${poolContext.dealType ?? 'equity'} pool, ${poolContext.termMonths} months, €${poolContext.minTicket?.toLocaleString()} min ticket.`
    : 'A Cyprus real estate investment pool.';

  const prompt = `You are a real estate investment advisor explaining a metric to an investor.
Language: ${language === 'ru' ? 'Russian' : 'English'}
Metric: ${metric}
Value: ${value}
Pool context: ${poolSummary}

Explain this metric in 3–5 sentences:
1. What it means in plain language
2. What this specific value (${value}) means for the investor
3. Is this value good, average, or below average for Cyprus real estate?
4. What to watch out for regarding this metric

Keep it educational, honest, and free of jargon. Max 120 words. Return plain text only.`;

  try {
    const result = await callAI({
      systemPrompt: 'You are a real estate investment advisor. Be concise and honest.',
      prompt,
    });

    // Cache the result
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

    return json({ explanation: result.content, cached: false });
  } catch {
    const fallback = METRIC_FALLBACKS[metric];
    if (fallback) return json({ explanation: fallback, cached: false, fallback: true });
    return json({ error: 'AI unavailable' }, { status: 503 });
  }
};
