# Architecture — System Topology

## Two layers, two diagrams

1. **Infrastructure layer** — что запускается в Docker (host topology)
2. **Logical layer** — как AI Core оркестрирует источники истины

См. [08-ai-orchestrator.md](08-ai-orchestrator.md) для подробностей по logical layer (11 движков, 15 источников, 11-факторный QueryContext, lifecycle одного вопроса).

## Logical layer (high-level)

```
                         user question
                              │
                              ▼
        ┌──────────────  AI Orchestrator (conductor)  ──────────────┐
        │  resolves QueryContext (11 factors), dispatches engines  │
        └──────────────────────────────┬───────────────────────────┘
                                       │
   ┌──────────┬──────────┬──────────┬──┴──────┬──────────┬──────────┬──────────┐
   ▼          ▼          ▼          ▼         ▼          ▼          ▼          ▼
 IAM     Knowledge   Data Access  Report  Accounting  Mgmt-Acct  Tasks/Q   Audit
                                                                            +
                                                              Agent / Tool / Policy

   each engine reads/writes ONLY through Adapter to a Source of Truth:

 [accounting]  [management_accounting]  [crm]  [documents]  [contracts]  [reports]
 [regulations] [iam_roles] [iam_permissions] [audit_log] [microservices_api]
 [knowledge_base] [event_log] [financial_rules] [compliance_rules]
```

## Infrastructure: Single-host topology (v1)

```
┌──────────────────────────  HOST SERVER (Linux + NVIDIA GPU)  ─────────────────────────┐
│                                                                                       │
│  ┌──────────────────────────  SHARED AI LAYER (ai-net)  ──────────────────────────┐   │
│  │   llm-gateway    (8080)         — FAIR QUEUE + semaphore + ROUTER (small/big)  │   │
│  │     ↓ единственный вход для всех tenant-app, ставит X-Tenant-Slug              │   │
│  │   ollama         (11434, GPU)   — два слота моделей:                           │   │
│  │       • small:   llama3.2:3b        — классификация, routing, короткие ответы, │   │
│  │                                       извлечение полей (JSON), tool args       │   │
│  │       • large:   qwen2.5:14b        — сложные рассуждения, длинная генерация,  │   │
│  │                                       schema-agent, анализ документов         │   │
│  │       • embed:   nomic-embed-text   — RAG векторы                              │   │
│  │   auto1111       (7860,  GPU)   — Stable Diffusion XL                          │   │
│  │   reranker       (опц., 8000)   — bge-reranker-v2 через TGI                   │   │
│  │                                                                                │   │
│  │   tenant-app A ──┐                                                             │   │
│  │   tenant-app B ──┼──> llm-gateway ──(router)──> small | large | embed | sd     │   │
│  │   tenant-app C ──┘                                                             │   │
│  └────────────────────────────────────────────────────────────────────────────────┘   │
│                                                                                       │
│  ┌────────────────────────────  CONTROL PLANE (admin-net)  ──────────────────────┐   │
│  │   master-app     (3000)         — SvelteKit super-admin (dockerode)           │   │
│  │   master-db      (5432)         — Postgres 16 (Tenant, IngestJob, AuditLog)   │   │
│  │   traefik        (80/443)       — TLS terminator + label-based routing        │   │
│  └────────────────────────────────────────────────────────────────────────────────┘   │
│                                                                                       │
│  ┌── TENANT STACK: groundz ─────┐  ┌── TENANT STACK: acme ──────┐                    │
│  │   groundz-app                │  │   acme-app                 │                    │
│  │     ↳ AI Orchestrator inside │  │     ↳ AI Orchestrator      │                    │
│  │     ↳ network: groundz-net   │  │     ↳ network: acme-net    │                    │
│  │     ↳ also on:   ai-net      │  │     ↳ also on:   ai-net    │                    │
│  │   groundz-db   (Postgres)    │  │   acme-db    (Postgres)    │                    │
│  │   groundz-qdrant             │  │   acme-qdrant              │                    │
│  │   groundz-audit (append-only)│  │   acme-audit               │                    │
│  │                              │  │                            │                    │
│  │   external SoT (read-only):  │  │   external SoT:            │                    │
│  │     ↳ accounting-1c  (URL)   │  │     ↳ accounting-xero      │                    │
│  │     ↳ crm-bitrix     (URL)   │  │     ↳ crm-hubspot          │                    │
│  │     ↳ documents-s3   (URL)   │  │     ↳ documents-sharepoint │                    │
│  │     ↳ iam-keycloak   (URL)   │  │     ↳ iam-azure-ad         │                    │
│  │   volume: ./data/groundz/    │  │   volume: ./data/acme/     │                    │
│  └──────────────────────────────┘  └─────────────────────────────┘                   │
│                                                                                       │
│   Traefik route table (auto-discovered from labels):                                  │
│     admin.groundz.estate   → master-app                                                   │
│     groundz.estate         → groundz-app                                                  │
│     acme-realty.com    → acme-app                                                     │
└───────────────────────────────────────────────────────────────────────────────────────┘
```

