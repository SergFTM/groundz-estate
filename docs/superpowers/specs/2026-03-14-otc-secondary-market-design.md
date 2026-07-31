# OTC Secondary Market — Design Spec

**Goal:** Add an OTC secondary market where investors and buyers can list investment shares, option contracts, or apartments for early sale, and logged-in counterparties can submit price offers that the seller accepts or declines — with ownership transfer executed in-platform on deal close.

**Architecture:** Unified `OtcListing` + `OtcOffer` Prisma models (2 new tables). Public marketplace at `/otc` (browseable without login, offers require login). Admin moderation gate before listings go live. Ownership transfer runs in a DB transaction on offer accept. Service layer in `src/lib/server/otc/service.ts`.

**Tech Stack:** SvelteKit, Prisma/SQLite, Svelte 5 runes, existing auth via `locals.user`, existing CSS design system.

---

## Section 1 — Data Models

### `OtcListing`

```prisma
model OtcListing {
  id           String    @id @default(uuid())
  sellerId     String
  assetType    String    // investment_share | option_contract | apartment
  investmentId String?   // → InvestorInvestment.id (for investment_share)
  unitId       String?   // → Unit.id (for option_contract | apartment)
  title        String
  description  String?
  askPrice     Float
  currency     String    @default("EUR")
  status       String    @default("pending")
  // status values: pending | active | sold | cancelled | rejected
  adminNote    String?
  expiresAt    DateTime?
  createdAt    DateTime  @default(now())
  updatedAt    DateTime  @default(now()) @updatedAt

  seller       User                @relation("OtcSeller", fields: [sellerId], references: [id])
  investment   InvestorInvestment? @relation("InvestmentOtcListings", fields: [investmentId], references: [id], onDelete: SetNull)
  unit         Unit?               @relation("UnitOtcListings", fields: [unitId], references: [id], onDelete: SetNull)
  offers       OtcOffer[]
}
```

### `OtcOffer`

```prisma
model OtcOffer {
  id        String     @id @default(uuid())
  listingId String
  buyerId   String
  amount    Float
  message   String?
  status    String     @default("pending")
  // status values: pending | accepted | declined
  createdAt DateTime   @default(now())
  updatedAt DateTime   @default(now()) @updatedAt

  listing   OtcListing @relation(fields: [listingId], references: [id], onDelete: Cascade)
  buyer     User       @relation("OtcBuyer", fields: [buyerId], references: [id])
}
```

### Back-relations to add on existing models

These fields must be added to the existing model definitions in `schema.prisma`:

**`User` model** — add:
```prisma
  otcListings  OtcListing[] @relation("OtcSeller")
  otcOffers    OtcOffer[]   @relation("OtcBuyer")
```

**`InvestorInvestment` model** — add:
```prisma
  otcListings  OtcListing[] @relation("InvestmentOtcListings")
```

**`Unit` model** — add:
```prisma
  otcListings  OtcListing[] @relation("UnitOtcListings")
```

### Status lifecycle

`pending` → admin approves → `active` → offer accepted → `sold`; or seller/admin cancels → `cancelled`; or admin rejects → `rejected`.

### Asset type constraints (enforced in service layer)
- `investment_share`: `investmentId` required, `unitId` null. Seller must be `InvestorInvestment.userId`.
- `option_contract` / `apartment`: `unitId` required, `investmentId` null. Seller must be `Unit.buyerId`.

### One-pending-offer constraint
A buyer cannot have more than one `pending` offer per listing. This is a **service-layer-only guard** (SQLite does not support partial unique indexes via Prisma). Before creating an offer, the service must run:
```ts
const existing = await db.otcOffer.findFirst({
  where: { listingId, buyerId, status: 'pending' }
});
if (existing) throw new Error('You already have a pending offer on this listing');
```

---

## Section 2 — Service Layer

**File:** `src/lib/server/otc/service.ts`

