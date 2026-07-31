# Market Indices Widget Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a public real estate market indices widget to `/investment` with 20-year daily chart, per-region tabs, AI analysis, and a register CTA — powered by Twelve Data synced into local DB.

**Architecture:** DB-first. Historical prices stored in Prisma, daily cron updates latest candle. Page reads purely from DB (no Twelve Data at render time). Custom indices are weighted composites calculated at sync time and stored as regular DailyPrice rows. AI responses cached 24h in existing AiResponseCache.

**Tech Stack:** SvelteKit 2, Svelte 5 runes, Prisma/SQLite (better-sqlite3 adapter), Twelve Data REST API, pure SVG chart (no chart library), existing `callAI` from `$lib/server/seo/ai-client.js`.

---

## Chunk 1: Data Layer

### Task 1: Prisma Schema — Add 3 Models + Migrate

**Files:**
- Modify: `prisma/schema.prisma` (append after line 411)
- Modify: `.env` (add TWELVE_DATA_API_KEY)

**Context:** The schema uses `@id @default(uuid())` everywhere, `@relation` with `onDelete: Cascade`, and `@@unique` for composite constraints. Import: `import db from '$lib/server/db.js'` throughout codebase. Generated client is at `src/generated/prisma/`.

- [ ] **Step 1: Add three models to schema.prisma**

Append after the closing `}` of `SeoContentRevision` (after line 411):

```prisma
model MarketIndex {
  id         String    @id @default(uuid())
  symbol     String    @unique
  name       String
  type       String    // "etf" | "custom"
  market     String    // "global" | "europe" | "cyprus" | "georgia" | "dubai" | "turkey"
  color      String    @default("#7a8c6e")
  active     Boolean   @default(true)
  lastSyncAt DateTime?
  createdAt  DateTime  @default(now())

  components IndexComponent[]
  prices     DailyPrice[]
}

model IndexComponent {
  id      String @id @default(uuid())
  indexId String
  symbol  String
  name    String
  weight  Float  // 0.0 – 1.0, sum per index must equal 1.0

  index MarketIndex @relation(fields: [indexId], references: [id], onDelete: Cascade)

  @@unique([indexId, symbol])
}

model DailyPrice {
  id        String   @id @default(uuid())
  indexId   String
  date      DateTime
  open      Float
  high      Float
  low       Float
  close     Float
  volume    Float?
  changePct Float?

  index MarketIndex @relation(fields: [indexId], references: [id], onDelete: Cascade)

  @@unique([indexId, date])
}
```

- [ ] **Step 2: Add API key to .env**

Add this line to `.env`:
```
TWELVE_DATA_API_KEY=
```
(Leave value empty for now — user will fill in their key)

- [ ] **Step 3: Run migration**

```bash
cd groundz-svelte
npx prisma migrate dev --name add_market_indices
```

Expected output: `✔ Your database is now in sync with your schema.`

- [ ] **Step 4: Regenerate Prisma client**

```bash
npx prisma generate
```

Expected: `✔ Generated Prisma Client`

- [ ] **Step 5: Verify models exist**

```bash
npx prisma studio
```

Check that `MarketIndex`, `IndexComponent`, `DailyPrice` tables appear. Close studio.

- [ ] **Step 6: Commit**

```bash
git add prisma/schema.prisma prisma/migrations/ src/generated/ .env
git commit -m "feat: add MarketIndex, IndexComponent, DailyPrice schema models"
```

---

### Task 2: Sync Service

**Files:**
- Create: `src/lib/server/market/sync.ts`

**Context:** Twelve Data time_series endpoint returns `{ values: [{ datetime, open, high, low, close, volume }] }`. Daily interval returns one value per trading day. `outputsize=5000` gives ~20 years. Date normalisation: all dates stored as midnight UTC. For custom indices, use strict date intersection (only dates present in ALL components).

- [ ] **Step 1: Create the sync module**

Create `src/lib/server/market/sync.ts`:

```typescript
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
    changePct: null, // calculated separately if needed
  }));
}

/** Sync a standard ETF index — fetches full history */
export async function syncEtf(indexId: string, outputsize = 5000): Promise<void> {
  const index = await db.marketIndex.findUniqueOrThrow({ where: { id: indexId } });
  const rows = await fetchTimeSeries(index.symbol, outputsize);

  await db.dailyPrice.createMany({
    data: rows.map(r => ({ indexId, ...r })),
    skipDuplicates: true,
  });

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

  // Fetch each component's history (outputsize controls how many candles)
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

  await db.dailyPrice.createMany({ data: rows, skipDuplicates: true });
  await db.marketIndex.update({ where: { id: indexId }, data: { lastSyncAt: new Date() } });
}

/** Daily update — fetch last 2 candles and upsert (lightweight, for cron) */
export async function dailyUpdate(indexId: string): Promise<void> {
  const index = await db.marketIndex.findUniqueOrThrow({ where: { id: indexId } });
  if (index.type === 'custom') {
    await syncCustom(indexId, 2); // fetch only 2 candles per component for daily update
  } else {
    await syncEtf(indexId, 2);
  }
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
cd groundz-svelte
npx tsc --noEmit
```

Expected: no errors referencing `sync.ts`.

- [ ] **Step 3: Commit**

```bash
git add src/lib/server/market/sync.ts
git commit -m "feat: add Twelve Data sync service (syncEtf, syncCustom, dailyUpdate)"
```

---

## Chunk 2: API Endpoints

### Task 3: Sync Trigger Endpoint

**Files:**
- Create: `src/routes/api/market/sync/+server.ts`

**Context:** Admin-only. Accepts `{ indexId, mode: 'initial' | 'daily' }`. Returns `{ ok, syncedAt }` or `{ error }`.

- [ ] **Step 1: Create endpoint**

```typescript
// src/routes/api/market/sync/+server.ts
import { json } from '@sveltejs/kit';
import { syncEtf, syncCustom, dailyUpdate } from '$lib/server/market/sync.js';
import db from '$lib/server/db.js';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request, locals }) => {
  if (locals.user?.role !== 'internal_team') {
    return json({ error: 'Forbidden' }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  if (!body?.indexId || !body?.mode) {
    return json({ error: 'indexId and mode required' }, { status: 400 });
  }

  const { indexId, mode } = body as { indexId: string; mode: 'initial' | 'daily' };

  const index = await db.marketIndex.findUnique({ where: { id: indexId } });
  if (!index) return json({ error: 'Index not found' }, { status: 404 });

  try {
    if (mode === 'initial') {
      if (index.type === 'custom') {
        await syncCustom(indexId);
      } else {
        await syncEtf(indexId);
      }
    } else {
      await dailyUpdate(indexId);
    }
    return json({ ok: true, syncedAt: new Date() });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return json({ error: msg }, { status: 500 });
  }
};
```

