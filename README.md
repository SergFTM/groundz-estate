# Groundz Platform

> Multi-tenant конструктор премиум-сайтов **и операционных платформ** для застройщиков. Один URL → автоматически развёрнутая, изолированная платформа-зеркало с собственным брендом, БД, кабинетами и AI.
>
> **AI ≠ источник истины. AI = оркестратор источников истины.** Платформа знает, где живёт правда (бухгалтерия, CRM, документы, регламенты, IAM, журналы, microservices), и оркестрирует доступ с проверкой прав и compliance на каждом шаге.

**Status:** v1.1 spec locked (2026-05-05). Текущий код — single-tenant (Groundz Limassol). Phase 0 = миграция в multi-tenant + AI orchestrator core.

---

## ⚡ START HERE — для нового разработчика / AI-агента

Прочитать в этом порядке (займёт 30–40 мин — даёт ПОЛНЫЙ контекст без этого чата):

### 1. ТЗ (`docs/spec/`)
| Порядок | Файл | О чём |
|---|---|---|
| 1 | [docs/spec/00-vision.md](docs/spec/00-vision.md) | Что строим, для кого, ценность, immutable принципы |
| 2 | [docs/spec/01-architecture.md](docs/spec/01-architecture.md) | Топология: shared AI + control plane + per-tenant Docker |
| 3 | [docs/spec/02-capabilities.md](docs/spec/02-capabilities.md) | 10 capabilities-каркас, manifest contract |
| 4 | [docs/spec/03-ai-core-rag.md](docs/spec/03-ai-core-rag.md) | LLM-gateway, two-tier модели (small/large), RAG, concurrency |
| 5 | [docs/spec/04-tenancy.md](docs/spec/04-tenancy.md) | Master/Tenant DB schemas, compose templates, lifecycle |
| 6 | [docs/spec/05-bootstrap-flow.md](docs/spec/05-bootstrap-flow.md) | URL → live mirror за ~15 мин (13 шагов) |
| 7 | [docs/spec/06-roadmap.md](docs/spec/06-roadmap.md) | 9 фаз, acceptance criteria |
| 8 | [docs/spec/07-stack-decisions.md](docs/spec/07-stack-decisions.md) | **LOCKED** stack, banned list, naming |
| 9 | [docs/spec/08-ai-orchestrator.md](docs/spec/08-ai-orchestrator.md) | **AI = оркестратор.** 11 движков, 15 SoT, QueryContext, Policy/Audit |

### 2. Skills для AI-кодера (`docs/skills/`)
Перед изменением кода — открой соответствующий skill:

| Skill | Когда читать |
|---|---|
| [01-stack-locks](docs/skills/01-stack-locks.skill.md) | Перед `npm install` или выбором подхода |
| [02-svelte5-patterns](docs/skills/02-svelte5-patterns.skill.md) | Любой `.svelte` файл, runes |
| [03-sveltekit-server](docs/skills/03-sveltekit-server.skill.md) | `+server.ts`, `+page.server.ts`, hooks |
| [04-prisma-tenant](docs/skills/04-prisma-tenant.skill.md) | Schema/миграции/multi-tenant Prisma |
| [05-local-ai](docs/skills/05-local-ai.skill.md) | LLM/SD вызов, embeddings, кэш, tier'ы |
| [06-rag-pipeline](docs/skills/06-rag-pipeline.skill.md) | crawl/chunk/embed/Qdrant |
| [07-capability-development](docs/skills/07-capability-development.skill.md) | Новая или изменённая capability |
| [08-docker-multitenancy](docs/skills/08-docker-multitenancy.skill.md) | Compose templates, dockerode |
| [09-security-checklist](docs/skills/09-security-checklist.skill.md) | Перед каждым PR |
| [10-design-system](docs/skills/10-design-system.skill.md) | Стилизация, tokens, frosted glass |
| [11-testing-and-build](docs/skills/11-testing-and-build.skill.md) | Перед merge |
| [12-ai-orchestrator](docs/skills/12-ai-orchestrator.skill.md) | Любое изменение в `src/lib/server/ai-core/` — обязательно |

---

## Hard locks (не нарушать без TZ-апдейта)

См. [docs/spec/07-stack-decisions.md](docs/spec/07-stack-decisions.md) + [08-ai-orchestrator.md](docs/spec/08-ai-orchestrator.md). Главное:

