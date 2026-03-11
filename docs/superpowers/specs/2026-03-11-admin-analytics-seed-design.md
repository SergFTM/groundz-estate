# Admin Analytics Dashboard Extensions + Seed Data Enrichment

**Date:** 2026-03-11
**Status:** Approved
**Scope:** Local development only (no deployment)

---

## Overview

Two independent improvements to the Develta platform:

1. **Admin Analytics Dashboard Extensions** — add missing KPIs (conversion rate, sold units, revenue, breakdowns) to the existing `/admin` page
2. **Seed Data Enrichment** — expand `prisma/seed.ts` with more leads, a second buyer, overdue payments, commissions, and lead notes for realistic testing

### What Already Exists (Do Not Duplicate)

**Admin dashboard (`/admin`)** already has:
- Total Leads, Hot Leads, Active Units (available), Overdue Payments count/total
- Total Users, Investment Raised, Active Pools, Pending Documents
- Recent Leads list, Upcoming Payments list, Users by Role breakdown

**Seed data (`prisma/seed.ts`)** already has:
- 4 users (buyer, investor, agent, internal_team)
- 5 projects with 22 units
- 6 payments for buyer (3 paid, 3 upcoming — no overdue)
- 5 documents, 6 leads, 2 investment pools, 4 job positions, 6 FAQ, 3 articles

---

## Part 1: Admin Analytics Dashboard Extensions

### Goal

Extend `src/routes/(cabinet)/admin/+page.server.ts` and `+page.svelte` with missing conversion, sales, and breakdown metrics.

### Additional Data to Compute

| New Metric | Prisma Query | Note |
|------------|-------------|------|
| `newLeadsThisWeek` | `COUNT(Lead WHERE createdAt >= now - 7d)` | Supplementary info |
| `convertedLeads` | `COUNT(Lead WHERE status = 'converted')` | Required for conversionRate |
| `conversionRate` | `convertedLeads / totalLeads * 100` | Guard against division by zero: return 0 if totalLeads = 0 |
| `soldUnits` | `COUNT(Unit WHERE status = 'sold')` | Already have `totalUnits` |
| `reservedUnits` | `COUNT(Unit WHERE status = 'reserved')` | Complement sold |
| `totalRevenuePaid` | `SUM(Payment.amount WHERE status = 'paid')` | Amounts stored in euros (Float) |
| `leadsByStatus` | `groupBy('status')` → `{ new, contacted, converted, lost }` | Percentage = `count / totalLeads * 100` |
| `unitsByType` | `groupBy('type')` → `{ studio, 1bed, 2bed, 3bed, penthouse }` | Percentage = `count / totalUnits * 100` |

### conversionRate Implementation

```typescript
const conversionRate = totalLeads === 0
  ? 0
  : Math.round((convertedLeads / totalLeads) * 100);
```

### UI Layout — New Sections Added Below Existing KPIs

**New Row — Sales & Revenue (4 cards):**
```
[Conversion Rate %]  [Units Sold / Total]  [Units Reserved]  [Revenue Paid €]
```

**New Row — Two Breakdown Panels:**
```
[Leads by Status — ProgressBar each]   [Units by Type — ProgressBar each]
new:        ████░ 33%                   studio:     ███░░ 27%
contacted:  ███░░ 25%                   1bed:       ████░ 36%
converted:  ██░░░ 25%                   2bed:       ███░░ 23%
lost:       ██░░░ 17%                   3bed:       ██░░░ 18%
                                        penthouse:  █░░░░  5%
```
Units panel shows all 5 type bars (no merging). Percentages use `totalUnits` as denominator. Lead percentages use `totalLeads`.

### Components Used (no new components)

- Existing `KPICard` CSS classes (`.kpi-card`, `.kpi-card__value`) defined inline in `+page.svelte`
- Existing `ProgressBar` component from `src/lib/components/ui/ProgressBar.svelte`

### Files Modified

- `src/routes/(cabinet)/admin/+page.server.ts` — add 7 new Prisma queries to existing `Promise.all()`
- `src/routes/(cabinet)/admin/+page.svelte` — add 2 new sections after existing KPI rows

---

## Part 2: Seed Data Enrichment

### Goal

Expand `prisma/seed.ts` to add a second buyer, 6 more leads (reaching 12 total with all statuses represented), overdue payments, agent commissions, and lead notes.

### Approach

Full replacement of `prisma/seed.ts`. Preserve all existing data structure but expand volume and coverage.

### `deleteMany()` Teardown Order (must follow FK constraints)

```text
1. passwordReset
2. investorInvestment
3. constructionMedia
4. constructionPhase
5. leadNote
6. commission
7. payment
8. document
9. jobApplication
10. lead
11. unit
12. project
13. jobPosition
14. investmentPool
15. article
16. fAQ
17. user
```

### New / Changed Data

#### Users (6, was 4)

| Email | Role | Name | Password |
|-------|------|------|----------|
| admin@develta.cy | internal_team | Sarah Admin | develta123 |
| buyer@develta.cy | buyer | Maria Petrova | develta123 |
| buyer2@develta.cy | buyer | Andreas Christodoulou | develta123 ← NEW |
| investor@develta.cy | investor | Alexander Chen | develta123 |
| agent@develta.cy | agent | Nikos Papadopoulos | develta123 |
| team@develta.cy | internal_team | Develta Team | develta123 ← NEW |

