# Market Indices Widget — Design Spec

**Goal:** Add a public-facing real estate market indices widget to `/investment` showing 20-year daily price history for global ETFs and custom Develta composite indices (Cyprus, Georgia, Dubai, Turkey), with AI analysis and a register CTA.

**Architecture:** DB-first — historical data synced once and stored in Prisma, daily cron updates latest candle. Page reads purely from DB (no Twelve Data latency in runtime). Custom indices are weighted composites of component symbols, stored as standard DailyPrice rows.

**Tech Stack:** SvelteKit, Prisma/SQLite, Twelve Data API (paid), SVG chart (no external library), existing `callAI` from `$lib/server/seo/ai-client.js` + `AiResponseCache` Prisma model.

---

## Section 1 — Data Models

### `MarketIndex`
```prisma
model MarketIndex {
  id         String   @id @default(uuid())
  symbol     String   @unique
  name       String
  type       String   // "etf" | "custom"
  market     String   // "global" | "europe" | "cyprus" | "georgia" | "dubai" | "turkey"
  color      String   @default("#7a8c6e")
  active     Boolean  @default(true)
  lastSyncAt DateTime?
  createdAt  DateTime @default(now())

  components IndexComponent[]
  prices     DailyPrice[]
}
```

### `IndexComponent`
```prisma
model IndexComponent {
  id       String      @id @default(uuid())
  indexId  String
  symbol   String      // Twelve Data ticker of component
  name     String
  weight   Float       // 0.0 – 1.0, sum must equal 1.0 per index

  index    MarketIndex @relation(fields: [indexId], references: [id], onDelete: Cascade)

  @@unique([indexId, symbol])
}
```

### `DailyPrice`
```prisma
model DailyPrice {
  id        String      @id @default(uuid())
  indexId   String
  date      DateTime
  open      Float
  high      Float
  low       Float
  close     Float
  volume    Float?
  changePct Float?

  index     MarketIndex @relation(fields: [indexId], references: [id], onDelete: Cascade)

  @@unique([indexId, date])
}
```

**DateTime normalisation rule:** All dates stored as midnight UTC (`new Date(dateString).setUTCHours(0,0,0,0)`). Applied in sync service before every insert/upsert. This ensures `@@unique([indexId, date])` deduplication works correctly regardless of Twelve Data response format.

AI responses reuse the existing `AiResponseCache` model (already in schema).

---

## Section 2 — Sync Service

**File:** `src/lib/server/market/sync.ts`

**Import:** `import { callAI } from '$lib/server/seo/ai-client.js'`

### ETF sync (`syncEtf(index: MarketIndex): Promise<void>`)
1. `GET https://api.twelvedata.com/time_series?symbol={symbol}&interval=1day&outputsize=5000&apikey={key}`
2. Parse `values[]` array from response: `{ datetime, open, high, low, close, volume }`
3. Normalise each `datetime` to midnight UTC
4. `db.dailyPrice.createMany({ data: rows, skipDuplicates: true })`
5. `db.marketIndex.update({ where: { id }, data: { lastSyncAt: new Date() } })`

### Custom index sync (`syncCustom(index: MarketIndex): Promise<void>`)
1. Load `index.components` from DB
2. For each component, fetch full time series (same as syncEtf, outputsize=5000)
3. Build a `Map<dateStr, number>` per component (normalised date → close)
4. **Date alignment (strict intersection):** Only dates present in ALL component maps are included. If a component has fewer years of data, the composite silently covers fewer years — this is acceptable.
5. For each aligned date: `compositeClose = Σ(component.close * component.weight)`, compositeOpen/High/Low similarly weighted
6. `db.dailyPrice.createMany({ data: compositeRows, skipDuplicates: true })`
7. Update `lastSyncAt`

### Daily update (`dailyUpdate(indexId: string): Promise<void>`)
- Fetch `outputsize=2` for the index (or each component for custom)
- Same normalise + upsert logic
- For custom: recalculate composite for the 2 latest dates

### Environment
```
TWELVE_DATA_API_KEY=   # in .env, server-only, never sent to client
```

---

## Section 3 — Sync API Endpoint

**File:** `src/routes/api/market/sync/+server.ts`

**Method:** `POST`

**Auth:** Requires `locals.user?.role === 'internal_team'` — returns 403 otherwise. (No cron secret needed for MVP; admin triggers manually.)

**Request body:**
```ts
{
  indexId: string;      // which index to sync
  mode: 'initial' | 'daily';  // 'initial' = full 5000 candles, 'daily' = last 2
}
```

