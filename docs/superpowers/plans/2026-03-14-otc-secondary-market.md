# OTC Secondary Market Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build an OTC secondary market where investors and buyers list assets for early sale, counterparties submit price offers, and ownership transfers atomically on deal close.

**Architecture:** Two new Prisma models (`OtcListing`, `OtcOffer`), a service layer handling all business logic and transactional ownership transfer, 10 API endpoints, public marketplace at `/otc`, seller cabinet pages for investor/buyer roles, and an admin moderation panel.

**Tech Stack:** SvelteKit 2, Prisma/SQLite (better-sqlite3), Svelte 5 runes (`$state`, `$derived`, `$props`, `$effect`), existing `requireAuth`/`requireRole` guards, existing CSS design tokens (no Tailwind), `enhance` from `$app/forms` for form actions.

**Spec:** `docs/superpowers/specs/2026-03-14-otc-secondary-market-design.md`

**Verification:** No test runner configured. Verify each task with `npx svelte-check --tsconfig ./tsconfig.json` (zero new errors) plus browser smoke test on `npm run dev`.

---

## Chunk 1: DB + Service

### Task 1: Prisma Schema — Add OtcListing, OtcOffer, back-relations

**Files:**
- Modify: `prisma/schema.prisma`

- [ ] **Step 1: Add back-relations to existing models**

Open `prisma/schema.prisma`. Find the `User` model (starts at line 10). Add these two lines inside the model body after the existing relations:

```prisma
  otcListings  OtcListing[] @relation("OtcSeller")
  otcOffers    OtcOffer[]   @relation("OtcBuyer")
```

Find the `Unit` model. Add inside the model body:

```prisma
  otcListings  OtcListing[] @relation("UnitOtcListings")
```

Find the `InvestorInvestment` model (around line 188). Add inside the model body:

```prisma
  otcListings  OtcListing[] @relation("InvestmentOtcListings")
```

- [ ] **Step 2: Append the two new models at the end of the file**

```prisma
model OtcListing {
  id           String    @id @default(uuid())
  sellerId     String
  assetType    String    // investment_share | option_contract | apartment
  investmentId String?   // → InvestorInvestment.id
  unitId       String?   // → Unit.id
  title        String
  description  String?
  askPrice     Float
  currency     String    @default("EUR")
  status       String    @default("pending")
  // pending | active | sold | cancelled | rejected
  adminNote    String?
  expiresAt    DateTime?
  createdAt    DateTime  @default(now())
  updatedAt    DateTime  @default(now()) @updatedAt

  seller     User                @relation("OtcSeller", fields: [sellerId], references: [id])
  investment InvestorInvestment? @relation("InvestmentOtcListings", fields: [investmentId], references: [id], onDelete: SetNull)
  unit       Unit?               @relation("UnitOtcListings", fields: [unitId], references: [id], onDelete: SetNull)
  offers     OtcOffer[]
}

model OtcOffer {
  id        String     @id @default(uuid())
  listingId String
  buyerId   String
  amount    Float
  message   String?
  status    String     @default("pending")
  // pending | accepted | declined
  createdAt DateTime   @default(now())
  updatedAt DateTime   @default(now()) @updatedAt

  listing OtcListing @relation(fields: [listingId], references: [id], onDelete: Cascade)
  buyer   User       @relation("OtcBuyer", fields: [buyerId], references: [id])
}
```

- [ ] **Step 3: Run migration**

```bash
npx prisma migrate dev --name add-otc-market
```

Expected: "Your database is now in sync with your schema."

- [ ] **Step 4: Regenerate the Prisma client**

```bash
npx prisma generate
```

Expected: "Generated Prisma Client" with no errors.

- [ ] **Step 5: Verify TypeScript still compiles**

```bash
npx svelte-check --tsconfig ./tsconfig.json 2>&1 | tail -5
```

Expected: 0 errors (pre-existing warnings are OK).

- [ ] **Step 6: Commit**

```bash
git add prisma/schema.prisma prisma/migrations/
git commit -m "feat(otc): add OtcListing and OtcOffer Prisma models"
```

---

### Task 2: Service Layer — src/lib/server/otc/service.ts

**Files:**
- Create: `src/lib/server/otc/service.ts`

- [ ] **Step 1: Create directory and file**

```bash
mkdir -p src/lib/server/otc
```

- [ ] **Step 2: Write service.ts**

```typescript
// src/lib/server/otc/service.ts
import db from '$lib/server/db.js';

const VALID_ASSET_TYPES = ['investment_share', 'option_contract', 'apartment'] as const;
type AssetType = (typeof VALID_ASSET_TYPES)[number];

// ─── Asset summary helper ────────────────────────────────────────────────────

type ListingWithAsset = {
  assetType: string;
  investment: { amount: number; pool: { name: string } } | null;
  unit: { code: string; floor: number; areaSqm: number } | null;
};

export function buildAssetSummary(l: ListingWithAsset): string {
  if (l.assetType === 'investment_share' && l.investment) {
    return `${l.investment.pool.name} — €${l.investment.amount.toLocaleString('en')} committed`;
  }
  if (l.unit) {
    return `Unit ${l.unit.code}, Floor ${l.unit.floor}, ${l.unit.areaSqm}m²`;
  }
  return '—';
}

// ─── Include shapes ──────────────────────────────────────────────────────────

export const LISTING_ASSET_INCLUDE = {
  investment: { include: { pool: { select: { name: true } } } },
  unit: { select: { code: true, floor: true, areaSqm: true, project: { select: { name: true } } } },
  _count: { select: { offers: true } },
} as const;

export const ADMIN_LISTING_INCLUDE = {
  seller: { select: { name: true, email: true } },
  investment: { include: { pool: { select: { name: true } } } },
  unit: { select: { code: true, floor: true, areaSqm: true } },
  _count: { select: { offers: true } },
} as const;

// ─── createListing ───────────────────────────────────────────────────────────

export interface CreateListingInput {
  assetType: string;
  investmentId?: string;
  unitId?: string;
  title: string;
  description?: string;
  askPrice: number;
  currency?: string;
  expiresAt?: Date;
}

export async function createListing(sellerId: string, input: CreateListingInput) {
  if (!VALID_ASSET_TYPES.includes(input.assetType as AssetType)) {
    throw new Error('Invalid assetType');
  }

  if (input.assetType === 'investment_share') {
    if (!input.investmentId) throw new Error('investmentId required for investment_share');
    const inv = await db.investorInvestment.findUnique({ where: { id: input.investmentId } });
    if (!inv || inv.userId !== sellerId) throw new Error('Investment not found or not owned by seller');
    const existing = await db.otcListing.findFirst({
      where: { investmentId: input.investmentId, status: { in: ['pending', 'active'] } },
    });
    if (existing) throw new Error('A listing already exists for this investment');
  } else {
    if (!input.unitId) throw new Error('unitId required for option_contract/apartment');
    const unit = await db.unit.findUnique({ where: { id: input.unitId } });
    if (!unit || unit.buyerId !== sellerId) throw new Error('Unit not found or not owned by seller');
    const existing = await db.otcListing.findFirst({
      where: { unitId: input.unitId, status: { in: ['pending', 'active'] } },
    });
    if (existing) throw new Error('A listing already exists for this unit');
  }

  return db.otcListing.create({
    data: {
      sellerId,
      assetType: input.assetType,
      investmentId: input.investmentId ?? null,
      unitId: input.unitId ?? null,
      title: input.title,
      description: input.description ?? null,
      askPrice: input.askPrice,
      currency: input.currency ?? 'EUR',
      expiresAt: input.expiresAt ?? null,
      status: 'pending',
    },
  });
}

// ─── acceptOffer ─────────────────────────────────────────────────────────────

export async function acceptOffer(offerId: string, sellerId: string) {
  return db.$transaction(async (tx) => {
    const offer = await tx.otcOffer.findUnique({
      where: { id: offerId },
      include: { listing: true },
    });
    if (!offer) throw new Error('Offer not found');
    if (offer.listing.sellerId !== sellerId) throw new Error('Forbidden');
    if (offer.listing.status !== 'active') throw new Error('Listing is not active');
    if (offer.status !== 'pending') throw new Error('Offer is not pending');

    await tx.otcOffer.update({ where: { id: offerId }, data: { status: 'accepted' } });
    await tx.otcOffer.updateMany({
      where: { listingId: offer.listingId, id: { not: offerId }, status: 'pending' },
      data: { status: 'declined' },
    });
    await tx.otcListing.update({ where: { id: offer.listingId }, data: { status: 'sold' } });

    if (offer.listing.assetType === 'investment_share') {
      if (!offer.listing.investmentId)
        throw new Error('Asset no longer exists; cannot transfer ownership');
      await tx.investorInvestment.update({
        where: { id: offer.listing.investmentId },
        data: { userId: offer.buyerId },
      });
    } else {
      if (!offer.listing.unitId)
        throw new Error('Asset no longer exists; cannot transfer ownership');
      await tx.unit.update({
        where: { id: offer.listing.unitId },
        data: { buyerId: offer.buyerId },
      });
    }

    return tx.otcListing.findUnique({ where: { id: offer.listingId } });
  });
}

// ─── declineOffer ────────────────────────────────────────────────────────────

export async function declineOffer(offerId: string, sellerId: string) {
  const offer = await db.otcOffer.findUnique({
    where: { id: offerId },
    include: { listing: { select: { sellerId: true } } },
  });
  if (!offer) throw new Error('Offer not found');
  if (offer.listing.sellerId !== sellerId) throw new Error('Forbidden');
  if (offer.status !== 'pending') throw new Error('Offer is not pending');
  return db.otcOffer.update({ where: { id: offerId }, data: { status: 'declined' } });
}

// ─── approveListing / rejectListing ──────────────────────────────────────────

export async function approveListing(listingId: string) {
  return db.otcListing.update({ where: { id: listingId }, data: { status: 'active' } });
}

export async function rejectListing(listingId: string, note: string) {
  return db.otcListing.update({
    where: { id: listingId },
    data: { status: 'rejected', adminNote: note },
  });
}

// ─── cancelListing ───────────────────────────────────────────────────────────

export async function cancelListing(listingId: string, actorId: string, actorRole: string) {
  const listing = await db.otcListing.findUnique({ where: { id: listingId } });
  if (!listing) throw new Error('Listing not found');
  if (!['pending', 'active'].includes(listing.status)) {
    throw new Error('Cannot cancel a listing in terminal status');
  }
  if (listing.sellerId !== actorId && actorRole !== 'internal_team') {
    throw new Error('Forbidden');
  }
  return db.otcListing.update({ where: { id: listingId }, data: { status: 'cancelled' } });
}
```

