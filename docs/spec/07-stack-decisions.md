# Stack Decisions Lock — DO NOT CHANGE WITHOUT TZ UPDATE

Этот документ фиксирует все технологические выборы, чтобы AI-кодеры (и люди) не сделали несовместимых замен.

## Foundational principle (HARD LOCK)

> **AI is NOT a source of truth. AI is the orchestrator of sources of truth.**

AI Core = Orchestrator + 11 движков. AI ничего не «знает» сам — только дёргает 15 категорий источников через Adapter'ы, проверяет права (IAM + Policy), согласует противоречия и объясняет результат с цитированием.

См. [08-ai-orchestrator.md](08-ai-orchestrator.md) — авторитетный документ по AI Core.

## Forbidden / banned

| Технология | Запрещена | Причина |
|---|---|---|
| OpenAI / Anthropic / Gemini cloud APIs | ❌ | требование «локальные модели» |
| Tailwind, Bootstrap, MUI, Chakra | ❌ | используем custom CSS + CSS Custom Properties |
| Next.js, Remix, Nuxt | ❌ | стек = SvelteKit |
| MongoDB, MySQL для основной БД | ❌ | стек = Postgres |
| Pinecone, Weaviate, Chroma, pgvector (как primary) | ❌ | vector store = Qdrant per-tenant |
| Redis (как обязательное) | ⚠️ | rate-limit пока in-memory; Redis опционально для multi-instance |
| jQuery, Lodash | ❌ | модерн ES + Svelte 5 runes |
| `process.env.X` напрямую в server-коде | ❌ | использовать `$env/static/private` или `$env/dynamic/private` |
| `npm install` без причины | ❌ | предпочитать встроенное (fetch, crypto, dns/promises) |
| Docker BuildKit secrets для tenant-secret | ❌ | secrets живут в `.env` stack'а + master.key шифрование |
| Monolithic single-tenant deployment | ❌ | каждый тенант = свой Compose стек |

## Locked-in stack

### Frontend
- **Framework:** SvelteKit 2.50+
- **UI lang:** Svelte 5 with runes ($state, $derived, $props, $effect)
- **CSS:** Custom CSS + CSS Custom Properties (design tokens в `src/app.css`)
- **Fonts:** self-hosted (woff/woff2/otf в `static/fonts/`), без Google Fonts CDN
- **Build:** Vite 7
- **Adapter:** `@sveltejs/adapter-node` (для Docker)

### Backend
- **Runtime:** Node 20 LTS (alpine)
- **ORM:** Prisma 7 (`prisma-client` provider, output в `src/generated/prisma`)
- **DB:** Postgres 16 (per-tenant контейнер)
- **Auth:** bcryptjs (cost=12) + jsonwebtoken + httpOnly cookies (`secure: !dev`, `sameSite: 'lax'`)
- **Validation:** zod 4
- **Email:** nodemailer 8
- **HTTP client:** native `fetch` (без axios/got)
- **Date:** native `Date` или `Intl.DateTimeFormat` (без moment/date-fns как обязательного)

### AI stack (locked)
- **LLM serving:** один Ollama (via OpenAI-compatible API at `/v1`), shared между всеми тенантами
- **LLM gateway:** `llm-gateway` в master-app — единственный вход, fair queue + tier router + per-tenant rate-limit
- **LLM SDK in code:** `openai` npm package (как Ollama client — никаких реальных вызовов в cloud)
- **LLM small (tier 1):** `llama3.2:3b` — классификация, routing, короткие ответы, извлечение полей
- **LLM large (tier 2):** `qwen2.5:14b` — сложные рассуждения, длинная генерация, schema-agent inference
- **Embedding model:** `nomic-embed-text` (768 dim, `POST ollama:11434/api/embeddings`)
- **Image gen:** Automatic1111 SD WebUI, REST API `/sdapi/v1/txt2img`
- **Image model default:** SDXL base 1.0
- **Reranker (optional):** `BAAI/bge-reranker-v2-m3` через TGI

### LLM concurrency contract (locked)
- **One Ollama server, one process** (shared across all tenants)
- **Two models loaded simultaneously** (small + large; KV cache balanced by Ollama scheduler)
- **Single entry point:** `llm-gateway` в `ai-net`. Никакой tenant-app не звонит в Ollama напрямую.
- **Per-tier semaphores:** small=4, large=2, embed=8, image=1 inflight
- **Fair scheduling:** round-robin по тенантам в очереди (не FIFO глобально)
- **Backpressure:** HTTP 429 при переполнении очереди (per-tenant cap + global cap)
- **Job timeout:** small=20s, large=90s, image=120s