**Logic:**
1. Load `MarketIndex` by `indexId` (404 if not found)
2. If `mode = 'initial'`: call `syncEtf(index)` or `syncCustom(index)` based on `index.type`
3. If `mode = 'daily'`: call `dailyUpdate(indexId)`
4. Return `{ ok: true, syncedAt: new Date() }`
5. On error: return `{ error: message }` with status 500

---

## Section 4 — Admin UI

**Route:** `src/routes/(cabinet)/admin/market-indices/`

Files:
- `+page.server.ts` — loads all `MarketIndex` with `_count: { select: { prices: true } }`, handles named form actions
- `+page.svelte` — index management UI

### Named form actions in `+page.server.ts`

| Action name | Inputs | Behaviour |
|---|---|---|
| `create` | symbol, name, market, type, color, components (JSON string) | Creates `MarketIndex` + `IndexComponent[]` in transaction |
| `update` | id, symbol, name, market, type, color, active, components (JSON string) | Updates index + replaces all components in transaction |
| `delete` | id | Deletes index (cascades to prices + components) |
| `toggleActive` | id, active (boolean string) | Flips `active` field |

Sync (initial/daily) is triggered via client-side `fetch('/api/market/sync', { method: 'POST', body: JSON.stringify({ indexId, mode }) })` — not a form action, to support loading state in UI.

### Index list page
- Table: Name · Symbol · Type · Market · Prices count · Last sync · Active toggle
- Actions per row: Edit · Sync Now (daily) · Delete
- "Add Index" button → shows inline form below table

### Create / Edit form
Fields:
- `symbol` (text, uppercase, required)
- `name` (text, required)
- `market` (select: global / europe / cyprus / georgia / dubai / turkey)
- `type` (radio: ETF / Custom)
- `color` (color input, default `#7a8c6e`)
- `active` (toggle, default true)

If `type = custom`:
- Component list: each row has `symbol` (text), `name` (text), `weight` (number 0–100)
- "+ Add component" button adds a new blank row
- Auto-sum display — shows current total, red if ≠ 100%
- Form submission serialises components as JSON string in hidden field `components`

### Sync controls (per index row)
- "Run Initial Sync" button — visible only when `lastSyncAt` is null; triggers `/api/market/sync` with `mode: 'initial'`; shows spinner while running
- "Update Now" button — triggers `/api/market/sync` with `mode: 'daily'`

### Sidebar
Add to `CabinetSidebar.svelte` under Content group (after Comments):
```ts
{ label: 'Market Indices', href: '/admin/market-indices' }
```

---

## Section 5 — Public Widget on `/investment`

### Server load (`+page.server.ts` modification)
Load only the **last 365 days** of prices per active index server-side (sufficient for default 1Y view):
```ts
const indices = await db.marketIndex.findMany({
  where: { active: true },
  include: {
    prices: {
      where: { date: { gte: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000) } },
      orderBy: { date: 'asc' },
    },
  },
});
```

Longer periods (5Y, 10Y, MAX) are fetched client-side via `GET /api/market/prices?indexId=X&period=5Y`.

**`GET /api/market/prices`** (new endpoint, file: `src/routes/api/market/prices/+server.ts`):
- Query params: `indexId`, `period` (1Y|5Y|10Y|MAX)
- No auth required (public data)
- Returns `{ prices: { date: string; close: number }[] }`

### Placement
Between trust bar and pool listings grid on `/investment`.

### Tab navigation
`Global · Europe · Cyprus · Georgia · Dubai · Turkey`

Each tab shows the single active `MarketIndex` for that market. If no active index exists for a market, the tab is hidden.

### Index card layout
```
[Symbol badge]  Index Name                    [+2.34%]  ← green/red badge
                Current close price (EUR display if market=europe, USD otherwise)

[SVG Line Chart — full width]
Period: [ 1Y ] [ 5Y ] [ 10Y ] [ MAX ]

[✦ AI Analysis]  ← button, triggers fetch to /api/market/ai-insight
  ↓ expands to:
  — What this instrument is
  — Current market context
  — How Develta investment differs
  — CTA: "Want this analysis for your portfolio?" → /register
```

### AI panel — auth gating
- **Intentional product decision:** The full AI response is delivered to all users (authenticated or not) from the server. Gating is purely visual/CSS on the client.
- **Logged in:** Full AI response rendered
- **Not logged in:** First 2 lines of `what` visible, rest has `filter: blur(4px)` + overlay CTA "Register free to read full analysis → /register"