- [ ] **Step 3: Verify TypeScript**

```bash
npx svelte-check --tsconfig ./tsconfig.json 2>&1 | tail -5
```

Expected: 0 errors.

- [ ] **Step 4: Commit**

```bash
git add src/lib/server/otc/service.ts
git commit -m "feat(otc): add service layer with createListing, acceptOffer, declineOffer, cancel, approve/reject"
```

---

## Chunk 2: API Endpoints

### Task 3: GET + POST /api/otc/listings

**Files:**
- Create: `src/routes/api/otc/listings/+server.ts`

- [ ] **Step 1: Create directories**

```bash
mkdir -p src/routes/api/otc/listings
```

- [ ] **Step 2: Write the file**

```typescript
// src/routes/api/otc/listings/+server.ts
import { json } from '@sveltejs/kit';
import db from '$lib/server/db.js';
import { createListing, buildAssetSummary, LISTING_ASSET_INCLUDE } from '$lib/server/otc/service.js';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ url }) => {
  const assetType = url.searchParams.get('type') ?? '';
  const page = Math.max(1, parseInt(url.searchParams.get('page') ?? '1'));
  const limit = 20;
  const offset = (page - 1) * limit;
  const now = new Date();

  const where = {
    status: 'active' as const,
    ...(assetType ? { assetType } : {}),
    OR: [{ expiresAt: null }, { expiresAt: { gt: now } }],
  };

  const [listings, total] = await Promise.all([
    db.otcListing.findMany({
      where,
      include: LISTING_ASSET_INCLUDE,
      orderBy: { createdAt: 'desc' },
      skip: offset,
      take: limit,
    }),
    db.otcListing.count({ where }),
  ]);

  return json({
    listings: listings.map((l) => ({
      id: l.id,
      assetType: l.assetType,
      title: l.title,
      askPrice: l.askPrice,
      currency: l.currency,
      status: l.status,
      createdAt: l.createdAt.toISOString(),
      assetSummary: buildAssetSummary(l),
      offerCount: l._count.offers,
    })),
    total,
  });
};

export const POST: RequestHandler = async ({ request, locals }) => {
  if (!locals.user) return json({ error: 'Unauthorized' }, { status: 401 });

  const body = await request.json().catch(() => null);
  if (!body) return json({ error: 'Invalid JSON' }, { status: 400 });

  try {
    const listing = await createListing(locals.user.id, {
      assetType: body.assetType,
      investmentId: body.investmentId,
      unitId: body.unitId,
      title: body.title,
      description: body.description,
      askPrice: Number(body.askPrice),
      currency: body.currency,
      expiresAt: body.expiresAt ? new Date(body.expiresAt) : undefined,
    });
    return json(listing, { status: 201 });
  } catch (err) {
    return json({ error: err instanceof Error ? err.message : 'Error' }, { status: 400 });
  }
};
```

- [ ] **Step 3: Verify**

```bash
npx svelte-check --tsconfig ./tsconfig.json 2>&1 | tail -5
```

Expected: 0 errors.

---

### Task 4: GET + DELETE /api/otc/listings/[id]

**Files:**
- Create: `src/routes/api/otc/listings/[id]/+server.ts`

- [ ] **Step 1: Create directory**

```bash
mkdir -p "src/routes/api/otc/listings/[id]"
```

- [ ] **Step 2: Write the file**

```typescript
// src/routes/api/otc/listings/[id]/+server.ts
import { json } from '@sveltejs/kit';
import db from '$lib/server/db.js';
import { cancelListing, buildAssetSummary, LISTING_ASSET_INCLUDE } from '$lib/server/otc/service.js';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ params }) => {
  const listing = await db.otcListing.findUnique({
    where: { id: params.id },
    include: {
      ...LISTING_ASSET_INCLUDE,
      offers: {
        orderBy: { amount: 'desc' },
        select: { id: true, amount: true, message: true, status: true, buyerId: true, createdAt: true },
      },
    },
  });

  if (!listing) return json({ error: 'Not found' }, { status: 404 });

  return json({
    ...listing,
    assetSummary: buildAssetSummary(listing),
    createdAt: listing.createdAt.toISOString(),
    updatedAt: listing.updatedAt.toISOString(),
  });
};

export const DELETE: RequestHandler = async ({ params, locals }) => {
  if (!locals.user) return json({ error: 'Unauthorized' }, { status: 401 });

  try {
    await cancelListing(params.id, locals.user.id, locals.user.role);
    return json({ ok: true });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Error';
    const status = msg === 'Listing not found' ? 404 : msg === 'Forbidden' ? 403 : 400;
    return json({ error: msg }, { status });
  }
};
```

- [ ] **Step 3: Verify**

```bash
npx svelte-check --tsconfig ./tsconfig.json 2>&1 | tail -5
```

---

### Task 5: POST /api/otc/offers (submit offer)

**Files:**
- Create: `src/routes/api/otc/offers/+server.ts`

- [ ] **Step 1: Create directory**

```bash
mkdir -p src/routes/api/otc/offers
```

- [ ] **Step 2: Write the file**

```typescript
// src/routes/api/otc/offers/+server.ts
import { json } from '@sveltejs/kit';
import db from '$lib/server/db.js';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request, locals }) => {
  if (!locals.user) return json({ error: 'Unauthorized' }, { status: 401 });

  const body = await request.json().catch(() => null);
  if (!body?.listingId || !body?.amount) {
    return json({ error: 'listingId and amount required' }, { status: 400 });
  }

  const listing = await db.otcListing.findUnique({ where: { id: body.listingId } });
  if (!listing || listing.status !== 'active') {
    return json({ error: 'Listing not found or not active' }, { status: 404 });
  }
  if (listing.sellerId === locals.user.id) {
    return json({ error: 'Seller cannot submit an offer on their own listing' }, { status: 400 });
  }

  // One-pending-offer guard
  const existing = await db.otcOffer.findFirst({
    where: { listingId: body.listingId, buyerId: locals.user.id, status: 'pending' },
  });
  if (existing) {
    return json({ error: 'You already have a pending offer on this listing' }, { status: 400 });
  }

  const offer = await db.otcOffer.create({
    data: {
      listingId: body.listingId,
      buyerId: locals.user.id,
      amount: Number(body.amount),
      message: body.message ?? null,
    },
  });

  return json(offer, { status: 201 });
};
```

- [ ] **Step 3: Verify**

```bash
npx svelte-check --tsconfig ./tsconfig.json 2>&1 | tail -5
```

---

### Task 6: POST /api/otc/offers/[id]/accept

**Files:**
- Create: `src/routes/api/otc/offers/[id]/accept/+server.ts`

- [ ] **Step 1: Create directories**

```bash
mkdir -p "src/routes/api/otc/offers/[id]/accept"
```

- [ ] **Step 2: Write the file**

