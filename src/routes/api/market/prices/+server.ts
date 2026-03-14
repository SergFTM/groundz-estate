// src/routes/api/market/prices/+server.ts
import { json } from '@sveltejs/kit';
import db from '$lib/server/db.js';
import type { RequestHandler } from './$types';

const PERIOD_DAYS: Record<string, number> = {
  '1Y': 365,
  '5Y': 365 * 5,
  '10Y': 365 * 10,
  'MAX': 365 * 25,
};

export const GET: RequestHandler = async ({ url }) => {
  const indexId = url.searchParams.get('indexId');
  const period = url.searchParams.get('period') ?? '1Y';

  if (!indexId) return json({ error: 'indexId required' }, { status: 400 });

  const days = PERIOD_DAYS[period] ?? PERIOD_DAYS['1Y'];
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

  const prices = await db.dailyPrice.findMany({
    where: { indexId, date: { gte: since } },
    select: { date: true, close: true },
    orderBy: { date: 'asc' },
  });

  return json({ prices: prices.map(p => ({ date: p.date.toISOString().slice(0, 10), close: p.close })) });
};
