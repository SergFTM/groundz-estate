# Roadmap & Acceptance Criteria

## Phase 0 — Foundation (готовность v0)

| Задача | Acceptance |
|---|---|
| Postgres миграция | `provider = "postgresql"`, все миграции прошли, dev.db удалён |
| Закрыты все 23 unauth AI-endpoints | `aiGuard()` стоит на каждом `+server.ts` под `/api/(seo|invest|generate-|market|model-config|test-gemini|save-tour-images|upload-floor-plan)` |
| Cookie `secure: !dev` | done |
| Reset-token не печатается в prod | `if (dev) console.log(...)` |
| Local AI стек работает | `npm run check && npm run build` ✅ |
| Adapter явный | `@sveltejs/adapter-node` (SPA не будет, нам нужен Node для Docker) |
| Docs spec заморожен | этот пакет файлов в `docs/spec/` |

## Phase 1 — Shared AI infra (1 день)

| Задача | Acceptance |
|---|---|
| `infra/ai.compose.yml` | `docker compose -f infra/ai.compose.yml up -d` поднимает Ollama + Auto1111 + Traefik |
| Pre-pull моделей | `ollama pull llama3.1:8b nomic-embed-text qwen2.5:7b` |
| `ai-net` external network | создаётся отдельно, traefik подключён, проверено `docker network inspect ai-net` |
| Health endpoint | `curl admin.groundz.estate/api/health/ai` возвращает 200 (после Phase 2) |

## Phase 2 — Master app skeleton (2 дня)

| Задача | Acceptance |
|---|---|
| `master-app/` SvelteKit проект | существует, билдится в Docker |
| `master.schema.prisma` | модели Tenant, IngestJob, SuperAdmin, AuditLog |
| Login + 2FA TOTP | super-admin не может войти без TOTP после первого логина |
| `/super/tenants` страница | список тенантов с фильтрами по статусу |
| `dockerode` интеграция | `listContainers()` показывает все стеки |
| Master в Docker | `infra/master.compose.yml` поднимает master-app + master-db + traefik route `admin.groundz.estate` |

## Phase 3 — Manual provisioning (2 дня)

| Задача | Acceptance |
|---|---|
| `templates/tenant.compose.yml.tmpl` + `.env.tmpl` | оба валидны mustache-рендером |
| `compose-renderer.ts` | unit-тест: рендерит файл с правильным slug/domain |
| `secrets.ts` | encrypt/decrypt round-trip ОК |
| `POST /super/tenants` (без AI) | `dockerode` поднимает stack, status=`ready` через ~30 сек |
| Tenant app живой | `curl https://demo.example.com` отдаёт 200 (DNS на хост) |
| Tenant видит свою чистую БД | `prisma.user.findMany()` → [] |

## Phase 4 — Ingest + Qdrant (3 дня)

| Задача | Acceptance |
|---|---|
| `ingestor/crawler.ts` | проходит sitemap.xml, лимит 100 pages, respect robots.txt |
| `extractor.ts` | возвращает clean text без меню/футера, использует Readability |
| `chunker.ts` | средний chunk 600±100 tokens, overlap 80 |
| `embedder.ts` | batch 16, retry 2, ollama timeout 60s |
| `rag/ensure-collection.ts` | создаёт Qdrant коллекцию `{slug}_rag` с size=768 |
| `rag/upsert.ts` | bulk upsert 1000 vectors < 5 сек |
| `rag/retrieve.ts` | top-k=8 search с filter работает |
| Manual trigger | `POST /super/tenants/{id}/ingest` собирает данные, фиксирует totalChunks |
| Идемпотентность | повторный запуск не дублирует чанки |

## Phase 5 — Schema-agent (3 дня)

| Задача | Acceptance |
|---|---|
| `infer-brand` | возвращает валидный `BrandJson` (zod) для 3 разных тестовых сайтов |
| `infer-taxonomy` | определяет residential/commercial/mixed/land с точностью ≥80% (manual eval, 10 sites) |
| `infer-unit-fields` | предлагает ≤8 валидных CustomField, типы корректны |
| `infer-voice` | возвращает 1-абзац описания brand voice |
| `synthesize.ts` | склеивает все агенты → `brand.json` + `skin.json`, валидируются zod |
| `theme-emit.ts` | пишет `tenant/theme.css` с CSS-переменными |
| Tenant-app читает skin при старте | `event.locals.tenant.skin` доступен в layout |

