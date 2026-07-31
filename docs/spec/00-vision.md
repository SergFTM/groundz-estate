# Groundz Platform — Vision & Product TZ

**Status:** locked, v1.1 (2026-05-05)
**Owner:** strategy.cy@gmail.com

> **AI is not a source of truth. AI is the conductor of sources of truth.**
> Платформа не пытается «знать всё сама». Она знает, **где** живёт правда (бухгалтерия, CRM, документы, регламенты, журналы, microservices), и оркестрирует доступ к ней с проверкой прав и compliance на каждом шаге.

## 1. Что мы строим

**Groundz Platform** — мультитенантный конструктор премиум-сайтов для застройщиков. Один URL сайта застройщика → автоматически развёрнутая, изолированная платформа-зеркало под него: свой домен, свой админ, своя БД, свой дизайн, свой контент, свой AI, обученный на его данных.

## 2. Ценностное предложение

> «Загнал URL сайта застройщика — через 15 минут получил production-grade платформу с CRM, инвест-модулем, OTC-маркетом, SEO-AI и кабинетами. AI-инфраструктура общая, всё остальное полностью изолировано в Docker.»

## 3. Целевые пользователи

| Уровень | Кто | Где живёт |
|---|---|---|
| **Super-admin** | оператор Groundz | `admin.groundz.estate` (Master app) |
| **Tenant-admin** | сотрудник застройщика | `{tenant-domain}/admin` (тот же tenant-app под другой ролью) |
| **Buyer / Investor / Agent** | клиенты застройщика | `{tenant-domain}/buyer`, `/investor`, `/agent` |
| **Anonymous** | посетители публичного сайта застройщика | `{tenant-domain}/` |

## 4. Ключевые принципы (immutable)

1. **AI = оркестратор источников истины, не источник.** AI достаёт правду из бухгалтерии / CRM / документов / регламентов / API / журналов. Сам ничего не «знает» — только спрашивает источники, проверяет права, согласует противоречия и объясняет ответ.
2. **15 источников истины** (см. [08-ai-orchestrator.md](08-ai-orchestrator.md)): accounting, management_accounting, crm, documents, contracts, reports, regulations, iam_roles, iam_permissions, audit_log, microservices_api, knowledge_base, event_log, financial_rules, compliance_rules.
3. **Ядро — оркестратор + 11 движков**, не «одна большая модель». См. [08-ai-orchestrator.md](08-ai-orchestrator.md).
4. **11-факторный Query Context.** Ни один ответ не отдаётся без полного резолва: who / role / legalEntity / dataScope / visibleDocuments / availableReports / allowedActions / confirmableActions / redactionPolicy / truthMap / explainability.
5. **Локальные модели** — Ollama (LLM/embeddings) + Automatic1111 (image gen). Никаких внешних API.
6. **Capability-Frame + Dynamic Skin** — каркас фиксирован, AI расширяет только динамические поля и подключенные источники.
7. **Docker-per-tenant** — каждый застройщик = свой Compose-стек: app + Postgres + Qdrant в изолированных сетях.
8. **Shared AI Layer** — Ollama, Auto1111, llm-gateway запущены однажды на хосте, доступны всем тенантам через приватный bridge `ai-net`.
9. **No-cloud** — система работает на собственном железе. Никаких OpenAI/Anthropic/GCP/AWS обязательных зависимостей.
10. **Tenant DB isolation** — Postgres с отдельной БД и отдельным юзером на тенанта.
11. **Audit-everything** — каждый вопрос/ответ/действие пишется в `audit_log` (append-only).
12. **Production-grade с первой строки** — auth, rate-limit, audit-log, 2FA для super-admin обязательны.

## 5. Бизнес-капабилити (всегда есть у каждого тенанта)

| Capability | Что включает | Always-on |
|---|---|---|
| `lead-capture` | формы, валидация, email-уведомления, CRM-таблица | ✅ |
| `catalog` | Project + Unit, фильтры, детали, customFields из skin | ✅ |
| `cabinet` | роли buyer/investor/agent/internal_team | ✅ |
| `investment-pools` | InvestmentPool, KYC, документы, milestones | ✅ |
| `otc-market` | OtcListing + OtcOffer (вторичный рынок долей/юнитов) | ✅ |
| `seo-optimizer` | AI SEO: clusters, audits, meta gen, rewrites, internal links | ✅ |
| `rag-chat` | tenant-scoped Q&A на сайте + в кабинетах | ✅ |
| `content` | Article, FAQ, JobPosition, ArticleComment | ✅ |
| `notifications` | email + in-app | ✅ |
| `market-data` | индексы недвижимости, AI-инсайты, графики | ✅ |

**AI не может удалить capability.** Только заполняет её данными и подмешивает skin.voice в промпты.

## 6. Что динамически (Skin поверх каркаса)