- [ ] **Step 2: Commit**

```bash
git add src/routes/api/market/sync/+server.ts
git commit -m "feat: add POST /api/market/sync endpoint"
```

---

### Task 4: Prices Endpoint

**Files:**
- Create: `src/routes/api/market/prices/+server.ts`

**Context:** Public. Returns DailyPrice rows for a given indexId and period (1Y/5Y/10Y/MAX). Used by the chart when user selects a period longer than the 1Y loaded server-side.

- [ ] **Step 1: Create endpoint**

```typescript
// src/routes/api/market/prices/+server.ts
import { json } from '@sveltejs/kit';
import db from '$lib/server/db.js';
import type { RequestHandler } from './$types';

const PERIOD_DAYS: Record<string, number> = {
  '1Y': 365,
  '5Y': 365 * 5,
  '10Y': 365 * 10,
  'MAX': 365 * 25, // covers 20+ years
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
```

- [ ] **Step 2: Commit**

```bash
git add src/routes/api/market/prices/+server.ts
git commit -m "feat: add GET /api/market/prices endpoint"
```

---

### Task 5: AI Insight Endpoint

**Files:**
- Create: `src/routes/api/market/ai-insight/+server.ts`

**Context:** Public (no auth). Uses same AiResponseCache pattern as `/api/invest/metric-explain`. Returns `{ what, context, comparison, cached }`. Fallback on JSON parse error returns `{ what: rawContent, context: '', comparison: '' }`.

- [ ] **Step 1: Create endpoint**

```typescript
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

  // Load last 365 prices for context
  const since = new Date(Date.now() - 365 * 24 * 60 * 60 * 1000);
  const since5y = new Date(Date.now() - 5 * 365 * 24 * 60 * 60 * 1000);
  const prices365 = await db.dailyPrice.findMany({
    where: { indexId, date: { gte: since } },
    orderBy: { date: 'asc' },
    select: { close: true, date: true },
  });
  const prices5y = await db.dailyPrice.findMany({
    where: { indexId, date: { gte: since5y } },
    orderBy: { date: 'asc' },
    select: { close: true },
    take: 1,
  });

  const current = prices365.at(-1)?.close ?? 0;
  const yearAgo = prices365[0]?.close ?? current;
  const fiveYearAgo = prices5y[0]?.close ?? current;
  const jan1 = prices365.find(p => p.date.toISOString().slice(0, 4) === String(new Date().getFullYear()))?.close ?? current;

  const fmt = (n: number) => n.toFixed(2);
  const pct = (a: number, b: number) => b ? (((a - b) / b) * 100).toFixed(1) : '0.0';

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

  const prompt = `You are a real estate investment analyst for Groundz, a Cyprus-based direct investment platform.

Instrument: ${index.name} (${index.symbol}), ${index.market} real estate market
Current close: ${fmt(current)} | YTD: ${pct(current, jan1)}% | 1Y: ${pct(current, yearAgo)}% | 5Y: ${pct(current, fiveYearAgo)}%