### `createListing(sellerId, input)`
1. Validate `assetType` is one of the three valid values
2. If `investment_share`: load `InvestorInvestment`, verify `userId === sellerId`
3. If `option_contract` or `apartment`: load `Unit`, verify `buyerId === sellerId`
4. Check no other `active` or `pending` listing exists for the same asset (one listing per asset at a time):
   - If `investment_share`: `db.otcListing.findFirst({ where: { investmentId: input.investmentId, status: { in: ['pending', 'active'] } } })`
   - If `option_contract`/`apartment`: `db.otcListing.findFirst({ where: { unitId: input.unitId, status: { in: ['pending', 'active'] } } })`
5. Create `OtcListing` with `status: 'pending'`
6. Return created listing

### `acceptOffer(offerId, sellerId)`
Runs in `db.$transaction`:
1. Load offer with listing (`include: { listing: true }`), verify listing `sellerId === sellerId`, listing `status === 'active'`, offer `status === 'pending'`
2. Update offer → `accepted`
3. Update all other offers on listing → `declined`
4. Update listing → `sold`
5. Transfer ownership — **null guard required**: if the asset FK is null (e.g., underlying record was deleted via `onDelete: SetNull`), abort the transaction with an error:
   - If `investment_share` and `listing.investmentId != null`: `db.investorInvestment.update({ where: { id: listing.investmentId }, data: { userId: offer.buyerId } })`
   - If `option_contract` or `apartment` and `listing.unitId != null`: `db.unit.update({ where: { id: listing.unitId }, data: { buyerId: offer.buyerId } })`
   - If the required FK is null: throw `new Error('Asset no longer exists; cannot transfer ownership')`
6. Return updated listing

### `declineOffer(offerId, sellerId)`
1. Load offer with listing; verify `listing.sellerId === sellerId`, offer `status === 'pending'`
2. Update offer → `declined`
3. Return updated offer

### `approveListing(listingId)` / `rejectListing(listingId, note)`
Admin-only. Update `status` to `active` or `rejected` (+ `adminNote`).

### `cancelListing(listingId, actorId, actorRole)`
1. Load `OtcListing` by `listingId`; throw 404 if not found
2. Verify `status` is `pending` or `active`; throw if already terminal (`sold`, `cancelled`, `rejected`)
3. Verify `actorId === listing.sellerId` OR `actorRole === 'internal_team'`; throw 403 otherwise
4. Update listing → `cancelled`
5. Return updated listing

---

## Section 3 — API Endpoints

All under `src/routes/api/otc/`.

| File | Method | Auth | Purpose |
|------|--------|------|---------|
| `listings/+server.ts` | GET | public | Paginated listings (filter: `assetType`, `status=active`) |
| `listings/+server.ts` | POST | logged in | Create listing; calls `createListing()` |
| `listings/[id]/+server.ts` | GET | public | Single listing detail with asset summary |
| `listings/[id]/+server.ts` | DELETE | seller or internal_team | Cancel listing; calls `cancelListing()` |
| `offers/+server.ts` | POST | logged in (not seller) | Submit offer on listing |
| `offers/[id]/accept/+server.ts` | POST | seller only | Accept offer; calls `acceptOffer()` |
| `offers/[id]/decline/+server.ts` | POST | seller only | Decline offer |
| `admin/listings/+server.ts` | GET | internal_team | All listings (filter by status) |
| `admin/listings/[id]/approve/+server.ts` | POST | internal_team | Approve pending listing |
| `admin/listings/[id]/reject/+server.ts` | POST | internal_team | Reject with `adminNote` |

**`GET /api/otc/admin/listings`** include shape (adds seller identity for the Pending tab "Seller" column):
```ts
{
  include: {
    seller: { select: { name: true, email: true } },
    investment: { include: { pool: { select: { name: true } } } },
    unit: { select: { code: true, floor: true, areaSqm: true } },
    _count: { select: { offers: true } }
  }
}
```

**Note:** Admin cancel reuses the same `DELETE listings/[id]/+server.ts` endpoint. The endpoint calls `cancelListing(id, user.id, user.role)` which accepts both seller and `internal_team` actors.