- ✅ **AI = оркестратор источников истины, не источник.** 11 движков, 15 SoT, 11-факторный QueryContext, Policy pre/post-check, Audit append-only.
- ✅ **Локальные модели only** через Ollama + Auto1111
- ✅ **Two-tier LLM:** `llama3.2:3b` (small) + `qwen2.5:14b` (large) — ОБА постоянно загружены
- ✅ **Один LLM-сервер** (Ollama) + `llm-gateway` спереди = fair queue + per-tenant rate-limit
- ✅ **Postgres 16** per-tenant Docker container
- ✅ **Qdrant** per-tenant Docker container
- ✅ **Docker-per-tenant** — каждый застройщик = свой стек (`{slug}-app`, `{slug}-db`, `{slug}-qdrant`)
- ✅ **Capability-Frame + Dynamic Skin** — каркас фиксирован, AI расширяет только динамические поля и подключенные источники
- ✅ **Custom CSS** + CSS Custom Properties (НЕ Tailwind)
- ✅ **SvelteKit + Svelte 5 runes** — `$state`, `$derived`, `$props`, `$effect`
- ❌ Cloud AI keys (OpenAI / Anthropic / Gemini) — ЗАПРЕЩЕНЫ
- ❌ LLM как источник фактов — ЗАПРЕЩЕНО (LLM формулирует ответ ИЗ данных адаптеров, не из памяти модели)

---

## Текущее состояние кода

### Что готово (Sessions 1–7)
- Marketing routes, 4 кабинета (admin/buyer/investor/agent)
- SEO AI module, Investment module, OTC market
- AI переведён на локальные модели (Ollama + Auto1111)
- 23 эндпоинта защищены `aiGuard()` (auth + rate-limit)
- Two-tier roting через `capability` параметр в `localChat()`
- Login cookie `secure: !dev`, reset-token логи только в dev
- ТЗ + 11 skills зафиксированы

### Что НЕ готово (см. roadmap)
- **Phase 0** — Postgres миграция (сейчас SQLite через `@prisma/adapter-better-sqlite3`)
- **Phase 0** — явный adapter (`@sveltejs/adapter-node`)
- **Phase 1** — `infra/ai.compose.yml` (shared Ollama + Auto1111 + Traefik + llm-gateway)
- **Phase 2** — master-app skeleton
- **Phase 3** — manual provisioning через dockerode
- **Phase 4** — ingest pipeline (crawler → chunker → embedder → Qdrant)
- **Phase 5** — schema-agent (brand + skin)
- **Phase 6** — seeder
- **Phase 7** — end-to-end UX
- **Phase 8** — operational hardening
- **Phase 9** — code cleanup (a11y warnings, DOMPurify)

---

## Развёртывание (текущее, single-tenant dev)

```sh
# 1. Установка
npm install
npx prisma generate
npx prisma migrate deploy   # или migrate dev для разработки

# 2. Локальный AI стек (требуется один раз)
ollama serve &
ollama pull llama3.2:3b
ollama pull qwen2.5:14b
ollama pull nomic-embed-text

# 3. Запуск
cp .env.example .env        # отредактируй JWT_SECRET, SMTP_*
npm run dev                 # http://localhost:5173

# 4. Проверки перед commit'ом
npm run check               # должно быть 0 errors
npm run build               # должно завершиться успешно
```

См. [docs/skills/11-testing-and-build.skill.md](docs/skills/11-testing-and-build.skill.md) — definition of done.

---

## Развёртывание (целевое, multi-tenant prod) — будет в Phase 1+

```sh
# 1. Один раз на хосте
docker network create ai-net
docker compose -f infra/ai.compose.yml up -d        # Ollama + Auto1111 + llm-gateway + Traefik
docker compose -f infra/master.compose.yml up -d    # super-admin app + master Postgres

# 2. Создание тенанта (через super-admin UI на admin.groundz.estate)
# POST /super/tenants { url: "https://acme-realty.com", slug: "acme", domain: "acme-realty.com" }
# → master-app:
#   - render stacks/acme/docker-compose.yml
#   - docker compose up -d (db + qdrant + app)
#   - ingest pipeline (crawl → chunk → embed → Qdrant)
#   - schema-agent → brand.json + skin.json
#   - seed Project/Unit/FAQ
#   - Traefik подхватывает Host(`acme-realty.com`) → SSL автоматом
```

