// src/lib/server/market/sync.ts
// Twelve Data sync service — ETF and custom composite index syncing
import db from '$lib/server/db.js';
import { TWELVE_DATA_API_KEY } from '$env/static/private';

const BASE_URL = 'https://api.twelvedata.com';

/** Normalise any date string to midnight UTC DateTime */
function toMidnightUTC(dateStr: string): Date {
  const d = new Date(dateStr);
  d.setUTCHours(0, 0, 0, 0);
  return d;
}

/** Fetch daily OHLCV from Twelve Data for a single symbol */
async function fetchTimeSeries(
  symbol: string,
  outputsize = 5000
): Promise<Array<{ date: Date; open: number; high: number; low: number; close: number; volume: number | null; changePct: number | null }>> {
  const url = `${BASE_URL}/time_series?symbol=${symbol}&interval=1day&outputsize=${outputsize}&apikey=${TWELVE_DATA_API_KEY}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Twelve Data error ${res.status} for ${symbol}`);
  const json = await res.json();
  if (json.status === 'error') throw new Error(`Twelve Data: ${json.message}`);
  if (!Array.isArray(json.values)) throw new Error(`No values array for ${symbol}`);

  return json.values.map((v: Record<string, string>) => ({
    date: toMidnightUTC(v.datetime),
    open: parseFloat(v.open),
    high: parseFloat(v.high),
    low: parseFloat(v.low),
    close: parseFloat(v.close),
    volume: v.volume ? parseFloat(v.volume) : null,
    changePct: null,
  }));
}

/** Sync a standard ETF index — fetches full history */
export async function syncEtf(indexId: string, outputsize = 5000): Promise<void> {
  const index = await db.marketIndex.findUniqueOrThrow({ where: { id: indexId } });
  const rows = await fetchTimeSeries(index.symbol, outputsize);

  await db.$transaction(
    rows.map(r =>
      db.dailyPrice.upsert({
        where: { indexId_date: { indexId, date: r.date } },
        create: { indexId, ...r },
        update: {},
      })
    )
  );

  await db.marketIndex.update({
    where: { id: indexId },
    data: { lastSyncAt: new Date() },
  });
}

/** Sync a custom composite index — weighted average of components */
export async function syncCustom(indexId: string, outputsize = 5000): Promise<void> {
  const index = await db.marketIndex.findUniqueOrThrow({
    where: { id: indexId },
    include: { components: true },
  });

  if (!index.components.length) throw new Error('Custom index has no components');

  // Fetch each component's history
  const componentSeries = await Promise.all(
    index.components.map(async (c) => ({
      weight: c.weight,
      priceMap: await fetchTimeSeries(c.symbol, outputsize).then(rows => {
        const m = new Map<string, { open: number; high: number; low: number; close: number }>();
        for (const r of rows) m.set(r.date.toISOString(), r);
        return m;
      }),
    }))
  );

  // Strict intersection — only dates present in ALL components
  const allDateSets = componentSeries.map(c => new Set(c.priceMap.keys()));
  const intersectedDates = [...allDateSets[0]].filter(d => allDateSets.every(s => s.has(d)));

  const rows = intersectedDates.map(dateIso => {
    let open = 0, high = 0, low = 0, close = 0;
    for (const { weight, priceMap } of componentSeries) {
      const v = priceMap.get(dateIso)!;
      open  += v.open  * weight;
      high  += v.high  * weight;
      low   += v.low   * weight;
      close += v.close * weight;
    }
    return { indexId, date: new Date(dateIso), open, high, low, close, volume: null, changePct: null };
  });

  await db.$transaction(
    rows.map(r =>
      db.dailyPrice.upsert({
        where: { indexId_date: { indexId: r.indexId, date: r.date } },
        create: r,
        update: {},
      })
    )
  );
  await db.marketIndex.update({ where: { id: indexId }, data: { lastSyncAt: new Date() } });
}

/** Daily update — fetch last 2 candles and upsert (lightweight, for cron) */
export async function dailyUpdate(indexId: string): Promise<void> {
  const index = await db.marketIndex.findUniqueOrThrow({ where: { id: indexId } });
  if (index.type === 'custom') {
    await syncCustom(indexId, 2);
  } else {
    await syncEtf(indexId, 2);
  }
}
