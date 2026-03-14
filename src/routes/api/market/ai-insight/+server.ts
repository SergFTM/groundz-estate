// src/routes/api/market/ai-insight/+server.ts
// POST — AI analysis of a market index. Public endpoint, gating is client-side.
import { json } from '@sveltejs/kit';
import db from '$lib/server/db.js';
import { callAI } from '$lib/server/seo/ai-client.js';
import type { RequestHandler } from './$types';

const CACHE_TTL_MS = 24 * 60 * 60 * 1000;

export const POST: RequestHandler = async ({ request }) => {
  const body = await request.json().catch(() => null);
  if (!body?.indexId) return json({ error: 'indexId required' }, { status: 400 });

  const { indexId } = body as { indexId: string };

  const index = await db.marketIndex.findUnique({ where: { id: indexId } });
  if (!index) return json({ error: 'Not found' }, { status: 404 });

  const since1y = new Date(Date.now() - 365 * 24 * 60 * 60 * 1000);
  const since5y = new Date(Date.now() - 5 * 365 * 24 * 60 * 60 * 1000);
  const currentYear = String(new Date().getFullYear());

  const [prices365, prices5yFirst] = await Promise.all([
    db.dailyPrice.findMany({
      where: { indexId, date: { gte: since1y } },
      orderBy: { date: 'asc' },
      select: { close: true, date: true },
    }),
    db.dailyPrice.findFirst({
      where: { indexId, date: { gte: since5y } },
      orderBy: { date: 'asc' },
      select: { close: true },
    }),
  ]);

  const current = prices365.at(-1)?.close ?? 0;
  const yearAgo = prices365[0]?.close ?? current;
  const fiveYearAgo = prices5yFirst?.close ?? current;
  const jan1Price = prices365.find(p => p.date.toISOString().slice(0, 4) === currentYear)?.close ?? current;

  const pct = (a: number, b: number) => (b ? (((a - b) / b) * 100).toFixed(1) : '0.0');

  const today = new Date().toISOString().slice(0, 10);
  const cacheKey = `market_insight_${indexId}_${today}`;

  const cached = await db.aiResponseCache.findUnique({ where: { cacheKey } });
  if (cached && cached.expiresAt > new Date()) {
    try {
      const parsed = JSON.parse(cached.response) as { what: string; context: string; comparison: string };
      return json({ ...parsed, cached: true });
    } catch {
      // corrupt cache — fall through to regenerate
    }
  }

  const prompt = `You are a real estate investment analyst for Develta, a Cyprus-based direct investment platform.

Instrument: ${index.name} (${index.symbol}), ${index.market} real estate market
Current close: ${current.toFixed(2)} | YTD: ${pct(current, jan1Price)}% | 1Y: ${pct(current, yearAgo)}% | 5Y: ${pct(current, fiveYearAgo)}%

Respond ONLY with valid JSON (no markdown, no code fences):
{
  "what": "2-3 sentences explaining what this instrument tracks and which markets/properties it represents",
  "context": "2-3 sentences describing the current market environment based on the price data above",
  "comparison": "2-3 sentences explaining how direct real estate investment via Develta (Cyprus development projects, 12-18% target IRR, fixed term) differs from this index in terms of risk, liquidity, and return profile"
}`;

  try {
    const result = await callAI({
      systemPrompt: 'You are a real estate investment analyst. Return only valid JSON with no markdown.',
      prompt,
    });

    let parsed: { what: string; context: string; comparison: string };
    try {
      parsed = JSON.parse(result.content);
    } catch {
      try {
        parsed = JSON.parse(result.content.replace(/```json|```/g, '').trim());
      } catch {
        parsed = { what: result.content, context: '', comparison: '' };
      }
    }

    await db.aiResponseCache.upsert({
      where: { cacheKey },
      create: {
        cacheKey,
        response: JSON.stringify(parsed),
        model: 'gpt-4o',
        tokensUsed: result.inputTokens + result.outputTokens,
        expiresAt: new Date(Date.now() + CACHE_TTL_MS),
      },
      update: {
        response: JSON.stringify(parsed),
        tokensUsed: result.inputTokens + result.outputTokens,
        expiresAt: new Date(Date.now() + CACHE_TTL_MS),
      },
    });

    return json({ ...parsed, cached: false });
  } catch {
    return json({ error: 'AI unavailable' }, { status: 503 });
  }
};