```typescript
// src/routes/api/otc/offers/[id]/accept/+server.ts
import { json } from '@sveltejs/kit';
import { acceptOffer } from '$lib/server/otc/service.js';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ params, locals }) => {
  if (!locals.user) return json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const listing = await acceptOffer(params.id, locals.user.id);
    return json({ ok: true, listing });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Error';
    const status = msg === 'Offer not found' ? 404 : msg === 'Forbidden' ? 403 : 400;
    return json({ error: msg }, { status });
  }
};
```

- [ ] **Step 3: Create /decline endpoint**

```bash
mkdir -p "src/routes/api/otc/offers/[id]/decline"
```

Create `src/routes/api/otc/offers/[id]/decline/+server.ts`:

```typescript
// src/routes/api/otc/offers/[id]/decline/+server.ts
import { json } from '@sveltejs/kit';
import { declineOffer } from '$lib/server/otc/service.js';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ params, locals }) => {
  if (!locals.user) return json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const offer = await declineOffer(params.id, locals.user.id);
    return json({ ok: true, offer });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Error';
    const status = msg === 'Offer not found' ? 404 : msg === 'Forbidden' ? 403 : 400;
    return json({ error: msg }, { status });
  }
};
```

- [ ] **Step 4: Verify**

```bash
npx svelte-check --tsconfig ./tsconfig.json 2>&1 | tail -5
```

- [ ] **Step 5: Commit endpoints so far**

```bash
git add src/routes/api/otc/
git commit -m "feat(otc): add offer + listing API endpoints"
```

---

### Task 7: Admin API endpoints

**Files:**
- Create: `src/routes/api/otc/admin/listings/+server.ts`
- Create: `src/routes/api/otc/admin/listings/[id]/approve/+server.ts`
- Create: `src/routes/api/otc/admin/listings/[id]/reject/+server.ts`

- [ ] **Step 1: Create directories**

```bash
mkdir -p src/routes/api/otc/admin/listings
mkdir -p "src/routes/api/otc/admin/listings/[id]/approve"
mkdir -p "src/routes/api/otc/admin/listings/[id]/reject"
```

- [ ] **Step 2: Write admin listings GET**

```typescript
// src/routes/api/otc/admin/listings/+server.ts
import { json } from '@sveltejs/kit';
import db from '$lib/server/db.js';
import { ADMIN_LISTING_INCLUDE } from '$lib/server/otc/service.js';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ url, locals }) => {
  if (locals.user?.role !== 'internal_team') {
    return json({ error: 'Forbidden' }, { status: 403 });
  }

  const status = url.searchParams.get('status') ?? '';

  const listings = await db.otcListing.findMany({
    where: status ? { status } : {},
    include: ADMIN_LISTING_INCLUDE,
    orderBy: { createdAt: 'desc' },
  });

  return json({ listings });
};
```

- [ ] **Step 3: Write approve endpoint**

```typescript
// src/routes/api/otc/admin/listings/[id]/approve/+server.ts
import { json } from '@sveltejs/kit';
import { approveListing } from '$lib/server/otc/service.js';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ params, locals }) => {
  if (locals.user?.role !== 'internal_team') {
    return json({ error: 'Forbidden' }, { status: 403 });
  }
  try {
    const listing = await approveListing(params.id);
    return json({ ok: true, listing });
  } catch (err) {
    return json({ error: err instanceof Error ? err.message : 'Error' }, { status: 400 });
  }
};
```

- [ ] **Step 4: Write reject endpoint**

```typescript
// src/routes/api/otc/admin/listings/[id]/reject/+server.ts
import { json } from '@sveltejs/kit';
import { rejectListing } from '$lib/server/otc/service.js';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ params, request, locals }) => {
  if (locals.user?.role !== 'internal_team') {
    return json({ error: 'Forbidden' }, { status: 403 });
  }
  const body = await request.json().catch(() => null);
  if (!body?.note) return json({ error: 'note required' }, { status: 400 });

  try {
    const listing = await rejectListing(params.id, body.note);
    return json({ ok: true, listing });
  } catch (err) {
    return json({ error: err instanceof Error ? err.message : 'Error' }, { status: 400 });
  }
};
```

- [ ] **Step 5: Verify**

```bash
npx svelte-check --tsconfig ./tsconfig.json 2>&1 | tail -5
```

- [ ] **Step 6: Commit**

```bash
git add src/routes/api/otc/admin/
git commit -m "feat(otc): add admin API endpoints (list, approve, reject)"
```

---

## Chunk 3: Public Frontend

### Task 8: Public Marketplace — /otc

**Files:**
- Create: `src/routes/(marketing)/otc/+page.server.ts`
- Create: `src/routes/(marketing)/otc/+page.svelte`

- [ ] **Step 1: Create directory**

```bash
mkdir -p "src/routes/(marketing)/otc"
```

- [ ] **Step 2: Write +page.server.ts**

```typescript
// src/routes/(marketing)/otc/+page.server.ts
import db from '$lib/server/db.js';
import { buildAssetSummary, LISTING_ASSET_INCLUDE } from '$lib/server/otc/service.js';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ url, locals }) => {
  const type = url.searchParams.get('type') ?? '';
  const now = new Date();

  const listings = await db.otcListing.findMany({
    where: {
      status: 'active',
      ...(type ? { assetType: type } : {}),
      OR: [{ expiresAt: null }, { expiresAt: { gt: now } }],
    },
    include: LISTING_ASSET_INCLUDE,
    orderBy: { createdAt: 'desc' },
  });

  return {
    listings: listings.map((l) => ({
      id: l.id,
      assetType: l.assetType,
      title: l.title,
      askPrice: l.askPrice,
      currency: l.currency,
      createdAt: l.createdAt.toISOString(),
      assetSummary: buildAssetSummary(l),
      offerCount: l._count.offers,
    })),
    activeType: type,
    isLoggedIn: !!locals.user,
  };
};
```

- [ ] **Step 3: Write +page.svelte**

```svelte
<!-- src/routes/(marketing)/otc/+page.svelte -->
<script lang="ts">
  let { data } = $props();

  const TYPES = [
    { value: '', label: 'All' },
    { value: 'investment_share', label: 'Investment Shares' },
    { value: 'option_contract', label: 'Option Contracts' },
    { value: 'apartment', label: 'Apartments' },
  ];

  function timeAgo(iso: string) {
    const ms = Date.now() - new Date(iso).getTime();
    const days = Math.floor(ms / 86400000);
    if (days === 0) return 'today';
    if (days === 1) return '1 day ago';
    return `${days} days ago`;
  }

  function assetTypeBadge(t: string) {
    if (t === 'investment_share') return 'INVESTMENT SHARE';
    if (t === 'option_contract') return 'OPTION CONTRACT';
    return 'APARTMENT';
  }
</script>

<svelte:head><title>OTC Secondary Market — Groundz</title></svelte:head>

<section class="otc-hero">
  <h1 class="otc-hero__title">OTC Secondary Market</h1>
  <p class="otc-hero__subtitle">Early-exit liquidity for Groundz investors and buyers</p>
</section>

<div class="otc-layout">
  <!-- Filter tabs -->
  <nav class="otc-tabs">
    {#each TYPES as t}
      <a
        href="/otc{t.value ? `?type=${t.value}` : ''}"
        class="otc-tabs__tab"
        class:otc-tabs__tab--active={data.activeType === t.value}
      >{t.label}</a>
    {/each}
  </nav>

  {#if data.listings.length === 0}
    <p class="otc-empty">No active listings at the moment.</p>
  {:else}
    <div class="otc-grid">
      {#each data.listings as l}
        <article class="otc-card">
          <span class="otc-card__badge">{assetTypeBadge(l.assetType)}</span>
          <h3 class="otc-card__title">{l.title}</h3>
          <p class="otc-card__asset">{l.assetSummary}</p>
          <p class="otc-card__price">Ask: €{l.askPrice.toLocaleString('en')}</p>
          <p class="otc-card__meta">{l.offerCount} offer{l.offerCount !== 1 ? 's' : ''} · listed {timeAgo(l.createdAt)}</p>
          <a href="/otc/{l.id}" class="btn btn--primary btn--sm">View &amp; Make Offer →</a>
        </article>
      {/each}
    </div>
  {/if}

  {#if !data.isLoggedIn}
    <div class="otc-cta">
      <a href="/auth/register">Register free to submit offers on any listing →</a>
    </div>
  {/if}
</div>

<style>
  .otc-hero {
    padding: var(--space-16) var(--space-8) var(--space-8);
    text-align: center;
  }
  .otc-hero__title {
    font-family: var(--font-display);
    font-size: var(--text-4xl);
    color: var(--color-text);
    margin: 0 0 var(--space-3);
  }
  .otc-hero__subtitle {
    color: var(--color-text-muted);
    font-size: var(--text-lg);
  }
  .otc-layout {
    max-width: 1100px;
    margin: 0 auto;
    padding: 0 var(--space-8) var(--space-16);
  }
  .otc-tabs {
    display: flex;
    gap: var(--space-2);
    margin-bottom: var(--space-8);
    border-bottom: 1px solid var(--color-border);
    padding-bottom: var(--space-4);
    flex-wrap: wrap;
  }
  .otc-tabs__tab {
    padding: var(--space-2) var(--space-4);
    border-radius: var(--radius-sm);
    color: var(--color-text-muted);
    text-decoration: none;
    font-size: var(--text-sm);
    font-weight: 500;
    transition: color 0.15s, background 0.15s;
  }
  .otc-tabs__tab:hover { color: var(--color-text); background: var(--color-surface); }
  .otc-tabs__tab--active { color: var(--color-accent); background: color-mix(in srgb, var(--color-accent) 10%, transparent); }
  .otc-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
    gap: var(--space-6);
  }
  .otc-card {
    background: var(--color-surface);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-lg);
    padding: var(--space-6);
    display: flex;
    flex-direction: column;
    gap: var(--space-2);
  }
  .otc-card__badge {
    font-size: var(--text-xs);
    font-weight: 700;
    letter-spacing: 0.08em;
    color: var(--color-accent);
    text-transform: uppercase;
  }
  .otc-card__title { font-size: var(--text-lg); font-weight: 600; margin: 0; color: var(--color-text); }
  .otc-card__asset { font-size: var(--text-sm); color: var(--color-text-muted); margin: 0; }
  .otc-card__price { font-size: var(--text-xl); font-weight: 700; color: var(--color-text); margin: 0; }
  .otc-card__meta { font-size: var(--text-xs); color: var(--color-text-muted); margin: 0 0 var(--space-2); }
  .otc-empty { text-align: center; color: var(--color-text-muted); padding: var(--space-16) 0; }
  .otc-cta {
    margin-top: var(--space-12);
    text-align: center;
    padding: var(--space-6);
    background: var(--color-surface);
    border-radius: var(--radius-lg);
    border: 1px solid var(--color-border);
  }
  .otc-cta a { color: var(--color-accent); font-weight: 600; text-decoration: none; }
</style>
```

