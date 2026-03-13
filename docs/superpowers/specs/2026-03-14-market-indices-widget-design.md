# Market Indices Widget — Design Spec

**Goal:** Add a public-facing real estate market indices widget to `/investment` showing 20-year daily price history for global ETFs and custom Develta composite indices (Cyprus, Georgia, Dubai, Turkey), with AI analysis and a register CTA.

**Architecture:** DB-first — historical data synced once and stored in Prisma, daily cron updates latest candle. Page reads purely from DB (no Twelve Data latency in runtime). Custom indices are weighted composites of component symbols, stored as standard DailyPrice rows.

**Tech Stack:** SvelteKit, Prisma/SQLite, Twelve Data API (paid), SVG chart (no external library), existing `callAI` + `AiResponseCache`.

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

AI responses reuse the existing `AiResponseCache` model.

---

## Section 2 — Sync Service

**File:** `src/lib/server/market/sync.ts`

### ETF sync (`syncEtf(index)`)
1. Call Twelve Data `GET /time_series?symbol={symbol}&interval=1day&outputsize=5000`
2. Parse OHLCV array
3. `db.dailyPrice.createMany({ skipDuplicates: true })` — safe to re-run

### Custom index sync (`syncCustom(index)`)
1. For each `IndexComponent`, fetch full time series
2. Align dates across all components (intersection)
3. For each date: `compositeClose = Σ(component.close * component.weight)`
4. Upsert into `DailyPrice` for the custom index

### Daily update (`dailyUpdate(indexId)`)
- Fetch `outputsize=2` (2 candles for overlap)
- Upsert into `DailyPrice`

### Environment
```
TWELVE_DATA_API_KEY=   # in .env, server-only
```

---

## Section 3 — Admin UI

**Route:** `src/routes/(cabinet)/admin/market-indices/`

Files:
- `+page.server.ts` — loads all `MarketIndex` with `_count.prices`, handles form actions
- `+page.svelte` — index management UI

### Index list page
- Table: Name · Symbol · Type · Market · Prices count · Last sync · Active toggle
- Actions per row: Edit · Sync Now · Delete
- "Add Index" button → inline form or modal

### Create / Edit form
Fields:
- `symbol` (text, uppercase)
- `name` (text)
- `market` (select: global / europe / cyprus / georgia / dubai / turkey)
- `type` (radio: ETF / Custom)
- `color` (color input, default `#7a8c6e`)
- `active` (toggle)

If `type = custom`:
- Component list: each row has `symbol`, `name`, `weight %`
- Add/remove component rows dynamically
- Auto-sum display (must equal 100%)

### Sync controls
- "Run Initial Sync" button — visible when `lastSyncAt` is null
- "Update Now" button — triggers `dailyUpdate` for this index
- Last sync timestamp shown

### Sidebar
Add to `CabinetSidebar.svelte` under Content group:
```
{ label: 'Market Indices', href: '/admin/market-indices' }
```

---

## Section 4 — Public Widget on `/investment`

**Placement:** Between the trust bar and the pool listings grid.

**Tab navigation (by market):**
`Global · Europe · Cyprus · Georgia · Dubai · Turkey`

Each tab shows the active `MarketIndex` for that market (one per tab).

### Index card layout
```
[Symbol badge]  Index Name                    [+2.34%]  ← green/red
                Current close price

[SVG Line Chart — full width, 20-year history]
Period: [ 1Y ] [ 5Y ] [ 10Y ] [ MAX ]

[✦ AI Analysis button]
  ↓ expands to:
  — What this instrument is
  — Current market context
  — How Develta investment differs
  — CTA: "Get this analysis in your inbox" → /register
```

### AI panel — auth gating
- **Logged in:** Full AI response
- **Not logged in:** First 2 lines visible, rest blurred + "Register free to read full analysis"

### Chart behaviour
- 2008–2009 zone highlighted with a subtle red background band (hardcoded date range)
- Period filter slices `$derived` array of prices
- Hover tooltip: date + close price
- Line color from `MarketIndex.color`
- Pure SVG, no chart library

---

## Section 5 — API Endpoint

**`POST /api/market/ai-insight`**

Request: `{ indexId: string }`

Server logic:
1. Load `MarketIndex` + last 30 `DailyPrice` rows
2. Calculate: current price, YTD change, 1Y change, 5Y change
3. Check cache: `AiResponseCache` key = `market_insight_${indexId}_${today}`
4. If miss: call `callAI()` with prompt containing instrument info + price context + Develta comparison angle
5. Return `{ what, context, comparison, cached: boolean }`

AI prompt structure:
```
You are a real estate investment analyst for Develta, a Cyprus-based platform.

Instrument: {name} ({symbol}), {market} market
Current close: {close} | 1Y change: {1yPct}% | 5Y change: {5yPct}%
YTD: {ytdPct}%

Respond in JSON:
{
  "what": "2-3 sentence explanation of what this instrument represents",
  "context": "2-3 sentence current market context",
  "comparison": "2-3 sentence why direct real estate investment via Develta offers different risk/return"
}
```

Response cached 24h. Works for both authenticated and unauthenticated (same content, gating is client-side).

---

## Section 6 — Chart Component

**`src/lib/components/market/MarketChart.svelte`**

Props:
```ts
prices: { date: string; close: number }[]
color?: string   // default '#7a8c6e'
period?: '1Y' | '5Y' | '10Y' | 'MAX'  // default 'MAX'
```

Implementation:
- SVG with `viewBox="0 0 800 200"`, `preserveAspectRatio="none"` for responsiveness
- Scales: min/max of `close` values → Y axis; date range → X axis
- Polyline path from normalised points
- Red band rect behind 2008-01-01 → 2009-12-31 range
- Hover: invisible rect overlay + `mousemove` → tooltip with date + price
- No external dependencies

---

## File Map

| File | Action |
|------|--------|
| `prisma/schema.prisma` | Add `MarketIndex`, `IndexComponent`, `DailyPrice` |
| `src/lib/server/market/sync.ts` | New — sync service |
| `src/routes/api/market/sync/+server.ts` | New — cron trigger endpoint |
| `src/routes/api/market/ai-insight/+server.ts` | New — AI analysis endpoint |
| `src/routes/(cabinet)/admin/market-indices/+page.server.ts` | New |
| `src/routes/(cabinet)/admin/market-indices/+page.svelte` | New |
| `src/lib/components/market/MarketChart.svelte` | New |
| `src/routes/(marketing)/investment/+page.svelte` | Modify — add widget section |
| `src/routes/(marketing)/investment/+page.server.ts` | Modify — load MarketIndex + DailyPrice |
| `src/lib/components/cabinet/CabinetSidebar.svelte` | Modify — add Market Indices link |
| `.env` | Add `TWELVE_DATA_API_KEY=` |