См. [docs/spec/05-bootstrap-flow.md](docs/spec/05-bootstrap-flow.md).

---

## Структура проекта

```
groundz-svelte/
├── docs/
│   ├── spec/                # 8 файлов ТЗ + README
│   └── skills/              # 11 файлов skills для AI-кодера + README
├── prisma/
│   ├── schema.prisma        # будет split на master + tenant в Phase 0
│   └── migrations/          # 9 миграций
├── src/
│   ├── app.css              # design tokens (НЕ ТРОГАТЬ структуру)
│   ├── app.html             # font preloads
│   ├── hooks.server.ts      # auth + (Phase 0) tenant resolver
│   ├── lib/
│   │   ├── components/      # Svelte компоненты
│   │   ├── server/
│   │   │   ├── local-llm.ts        # Ollama OpenAI-compat client + tier router
│   │   │   ├── local-image.ts      # Auto1111 SD client
│   │   │   ├── ai-guard.ts         # auth + rate-limit для AI endpoints
│   │   │   ├── rate-limit.ts       # token bucket
│   │   │   ├── auth.ts             # JWT + bcrypt
│   │   │   ├── db.ts               # Prisma client (Phase 0: split)
│   │   │   ├── email.ts            # nodemailer
│   │   │   ├── settings.ts         # AppSetting w/ AES-256-GCM
│   │   │   ├── seo/                # SEO-AI модуль
│   │   │   ├── otc/                # OTC market
│   │   │   ├── market/             # market data
│   │   │   ├── ai-context.ts       # business context для chat
│   │   │   ├── ai-tools.ts         # tool calling schemas
│   │   │   ├── ai.ts               # main chat handler
│   │   │   ├── gemini-tour.ts      # tour image generation
│   │   │   ├── guards.ts           # requireAuth/requireRole
│   │   │   └── upload.ts           # file uploads
│   │   ├── stores/
│   │   ├── types/
│   │   └── utils/validators.ts     # Zod schemas
│   └── routes/
│       ├── (cabinet)/              # admin/buyer/investor/agent
│       ├── (marketing)/            # публичные страницы
│       ├── auth/                   # login/register/forgot/reset
│       └── api/                    # 40+ endpoints
├── static/
│   ├── fonts/                      # IvyoraDisplay + HelveticaNowText (self-hosted)
│   └── images/
├── package.json
├── svelte.config.js                # adapter-auto (поменять на adapter-node в Phase 0)
├── prisma.config.ts
└── README.md                       # этот файл
```

---

## Memory & convention

### Auto-memory
Если используешь Claude Code — система памяти живёт в `~/.claude/projects/.../memory/`:
- `MEMORY.md` — index
- `platform_pivot_v1.md` — фиксация решений 2026-05-05
- `design-system.md` — design tokens detail
- `project_*.md` — детали по сессиям

### Conventions
- **Files:** kebab-case (`local-llm.ts`)
- **Components:** PascalCase (`ProjectCard.svelte`)
- **CSS:** BEM-lite (`.project-card__title--featured`)
- **API:** `/api/{namespace}/{action}/+server.ts`
- **Slugs:** `^[a-z][a-z0-9-]{1,30}$`
- **Container names:** `{slug}-app`, `{slug}-db`, `{slug}-qdrant`
- **Networks:** `ai-net` (shared), `{slug}-net` (tenant)
- **Qdrant collection:** `{slug}_rag`

---

## Mantra

1. **AI = оркестратор источников истины, не источник.**
2. Резолв 11-факторного QueryContext до любого engine call.
3. Adapter ко всему, всегда DataScope, всегда audit.
4. Policy pre-check + post-check обязательны.
5. Локально, никаких cloud AI keys.
6. Каждый тенант = свой Docker stack.
7. Capability immutable, skin dynamic.
8. RAG читает только свою коллекцию.
9. Один LLM-сервер, две модели, fair queue.
10. Auth + rate-limit на каждом AI endpoint.
11. Build green = right to merge.

---

## Дальше делать

Открыть [docs/spec/06-roadmap.md](docs/spec/06-roadmap.md) → Phase 0 → выполнять задачи по списку. Acceptance criteria для каждой фазы там же.