- [ ] **Step 4: Verify**

```bash
npx svelte-check --tsconfig ./tsconfig.json 2>&1 | tail -5
```

- [ ] **Step 5: Commit**

```bash
git add "src/routes/(marketing)/otc/"
git commit -m "feat(otc): add public marketplace page /otc"
```

---

### Task 9: Listing Detail — /otc/[id]

**Files:**
- Create: `src/routes/(marketing)/otc/[id]/+page.server.ts`
- Create: `src/routes/(marketing)/otc/[id]/+page.svelte`

- [ ] **Step 1: Create directory**

```bash
mkdir -p "src/routes/(marketing)/otc/[id]"
```

- [ ] **Step 2: Write +page.server.ts**

```typescript
// src/routes/(marketing)/otc/[id]/+page.server.ts
import db from '$lib/server/db.js';
import { buildAssetSummary } from '$lib/server/otc/service.js';
import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params, locals }) => {
  const listing = await db.otcListing.findUnique({
    where: { id: params.id },
    include: {
      investment: { include: { pool: { select: { name: true } } } },
      unit: { select: { code: true, floor: true, areaSqm: true, project: { select: { name: true } } } },
      offers: {
        orderBy: { amount: 'desc' },
        select: {
          id: true, amount: true, message: true, status: true,
          buyerId: true, createdAt: true,
        },
      },
    },
  });

  if (!listing || listing.status !== 'active') throw error(404, 'Listing not found');

  const userId = locals.user?.id ?? null;
  const isSeller = userId === listing.sellerId;

  // Buyer: only show their own offers; seller: show all
  const visibleOffers = isSeller
    ? listing.offers
    : listing.offers.filter((o) => o.buyerId === userId);

  return {
    listing: {
      id: listing.id,
      assetType: listing.assetType,
      title: listing.title,
      description: listing.description,
      askPrice: listing.askPrice,
      currency: listing.currency,
      status: listing.status,
      assetSummary: buildAssetSummary(listing),
      createdAt: listing.createdAt.toISOString(),
    },
    offers: visibleOffers.map((o) => ({
      ...o,
      createdAt: o.createdAt.toISOString(),
    })),
    isSeller,
    isLoggedIn: !!locals.user,
  };
};
```

- [ ] **Step 3: Write +page.svelte**

```svelte
<!-- src/routes/(marketing)/otc/[id]/+page.svelte -->
<script lang="ts">
  let { data } = $props();

  // Offer form state
  let offerAmount = $state('');
  let offerMessage = $state('');
  let submitting = $state(false);
  let submitError = $state('');
  let submitOk = $state(false);

  async function submitOffer() {
    submitting = true;
    submitError = '';
    submitOk = false;
    try {
      const res = await fetch('/api/otc/offers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          listingId: data.listing.id,
          amount: parseFloat(offerAmount),
          message: offerMessage || undefined,
        }),
      });
      const r = await res.json();
      if (!res.ok) { submitError = r.error ?? 'Failed to submit offer'; return; }
      submitOk = true;
      offerAmount = '';
      offerMessage = '';
      // Reload to show new offer in list
      location.reload();
    } catch {
      submitError = 'Network error';
    } finally {
      submitting = false;
    }
  }

  async function acceptOffer(offerId: string) {
    const res = await fetch(`/api/otc/offers/${offerId}/accept`, { method: 'POST' });
    if (res.ok) location.reload();
  }

  async function declineOffer(offerId: string) {
    const res = await fetch(`/api/otc/offers/${offerId}/decline`, { method: 'POST' });
    if (res.ok) location.reload();
  }

  async function cancelListing() {
    if (!confirm('Cancel this listing?')) return;
    const res = await fetch(`/api/otc/listings/${data.listing.id}`, { method: 'DELETE' });
    if (res.ok) location.href = '/otc';
  }

  function assetTypeBadge(t: string) {
    if (t === 'investment_share') return 'INVESTMENT SHARE';
    if (t === 'option_contract') return 'OPTION CONTRACT';
    return 'APARTMENT';
  }

  function timeAgo(iso: string) {
    const days = Math.floor((Date.now() - new Date(iso).getTime()) / 86400000);
    return days === 0 ? 'today' : days === 1 ? '1 day ago' : `${days} days ago`;
  }
</script>

<svelte:head><title>{data.listing.title} — OTC Market</title></svelte:head>

<div class="otc-detail">
  <div class="otc-detail__header">
    <span class="otc-detail__badge">{assetTypeBadge(data.listing.assetType)}</span>
    {#if data.isSeller}<span class="otc-detail__role-badge">My Listing — ACTIVE</span>{/if}
    <h1 class="otc-detail__title">{data.listing.title}</h1>
    <p class="otc-detail__asset">{data.listing.assetSummary}</p>
    {#if data.listing.description}
      <p class="otc-detail__desc">{data.listing.description}</p>
    {/if}
    <p class="otc-detail__price">Ask price: <strong>€{data.listing.askPrice.toLocaleString('en')}</strong> {data.listing.currency}</p>
  </div>

  {#if data.isSeller}
    <!-- Seller view -->
    <section class="otc-detail__offers">
      <h2>Received Offers ({data.offers.length})</h2>
      {#if data.offers.length === 0}
        <p class="otc-empty">No offers yet.</p>
      {:else}
        {#each data.offers as offer}
          <div class="offer-row">
            <span class="offer-row__amount">€{offer.amount.toLocaleString('en')}</span>
            {#if offer.message}<span class="offer-row__msg">"{offer.message}"</span>{/if}
            <span class="offer-row__meta">{timeAgo(offer.createdAt)}</span>
            {#if offer.status === 'pending'}
              <button class="btn btn--primary btn--sm" onclick={() => acceptOffer(offer.id)}>Accept</button>
              <button class="btn btn--ghost btn--sm" onclick={() => declineOffer(offer.id)}>Decline</button>
            {:else}
              <span class="offer-row__status offer-row__status--{offer.status}">{offer.status}</span>
            {/if}
          </div>
        {/each}
      {/if}
    </section>
    <button class="btn btn--danger btn--sm" onclick={cancelListing}>Cancel Listing</button>

  {:else if data.isLoggedIn}
    <!-- Buyer view -->
    <section class="otc-detail__form">
      <h2>Make an Offer</h2>
      {#if submitOk}
        <p class="form-success">Offer submitted!</p>
      {:else}
        <label class="form-label">
          Amount (€)
          <input class="form-input" type="number" bind:value={offerAmount} placeholder="45000" min="1" />
        </label>
        <label class="form-label">
          Message (optional)
          <input class="form-input" type="text" bind:value={offerMessage} placeholder="I'm a long-term investor…" />
        </label>
        {#if submitError}<p class="form-error">{submitError}</p>{/if}
        <button class="btn btn--primary" onclick={submitOffer} disabled={submitting || !offerAmount}>
          {submitting ? 'Submitting…' : 'Submit Offer'}
        </button>
      {/if}
    </section>

    {#if data.offers.length > 0}
      <section class="otc-detail__my-offers">
        <h3>My offers on this listing</h3>
        {#each data.offers as offer}
          <div class="offer-row">
            <span class="offer-row__amount">€{offer.amount.toLocaleString('en')}</span>
            <span class="offer-row__status offer-row__status--{offer.status}">{offer.status}</span>
            <span class="offer-row__meta">submitted {timeAgo(offer.createdAt)}</span>
          </div>
        {/each}
      </section>
    {/if}

  {:else}
    <!-- Public (not logged in) -->
    <div class="otc-detail__auth-cta">
      <a href="/auth/login">Log in</a> or <a href="/auth/register">register</a> to submit an offer.
    </div>
  {/if}
</div>

<style>
  .otc-detail {
    max-width: 720px;
    margin: 0 auto;
    padding: var(--space-12) var(--space-8);
    display: flex;
    flex-direction: column;
    gap: var(--space-8);
  }
  .otc-detail__header { display: flex; flex-direction: column; gap: var(--space-2); }
  .otc-detail__badge {
    font-size: var(--text-xs); font-weight: 700; letter-spacing: 0.08em;
    color: var(--color-accent); text-transform: uppercase;
  }
  .otc-detail__role-badge {
    font-size: var(--text-xs); font-weight: 600; color: var(--color-success, #5a8c5a);
    background: color-mix(in srgb, var(--color-success, #5a8c5a) 12%, transparent);
    padding: 2px 8px; border-radius: var(--radius-sm); align-self: flex-start;
  }
  .otc-detail__title { font-family: var(--font-display); font-size: var(--text-3xl); margin: 0; }
  .otc-detail__asset, .otc-detail__desc { color: var(--color-text-muted); margin: 0; }
  .otc-detail__price { font-size: var(--text-xl); margin: 0; }
  .otc-detail__offers, .otc-detail__form, .otc-detail__my-offers {
    background: var(--color-surface);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-lg);
    padding: var(--space-6);
    display: flex;
    flex-direction: column;
    gap: var(--space-4);
  }
  .otc-detail__offers h2, .otc-detail__form h2, .otc-detail__my-offers h3 {
    margin: 0; font-size: var(--text-lg);
  }
  .offer-row {
    display: flex;
    align-items: center;
    gap: var(--space-3);
    padding: var(--space-3) 0;
    border-bottom: 1px solid var(--color-border);
    flex-wrap: wrap;
  }
  .offer-row:last-child { border-bottom: none; }
  .offer-row__amount { font-weight: 700; font-size: var(--text-lg); }
  .offer-row__msg { color: var(--color-text-muted); font-style: italic; font-size: var(--text-sm); flex: 1; }
  .offer-row__meta { color: var(--color-text-muted); font-size: var(--text-xs); margin-left: auto; }
  .offer-row__status { font-size: var(--text-xs); font-weight: 600; padding: 2px 8px; border-radius: var(--radius-sm); }
  .offer-row__status--pending { background: color-mix(in srgb, var(--color-accent) 12%, transparent); color: var(--color-accent); }
  .offer-row__status--accepted { background: color-mix(in srgb, #5a8c5a 12%, transparent); color: #5a8c5a; }
  .offer-row__status--declined { background: color-mix(in srgb, #8c5a5a 12%, transparent); color: #8c5a5a; }
  .otc-detail__auth-cta {
    padding: var(--space-8);
    text-align: center;
    background: var(--color-surface);
    border-radius: var(--radius-lg);
    border: 1px solid var(--color-border);
  }
  .otc-detail__auth-cta a { color: var(--color-accent); font-weight: 600; }
  .otc-empty { color: var(--color-text-muted); }
  .form-success { color: #5a8c5a; font-weight: 500; }
</style>
```