**GET `/api/otc/listings`** query includes:
```ts
{
  include: {
    investment: { include: { pool: { select: { name: true } } } },
    unit: { select: { code: true, floor: true, areaSqm: true, project: { select: { name: true } } } },
    _count: { select: { offers: true } }
  }
}
```

`assetSummary` construction:
- `investment_share`: `"${listing.investment.pool.name} — €${listing.investment.amount.toLocaleString()} committed"`
- `option_contract` / `apartment`: `"Unit ${listing.unit.code}, Floor ${listing.unit.floor}, ${listing.unit.areaSqm}m²"`

**GET `/api/otc/listings`** response shape:
```ts
{
  listings: Array<{
    id: string;
    assetType: string;
    title: string;
    askPrice: number;
    currency: string;
    status: string;
    createdAt: string;
    assetSummary: string; // e.g. "Marina Heights — €25,000 committed" or "Unit 3B, Floor 4, 72m²"
    offerCount: number;
  }>;
  total: number;
}
```

---

## Section 4 — Public Marketplace (`/otc`)

**Route:** `src/routes/(marketing)/otc/`

### Server load
- Load all `active` listings with `_count: { offers: true }` and the include shape defined in Section 3
- Filter out listings where `expiresAt` is not null and `expiresAt < new Date()` (treat as soft-expired but do not auto-cancel — expiry is informational in this version)
- Support `?type=` query param filter (investment_share | option_contract | apartment)
- No auth required

### Page layout
```
[OTC SECONDARY MARKET]
Early-exit liquidity for Groundz investors and buyers

[All] [Investment Shares] [Option Contracts] [Apartments]   ← filter tabs

[Listing Card Grid — 3 columns]
  ┌─────────────────────────────────┐
  │ INVESTMENT SHARE                │  ← asset type badge
  │ Title of Listing                │
  │ Asset: Equity Pool stake        │
  │ Ask: €45,000                    │
  │ 3 offers · listed 2 days ago    │
  │ [View & Make Offer →]           │
  └─────────────────────────────────┘

[Not logged in → register CTA at bottom]
"Register free to submit offers on any listing →"
```

---

## Section 5 — Listing Detail (`/otc/[id]`)

**Route:** `src/routes/(marketing)/otc/[id]/`

**Scope:** This is a public marketing route showing only `active` listings. Sellers view their non-active listings exclusively through their cabinet pages (`/investor/otc` or `/buyer/otc`).

### Server load
- Load `OtcListing` by id; 404 if not found or `status !== 'active'`
- Include asset detail using the include shape from Section 3
- If logged in: include `locals.user.id` to detect seller vs. buyer view
- If logged in and is buyer (not seller): include buyer's own offers on this listing

### Page — buyer view (logged in, not seller)
```
[INVESTMENT SHARE]
Title of listing
Asset: Equity Pool "Marina Heights" — €25,000 committed

Description (if any)

Ask price: €45,000

[Make an Offer]
  Amount (€): [_______]
  Message (optional): [_______]
  [Submit Offer]

My offers on this listing:
  €42,000 · pending · submitted 1 day ago
```

### Page — seller view (logged in, is seller)
```
[My Listing — ACTIVE]
Title of listing
Asset: ...
Ask price: €45,000

Received Offers (3):
  €42,000 · "I'm a long-term investor" · [Accept] [Decline]
  €40,000 · — · [Accept] [Decline]
  €38,000 · — · [Accept] [Decline]

[Cancel Listing]
```

### Page — public (not logged in)
Shows listing info + ask price. Offer form replaced with:
> "Log in or register to submit an offer"

---

## Section 6 — Seller Cabinet Pages

### Investor cabinet (`/investor/otc`)
**File:** `src/routes/(cabinet)/investor/otc/`
- "My Listings" tab: list of investor's OTC listings with status badge, offer count, Cancel button (all statuses — pending, active, sold, cancelled, rejected)
- "Create Listing" inline form: select which `InvestorInvestment` to list (dropdown of their funded investments), title, description, ask price, optional expiry
- "My Offers" tab: offers the investor submitted as a buyer, their status