```ts
TenantSkin = {
  brand:         { primaryColor, accentColor, fontHeading, fontBody, logoUrl, voice },
  taxonomy:      'residential' | 'commercial' | 'mixed' | 'land',
  unitFields:    CustomField[]      // [{key:'parkingSpots', type:'int', label:{en,ru}, required, options?}]
  projectFields: CustomField[]
  copyLibrary:   { hero, leadFormCta, chatGreeting, voiceExamples }
  enabledCaps:   Set<CapabilityId>  // capability видима/скрыта в UI, но НЕ удаляется из БД
}
```

## 7. Нефункциональные требования

| Категория | Требование |
|---|---|
| **Performance** | Lighthouse ≥ 90 (perf/seo/a11y) на публичных страницах тенанта |
| **Security** | OWASP Top 10, 2FA для super-admin, rate-limit на всех публичных и AI endpoints |
| **Privacy** | Tenant data isolation на уровне Postgres user + Qdrant collection |
| **Observability** | per-tenant логи, audit-log на каждое действие super-admin |
| **Recovery** | per-tenant backup volume (`./data/{slug}/`), restore через `docker compose down && tar -xzf` |
| **Provisioning SLA** | URL → ready ≤ 15 минут (без учёта DNS-распространения) |
| **Concurrency** | до 50 тенантов на 1 хосте при 32GB RAM + 1 GPU (тест-цель) |

## 8. Out-of-scope (v1)

- Stripe / платежи (только модели Payment в БД, без интеграции PSP)
- Мобильные приложения
- Realtime collaborative editing
- A/B тестирование
- Multi-region deployment
- Marketplace плагинов

## 9. Locked tech decisions

| Слой | Выбор | Причина |
|---|---|---|
| **Frontend** | SvelteKit + Svelte 5 runes | уже выбрано в текущем проекте |
| **DB** | **Postgres 16** (миграция с SQLite обязательна для prod) | concurrent writes, ACID, pgvector опционально |
| **ORM** | Prisma 7 | уже выбрано |
| **Vector store** | **Qdrant** в Docker, per-tenant контейнер | изоляция = ценность продукта |
| **LLM runtime** | **Ollama** (OpenAI-compatible API) | минимум кода, поддержка tool calling |
| **LLM модель** | `llama3.1:8b` (или `qwen2.5:7b`) | tool calling, 8B fit в потребительский GPU |
| **Embed модель** | `nomic-embed-text` (768d) | local через Ollama, free |
| **Image gen** | Automatic1111 SD WebUI + SDXL | REST API, локальная GPU |
| **Reverse proxy** | Traefik v3 | auto-TLS Let's Encrypt, Docker label discovery |
| **Container orchestrator** | Docker Compose (v1) | k8s — после 100+ тенантов |
| **CSS** | Custom CSS + CSS Custom Properties (НЕ Tailwind) | уже выбрано |
| **Auth** | bcrypt + JWT в httpOnly cookie | уже выбрано |
| **Email** | Nodemailer | уже выбрано |
| **Validation** | Zod | уже выбрано |
| **Crawler** | `@mozilla/readability` + `cheerio` + native fetch | стандарт индустрии |
| **Docker SDK** | `dockerode` | для Master app |

## 10. Domain glossary

- **Tenant** — застройщик, у которого свой Compose-стек.
- **Capability** — модуль платформы (catalog, seo-optimizer, ...). Всегда присутствует.
- **Skin** — динамическая часть тенанта: brand, taxonomy, customFields, voice, **подключенные источники истины**.
- **Source of Truth (SoT)** — внешняя система с авторитетными данными (1С / Xero / Bitrix / Confluence / S3 / Keycloak / event store / ...). 15 категорий — см. [08-ai-orchestrator.md](08-ai-orchestrator.md).
- **Adapter** — унифицированный интерфейс к конкретному SoT (`accounting-1c`, `crm-bitrix`, ...).
- **Engine** — один из 11 модулей AI Core (Identity / Knowledge / Data Access / Report / Accounting / Management / Tasks / Audit / Agent Registry / Tool Registry / Policy).
- **Orchestrator** — conductor AI Core: ничего сам не знает, диспетчирует движки.
- **QueryContext** — 11-факторный контекст одного запроса (резолвится Identity-движком).
- **DataScope** — формальное описание, к каким записям/полям имеет доступ конкретный пользователь.
- **RedactionPolicy** — правила скрытия PII/salaries/sensitive перед выдачей.
- **Trust Level** — `authoritative | derived | cached | inferred` для каждого источника.
- **Conflict resolution** — DSL-правила в `compliance_rules`, как разруливать противоречия между SoT.
- **Ingest** — процесс: crawl URL → chunk → embed → upsert в tenant-Qdrant. Готовит **knowledge_base**, не подменяет другие источники.
- **Bootstrap / Provision** — создание нового tenant-стека: compose render → up → migrate → ingest → **probe sources** → seed.
- **Master app** — control plane на `admin.groundz.estate`.
- **Tenant app** — app-контейнер тенанта.
- **`ai-net`** — внешний Docker network: Ollama / Auto1111 / llm-gateway / Traefik.
- **`audit_log`** — append-only журнал каждого AI-вопроса/ответа/действия. Read-only для всех кроме compliance officer.