## Phase 6 — Seeder (2 дня)

| Задача | Acceptance |
|---|---|
| `seed-from-rag.ts` для Project | AI читает чанки тегом `project` → JSON → tenant `/api/internal/seed` |
| То же для Unit (с customFieldsJson) | INSERT-ы видны в tenant Postgres |
| То же для FAQ, Article | базовый контент сидится |
| Internal seed endpoint защищён | без INTERNAL_SEED_TOKEN отдаёт 401 |
| Lighthouse на сидованном тенанте ≥ 80 | manual run |

## Phase 7 — End-to-end UX (2 дня)

| Задача | Acceptance |
|---|---|
| `/super/tenants/new` | форма {url, slug, domain}, кнопка «Provision» |
| SSE стрим | `/super/tenants/{id}/stream` отдаёт events с прогрессом |
| Live прогресс-UI | реактивно показывает шаги ingest |
| 1 click → ready | от submit до status=ready ≤ 15 минут (на тестовом сайте) |
| Доступ к tenant админке | super-admin может «зайти за» tenant-admin через signed JWT |

## Phase 8 — Operational hardening (2 дня)

| Задача | Acceptance |
|---|---|
| Backup cron | каждый день pg_dump + qdrant snapshot + tar tenant folder |
| Restore proc | можно поднять тенанта из backup за <5 минут |
| Suspend/Resume | `compose stop`/`start` через UI, статус меняется |
| Redeploy при обновлении image | rolling: `compose pull && compose up -d` |
| Monitoring | Prometheus metrics: `/api/metrics`; Grafana дашборд per-tenant |
| Audit log UI | `/super/audit` показывает последние действия |

## Phase 9 — Hardening cleanup (1 день)

| Задача | Acceptance |
|---|---|
| Все `state_referenced_locally` warnings | устранены |
| A11y warnings | устранены |
| `@html` в jobs/knowledge | DOMPurify (`isomorphic-dompurify`) на serialize |
| Переменная `JWT_SECRET` ≥ 32 байт | проверка при старте, иначе `process.exit(1)` |
| Healthcheck endpoints | `/api/health` (basic), `/api/health/ai` (admin) |
| README со схемой развёртывания | существует, шаги воспроизводятся |

## AI Orchestrator additions (vertical slice across phases)

В дополнение к фазам 0–9 ниже добавляются задачи для AI-оркестратора (см. [08-ai-orchestrator.md](08-ai-orchestrator.md)):

| Sub-phase | Когда | Задача |
|---|---|---|
| 4.5 | вместе с Phase 4 | **Adapter framework**: `src/lib/server/ai-core/data-access/registry.ts` + первые 3 адаптера (`accounting-internal`, `crm-internal`, `documents-s3`). Контракт `SourceAdapter`. |
| 5.0 | вместе с Phase 5 | **Identity & Access Engine** — резолв 11-факторного QueryContext. DataScope + RedactionPolicy generator. |
| 6.0 | вместе с Phase 6 | **Policy Engine** — pre-check + post-check + DSL для financial/compliance/redaction. **Audit Engine** — append-only writer + reader. |
| 6.5 | новая | **Tool Registry** + **Agent Registry** (presets: sales / finance / legal / ops / investor-relations). |
| 7.0 | вместе с Phase 7 | **Orchestrator conductor.ts** — Intent classifier (small) + Step runner + Explainer (large). End-to-end ask flow. |
| 7.5 | новая | **Conflict resolution** — DSL для cross-source проверок + escalation UX в super-admin. |
| 8.0 | вместе с Phase 8 | **External adapters**: 1С / Xero / Bitrix24 / HubSpot / Keycloak / SharePoint. Health & sync UI. |

Acceptance для всех под-фаз: пройден тест «AI не отвечает фактом без цитирования источника» (e2e harness).

## Out-of-scope phases (после v1)

- Phase 10: Stripe billing per-tenant
- Phase 11: Multi-host через Docker Swarm
- Phase 12: Mobile native (Capacitor)
- Phase 13: Plugin marketplace (custom capabilities)
- Phase 14: A/B testing engine
- Phase 15: White-label super-admin (resellers)
