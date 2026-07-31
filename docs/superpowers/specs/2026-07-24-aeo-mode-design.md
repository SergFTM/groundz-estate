# AEO Mode — AI SEO Optimizer + Lead Generator (Design)

Date: 2026-07-24
Status: approved (user picked "both" for lead-gen scope; instructed to implement and push)

## Goal

Make the admin AI SEO optimizer measure and improve **AEO (Answer Engine Optimization)** —
how citable Groundz pages are for ChatGPT/AI search — per Elena's checklist, and extend the
same checks to the lead-generation surfaces. Plus the technical foundation AI crawlers need
(robots.txt directives, sitemap.xml, JSON-LD).

## Scope

### 1. AEO check-set in the SEO module (`src/lib/server/seo/`)

New deterministic analyzer + rules, mirroring the existing structural/rules split:

- `aeo-rules.ts` — `analyzeAeoSignals(html)` + `checkAeo(signals, structural)`.
  Signals (page-level, regex-based, RU+EN):
  - `yieldClaimCount` — "до 25%", "up to 30%", "N% доходность/yield/ROI/IRR/годовых"
  - `hasDisclaimer` — "не гарантирует", "прогнозный", "not guaranteed", "forecast"
  - `hasUpdatedDate` — "Обновлено", "Дата актуализации", "Last updated", `<time datetime>`
  - `hasAuthorBlock` — "Автор:", "Author:", `rel="author"`, `itemprop="author"`
  - `externalSourceCount` — external `https://` links (proof/sources)
  - `mixedLanguage` — significant RU+EN word mix on one page
  Issues (severity): `yield_claim_no_disclaimer` (critical), `undated_financial_claims` (high),
  `missing_author_block` (medium), `no_external_sources` (medium, long pages only),
  `mixed_language_content` (medium), plus reuse of `missing_schema` / `no_faq_block` context.
- Score: `aeoScore` 0–100 computed from AEO issues with the same severity penalties
  (shared helper exported from `scorer.ts`).
- AI citability pass (optional, local LLM, same `withAiFallback` pattern):
  `prompts/aeo-citability.txt` → `ai-citability.ts` returns `unverifiedClaims[]` and
  `citabilityNotes[]`. Falls back to null when AI is down; deterministic rules still run.

### 2. Pipeline & persistence

- `orchestrator.ts` runs AEO after basic rules; result added to `SeoAuditResult.aeo`.
- Prisma (extend existing, no duplicates):
  - `SeoPageProfile.aeoScore Float?`
  - `SeoAudit.aeoScore Float?`, `SeoAudit.aeoIssuesJson String?`
  Migration: `add_aeo_mode`.

### 3. Lead-gen coverage (admin)

- New `POST /api/seo/audit-routes` (internal_team): renders given marketing routes via
  server-side `event.fetch` and runs the full audit (`pageType: 'landing'`).
  Default route set = lead-gen surfaces: `/`, `/lead-forms`, `/lead-quiz`, `/contact`.
- `/admin/seo` dashboard: "Audit lead pages" button + AEO score column in the pages table.
- `SeoPanel.svelte` (article editor): new **AEO tab** — aeoScore, AEO issues, citability notes.

### 4. AEO guidelines in lead-gen AI prompts

- `aeo-guidelines.ts` exports `AEO_CONTENT_GUIDELINES` (no bare yield promises, date every
  figure, label forecast vs actual, cite sources, single language per message).
- Appended to the `pipeline-insight` system prompt (the admin/agent-facing lead AI).

### 5. Technical foundation

- `static/robots.txt` — explicit `OAI-SearchBot: Allow /`, `GPTBot: Allow /` (commented
  toggle for disallowing training crawl), `Sitemap:` line.
- `src/routes/sitemap.xml/+server.ts` — static marketing routes + articles + projects +
  pools from DB; `application/xml`, 1h cache.
- `src/lib/components/seo/JsonLd.svelte` — generic JSON-LD injector.
  Wired: Organization (marketing layout), Article + author/dates (knowledge/[slug]).

## Non-goals

- Content itself (15 expert articles, cases) — editorial work, not code.
- Author entity pages / legal transparency page — separate feature.
- Changes to the AI orchestrator (`orchestrator.ask()`) — hard rule.

## Testing

- `aeo-rules.test.ts` (node --test, tsx) — signals + issue triggering on RU/EN fixtures.
- `npm run check` and `npm run build` must pass (Definition of Done).
