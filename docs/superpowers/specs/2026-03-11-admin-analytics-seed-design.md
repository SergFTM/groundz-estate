# Admin Analytics Dashboard + Seed Data

**Date:** 2026-03-11
**Status:** Approved
**Scope:** Local development only (no deployment)

---

## Overview

Two independent improvements to the Develta platform:

1. **Admin Analytics Dashboard** — KPI metrics on the `/admin` page using existing components and Prisma queries
2. **Seed Data** — Realistic Cypriot real estate data in `prisma/seed.ts` for local testing

---

## Part 1: Admin Analytics Dashboard

### Goal

Add a KPI metrics section to the existing `/admin` dashboard page showing leads, conversions, unit sales, and revenue — without adding new dependencies.

### Approach

Pure Svelte + CSS. All data computed server-side via Prisma aggregation queries in `src/routes/(cabinet)/admin/+page.server.ts`. Rendered using existing `KPICard` and `ProgressBar` components from `src/lib/components/ui/`.

### Data Computed Server-Side

| Metric | Source |
|--------|--------|
| `totalLeads` | `COUNT(Lead)` |
| `newLeads` | `COUNT(Lead WHERE createdAt >= 7 days ago)` |
| `conversionRate` | `converted / total * 100` |
| `totalUnits` | `COUNT(Unit)` |
| `soldUnits` | `COUNT(Unit WHERE status = sold)` |
| `availableUnits` | `COUNT(Unit WHERE status = available)` |
| `totalRevenue` | `SUM(Payment.amount WHERE status = paid)` |
| `activeProjects` | `COUNT(Project WHERE status != completed)` |
| `leadsByStatus` | `GROUP BY status` counts |
| `unitsByType` | `GROUP BY type` counts |

### UI Layout

**Row 1 — 4 KPI cards:**
```
[Всего лидов + новых за неделю]  [Конверсия %]  [Юниты: продано / всего]  [Выручка €]
```

**Row 2 — 2 breakdown panels:**
```
[Лиды по статусам]        [Юниты по типам]
new     ████░░ 40%         studio    ███░░ 30%
contacted ██░░ 25%         1bed      ████░ 35%
converted █░░░ 20%         2bed      ██░░░ 20%
lost    █░░░░ 15%          3bed      █░░░░ 10%
                           penthouse ░░░░░  5%
```

### Files Modified

- `src/routes/(cabinet)/admin/+page.server.ts` — add Prisma queries, return analytics data
- `src/routes/(cabinet)/admin/+page.svelte` — add analytics section above existing content

### Components Used (no new components)

- `src/lib/components/ui/KPICard.svelte` — existing
- `src/lib/components/ui/ProgressBar.svelte` — existing

---

## Part 2: Seed Data

### Goal

Populate the SQLite database with realistic Cypriot real estate data for local development and testing. All user passwords: `develta123`.

### File

`prisma/seed.ts` — full replacement of current content.

### Data Specification

#### Users (6)

| Email | Role | Name |
|-------|------|------|
| admin@develta.cy | admin | Admin User |
| buyer1@develta.cy | buyer | Andreas Christodoulou |
| buyer2@develta.cy | buyer | Maria Petrou |
| investor@develta.cy | investor | Nikolaos Georgiou |
| agent@develta.cy | agent | Elena Stavrou |
| team@develta.cy | internal_team | Develta Team |

#### Projects (4, matching existing SVG placeholders)

| Slug | Name | Status | Units |
|------|------|--------|-------|
| sungardo | Sungardo | for_sale | 12 |
| antigone-court | Antigone Court | under_construction | 8 |
| symphony-residence | Symphony Residence | for_sale | 10 |
| cascada-residence | Cascada Residence | for_sale | 6 |

Each project has: location (Limassol area), description, priceFrom, completionDate.

#### Units per Project

Mix of types: studio, 1bed, 2bed, 3bed, penthouse.
Status mix: available, reserved, sold.
Floor range: 1-8. Area: 45-220 sqm. Price: €120,000 – €850,000.

buyer1 assigned to 1 unit in Sungardo (status: sold), buyer2 to 1 unit in Symphony (status: reserved).

#### Leads (12)

Mix of:
- Sources: quiz, newsletter, brochure, call_booking
- Statuses: new (4), contacted (3), converted (3), lost (2)
- Tags: hot (4), warm (5), cold (3)
- Some assigned to agent@develta.cy
- Realistic Cypriot/international names and phone numbers

#### Payments (10, for buyer1 and buyer2)

- 4x paid (historical)
- 4x upcoming (next 3-6 months)
- 2x overdue

#### Articles (3)

| Slug | Category | Title |
|------|----------|-------|
| limassol-market-2025 | market | Limassol Property Market 2025 Outlook |
| roi-guide-cyprus | investment | Complete ROI Guide for Cyprus Real Estate |
| living-in-limassol | lifestyle | Living in Limassol: Expat Guide |

#### Job Positions (3, all active)

- Sales Manager
- Property Consultant
- Marketing Specialist

#### FAQ (8)

Categories: buying, investment, legal, general — 2 entries each.

#### Investment Pools (2)

| Name | Goal | Raised | Yield | Term |
|------|------|--------|-------|------|
| Sungardo Pool A | €2,000,000 | €1,400,000 | 9.5% | 36 months |
| Mediterranean Fund I | €5,000,000 | €2,100,000 | 11% | 48 months |

investor@develta.cy has an investment of €50,000 in Sungardo Pool A.

#### Construction Phases (for Antigone Court, 4 phases)

- Foundation (completed)
- Structure (completed)
- Exterior (in_progress)
- Interior (pending)

---

## Architecture Notes

- No new npm dependencies required
- Seed script uses `prisma/seed.ts` with `tsx` runner (already configured)
- All passwords hashed with bcryptjs (salt rounds: 12) — same as production auth
- Seed script uses `deleteMany()` before inserts for idempotency (safe to re-run)
- Prisma client imported from `src/generated/prisma/`

---

## Success Criteria

- `/admin` shows 4 KPI cards + 2 breakdown panels with real data
- `npx prisma db seed` populates all 13 DB models with realistic data
- All test users can log in with `develta123`
- Admin dashboard KPIs reflect seeded data accurately