Respond ONLY with valid JSON (no markdown, no code fences):
{
  "what": "2-3 sentences explaining what this instrument tracks and which markets/properties it represents",
  "context": "2-3 sentences describing the current market environment based on the price data above",
  "comparison": "2-3 sentences explaining how direct real estate investment via Groundz (Cyprus development projects, 12-18% target IRR, fixed term) differs from this index in terms of risk, liquidity, and return profile"
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
        // Fallback: wrap raw content in what field
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
```

- [ ] **Step 2: Commit**

```bash
git add src/routes/api/market/ai-insight/+server.ts
git commit -m "feat: add POST /api/market/ai-insight endpoint with 24h cache"
```

---

## Chunk 3: Admin UI

### Task 6: Admin Market Indices Page + Sidebar

**Files:**
- Create: `src/routes/(cabinet)/admin/market-indices/+page.server.ts`
- Create: `src/routes/(cabinet)/admin/market-indices/+page.svelte`
- Modify: `src/lib/components/cabinet/CabinetSidebar.svelte`

**Context:** Admin pages use `locals.user?.role === 'internal_team'` guard in layout. Form actions follow SvelteKit named actions pattern. Sync is triggered via client `fetch` (not form action) so the button can show a loading spinner. The sidebar `groups` array in `CabinetSidebar.svelte` has a `Content` group at line 38 — add `Market Indices` after `Comments`.

- [ ] **Step 1: Create page server**

```typescript
// src/routes/(cabinet)/admin/market-indices/+page.server.ts
import db from '$lib/server/db.js';
import type { PageServerLoad, Actions } from './$types';

export const load: PageServerLoad = async () => {
  const indices = await db.marketIndex.findMany({
    include: {
      components: true,
      _count: { select: { prices: true } },
    },
    orderBy: { createdAt: 'asc' },
  });
  return { indices };
};

export const actions: Actions = {
  create: async ({ request }) => {
    const data = await request.formData();
    const symbol = (data.get('symbol') as string)?.trim().toUpperCase();
    const name = (data.get('name') as string)?.trim();
    const market = data.get('market') as string;
    const type = data.get('type') as string;
    const color = (data.get('color') as string) ?? '#7a8c6e';
    const componentsJson = data.get('components') as string | null;

    if (!symbol || !name || !market || !type) {
      return { error: 'All fields required' };
    }

    const components: Array<{ symbol: string; name: string; weight: number }> =
      componentsJson ? JSON.parse(componentsJson) : [];

    await db.$transaction(async (tx) => {
      const index = await tx.marketIndex.create({
        data: { symbol, name, market, type, color },
      });
      if (type === 'custom' && components.length) {
        await tx.indexComponent.createMany({
          data: components.map(c => ({ indexId: index.id, symbol: c.symbol.toUpperCase(), name: c.name, weight: c.weight })),
        });
      }
    });

    return { success: true };
  },

  update: async ({ request }) => {
    const data = await request.formData();
    const id = data.get('id') as string;
    const symbol = (data.get('symbol') as string)?.trim().toUpperCase();
    const name = (data.get('name') as string)?.trim();
    const market = data.get('market') as string;
    const type = data.get('type') as string;
    const color = (data.get('color') as string) ?? '#7a8c6e';
    const active = data.get('active') === 'true';
    const componentsJson = data.get('components') as string | null;

    if (!id) return { error: 'id required' };
    const components: Array<{ symbol: string; name: string; weight: number }> =
      componentsJson ? JSON.parse(componentsJson) : [];

    await db.$transaction(async (tx) => {
      await tx.marketIndex.update({
        where: { id },
        data: { symbol, name, market, type, color, active },
      });
      await tx.indexComponent.deleteMany({ where: { indexId: id } });
      if (type === 'custom' && components.length) {
        await tx.indexComponent.createMany({
          data: components.map(c => ({ indexId: id, symbol: c.symbol.toUpperCase(), name: c.name, weight: c.weight })),
        });
      }
    });

    return { success: true };
  },

  delete: async ({ request }) => {
    const data = await request.formData();
    const id = data.get('id') as string;
    if (!id) return { error: 'id required' };
    await db.marketIndex.delete({ where: { id } });
    return { success: true };
  },

  toggleActive: async ({ request }) => {
    const data = await request.formData();
    const id = data.get('id') as string;
    const active = data.get('active') === 'true';
    await db.marketIndex.update({ where: { id }, data: { active } });
    return { success: true };
  },
};
```

- [ ] **Step 2: Create admin page UI**

```svelte
<!-- src/routes/(cabinet)/admin/market-indices/+page.svelte -->
<script lang="ts">
  import { enhance } from '$app/forms';

  let { data, form } = $props();

  type Index = typeof data.indices[0];

  let showForm = $state(false);
  let editingId = $state<string | null>(null);

  // Form fields
  let fSymbol = $state('');
  let fName = $state('');
  let fMarket = $state('global');
  let fType = $state('etf');
  let fColor = $state('#7a8c6e');
  let fActive = $state(true);
  let fComponents = $state<Array<{ symbol: string; name: string; weight: number }>>([]);

  let totalWeight = $derived(fComponents.reduce((s, c) => s + (c.weight || 0), 0));

  const MARKETS = ['global', 'europe', 'cyprus', 'georgia', 'dubai', 'turkey'];

  function startCreate() {
    editingId = null;
    fSymbol = ''; fName = ''; fMarket = 'global'; fType = 'etf'; fColor = '#7a8c6e'; fActive = true; fComponents = [];
    showForm = true;
  }

  function startEdit(idx: Index) {
    editingId = idx.id;
    fSymbol = idx.symbol; fName = idx.name; fMarket = idx.market; fType = idx.type;
    fColor = idx.color; fActive = idx.active;
    fComponents = idx.components.map(c => ({ symbol: c.symbol, name: c.name, weight: Math.round(c.weight * 100) }));
    showForm = true;
  }

  function cancelForm() { showForm = false; editingId = null; }

  function addComponent() {
    fComponents = [...fComponents, { symbol: '', name: '', weight: 0 }];
  }

  function removeComponent(i: number) {
    fComponents = fComponents.filter((_, idx) => idx !== i);
  }

  // Sync state per index
  let syncing = $state<Record<string, boolean>>({});
  let syncError = $state<Record<string, string>>({});

  async function runSync(indexId: string, mode: 'initial' | 'daily') {
    syncing = { ...syncing, [indexId]: true };
    syncError = { ...syncError, [indexId]: '' };
    try {
      const res = await fetch('/api/market/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ indexId, mode }),
      });
      const r = await res.json();
      if (!res.ok) syncError = { ...syncError, [indexId]: r.error ?? 'Sync failed' };
      else location.reload();
    } catch {
      syncError = { ...syncError, [indexId]: 'Network error' };
    } finally {
      syncing = { ...syncing, [indexId]: false };
    }
  }

  function getComponentsJson() {
    return JSON.stringify(fComponents.map(c => ({ symbol: c.symbol, name: c.name, weight: c.weight / 100 })));
  }
</script>

<svelte:head><title>Market Indices — Admin</title></svelte:head>