### Buyer cabinet (`/buyer/otc`)
**File:** `src/routes/(cabinet)/buyer/otc/`
- Same structure but "Create Listing" lets buyer select which `Unit` (where `buyerId === user.id`) to list

### Navigation additions
- `src/routes/(cabinet)/+layout.svelte` `investorTabs` array: add `{ label: 'Secondary Market', href: '/investor/otc' }`
- `src/routes/(cabinet)/+layout.svelte` `buyerTabs` array: add `{ label: 'Secondary Market', href: '/buyer/otc' }`

Note: investor and buyer use `CabinetTabs` (tab arrays in `+layout.svelte`), **not** `CabinetSidebar`.

---

## Section 7 — Admin Panel (`/admin/otc`)

**Route:** `src/routes/(cabinet)/admin/otc/`

**Files:**
- `+page.server.ts` — loads listings grouped by status; named form actions: `approve`, `reject`
- `+page.svelte` — two tabs: Pending (awaiting approval) and All listings

### Pending tab
Table: Title · Asset Type · Seller · Ask Price · Created · Actions (Approve / Reject+Note)

### All listings tab
Table: Title · Status · Asset Type · Ask Price · Offers · Created · Admin Cancel button (calls `DELETE /api/otc/listings/[id]`)

### Sidebar
Add to `src/lib/components/cabinet/CabinetSidebar.svelte` under Content group (after Market Indices):
```ts
{ label: 'OTC Market', href: '/admin/otc' }
```

---

## File Map

| File | Action |
|------|--------|
| `prisma/schema.prisma` | Add `OtcListing`, `OtcOffer`; add back-relations to `User`, `InvestorInvestment`, `Unit` |
| `src/lib/server/otc/service.ts` | New — `createListing`, `acceptOffer`, `declineOffer`, `approveListing`, `rejectListing`, `cancelListing` |
| `src/routes/api/otc/listings/+server.ts` | New — GET (public browse), POST (create) |
| `src/routes/api/otc/listings/[id]/+server.ts` | New — GET (detail), DELETE (cancel — seller or admin) |
| `src/routes/api/otc/offers/+server.ts` | New — POST (submit offer) |
| `src/routes/api/otc/offers/[id]/accept/+server.ts` | New — POST (accept + transfer) |
| `src/routes/api/otc/offers/[id]/decline/+server.ts` | New — POST (decline) |
| `src/routes/api/otc/admin/listings/+server.ts` | New — GET (admin list) |
| `src/routes/api/otc/admin/listings/[id]/approve/+server.ts` | New — POST |
| `src/routes/api/otc/admin/listings/[id]/reject/+server.ts` | New — POST |
| `src/routes/(marketing)/otc/+page.server.ts` | New — public marketplace load |
| `src/routes/(marketing)/otc/+page.svelte` | New — marketplace with type filter tabs |
| `src/routes/(marketing)/otc/[id]/+page.server.ts` | New — listing detail load (active only) |
| `src/routes/(marketing)/otc/[id]/+page.svelte` | New — detail with buyer/seller/public views |
| `src/routes/(cabinet)/investor/otc/+page.server.ts` | New — investor seller/buyer cabinet |
| `src/routes/(cabinet)/investor/otc/+page.svelte` | New |
| `src/routes/(cabinet)/buyer/otc/+page.server.ts` | New — buyer seller cabinet |
| `src/routes/(cabinet)/buyer/otc/+page.svelte` | New |
| `src/routes/(cabinet)/admin/otc/+page.server.ts` | New — admin moderation |
| `src/routes/(cabinet)/admin/otc/+page.svelte` | New |
| `src/routes/(cabinet)/+layout.svelte` | Modify — add Secondary Market tab to `investorTabs` and `buyerTabs` arrays |
| `src/lib/components/cabinet/CabinetSidebar.svelte` | Modify — add OTC Market to Content group (admin sidebar only) |