### Chart behaviour
- 2008–2009 zone: red background band from `2008-01-01` to `2009-12-31` (hardcoded, always rendered if date range covers it)
- Period filter: client-side `$derived` slice for 1Y (uses server data); 5Y/10Y/MAX triggers fetch to `/api/market/prices`
- Hover tooltip: date + close price
- Line color from `MarketIndex.color`
- Pure SVG, no chart library

---

## Section 6 — AI Insight Endpoint

**File:** `src/routes/api/market/ai-insight/+server.ts`

**Method:** `POST`
**Auth:** None required (public endpoint — gating is client-side by design)

**Request:** `{ indexId: string }`

**Server logic:**
1. Load `MarketIndex` by `indexId` (404 if not found)
2. Load last 365 `DailyPrice` rows ordered by date desc
3. Calculate: `currentClose`, `ytdPct`, `1yPct`, `5yPct` (from available data)
4. Cache key: `market_insight_${indexId}_${new Date().toISOString().slice(0,10)}`
5. Check `AiResponseCache` — if hit and not expired (24h), return cached
6. Call `callAI()` (import from `$lib/server/seo/ai-client.js`):
```ts
const result = await callAI({
  systemPrompt: 'You are a real estate investment analyst. Return only valid JSON.',
  prompt: `...` // see below
});
```
7. Parse response:
```ts
let parsed: { what: string; context: string; comparison: string };
try {
  parsed = JSON.parse(result.content);
} catch {
  parsed = JSON.parse(result.content.replace(/```json|```/g, '').trim());
}
// On parse failure: return { what: result.content, context: '', comparison: '', cached: false }
```
8. Save to `AiResponseCache`, return `{ what, context, comparison, cached: false }`

**AI prompt:**
```
Instrument: {name} ({symbol}), {market} real estate market
Current close: {currentClose} | YTD: {ytdPct}% | 1Y: {1yPct}% | 5Y: {5yPct}%

Respond ONLY with valid JSON (no markdown):
{
  "what": "2-3 sentence explanation of what this instrument represents and what it tracks",
  "context": "2-3 sentence current market context based on the price data above",
  "comparison": "2-3 sentence explanation of how direct real estate investment via Develta (Cyprus development projects, 12-18% target IRR) differs from this index"
}
```

---

## Section 7 — Chart Component

**`src/lib/components/market/MarketChart.svelte`**

Props:
```ts
prices: { date: string; close: number }[]   // already period-filtered
color?: string         // default '#7a8c6e'
showCrisisBand?: boolean  // default true — shows 2008-2009 red band
```

Implementation:
- SVG `viewBox="0 0 800 200"` with `width="100%" height="100%"` on wrapper
- X scale: map date to [0, 800]; Y scale: map close to [180, 10] (inverted, 10px top padding)
- 2008 crisis band: rect from x(2008-01-01) to x(2009-12-31), `fill="rgba(239,68,68,0.06)"`, only rendered if dates overlap
- Polyline path: `points={prices.map((p,i) => `${xScale(p.date)},${yScale(p.close)}`).join(' ')}`
- Gradient fill under line: `<defs><linearGradient>` from `color` at 20% opacity to transparent
- Hover: `<rect width="800" height="200" fill="transparent" onmousemove={handleHover}>`
- Tooltip: absolutely positioned div (outside SVG) showing date + close
- No external dependencies

---

## File Map

| File | Action |
|------|--------|
| `prisma/schema.prisma` | Add `MarketIndex`, `IndexComponent`, `DailyPrice` |
| `src/lib/server/market/sync.ts` | New — sync service (syncEtf, syncCustom, dailyUpdate) |
| `src/routes/api/market/sync/+server.ts` | New — POST, admin-only, triggers sync |
| `src/routes/api/market/prices/+server.ts` | New — GET, public, returns price series by period |
| `src/routes/api/market/ai-insight/+server.ts` | New — POST, public, AI analysis with cache |
| `src/routes/(cabinet)/admin/market-indices/+page.server.ts` | New — load + 4 form actions |
| `src/routes/(cabinet)/admin/market-indices/+page.svelte` | New — admin UI |
| `src/lib/components/market/MarketChart.svelte` | New — SVG chart component |
| `src/routes/(marketing)/investment/+page.svelte` | Modify — add widget section |
| `src/routes/(marketing)/investment/+page.server.ts` | Modify — load last 365d prices per index |
| `src/lib/components/cabinet/CabinetSidebar.svelte` | Modify — add Market Indices link |
| `.env` | Add `TWELVE_DATA_API_KEY=` |