- [ ] **Step 4: Verify**

```bash
npx svelte-check --tsconfig ./tsconfig.json 2>&1 | tail -5
```

- [ ] **Step 5: Commit**

```bash
git add "src/routes/(marketing)/otc/[id]/"
git commit -m "feat(otc): add listing detail page /otc/[id] with buyer/seller/public views"
```

---

## Chunk 4: Cabinet + Navigation

### Task 10: Investor Cabinet — /investor/otc

**Files:**
- Create: `src/routes/(cabinet)/investor/otc/+page.server.ts`
- Create: `src/routes/(cabinet)/investor/otc/+page.svelte`

- [ ] **Step 1: Create directory**

```bash
mkdir -p "src/routes/(cabinet)/investor/otc"
```

- [ ] **Step 2: Write +page.server.ts**

```typescript
// src/routes/(cabinet)/investor/otc/+page.server.ts
import db from '$lib/server/db.js';
import { requireRole } from '$lib/server/guards.js';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async (event) => {
  const user = requireRole(event, ['investor']);

  const [myListings, myOffers, myInvestments] = await Promise.all([
    db.otcListing.findMany({
      where: { sellerId: user.id },
      include: { _count: { select: { offers: true } } },
      orderBy: { createdAt: 'desc' },
    }),
    db.otcOffer.findMany({
      where: { buyerId: user.id },
      include: {
        listing: { select: { id: true, title: true, askPrice: true, currency: true, status: true } },
      },
      orderBy: { createdAt: 'desc' },
    }),
    // Funded investments NOT already having a pending/active listing
    db.investorInvestment.findMany({
      where: {
        userId: user.id,
        status: 'funded',
        otcListings: { none: { status: { in: ['pending', 'active'] } } },
      },
      include: { pool: { select: { name: true } } },
      orderBy: { createdAt: 'desc' },
    }),
  ]);

  return { myListings, myOffers, myInvestments };
};
```

- [ ] **Step 3: Write +page.svelte**