### AI Orchestrator contract (locked)
- **Orchestrator stateless.** Всё знание живёт в источниках, не в LLM.
- **11 движков** в `src/lib/server/ai-core/`: orchestrator, identity, knowledge, data-access, reports, accounting, management-accounting, tasks, audit, agents, tools, policy.
- **15 категорий SoT** обязательно поддерживаются адаптерами; конкретные системы — pluggable per-tenant.
- **QueryContext (11 факторов)** резолвится Identity-движком ДО любого engine call.
- **Policy Engine pre-check + post-check** обязательны для каждого ответа.
- **Audit append-only,** non-bypassable: ответ не отдаётся, если audit-запись не успела сохраниться.
- **Adapter contract:** `id`, `trustLevel`, `schema()`, `health()`, `read()`, optional `write()`. Всегда фильтрует по `DataScope`.
- **Conflict resolution через DSL** в `compliance_rules`. Без правила — escalate to human, не «угадывать».
- **AI agents (sales / finance / legal / ops / IR)** — пресеты в Agent Registry. Никаких ad-hoc system-промптов в endpoint-коде.
- **Tool calling** — только через Tool Registry с проверкой роли + источника.

### RAG stack
- **Vector store:** Qdrant (per-tenant Docker container)
- **Qdrant client:** `@qdrant/js-client-rest`
- **Crawler:** native fetch + `@mozilla/readability` + `cheerio` + `robots-parser`
- **Chunker:** custom (~600 tokens, 80 overlap, semantic boundaries on `\n\n`)

### Infra
- **Container orchestration:** Docker Compose v2 (CLI или dockerode)
- **Reverse proxy:** Traefik v3
- **TLS:** Let's Encrypt (TLS-ALPN-01 challenge)
- **Master Docker SDK:** `dockerode` 4
- **Template engine for compose files:** mustache 4

### Multi-tenancy
- **Strategy:** **DB-per-tenant** + **container-per-tenant** для всего стека
- **Tenant resolution:** env-variable `TENANT_SLUG` в каждом app-контейнере
- **Master ↔ tenant communication:** internal HTTP via `ai-net` network + bearer token

### Observability
- **Logs:** stdout JSON в каждом контейнере, агрегация через `docker logs` (или Loki опц.)
- **Metrics:** Prometheus `/api/metrics` endpoint в master + tenant
- **Audit:** `AuditLog` модель в master DB

### Security
- **Super-admin 2FA:** TOTP (`otplib`)
- **Secrets at rest:** AES-256-GCM шифрование с `master.key`
- **Tenant secrets:** в `.env` файле stack'а (chmod 600)
- **Rate limiting:** `src/lib/server/rate-limit.ts` (token bucket, in-memory)
- **CSRF:** SvelteKit form actions используют built-in защиту; для API endpoints `aiGuard()`
- **Sanitization:** `isomorphic-dompurify` для `@html` в knowledge/jobs

## Allowed flexibility

| Решение | Где можно отклониться |
|---|---|
| LLM модель | можно подменить на `qwen2.5:7b` или `mistral:7b` через env |
| Image модель | можно SDXL turbo / SD3 / FLUX.1 через env |
| Embeddings dim | если меняется модель — миграция collections |
| Postgres → SQLite | только в **dev**, не в production |
| Ollama → vLLM/TGI | OK, тот же OpenAI-compatible API |

## File path conventions

| Слой | Путь |
|---|---|
| Server-only код | `src/lib/server/**` |
| Shared client/server типы | `src/lib/types/**` |
| UI компоненты | `src/lib/components/**` |
| Утилиты client+server | `src/lib/utils/**` |
| Stores (client) | `src/lib/stores/**` |
| Routes | `src/routes/**` |
| Generated Prisma | `src/generated/prisma/**` (gitignore) |
| Spec docs | `docs/spec/**` |
| AI skills | `docs/skills/**` |
| Compose templates | `templates/*.tmpl` |
| Generated stacks | `stacks/{slug}/` (gitignore) |
| Tenant data | `data/tenants/{slug}/` (gitignore) |
| Master infra | `infra/*.compose.yml` |

## Naming conventions

- **Slug regex:** `/^[a-z][a-z0-9-]{1,30}$/`
- **Container names:** `{slug}-app`, `{slug}-db`, `{slug}-qdrant`
- **Network name:** `{slug}-net` (tenant-private), `ai-net` (shared)
- **Qdrant collection:** `{slug}_rag` (underscore — Qdrant rules)
- **Postgres DB name + user:** `{slug}` (одинаковые)
- **AppSetting keys:** snake_case
- **Capability ID:** kebab-case
- **CSS classes:** BEM-like (`.cabinet-sidebar__item--active`)
- **TS interfaces:** PascalCase, `I` prefix НЕ используем
- **Files:** kebab-case (`local-llm.ts`, `tenant-db.ts`)