## Networks

| Network | Members | Доступ извне |
|---|---|---|
| `ai-net` | ollama, auto1111, reranker, traefik, **все** tenant-app, master-app | нет (kernel bridge) |
| `admin-net` | traefik, master-app, master-db | нет |
| `{slug}-net` | {slug}-app, {slug}-db, {slug}-qdrant | нет |
| host:80,443 | traefik | да (TLS только) |

## Volumes layout

```
/opt/groundz/
├── infra/
│   ├── ai.compose.yml
│   └── master.compose.yml
├── stacks/                       # generated
│   ├── groundz/
│   │   ├── docker-compose.yml
│   │   └── .env
│   └── acme-realty/
├── templates/
│   ├── tenant.compose.yml.tmpl
│   └── tenant.env.tmpl
├── data/
│   ├── ai/{ollama, sd}
│   ├── master/{pgdata, uploads}
│   ├── letsencrypt/
│   └── tenants/
│       ├── groundz/{pgdata, qdrant, uploads, tenant/}
│       └── acme-realty/{pgdata, qdrant, uploads, tenant/}
└── secrets/
    └── master.key                # шифрует tenant.dbPassword/jwtSecret в master DB
```

## Request lifecycle (tenant)

1. `GET https://acme-realty.com/projects` → Traefik
2. Traefik подбирает route по `Host(\`acme-realty.com\`)` → `acme-app:3000`
3. Tenant app: `hooks.server.ts` уже знает `TENANT_SLUG=acme-realty` (env)
4. Подключается к `acme-db:5432/acme-realty` (своему Postgres)
5. Загружает skin из `/tenant/skin.json` (read-only mount)
6. Если запрос идёт на AI route — обращается к `ollama:11434/v1` (shared) и `acme-qdrant:6333` (свой)
7. Render → response

## Bootstrap lifecycle

1. Super-admin `POST /super/tenants {url, slug, domain}`
2. Master app:
   - validate slug uniqueness, domain DNS sanity check
   - `secrets.ts` → random JWT secret + db password (encrypted with `master.key`)
   - render `templates/tenant.compose.yml.tmpl` → `stacks/{slug}/docker-compose.yml`
   - render `.env` со всеми секретами
   - `dockerode`: `compose up -d {slug}-db {slug}-qdrant`
   - wait healthcheck
   - `compose run --rm {slug}-app prisma migrate deploy` — накатить tenant schema
   - **ingest pipeline (живёт в master-app, пишет в tenant resources):**
     - crawl → extract → chunk → embed (через shared `ai-net`) → upsert в `{slug}-qdrant`
     - schema-agent → `brand.json` + `skin.json` → mount path `./data/tenants/{slug}/tenant/`
     - seed-from-rag → INSERT через tenant-app internal endpoint `/api/internal/seed`
   - `compose up -d {slug}-app` — поднять приложение
   - Traefik подхватывает `Host` label автоматически
   - status → `ready`

Все шаги пишут логи в `IngestJob.logsJson` через SSE, super-admin UI стримит прогресс.

## Failure modes & recovery

| Failure | Detection | Recovery |
|---|---|---|
| AI runtime упал | health endpoint `/api/health/ai` | `docker compose -f infra/ai.compose.yml restart ollama` |
| Tenant DB corrupt | tenant-app health 503 | restore из последнего бэкапа `./data/tenants/{slug}/pgdata.bak` |
| Ingest упал на середине | step < 'done' в IngestJob | super-admin retry: продолжает с `lastSuccessfulStep + 1` |
| Tenant домен не открывается | Traefik dashboard | проверить label, перезапустить traefik |
| Out of disk | host monitoring | прометеус alert + ручное удаление старых tenant-volumes |

## Scale ceilings (single host)

| Ресурс | На одном хосте |
|---|---|
| Тенантов | ~50 (32 GB RAM, 1× RTX 4090 24GB, 2 TB NVMe) |
| RPS на тенанта | ~30 (без AI) / ~3 (с AI) |
| Параллельных AI вызовов | ограничено GPU: 1 SDXL gen ≈ 10 сек, 1 LLM ≈ 0.5–2 сек |

При выходе за лимиты — fan-out на 2-й хост: AI остаётся на одном, tenant-стеки разъезжаются по нодам через Docker Swarm или k8s.