```svelte
<!-- src/routes/(cabinet)/investor/otc/+page.svelte -->
<script lang="ts">
  let { data } = $props();

  type Tab = 'listings' | 'create' | 'offers';
  let activeTab = $state<Tab>('listings');

  // Create form state
  let fInvestmentId = $state('');
  let fTitle = $state('');
  let fDescription = $state('');
  let fAskPrice = $state('');
  let fExpiresAt = $state('');
  let creating = $state(false);
  let createError = $state('');

  async function createListing() {
    if (!fInvestmentId || !fTitle || !fAskPrice) { createError = 'Investment, title and price required'; return; }
    creating = true;
    createError = '';
    try {
      const res = await fetch('/api/otc/listings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          assetType: 'investment_share',
          investmentId: fInvestmentId,
          title: fTitle,
          description: fDescription || undefined,
          askPrice: parseFloat(fAskPrice),
          expiresAt: fExpiresAt || undefined,
        }),
      });
      const r = await res.json();
      if (!res.ok) { createError = r.error ?? 'Failed'; return; }
      location.reload();
    } catch { createError = 'Network error'; }
    finally { creating = false; }
  }

  async function cancelListing(id: string) {
    if (!confirm('Cancel this listing?')) return;
    const res = await fetch(`/api/otc/listings/${id}`, { method: 'DELETE' });
    if (res.ok) location.reload();
  }

  const STATUS_COLORS: Record<string, string> = {
    pending: 'warning', active: 'success', sold: 'info', cancelled: 'neutral', rejected: 'danger'
  };
</script>

<svelte:head><title>Secondary Market — Investor</title></svelte:head>

<h1 style="margin-bottom: var(--space-6);">Secondary Market</h1>

<nav class="cabinet-tabs-inline">
  <button class:active={activeTab === 'listings'} onclick={() => activeTab = 'listings'}>My Listings ({data.myListings.length})</button>
  <button class:active={activeTab === 'create'} onclick={() => activeTab = 'create'}>Create Listing</button>
  <button class:active={activeTab === 'offers'} onclick={() => activeTab = 'offers'}>My Offers ({data.myOffers.length})</button>
</nav>

{#if activeTab === 'listings'}
  {#if data.myListings.length === 0}
    <p class="empty-state">You have no listings yet.</p>
  {:else}
    <table class="data-table">
      <thead><tr><th>Title</th><th>Status</th><th>Ask Price</th><th>Offers</th><th></th></tr></thead>
      <tbody>
        {#each data.myListings as l}
          <tr>
            <td><a href="/otc/{l.id}">{l.title}</a></td>
            <td><span class="status-badge status-badge--{STATUS_COLORS[l.status] ?? 'neutral'}">{l.status}</span></td>
            <td>€{l.askPrice.toLocaleString('en')}</td>
            <td>{l._count.offers}</td>
            <td>
              {#if ['pending','active'].includes(l.status)}
                <button class="btn btn--ghost btn--sm" onclick={() => cancelListing(l.id)}>Cancel</button>
              {/if}
            </td>
          </tr>
        {/each}
      </tbody>
    </table>
  {/if}

{:else if activeTab === 'create'}
  <div class="form-card" style="max-width:480px;">
    <h2 style="margin:0 0 var(--space-4);">List an Investment</h2>
    <label class="form-label">
      Investment to list
      <select class="form-input" bind:value={fInvestmentId}>
        <option value="">— select —</option>
        {#each data.myInvestments as inv}
          <option value={inv.id}>{inv.pool.name} — €{inv.amount.toLocaleString('en')}</option>
        {/each}
      </select>
    </label>
    <label class="form-label">
      Listing title
      <input class="form-input" type="text" bind:value={fTitle} placeholder="Marina Heights stake, €25k" />
    </label>
    <label class="form-label">
      Description (optional)
      <textarea class="form-input" rows="3" bind:value={fDescription}></textarea>
    </label>
    <label class="form-label">
      Ask price (€)
      <input class="form-input" type="number" bind:value={fAskPrice} placeholder="25000" min="1" />
    </label>
    <label class="form-label">
      Expiry date (optional)
      <input class="form-input" type="date" bind:value={fExpiresAt} />
    </label>
    {#if createError}<p class="form-error">{createError}</p>{/if}
    <button class="btn btn--primary" onclick={createListing} disabled={creating}>
      {creating ? 'Creating…' : 'Submit for Review'}
    </button>
    <p class="form-hint">Listings require admin approval before appearing on the marketplace.</p>
  </div>

{:else}
  {#if data.myOffers.length === 0}
    <p class="empty-state">You haven't submitted any offers yet.</p>
  {:else}
    <table class="data-table">
      <thead><tr><th>Listing</th><th>Your Offer</th><th>Status</th></tr></thead>
      <tbody>
        {#each data.myOffers as o}
          <tr>
            <td><a href="/otc/{o.listing.id}">{o.listing.title}</a></td>
            <td>€{o.amount.toLocaleString('en')}</td>
            <td><span class="status-badge status-badge--{STATUS_COLORS[o.status] ?? 'neutral'}">{o.status}</span></td>
          </tr>
        {/each}
      </tbody>
    </table>
  {/if}
{/if}

<style>
  .cabinet-tabs-inline {
    display: flex; gap: var(--space-2); margin-bottom: var(--space-6);
    border-bottom: 1px solid var(--color-border); padding-bottom: var(--space-3);
  }
  .cabinet-tabs-inline button {
    background: none; border: none; cursor: pointer; padding: var(--space-2) var(--space-4);
    color: var(--color-text-muted); font-size: var(--text-sm); font-weight: 500;
    border-radius: var(--radius-sm); transition: color 0.15s, background 0.15s;
  }
  .cabinet-tabs-inline button:hover { color: var(--color-text); background: var(--color-surface); }
  .cabinet-tabs-inline button.active { color: var(--color-accent); background: color-mix(in srgb, var(--color-accent) 10%, transparent); }
  .form-card {
    background: var(--color-surface); border: 1px solid var(--color-border);
    border-radius: var(--radius-lg); padding: var(--space-6);
    display: flex; flex-direction: column; gap: var(--space-4);
  }
  .form-hint { color: var(--color-text-muted); font-size: var(--text-xs); margin: 0; }
  .empty-state { color: var(--color-text-muted); padding: var(--space-8) 0; }
</style>
```

- [ ] **Step 4: Verify**

```bash
npx svelte-check --tsconfig ./tsconfig.json 2>&1 | tail -5
```

- [ ] **Step 5: Commit**

```bash
git add "src/routes/(cabinet)/investor/otc/"
git commit -m "feat(otc): add investor secondary market cabinet page"
```

---

### Task 11: Buyer Cabinet — /buyer/otc

**Files:**
- Create: `src/routes/(cabinet)/buyer/otc/+page.server.ts`
- Create: `src/routes/(cabinet)/buyer/otc/+page.svelte`

- [ ] **Step 1: Create directory**

```bash
mkdir -p "src/routes/(cabinet)/buyer/otc"
```

- [ ] **Step 2: Write +page.server.ts**

```typescript
// src/routes/(cabinet)/buyer/otc/+page.server.ts
import db from '$lib/server/db.js';
import { requireRole } from '$lib/server/guards.js';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async (event) => {
  const user = requireRole(event, ['buyer']);

  const [myListings, myOffers, myUnits] = await Promise.all([
    db.otcListing.findMany({
      where: { sellerId: user.id },
      include: { _count: { select: { offers: true } } },
      orderBy: { createdAt: 'desc' },
    }),
    db.otcOffer.findMany({
      where: { buyerId: user.id },
      include: {
        listing: { select: { id: true, title: true, askPrice: true, currency: true, status: true } },
      },
      orderBy: { createdAt: 'desc' },
    }),
    // Units owned by this buyer NOT already having a pending/active listing
    db.unit.findMany({
      where: {
        buyerId: user.id,
        otcListings: { none: { status: { in: ['pending', 'active'] } } },
      },
      select: { id: true, code: true, floor: true, areaSqm: true, type: true, project: { select: { name: true } } },
      orderBy: { code: 'asc' },
    }),
  ]);

  return { myListings, myOffers, myUnits };
};
```

- [ ] **Step 3: Write +page.svelte**

The buyer cabinet page is structurally identical to the investor page but creates listings for units (not investments). Copy the investor page and replace:
- `assetType: 'investment_share'` → `assetType: data.activeAssetType` (dropdown selection between `option_contract` and `apartment`)
- `investmentId` → `unitId`
- The asset dropdown iterates `data.myUnits` (showing `unit.project.name + unit.code`)

Create `src/routes/(cabinet)/buyer/otc/+page.svelte`:

```svelte
<!-- src/routes/(cabinet)/buyer/otc/+page.svelte -->
<script lang="ts">
  let { data } = $props();

  type Tab = 'listings' | 'create' | 'offers';
  let activeTab = $state<Tab>('listings');

  let fUnitId = $state('');
  let fAssetType = $state('option_contract');
  let fTitle = $state('');
  let fDescription = $state('');
  let fAskPrice = $state('');
  let fExpiresAt = $state('');
  let creating = $state(false);
  let createError = $state('');

  async function createListing() {
    if (!fUnitId || !fTitle || !fAskPrice) { createError = 'Unit, title and price required'; return; }
    creating = true;
    createError = '';
    try {
      const res = await fetch('/api/otc/listings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          assetType: fAssetType,
          unitId: fUnitId,
          title: fTitle,
          description: fDescription || undefined,
          askPrice: parseFloat(fAskPrice),
          expiresAt: fExpiresAt || undefined,
        }),
      });
      const r = await res.json();
      if (!res.ok) { createError = r.error ?? 'Failed'; return; }
      location.reload();
    } catch { createError = 'Network error'; }
    finally { creating = false; }
  }

  async function cancelListing(id: string) {
    if (!confirm('Cancel this listing?')) return;
    const res = await fetch(`/api/otc/listings/${id}`, { method: 'DELETE' });
    if (res.ok) location.reload();
  }

  const STATUS_COLORS: Record<string, string> = {
    pending: 'warning', active: 'success', sold: 'info', cancelled: 'neutral', rejected: 'danger'
  };
</script>

<svelte:head><title>Secondary Market — Buyer</title></svelte:head>

<h1 style="margin-bottom: var(--space-6);">Secondary Market</h1>

<nav class="cabinet-tabs-inline">
  <button class:active={activeTab === 'listings'} onclick={() => activeTab = 'listings'}>My Listings ({data.myListings.length})</button>
  <button class:active={activeTab === 'create'} onclick={() => activeTab = 'create'}>Create Listing</button>
  <button class:active={activeTab === 'offers'} onclick={() => activeTab = 'offers'}>My Offers ({data.myOffers.length})</button>
</nav>

{#if activeTab === 'listings'}
  {#if data.myListings.length === 0}
    <p class="empty-state">You have no listings yet.</p>
  {:else}
    <table class="data-table">
      <thead><tr><th>Title</th><th>Status</th><th>Ask Price</th><th>Offers</th><th></th></tr></thead>
      <tbody>
        {#each data.myListings as l}
          <tr>
            <td><a href="/otc/{l.id}">{l.title}</a></td>
            <td><span class="status-badge status-badge--{STATUS_COLORS[l.status] ?? 'neutral'}">{l.status}</span></td>
            <td>€{l.askPrice.toLocaleString('en')}</td>
            <td>{l._count.offers}</td>
            <td>
              {#if ['pending','active'].includes(l.status)}
                <button class="btn btn--ghost btn--sm" onclick={() => cancelListing(l.id)}>Cancel</button>
              {/if}
            </td>
          </tr>
        {/each}
      </tbody>
    </table>
  {/if}

{:else if activeTab === 'create'}
  <div class="form-card" style="max-width:480px;">
    <h2 style="margin:0 0 var(--space-4);">List a Unit</h2>
    <label class="form-label">
      Listing type
      <select class="form-input" bind:value={fAssetType}>
        <option value="option_contract">Option Contract</option>
        <option value="apartment">Apartment</option>
      </select>
    </label>
    <label class="form-label">
      Unit to list
      <select class="form-input" bind:value={fUnitId}>
        <option value="">— select —</option>
        {#each data.myUnits as u}
          <option value={u.id}>{u.project.name} — Unit {u.code} ({u.areaSqm}m²)</option>
        {/each}
      </select>
    </label>
    <label class="form-label">
      Listing title
      <input class="form-input" type="text" bind:value={fTitle} placeholder="Unit 3B, Marina Heights" />
    </label>
    <label class="form-label">
      Description (optional)
      <textarea class="form-input" rows="3" bind:value={fDescription}></textarea>
    </label>
    <label class="form-label">
      Ask price (€)
      <input class="form-input" type="number" bind:value={fAskPrice} placeholder="120000" min="1" />
    </label>
    <label class="form-label">
      Expiry date (optional)
      <input class="form-input" type="date" bind:value={fExpiresAt} />
    </label>
    {#if createError}<p class="form-error">{createError}</p>{/if}
    <button class="btn btn--primary" onclick={createListing} disabled={creating}>
      {creating ? 'Creating…' : 'Submit for Review'}
    </button>
    <p class="form-hint">Listings require admin approval before appearing on the marketplace.</p>
  </div>

{:else}
  {#if data.myOffers.length === 0}
    <p class="empty-state">You haven't submitted any offers yet.</p>
  {:else}
    <table class="data-table">
      <thead><tr><th>Listing</th><th>Your Offer</th><th>Status</th></tr></thead>
      <tbody>
        {#each data.myOffers as o}
          <tr>
            <td><a href="/otc/{o.listing.id}">{o.listing.title}</a></td>
            <td>€{o.amount.toLocaleString('en')}</td>
            <td><span class="status-badge status-badge--{STATUS_COLORS[o.status] ?? 'neutral'}">{o.status}</span></td>
          </tr>
        {/each}
      </tbody>
    </table>
  {/if}
{/if}

<style>
  .cabinet-tabs-inline {
    display: flex; gap: var(--space-2); margin-bottom: var(--space-6);
    border-bottom: 1px solid var(--color-border); padding-bottom: var(--space-3);
  }
  .cabinet-tabs-inline button {
    background: none; border: none; cursor: pointer; padding: var(--space-2) var(--space-4);
    color: var(--color-text-muted); font-size: var(--text-sm); font-weight: 500;
    border-radius: var(--radius-sm); transition: color 0.15s, background 0.15s;
  }
  .cabinet-tabs-inline button:hover { color: var(--color-text); background: var(--color-surface); }
  .cabinet-tabs-inline button.active { color: var(--color-accent); background: color-mix(in srgb, var(--color-accent) 10%, transparent); }
  .form-card {
    background: var(--color-surface); border: 1px solid var(--color-border);
    border-radius: var(--radius-lg); padding: var(--space-6);
    display: flex; flex-direction: column; gap: var(--space-4);
  }
  .form-hint { color: var(--color-text-muted); font-size: var(--text-xs); margin: 0; }
  .empty-state { color: var(--color-text-muted); padding: var(--space-8) 0; }
</style>
```

- [ ] **Step 4: Verify**

```bash
npx svelte-check --tsconfig ./tsconfig.json 2>&1 | tail -5
```

- [ ] **Step 5: Commit**

```bash
git add "src/routes/(cabinet)/buyer/otc/"
git commit -m "feat(otc): add buyer secondary market cabinet page"
```

---

### Task 12: Admin Panel — /admin/otc

**Files:**
- Create: `src/routes/(cabinet)/admin/otc/+page.server.ts`
- Create: `src/routes/(cabinet)/admin/otc/+page.svelte`

- [ ] **Step 1: Create directory**

```bash
mkdir -p "src/routes/(cabinet)/admin/otc"
```

- [ ] **Step 2: Write +page.server.ts**

```typescript
// src/routes/(cabinet)/admin/otc/+page.server.ts
import db from '$lib/server/db.js';
import { requireRole } from '$lib/server/guards.js';
import { approveListing, rejectListing, cancelListing, ADMIN_LISTING_INCLUDE } from '$lib/server/otc/service.js';
import type { PageServerLoad, Actions } from './$types';

export const load: PageServerLoad = async (event) => {
  requireRole(event, ['internal_team']);

  const [pending, all] = await Promise.all([
    db.otcListing.findMany({
      where: { status: 'pending' },
      include: ADMIN_LISTING_INCLUDE,
      orderBy: { createdAt: 'asc' },
    }),
    db.otcListing.findMany({
      include: ADMIN_LISTING_INCLUDE,
      orderBy: { createdAt: 'desc' },
    }),
  ]);

  return { pending, all };
};

export const actions: Actions = {
  approve: async ({ request, locals }) => {
    requireRole({ locals } as Parameters<typeof requireRole>[0], ['internal_team']);
    const data = await request.formData();
    const id = data.get('id') as string;
    if (!id) return { error: 'id required' };
    await approveListing(id);
    return { success: true };
  },

  reject: async ({ request, locals }) => {
    requireRole({ locals } as Parameters<typeof requireRole>[0], ['internal_team']);
    const data = await request.formData();
    const id = data.get('id') as string;
    const note = (data.get('note') as string)?.trim();
    if (!id || !note) return { error: 'id and note required' };
    await rejectListing(id, note);
    return { success: true };
  },

  cancel: async ({ request, locals }) => {
    const user = requireRole({ locals } as Parameters<typeof requireRole>[0], ['internal_team']);
    const data = await request.formData();
    const id = data.get('id') as string;
    if (!id) return { error: 'id required' };
    await cancelListing(id, user.id, user.role);
    return { success: true };
  },
};
```

**Note on the `requireRole` call inside actions:** The `actions` receive an `ActionEvent` which is not a `ServerLoadEvent`. The cleanest approach is to check `locals.user.role` directly in actions:

```typescript
// Replace the requireRole calls inside actions with:
if (locals.user?.role !== 'internal_team') return { error: 'Forbidden' };
```

Use this pattern for all three actions in the file.

- [ ] **Step 3: Write correct +page.server.ts (with inline role check in actions)**

```typescript
// src/routes/(cabinet)/admin/otc/+page.server.ts
import db from '$lib/server/db.js';
import { requireRole } from '$lib/server/guards.js';
import { approveListing, rejectListing, cancelListing, ADMIN_LISTING_INCLUDE } from '$lib/server/otc/service.js';
import type { PageServerLoad, Actions } from './$types';

export const load: PageServerLoad = async (event) => {
  requireRole(event, ['internal_team']);

  const [pending, all] = await Promise.all([
    db.otcListing.findMany({
      where: { status: 'pending' },
      include: ADMIN_LISTING_INCLUDE,
      orderBy: { createdAt: 'asc' },
    }),
    db.otcListing.findMany({
      include: ADMIN_LISTING_INCLUDE,
      orderBy: { createdAt: 'desc' },
    }),
  ]);

  return { pending, all };
};

export const actions: Actions = {
  approve: async ({ request, locals }) => {
    if (locals.user?.role !== 'internal_team') return { error: 'Forbidden' };
    const data = await request.formData();
    const id = data.get('id') as string;
    if (!id) return { error: 'id required' };
    await approveListing(id);
    return { success: true };
  },

  reject: async ({ request, locals }) => {
    if (locals.user?.role !== 'internal_team') return { error: 'Forbidden' };
    const data = await request.formData();
    const id = data.get('id') as string;
    const note = (data.get('note') as string)?.trim();
    if (!id || !note) return { error: 'id and note required' };
    await rejectListing(id, note);
    return { success: true };
  },

  cancel: async ({ request, locals }) => {
    if (locals.user?.role !== 'internal_team') return { error: 'Forbidden' };
    const data = await request.formData();
    const id = data.get('id') as string;
    if (!id) return { error: 'id required' };
    await cancelListing(id, locals.user.id, locals.user.role);
    return { success: true };
  },
};
```

- [ ] **Step 4: Write +page.svelte**