<div style="max-width:1000px;">
  <div style="margin-bottom:var(--space-6);">
    <span style="font-size:10px;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;color:var(--color-text-muted);">CONTENT</span>
    <h1 style="font-size:var(--text-2xl);font-weight:700;color:var(--color-text);margin-top:var(--space-1);">Market Indices</h1>
  </div>

  <!-- Action bar -->
  <div style="display:flex;justify-content:flex-end;margin-bottom:var(--space-5);">
    <button
      onclick={startCreate}
      style="padding:var(--space-2) var(--space-5);border-radius:var(--radius-md);border:none;background:var(--color-accent);color:#fff;font-size:var(--text-sm);font-weight:600;cursor:pointer;"
    >+ Add Index</button>
  </div>

  <!-- Create/Edit form -->
  {#if showForm}
    <div style="background:rgba(255,255,255,0.7);backdrop-filter:blur(8px);border:1px solid rgba(0,0,0,0.08);border-radius:var(--radius-lg);padding:var(--space-6);margin-bottom:var(--space-6);">
      <h2 style="font-size:var(--text-sm);font-weight:700;margin-bottom:var(--space-5);">{editingId ? 'Edit Index' : 'New Index'}</h2>

      <form
        method="POST"
        action={editingId ? '?/update' : '?/create'}
        use:enhance={() => async ({ result }) => { if (result.type === 'success') location.reload(); }}
      >
        {#if editingId}<input type="hidden" name="id" value={editingId} />{/if}
        <input type="hidden" name="components" value={getComponentsJson()} />
        {#if editingId}<input type="hidden" name="active" value={String(fActive)} />{/if}

        <div style="display:grid;grid-template-columns:1fr 2fr 1fr 1fr auto;gap:var(--space-3);align-items:end;margin-bottom:var(--space-4);">
          <div>
            <label style="font-size:var(--text-xs);font-weight:600;display:block;margin-bottom:4px;">Symbol</label>
            <input class="form-input" name="symbol" bind:value={fSymbol} placeholder="VNQ" style="text-transform:uppercase;" required />
          </div>
          <div>
            <label style="font-size:var(--text-xs);font-weight:600;display:block;margin-bottom:4px;">Name</label>
            <input class="form-input" name="name" bind:value={fName} placeholder="Vanguard Real Estate ETF" required />
          </div>
          <div>
            <label style="font-size:var(--text-xs);font-weight:600;display:block;margin-bottom:4px;">Market</label>
            <select class="form-input" name="market" bind:value={fMarket}>
              {#each MARKETS as m}<option value={m}>{m}</option>{/each}
            </select>
          </div>
          <div>
            <label style="font-size:var(--text-xs);font-weight:600;display:block;margin-bottom:4px;">Type</label>
            <select class="form-input" name="type" bind:value={fType}>
              <option value="etf">ETF</option>
              <option value="custom">Custom</option>
            </select>
          </div>
          <div>
            <label style="font-size:var(--text-xs);font-weight:600;display:block;margin-bottom:4px;">Color</label>
            <input type="color" name="color" bind:value={fColor} style="height:38px;border:1px solid rgba(0,0,0,0.12);border-radius:var(--radius-base);padding:2px 4px;cursor:pointer;" />
          </div>
        </div>

        {#if fType === 'custom'}
          <div style="margin-bottom:var(--space-4);">
            <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:var(--space-3);">
              <span style="font-size:var(--text-xs);font-weight:700;">Components</span>
              <span style="font-size:var(--text-xs);color:{Math.abs(totalWeight - 100) < 0.01 ? '#16a34a' : '#ef4444'};">
                Total: {totalWeight.toFixed(0)}% {Math.abs(totalWeight - 100) < 0.01 ? '✓' : '(must be 100%)'}
              </span>
            </div>
            {#each fComponents as c, i}
              <div style="display:grid;grid-template-columns:1fr 2fr 80px auto;gap:var(--space-2);margin-bottom:var(--space-2);">
                <input class="form-input" bind:value={c.symbol} placeholder="Symbol" style="font-size:var(--text-xs);text-transform:uppercase;" />
                <input class="form-input" bind:value={c.name} placeholder="Name" style="font-size:var(--text-xs);" />
                <input class="form-input" type="number" bind:value={c.weight} min="0" max="100" step="0.1" style="font-size:var(--text-xs);" />
                <button type="button" onclick={() => removeComponent(i)} style="padding:var(--space-1) var(--space-2);border:1px solid rgba(239,68,68,0.3);border-radius:var(--radius-sm);background:none;color:#ef4444;font-size:var(--text-xs);cursor:pointer;">×</button>
              </div>
            {/each}
            <button type="button" onclick={addComponent} style="font-size:var(--text-xs);color:var(--color-accent);background:none;border:none;cursor:pointer;padding:0;">+ Add component</button>
          </div>
        {/if}

        <!-- form error: use derived cast to avoid TS union type error (project convention) -->
        <!-- Add to script: let formError = $derived((form as { error?: string } | null)?.error ?? null); -->
        {#if formError}<p style="color:#ef4444;font-size:var(--text-xs);margin-bottom:var(--space-3);">{formError}</p>{/if}

        <div style="display:flex;gap:var(--space-3);">
          <button type="submit" style="padding:var(--space-2) var(--space-5);border-radius:var(--radius-md);border:none;background:var(--color-accent);color:#fff;font-size:var(--text-sm);font-weight:600;cursor:pointer;">
            {editingId ? 'Save Changes' : 'Create Index'}
          </button>
          <button type="button" onclick={cancelForm} style="padding:var(--space-2) var(--space-4);border-radius:var(--radius-md);border:1px solid rgba(0,0,0,0.1);background:none;font-size:var(--text-sm);cursor:pointer;">Cancel</button>
        </div>
      </form>
    </div>
  {/if}

  <!-- Index table -->
  <div style="display:flex;flex-direction:column;gap:var(--space-3);">
    {#each data.indices as idx}
      <div style="background:rgba(255,255,255,0.6);backdrop-filter:blur(8px);border:1px solid rgba(0,0,0,0.06);border-radius:var(--radius-lg);padding:var(--space-4) var(--space-5);">
        <div style="display:flex;align-items:center;gap:var(--space-4);flex-wrap:wrap;">
          <span style="width:10px;height:10px;border-radius:50%;background:{idx.color};flex-shrink:0;"></span>
          <div style="flex:1;min-width:0;">
            <div style="display:flex;align-items:center;gap:var(--space-3);flex-wrap:wrap;">
              <span style="font-size:var(--text-sm);font-weight:700;">{idx.symbol}</span>
              <span style="font-size:var(--text-xs);color:var(--color-text-muted);">{idx.name}</span>
              <span style="font-size:10px;padding:1px 7px;border-radius:99px;background:rgba(0,0,0,0.05);color:var(--color-text-muted);text-transform:uppercase;">{idx.type}</span>
              <span style="font-size:10px;padding:1px 7px;border-radius:99px;background:rgba(0,0,0,0.05);color:var(--color-text-muted);">{idx.market}</span>
              {#if !idx.active}
                <span style="font-size:10px;padding:1px 7px;border-radius:99px;background:rgba(239,68,68,0.08);color:#ef4444;">inactive</span>
              {/if}
            </div>
            <div style="font-size:var(--text-xs);color:var(--color-text-muted);margin-top:2px;">
              {idx._count.prices.toLocaleString()} candles ·
              {idx.lastSyncAt ? `Last sync: ${new Date(idx.lastSyncAt).toLocaleDateString()}` : 'Never synced'}
            </div>
          </div>

          <!-- Controls -->
          <div style="display:flex;align-items:center;gap:var(--space-2);flex-wrap:wrap;">
            {#if !idx.lastSyncAt}
              <button
                onclick={() => runSync(idx.id, 'initial')}
                disabled={syncing[idx.id]}
                style="font-size:var(--text-xs);padding:var(--space-1) var(--space-3);border-radius:var(--radius-sm);border:1px solid var(--color-accent);background:transparent;color:var(--color-accent);cursor:pointer;opacity:{syncing[idx.id] ? 0.6 : 1};"
              >{syncing[idx.id] ? 'Syncing…' : '↓ Initial Sync'}</button>
            {:else}
              <button
                onclick={() => runSync(idx.id, 'daily')}
                disabled={syncing[idx.id]}
                style="font-size:var(--text-xs);padding:var(--space-1) var(--space-3);border-radius:var(--radius-sm);border:1px solid rgba(0,0,0,0.15);background:transparent;color:var(--color-text-muted);cursor:pointer;"
              >{syncing[idx.id] ? 'Updating…' : '↺ Update'}</button>
            {/if}

            <button
              onclick={() => startEdit(idx)}
              style="font-size:var(--text-xs);padding:var(--space-1) var(--space-3);border-radius:var(--radius-sm);border:1px solid rgba(0,0,0,0.12);background:none;cursor:pointer;"
            >Edit</button>

            <form method="POST" action="?/delete" use:enhance={() => async ({ result }) => { if (result.type === 'success') location.reload(); }}>
              <input type="hidden" name="id" value={idx.id} />
              <button
                type="submit"
                onclick={(e) => { if (!confirm(`Delete ${idx.symbol}?`)) e.preventDefault(); }}
                style="font-size:var(--text-xs);padding:var(--space-1) var(--space-3);border-radius:var(--radius-sm);border:1px solid rgba(239,68,68,0.25);background:none;color:#ef4444;cursor:pointer;"
              >Delete</button>
            </form>
          </div>
        </div>

        {#if syncError[idx.id]}
          <p style="font-size:var(--text-xs);color:#ef4444;margin-top:var(--space-2);">⚠ {syncError[idx.id]}</p>
        {/if}
      </div>
    {/each}

    {#if data.indices.length === 0}
      <p style="text-align:center;padding:var(--space-10);font-size:var(--text-sm);color:var(--color-text-muted);">No indices yet. Add one above.</p>
    {/if}
  </div>
</div>
```

- [ ] **Step 3: Add to sidebar**

In `src/lib/components/cabinet/CabinetSidebar.svelte`, find the Content group (around line 38):

```typescript
// BEFORE:
{
  label: 'Content',
  items: [
    { label: 'Articles', href: '/admin/articles' },
    { label: 'Comments', href: '/admin/comments' },
    { label: 'FAQ', href: '/admin/faq' },
    { label: 'Jobs', href: '/admin/jobs' }
  ]
},
```

Change to:
```typescript
{
  label: 'Content',
  items: [
    { label: 'Articles', href: '/admin/articles' },
    { label: 'Comments', href: '/admin/comments' },
    { label: 'Market Indices', href: '/admin/market-indices' },
    { label: 'FAQ', href: '/admin/faq' },
    { label: 'Jobs', href: '/admin/jobs' }
  ]
},
```

- [ ] **Step 4: Verify in browser**

Start dev server. Log in as `admin@groundz.estate`. Navigate to `/admin/market-indices`. Verify:
- Page loads with empty state
- "Add Index" button opens form
- Create a test ETF index (e.g. VNQ, global, etf)
- Index appears in list
- "Initial Sync" button visible (lastSyncAt null)
- Sidebar shows "Market Indices" link

- [ ] **Step 5: Commit**

```bash
git add src/routes/(cabinet)/admin/market-indices/ src/lib/components/cabinet/CabinetSidebar.svelte
git commit -m "feat: add admin market indices management page"
```

---

## Chunk 4: Public Widget

### Task 7: MarketChart SVG Component

**Files:**
- Create: `src/lib/components/market/MarketChart.svelte`

**Context:** Pure SVG, no external libraries. ViewBox 800×200. Y-axis inverted (low value = high Y position). 2008 crisis band is a hardcoded rect from 2008-01-01 to 2009-12-31. Gradient fill under the line. Hover via mousemove on transparent overlay rect. Svelte 5 runes: `$props()`, `$derived`.

- [ ] **Step 1: Create the chart component**

```svelte
<!-- src/lib/components/market/MarketChart.svelte -->
<script lang="ts">
  const W = 800;
  const H = 200;
  const PAD_TOP = 12;
  const PAD_BOTTOM = 8;

  interface Price { date: string; close: number }

  let {
    prices = [],
    color = '#7a8c6e',
    showCrisisBand = true,
  }: {
    prices: Price[];
    color?: string;
    showCrisisBand?: boolean;
  } = $props();

  let tooltip = $state<{ x: number; y: number; date: string; close: number } | null>(null);

  let minClose = $derived(prices.length ? Math.min(...prices.map(p => p.close)) : 0);
  let maxClose = $derived(prices.length ? Math.max(...prices.map(p => p.close)) : 1);
  let minTime  = $derived(prices.length ? new Date(prices[0].date).getTime() : 0);
  let maxTime  = $derived(prices.length ? new Date(prices[prices.length - 1].date).getTime() : 1);

  function xScale(dateStr: string): number {
    const t = new Date(dateStr).getTime();
    return ((t - minTime) / (maxTime - minTime)) * W;
  }

  function yScale(close: number): number {
    return PAD_TOP + ((maxClose - close) / (maxClose - minClose)) * (H - PAD_TOP - PAD_BOTTOM);
  }

  let polylinePoints = $derived(
    prices.map(p => `${xScale(p.date).toFixed(1)},${yScale(p.close).toFixed(1)}`).join(' ')
  );

  // 2008 crisis band X positions
  let crisisX1 = $derived(xScale('2008-01-01'));
  let crisisX2 = $derived(xScale('2009-12-31'));
  let showBand = $derived(
    showCrisisBand &&
    prices.length > 0 &&
    new Date(prices[0].date).getTime() < new Date('2009-12-31').getTime() &&
    new Date(prices[prices.length - 1].date).getTime() > new Date('2008-01-01').getTime()
  );

  // Area path (close shape under polyline)
  let areaPath = $derived(
    prices.length
      ? `M${xScale(prices[0].date).toFixed(1)},${H} ` +
        prices.map(p => `L${xScale(p.date).toFixed(1)},${yScale(p.close).toFixed(1)}`).join(' ') +
        ` L${xScale(prices[prices.length - 1].date).toFixed(1)},${H} Z`
      : ''
  );

  function handleMouseMove(e: MouseEvent) {
    const svg = (e.currentTarget as SVGElement).ownerSVGElement!;
    const rect = svg.getBoundingClientRect();
    const svgX = ((e.clientX - rect.left) / rect.width) * W;

    // Find nearest price
    const t = minTime + (svgX / W) * (maxTime - minTime);
    let nearest = prices[0];
    let minDiff = Infinity;
    for (const p of prices) {
      const diff = Math.abs(new Date(p.date).getTime() - t);
      if (diff < minDiff) { minDiff = diff; nearest = p; }
    }
    if (nearest) {
      tooltip = {
        x: Math.min(Math.max(xScale(nearest.date), 40), W - 40),
        y: yScale(nearest.close) - 8,
        date: nearest.date,
        close: nearest.close,
      };
    }
  }

  function handleMouseLeave() { tooltip = null; }
</script>

<div style="position:relative;width:100%;">
  <svg
    viewBox="0 0 {W} {H}"
    preserveAspectRatio="none"
    width="100%"
    height="100%"
    style="display:block;overflow:visible;"
    role="img"
    aria-label="Price chart"
  >
    <defs>
      <linearGradient id="grad-{color.replace('#','')}" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color={color} stop-opacity="0.18" />
        <stop offset="100%" stop-color={color} stop-opacity="0" />
      </linearGradient>
    </defs>

    <!-- Crisis band 2008-2009 -->
    {#if showBand}
      <rect
        x={crisisX1}
        y={0}
        width={Math.max(0, crisisX2 - crisisX1)}
        height={H}
        fill="rgba(239,68,68,0.06)"
      />
    {/if}

    <!-- Area fill -->
    {#if areaPath}
      <path d={areaPath} fill="url(#grad-{color.replace('#','')})" />
    {/if}

    <!-- Line -->
    {#if polylinePoints}
      <polyline
        points={polylinePoints}
        fill="none"
        stroke={color}
        stroke-width="1.5"
        stroke-linejoin="round"
        vector-effect="non-scaling-stroke"
      />
    {/if}

    <!-- Hover overlay -->
    <rect
      x="0" y="0" width={W} height={H}
      fill="transparent"
      onmousemove={handleMouseMove}
      onmouseleave={handleMouseLeave}
      style="cursor:crosshair;"
    />

    <!-- Tooltip dot -->
    {#if tooltip}
      <circle cx={tooltip.x} cy={tooltip.y + 8} r="3" fill={color} />
      <line x1={tooltip.x} y1={0} x2={tooltip.x} y2={H} stroke={color} stroke-width="0.5" stroke-dasharray="3,3" vector-effect="non-scaling-stroke" />
    {/if}
  </svg>

  <!-- Tooltip label (outside SVG for correct font rendering) -->
  {#if tooltip}
    <div style="
      position:absolute;
      left:{(tooltip.x / W * 100).toFixed(1)}%;
      top:{(tooltip.y / H * 100).toFixed(1)}%;
      transform:translate(-50%,-100%);
      background:rgba(0,0,0,0.75);
      color:#fff;
      font-size:11px;
      padding:3px 7px;
      border-radius:4px;
      pointer-events:none;
      white-space:nowrap;
    ">
      {tooltip.date} · {tooltip.close.toFixed(2)}
    </div>
  {/if}
</div>
```

- [ ] **Step 2: Commit**

```bash
git add src/lib/components/market/MarketChart.svelte
git commit -m "feat: add MarketChart SVG component with 2008 crisis band"
```

---

### Task 8: Public Widget on /investment Page

**Files:**
- Modify: `src/routes/(marketing)/investment/+page.server.ts`
- Modify: `src/routes/(marketing)/investment/+page.svelte`

**Context:** The investment page server currently returns `{ pools, trustBar, filters }`. We add `{ indices }` to the load result — only last 365 days of prices. The widget goes between trust bar and pools grid in the Svelte file. Svelte 5 runes used throughout. Auth gating is CSS-only (blur) — full AI content always returned from server but visually hidden for guests.

- [ ] **Step 1: Update the server load to include indices**

In `src/routes/(marketing)/investment/+page.server.ts`, add the indices query:

```typescript
import db from '$lib/server/db';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ url, locals }) => {
  const dealType = url.searchParams.get('dealType') ?? '';
  const country = url.searchParams.get('country') ?? '';
  const status = url.searchParams.get('status') ?? '';

  const [pools, allPools, investorCount, indices] = await Promise.all([
    db.investmentPool.findMany({
      where: {
        ...(dealType ? { dealType } : {}),
        ...(country ? { country } : {}),
        ...(status ? { status } : { status: { not: 'draft' } }),
      },
      include: { _count: { select: { investments: true } } },
      orderBy: { createdAt: 'desc' },
    }),
    db.investmentPool.findMany({
      where: { status: { not: 'draft' } },
      select: { goalAmount: true, raisedAmount: true, targetIrr: true, targetYield: true, termMonths: true, minTicket: true, developerCoinvestPct: true },
    }),
    db.investorInvestment.count(),
    db.marketIndex.findMany({
      where: { active: true },
      include: {
        prices: {
          where: { date: { gte: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000) } },
          orderBy: { date: 'asc' },
          select: { date: true, close: true },
        },
      },
      orderBy: { createdAt: 'asc' },
    }),
  ]);

  const totalAum = allPools.reduce((s, p) => s + p.goalAmount, 0);
  const totalRaised = allPools.reduce((s, p) => s + p.raisedAmount, 0);
  const avgIrr = allPools.length
    ? allPools.reduce((s, p) => s + (p.targetIrr ?? p.targetYield), 0) / allPools.length
    : 0;
  const minTicketAll = allPools.length ? Math.min(...allPools.map(p => p.minTicket)) : 0;
  const avgTerm = allPools.length
    ? allPools.reduce((s, p) => s + p.termMonths, 0) / allPools.length
    : 0;

  const trustBar = {
    totalAum, totalRaised, activeInvestors: investorCount,
    avgIrr: Math.round(avgIrr * 10) / 10,
    avgTermMonths: Math.round(avgTerm),
    minTicket: minTicketAll,
  };

  // Serialize dates for client
  const serialisedIndices = indices.map(idx => ({
    ...idx,
    lastSyncAt: idx.lastSyncAt?.toISOString() ?? null,
    createdAt: idx.createdAt.toISOString(),
    prices: idx.prices.map(p => ({
      date: p.date.toISOString().slice(0, 10),
      close: p.close,
    })),
  }));

  return { pools, trustBar, filters: { dealType, country, status }, indices: serialisedIndices, user: locals.user ?? null };
};
```

- [ ] **Step 2: Add the widget section to the investment page**

In `src/routes/(marketing)/investment/+page.svelte`, find the section after the trust bar and before the filters/pools grid. Add the following widget section between them:

```svelte
<!-- ═══════════════════════════════════════════
     MARKET INDICES WIDGET
     ════════════════════════════════════════ -->
{#if data.indices.length > 0}
  {@const MARKETS = ['global','europe','cyprus','georgia','dubai','turkey']}
  {@const marketLabels: Record<string,string> = { global:'Global', europe:'Europe', cyprus:'Cyprus', georgia:'Georgia', dubai:'Dubai', turkey:'Turkey' }}

  <!-- Add to script section: -->
  <!-- let activeMarket = $state(data.indices[0]?.market ?? 'global') -->
  <!-- let activeIndex = $derived(data.indices.find(i => i.market === activeMarket) ?? data.indices[0]) -->
  <!-- let chartPrices = $state<{date:string;close:number}[]>([]) -->
  <!-- let chartPeriod = $state<'1Y'|'5Y'|'10Y'|'MAX'>('1Y') -->
  <!-- let aiData = $state<{what:string;context:string;comparison:string}|null>(null) -->
  <!-- let aiLoading = $state(false) -->
  <!-- let aiOpen = $state(false) -->

  <section style="margin-bottom:var(--space-12);">
    <div style="margin-bottom:var(--space-6);">
      <p style="font-size:10px;font-weight:700;letter-spacing:0.12em;text-transform:uppercase;color:var(--color-text-muted);margin-bottom:var(--space-2);">MARKET DATA</p>
      <h2 style="font-size:var(--text-2xl);font-weight:700;color:var(--color-text);">Global Real Estate Markets</h2>
      <p style="font-size:var(--text-sm);color:var(--color-text-muted);margin-top:var(--space-1);">20-year daily price history · Updated daily</p>
    </div>

    <!-- Market tabs -->
    <!-- rendered from MARKETS filtered to indices that exist -->
  </section>
{/if}
```

The script section additions and full widget are in the next step.

- [ ] **Step 3: Add full script + widget to investment page**

At the **top of the `<script lang="ts">` section** in `+page.svelte`, add after the existing `let { data } = $props();` line:

```typescript
// Market indices widget state
const MARKETS = ['global','europe','cyprus','georgia','dubai','turkey'] as const;
const MARKET_LABELS: Record<string,string> = { global:'Global', europe:'Europe', cyprus:'Cyprus', georgia:'Georgia', dubai:'Dubai', turkey:'Turkey' };
const PERIOD_LABELS = ['1Y','5Y','10Y','MAX'] as const;

let activeMarket = $state(data.indices[0]?.market ?? 'global');
let activeIndex = $derived(data.indices.find(i => i.market === activeMarket) ?? data.indices[0]);
let chartPrices = $state<{date:string;close:number}[]>(
  data.indices[0]?.prices ?? []
);
let chartPeriod = $state<'1Y'|'5Y'|'10Y'|'MAX'>('1Y');
let aiData = $state<{what:string;context:string;comparison:string}|null>(null);
let aiLoading = $state(false);
let aiOpen = $state(false);
let aiError = $state<string|null>(null);

$effect(() => {
  // When active index or period changes, update chart prices
  const idx = activeIndex;
  if (!idx) return;
  if (chartPeriod === '1Y') {
    chartPrices = idx.prices; // already loaded server-side
  } else {
    fetch(`/api/market/prices?indexId=${idx.id}&period=${chartPeriod}`)
      .then(r => r.json())
      .then(d => { chartPrices = d.prices ?? []; })
      .catch(() => {});
  }
  // Reset AI when switching indices
  aiData = null;
  aiOpen = false;
});

async function openAiAnalysis() {
  if (!activeIndex) return;
  aiOpen = true;
  if (aiData) return; // already loaded
  aiLoading = true;
  aiError = null;
  try {
    const res = await fetch('/api/market/ai-insight', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ indexId: activeIndex.id }),
    });
    const d = await res.json();
    if (!res.ok) { aiError = d.error ?? 'AI unavailable'; }
    else { aiData = d; }
  } catch { aiError = 'Network error'; }
  finally { aiLoading = false; }
}
```

Also add `import MarketChart from '$lib/components/market/MarketChart.svelte';` at the top of the script.

- [ ] **Step 4: Add widget HTML after trust bar**

Find the trust bar closing tag and add the widget section after it:

```svelte
<!-- ═══ MARKET INDICES WIDGET ═══ -->
{#if data.indices.length > 0}
  <section style="margin:var(--space-12) 0;">
    <div style="margin-bottom:var(--space-5);">
      <p style="font-size:10px;font-weight:700;letter-spacing:0.12em;text-transform:uppercase;color:var(--color-text-muted);margin-bottom:var(--space-1);">LIVE MARKET DATA</p>
      <h2 style="font-size:var(--text-xl);font-weight:700;color:var(--color-text);">Global Real Estate Markets</h2>
      <p style="font-size:var(--text-sm);color:var(--color-text-muted);">20-year daily history · Updated daily</p>
    </div>

    <!-- Region tabs -->
    <div style="display:flex;gap:var(--space-1);margin-bottom:var(--space-5);flex-wrap:wrap;">
      {#each MARKETS as m}
        {#if data.indices.some(i => i.market === m)}
          <button
            onclick={() => { activeMarket = m; chartPeriod = '1Y'; }}
            style="
              padding:var(--space-1) var(--space-4);border-radius:99px;
              border:1px solid {activeMarket === m ? 'var(--color-accent)' : 'rgba(0,0,0,0.1)'};
              background:{activeMarket === m ? 'var(--color-accent)' : 'transparent'};
              color:{activeMarket === m ? '#fff' : 'var(--color-text-muted)'};
              font-size:var(--text-xs);font-weight:600;cursor:pointer;
              transition:all var(--transition-fast);
            "
          >{MARKET_LABELS[m]}</button>
        {/if}
      {/each}
    </div>

    {#if activeIndex}
      <div style="background:rgba(255,255,255,0.65);backdrop-filter:blur(12px);border:1px solid rgba(0,0,0,0.07);border-radius:var(--radius-lg);padding:var(--space-6);">
        <!-- Header row -->
        <div style="display:flex;align-items:flex-start;justify-content:space-between;gap:var(--space-4);margin-bottom:var(--space-4);flex-wrap:wrap;">
          <div>
            <div style="display:flex;align-items:center;gap:var(--space-3);">
              <span style="
                font-size:11px;font-weight:700;letter-spacing:0.08em;padding:2px 8px;
                border-radius:99px;background:rgba(0,0,0,0.05);color:var(--color-text-muted);
              ">{activeIndex.symbol}</span>
              <h3 style="font-size:var(--text-base);font-weight:700;color:var(--color-text);">{activeIndex.name}</h3>
            </div>
            {#if chartPrices.length > 0}
              {@const last = chartPrices[chartPrices.length - 1]}
              {@const prev = chartPrices[chartPrices.length - 2]}
              {@const chg = prev ? ((last.close - prev.close) / prev.close * 100) : 0}
              <div style="display:flex;align-items:baseline;gap:var(--space-3);margin-top:var(--space-1);">
                <span style="font-size:var(--text-2xl);font-weight:700;color:var(--color-text);">{last.close.toFixed(2)}</span>
                <span style="
                  font-size:var(--text-xs);font-weight:700;padding:2px 7px;border-radius:99px;
                  background:{chg >= 0 ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)'};
                  color:{chg >= 0 ? '#16a34a' : '#ef4444'};
                ">{chg >= 0 ? '+' : ''}{chg.toFixed(2)}%</span>
              </div>
            {/if}
          </div>

          <!-- Period selector -->
          <div style="display:flex;gap:var(--space-1);">
            {#each PERIOD_LABELS as p}
              <button
                onclick={() => chartPeriod = p}
                style="
                  padding:var(--space-1) var(--space-3);border-radius:var(--radius-sm);
                  border:1px solid {chartPeriod === p ? 'var(--color-accent)' : 'rgba(0,0,0,0.1)'};
                  background:{chartPeriod === p ? 'rgba(122,140,110,0.08)' : 'transparent'};
                  color:{chartPeriod === p ? 'var(--color-accent)' : 'var(--color-text-muted)'};
                  font-size:11px;font-weight:600;cursor:pointer;
                "
              >{p}</button>
            {/each}
          </div>
        </div>

        <!-- Chart -->
        <div style="height:180px;margin-bottom:var(--space-5);">
          <MarketChart prices={chartPrices} color={activeIndex.color} />
        </div>

        {#if chartPeriod === 'MAX' && chartPrices.length > 0}
          <p style="font-size:10px;color:var(--color-text-muted);text-align:right;margin-top:-var(--space-3);margin-bottom:var(--space-3);">
            Red band = 2008-2009 global financial crisis
          </p>
        {/if}

        <!-- AI Analysis button -->
        {#if !aiOpen}
          <button
            onclick={openAiAnalysis}
            style="
              display:flex;align-items:center;gap:6px;
              padding:var(--space-2) var(--space-5);border-radius:var(--radius-md);
              border:1px solid var(--color-accent);background:transparent;
              color:var(--color-accent);font-size:var(--text-sm);font-weight:600;cursor:pointer;
            "
          >✦ AI Analysis</button>
        {/if}

        <!-- AI Panel -->
        {#if aiOpen}
          <div style="border-top:1px solid rgba(0,0,0,0.06);margin-top:var(--space-4);padding-top:var(--space-5);">
            {#if aiLoading}
              <p style="font-size:var(--text-sm);color:var(--color-text-muted);">✦ Analysing market data…</p>
            {:else if aiError}
              <p style="font-size:var(--text-sm);color:#ef4444;">⚠ {aiError}</p>
            {:else if aiData}
              <div style="display:flex;flex-direction:column;gap:var(--space-4);">
                <div>
                  <p style="font-size:10px;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;color:var(--color-text-muted);margin-bottom:var(--space-1);">WHAT IS THIS</p>
                  {#if data.user}
                    <p style="font-size:var(--text-sm);color:var(--color-text);line-height:1.7;">{aiData.what}</p>
                  {:else}
                    <p style="font-size:var(--text-sm);color:var(--color-text);line-height:1.7;">{aiData.what.slice(0, 80)}…</p>
                  {/if}
                </div>

                <div style="position:relative;">
                  <p style="font-size:10px;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;color:var(--color-text-muted);margin-bottom:var(--space-1);">MARKET CONTEXT</p>
                  <p style="font-size:var(--text-sm);color:var(--color-text);line-height:1.7;{!data.user ? 'filter:blur(4px);user-select:none;' : ''}">{aiData.context}</p>
                </div>

                <div style="position:relative;">
                  <p style="font-size:10px;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;color:var(--color-text-muted);margin-bottom:var(--space-1);">VS GROUNDZ INVESTMENT</p>
                  <p style="font-size:var(--text-sm);color:var(--color-text);line-height:1.7;{!data.user ? 'filter:blur(4px);user-select:none;' : ''}">{aiData.comparison}</p>
                </div>

                {#if !data.user}
                  <div style="
                    background:rgba(255,255,255,0.9);border:1px solid rgba(0,0,0,0.08);
                    border-radius:var(--radius-md);padding:var(--space-4);text-align:center;
                    margin-top:var(--space-2);
                  ">
                    <p style="font-size:var(--text-sm);font-weight:600;color:var(--color-text);margin-bottom:var(--space-3);">
                      Register free to access full AI analysis and market insights
                    </p>
                    <a
                      href="/register"
                      style="
                        display:inline-block;padding:var(--space-2) var(--space-6);
                        border-radius:var(--radius-md);background:var(--color-accent);
                        color:#fff;font-size:var(--text-sm);font-weight:700;text-decoration:none;
                      "
                    >Create free account →</a>
                  </div>
                {/if}
              </div>
            {/if}
          </div>
        {/if}
      </div>
    {/if}
  </section>
{/if}
```

- [ ] **Step 5: Verify in browser**

1. Go to `/admin/market-indices`, create index: symbol=`VNQ`, name=`Vanguard Real Estate ETF`, market=`global`, type=`etf`, color=`#7a8c6e`
2. Add `TWELVE_DATA_API_KEY=your-key` to `.env`, restart dev server
3. Click "Initial Sync" on VNQ — wait for completion (may take 10-20s for 5000 candles)
4. Navigate to `/investment` — widget section should appear
5. Verify: chart renders, period toggle works, crisis band visible on MAX, AI button fetches and displays analysis
6. Log out — verify blurred sections + register CTA shows

- [ ] **Step 6: Commit**

```bash
git add src/routes/(marketing)/investment/ src/lib/components/market/
git commit -m "feat: add market indices widget to /investment page"
```

---

## Final verification

- [ ] TypeScript clean: `npx tsc --noEmit` — no errors
- [ ] All 6 markets can have active indices and display correctly
- [ ] Custom index with components syncs and renders chart
- [ ] AI analysis works when OpenAI key is set, gracefully errors when not
- [ ] Unauthenticated users see blur + register CTA
- [ ] Admin can add/edit/delete indices without page reload issues