Note: `internal_team` is the admin role (schema: `buyer | investor | agent | internal_team`). Amounts stored in euros as Float.

#### Projects (5, unchanged)

Keep existing 5 projects. Status values remain: `active`, `coming_soon`, `completed`.

#### Units (22, unchanged structure; AC-201 status changed)

In the seed, create AC-201 directly with `status: 'sold'` and `buyerId: buyer2.id` (not `reserved`).
This is a direct create, not an update — the seed fully replaces all data each run.

#### Payments (expanded, was 6 for buyer only)

**buyer (Maria Petrova, SYM-202):** Keep existing 3 paid + add 1 overdue:
```
+ Overdue: "Structural Milestone Advance", €8,000, dueDate: 2026-01-15, status: overdue
```

**buyer2 (Andreas Christodoulou, AC-201):** 4 payments:
```
paid:     Booking Deposit €8,000 (2025-08-01)
paid:     Contract Signing €28,000 (2025-09-15)
overdue:  Foundation Milestone €22,000 (2026-01-01)
upcoming: Structural Completion €32,000 (2026-06-01)
```

Total payments: 6 (buyer) + 4 (buyer2) = 10

#### Leads (12, was 6)

Keep existing 6. Add 6 new:
```
7.  source: quiz,         status: new,       tag: warm,  name: "Sophie Laurent",     email: sophie@example.com
8.  source: newsletter,   status: lost,      tag: cold,  name: "Robert Mueller",     email: r.mueller@example.com
9.  source: brochure,     status: converted, tag: hot,   name: "Yuki Tanaka",        phone: +81 90 1234 5678, agentId: agent
10. source: call_booking, status: lost,      tag: cold,  name: "Marco Rossi",        email: marco@example.com
11. source: quiz,         status: converted, tag: hot,   name: "Priya Sharma",       email: priya@example.com, agentId: agent
12. source: newsletter,   status: new,       tag: warm,  email: info@nordic-invest.dk
```

Coverage: new (4), contacted (3), converted (3), lost (2) — all 4 statuses represented.
Status explicitly set on all 12 leads (no reliance on schema default).

Converted leads breakdown: lead #5 (Alexander Chen, existing), lead #9 (Yuki Tanaka, new), lead #11 (Priya Sharma, new) = 3 converted.

#### LeadNotes (3, new)

Add notes to 3 leads from agent:
```
Lead 1 (Elena Karasova): "Called on 10 March. Interested in 2bed at Sungardo. Budget confirmed €300-400k."
Lead 3 (Ahmed Al-Hassan): "Visited office. Serious buyer, requesting floor plans."
Lead 11 (Priya Sharma): "Converted — signed reservation for SYM-101."
```

#### Commissions (2, new)

```
{ agentId: agent, amount: 8750, status: approved, description: "SYM-101 sale commission 2.5%" }
{ agentId: agent, amount: 5600, status: pending,  description: "AC-201 reservation commission 2%" }
```

#### All Other Data (unchanged)

- Construction phases + media (Symphony Residence, 4 phases)
- Documents for buyer (5 docs)
- Investment pools (2 pools: Aura, Elysium)
- Investor investments (buyer → 100k Aura, 50k Elysium)
- Job positions (4)
- FAQ (6 entries)
- Articles (3)

---

## Architecture Notes

- No new npm dependencies
- `bcryptjs` confirmed in `package.json` (^3.0.3)
- All passwords hashed at salt rounds 12
- Amounts in euros as `Float` (not cents)
- Seed is idempotent: `deleteMany()` in FK-safe order before all inserts
- Run with: `npx prisma db seed`

---

## Success Criteria

### Analytics Dashboard

- `/admin` shows new row: Conversion Rate, Sold Units, Reserved Units, Revenue Paid
- `/admin` shows Leads by Status panel with 4 ProgressBars reflecting seeded lead counts
- `/admin` shows Units by Type panel with ProgressBars reflecting seeded unit counts
- Conversion Rate = `(converted leads / total leads) * 100` — no divide-by-zero on empty DB
- Revenue Paid = sum of all `payment.status = 'paid'` amounts in euros

### Seed Data

- `npx prisma db seed` runs without errors and is re-runnable (idempotent)
- 6 users exist; all log in with password `develta123`
- 12 leads exist covering all 4 statuses (new/contacted/converted/lost)
- 10 payments exist including at least 2 overdue entries
- 2 commissions exist (1 approved, 1 pending)
- 3 lead notes exist attached to leads
- Admin dashboard KPIs reflect seeded data:
  - totalLeads = 12
  - conversionRate ≈ 25% (3 converted / 12 total)
  - soldUnits = 8. Pre-existing sold units from seed: SUN-101, AC-101, SYM-101, PT-101, PT-102, PT-201, PT-202 (7 units). AC-201 updated from `reserved` → `sold` = 8 total.
  - convertedLeads = 3 (leads 5, 11 + existing converted lead Alexander Chen)
  - overdueCount = 2 (buyer overdue + buyer2 overdue)