```svelte
<!-- src/routes/(cabinet)/admin/otc/+page.svelte -->
<script lang="ts">
  import { enhance } from '$app/forms';

  let { data, form } = $props();

  type Tab = 'pending' | 'all';
  let activeTab = $state<Tab>('pending');
  let rejectingId = $state<string | null>(null);
  let rejectNote = $state('');

  let formError = $derived((form as { error?: string } | null)?.error ?? null);

  function formatDate(iso: string) {
    return new Date(iso).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  }

  function assetLabel(t: string) {
    if (t === 'investment_share') return 'Investment Share';
    if (t === 'option_contract') return 'Option Contract';
    return 'Apartment';
  }

  const STATUS_COLORS: Record<string, string> = {
    pending: 'warning', active: 'success', sold: 'info', cancelled: 'neutral', rejected: 'danger'
  };
</script>

<svelte:head><title>OTC Market — Admin</title></svelte:head>

<div style="max-width:1100px;">
  <h1 style="margin-bottom:var(--space-6);">OTC Market</h1>

  {#if formError}<p class="form-error">{formError}</p>{/if}

  <nav class="cabinet-tabs-inline">
    <button class:active={activeTab === 'pending'} onclick={() => activeTab = 'pending'}>
      Pending ({data.pending.length})
    </button>
    <button class:active={activeTab === 'all'} onclick={() => activeTab = 'all'}>
      All Listings ({data.all.length})
    </button>
  </nav>

  {#if activeTab === 'pending'}
    {#if data.pending.length === 0}
      <p class="empty-state">No listings awaiting approval.</p>
    {:else}
      <table class="data-table">
        <thead>
          <tr>
            <th>Title</th><th>Type</th><th>Seller</th><th>Ask Price</th><th>Created</th><th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {#each data.pending as l}
            <tr>
              <td>{l.title}</td>
              <td>{assetLabel(l.assetType)}</td>
              <td>{l.seller.name ?? l.seller.email}</td>
              <td>€{l.askPrice.toLocaleString('en')}</td>
              <td>{formatDate(String(l.createdAt))}</td>
              <td style="display:flex;gap:var(--space-2);flex-wrap:wrap;align-items:center;">
                <form method="POST" action="?/approve" use:enhance>
                  <input type="hidden" name="id" value={l.id} />
                  <button class="btn btn--primary btn--sm" type="submit">Approve</button>
                </form>
                {#if rejectingId === l.id}
                  <form method="POST" action="?/reject" use:enhance onsubmit={() => { rejectingId = null; rejectNote = ''; }}>
                    <input type="hidden" name="id" value={l.id} />
                    <input class="form-input" style="width:160px;" type="text" name="note" bind:value={rejectNote} placeholder="Reason…" required />
                    <button class="btn btn--danger btn--sm" type="submit">Confirm</button>
                    <button type="button" class="btn btn--ghost btn--sm" onclick={() => rejectingId = null}>Cancel</button>
                  </form>
                {:else}
                  <button class="btn btn--ghost btn--sm" onclick={() => { rejectingId = l.id; rejectNote = ''; }}>Reject</button>
                {/if}
              </td>
            </tr>
          {/each}
        </tbody>
      </table>
    {/if}

  {:else}
    <table class="data-table">
      <thead>
        <tr><th>Title</th><th>Status</th><th>Type</th><th>Ask Price</th><th>Offers</th><th>Created</th><th></th></tr>
      </thead>
      <tbody>
        {#each data.all as l}
          <tr>
            <td>{l.title}</td>
            <td><span class="status-badge status-badge--{STATUS_COLORS[l.status] ?? 'neutral'}">{l.status}</span></td>
            <td>{assetLabel(l.assetType)}</td>
            <td>€{l.askPrice.toLocaleString('en')}</td>
            <td>{l._count.offers}</td>
            <td>{formatDate(String(l.createdAt))}</td>
            <td>
              {#if ['pending','active'].includes(l.status)}
                <form method="POST" action="?/cancel" use:enhance>
                  <input type="hidden" name="id" value={l.id} />
                  <button class="btn btn--ghost btn--sm" type="submit">Cancel</button>
                </form>
              {/if}
            </td>
          </tr>
        {/each}
      </tbody>
    </table>
  {/if}
</div>

<style>
  .cabinet-tabs-inline {
    display: flex; gap: var(--space-2); margin-bottom: var(--space-6);
    border-bottom: 1px solid var(--color-border); padding-bottom: var(--space-3);
  }
  .cabinet-tabs-inline button {
    background: none; border: none; cursor: pointer; padding: var(--space-2) var(--space-4);
    color: var(--color-text-muted); font-size: var(--text-sm); font-weight: 500;
    border-radius: var(--radius-sm); transition: color 0.15s, background 0.15s;
  }
  .cabinet-tabs-inline button:hover { color: var(--color-text); background: var(--color-surface); }
  .cabinet-tabs-inline button.active { color: var(--color-accent); background: color-mix(in srgb, var(--color-accent) 10%, transparent); }
  .empty-state { color: var(--color-text-muted); padding: var(--space-8) 0; }
</style>
```

- [ ] **Step 5: Verify**

```bash
npx svelte-check --tsconfig ./tsconfig.json 2>&1 | tail -5
```

- [ ] **Step 6: Commit**

```bash
git add "src/routes/(cabinet)/admin/otc/"
git commit -m "feat(otc): add admin OTC moderation panel"
```

---

### Task 13: Wire Navigation

**Files:**
- Modify: `src/routes/(cabinet)/+layout.svelte`
- Modify: `src/lib/components/cabinet/CabinetSidebar.svelte`

- [ ] **Step 1: Add Secondary Market tab to investor and buyer tabs in layout.svelte**

In `src/routes/(cabinet)/+layout.svelte`, find `const investorTabs` and add at the end:

```typescript
{ label: 'Secondary Market', href: '/investor/otc' }
```

Find `const buyerTabs` and add at the end:

```typescript
{ label: 'Secondary Market', href: '/buyer/otc' }
```

The arrays should look like:

```typescript
const buyerTabs = [
  { label: 'Overview', href: '/buyer' },
  { label: 'My Property', href: '/buyer/property' },
  { label: 'Construction', href: '/buyer/construction' },
  { label: 'Payments', href: '/buyer/payments' },
  { label: 'Documents', href: '/buyer/documents' },
  { label: 'Secondary Market', href: '/buyer/otc' }
];

const investorTabs = [
  { label: 'Overview', href: '/investor' },
  { label: 'Portfolio', href: '/investor/portfolio' },
  { label: 'Cashflow', href: '/investor/cashflow' },
  { label: 'Risk', href: '/investor/risk' },
  { label: 'Construction', href: '/investor/construction' },
  { label: 'Pools', href: '/investor/pools' },
  { label: 'Documents', href: '/investor/documents' },
  { label: 'Secondary Market', href: '/investor/otc' }
];
```

- [ ] **Step 2: Add OTC Market to admin sidebar**

In `src/lib/components/cabinet/CabinetSidebar.svelte`, find the Content group items array:

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

Add `{ label: 'OTC Market', href: '/admin/otc' }` after Market Indices:

```typescript
{
  label: 'Content',
  items: [
    { label: 'Articles', href: '/admin/articles' },
    { label: 'Comments', href: '/admin/comments' },
    { label: 'Market Indices', href: '/admin/market-indices' },
    { label: 'OTC Market', href: '/admin/otc' },
    { label: 'FAQ', href: '/admin/faq' },
    { label: 'Jobs', href: '/admin/jobs' }
  ]
},
```

- [ ] **Step 3: Verify**

```bash
npx svelte-check --tsconfig ./tsconfig.json 2>&1 | tail -5
```

Expected: 0 errors.

- [ ] **Step 4: Commit**

```bash
git add "src/routes/(cabinet)/+layout.svelte" src/lib/components/cabinet/CabinetSidebar.svelte
git commit -m "feat(otc): wire OTC navigation into investor, buyer, and admin sidebar"
```

---

## Final Verification

- [ ] **Run svelte-check one last time**

```bash
npx svelte-check --tsconfig ./tsconfig.json 2>&1 | grep -E "error|warning" | tail -20
```

Expected: 0 errors. Pre-existing warnings are OK.

- [ ] **Start dev server and smoke test**

```bash
npm run dev
```

Verify in browser:
1. `/otc` — loads marketplace (empty if no listings yet, no errors)
2. Log in as admin → `/admin/otc` appears in sidebar → page loads
3. Log in as investor → Secondary Market tab visible → `/investor/otc` loads
4. Log in as buyer → Secondary Market tab visible → `/buyer/otc` loads
5. Create a listing as investor → status shows "pending"
6. Approve listing as admin → status → "active"
7. Visit `/otc` — listing appears
8. Log in as different investor → visit `/otc/[id]` → Make Offer form visible
9. Submit offer → shows in seller's pending offers
10. Accept offer as seller → listing status → "sold"
