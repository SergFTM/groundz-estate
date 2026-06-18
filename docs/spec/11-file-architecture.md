# 11 — Файловая архитектура проекта

> Карта реальной структуры репозитория `groundz-svelte` (на 2026-06-18). Аннотирует, **где что лежит** и **куда добавлять новое**. Сгенерирована из дерева исходников.

## 0. Корень репозитория

```
groundz-svelte/
├── CLAUDE.md            # инструкции для AI-кодера (подтягивает AGENTS.md, docs/)
├── AGENTS.md            # конвенции платформы (immutable-правила)
├── README.md            # ориентир по проекту
├── package.json         # зависимости + скрипты (dev, build, check, prisma seed)
├── svelte.config.js     # конфиг SvelteKit
├── vite.config.ts       # конфиг Vite
├── tsconfig.json        # TypeScript (strict)
├── prisma.config.ts     # Prisma config (schema path, migrations, seed)
├── dev.db               # SQLite (dev) — сидируется prisma/seed.ts
├── prisma/              # схема БД, миграции, сид (см. §5)
├── static/              # статика: /fonts, /img, изображения туров
├── docs/                # спецификация (spec/) + скиллы (skills/) — см. §6
└── src/                 # весь код приложения (см. §1–§4)
```

## 1. Маршруты — `src/routes/`

SvelteKit-роутинг, сгруппирован по зонам (route groups в скобках имеют общий layout, но не влияют на URL).

```
src/routes/
├── +layout.svelte / +layout.server.ts   # корневой layout: nav + footer, locale, user
├── (marketing)/        # ПУБЛИЧНЫЙ САЙТ (SSR)
├── (cabinet)/          # КАБИНЕТЫ (по ролям)
├── api/                # JSON-эндпоинты (+server.ts)
└── auth/               # login / logout / forgot-password / reset-password
```

### 1.1 `(marketing)/` — публичная зона
```
+page.svelte                 # ЛЕНДИНГ (hero, метрики, пулы, ROI-калькулятор, платформа, CTA)
pools/                       # МАРКЕТПЛЕЙС пулов
  +page.svelte               #   список + фильтры (рынок/стратегия/статус)
  [slug]/+page.svelte        #   карточка пула (KPI, тезисы, milestones, sticky-сбор)
  [slug]/commit/             #   INVEST-FLOW (форма обязательства → Holding)
  compare/                   #   сравнение пулов
pricing/                     # уровни участия (MembershipTier)
invest/{how-it-works,protections,apply}/   # инвест-лендинги + заявка
projects/[slug]/             # объекты застройщика
knowledge/[slug]/            # база знаний (SEO-контент)
otc/[id]/                    # вторичный рынок (публичный просмотр)
about · contact · faq · privacy · terms · jobs · lead-quiz · lead-forms · roi-calculator
```

### 1.2 `(cabinet)/` — кабинеты по ролям
```
investor/    # портфель, pools, cashflow, risk, construction, documents, onboarding, otc
buyer/       # property, payments, documents, construction, otc
agent/       # clients, leads, commissions
admin/       # CRM (leads/users/investors/kyc), projects + tour-gen (AI 3D),
             # финансы (payments/documents/investment-pools/commits/reporting),
             # контент (articles/comments/market-indices/otc/faq/jobs),
             # seo (pages/clusters/issues), settings, underwriting
```
> Кабинет рендерит свой сайдбар (`components/cabinet/CabinetSidebar.svelte`). Каждая страница — пара `+page.svelte` + `+page.server.ts` (загрузка через Prisma).

### 1.3 `api/` — серверные эндпоинты (≈40)
```
ai/chat                      # общий AI-чат
invest/                      # pool-chat, pool-compare, portfolio-insight, risk-narrative,
                             #   cashflow-forecast, metric-explain, construction-alert, pipeline-insight
seo/                         # generate-cluster, generate-meta, audit-page, rewrite-section, suggest-links, setup/*
market/                      # ai-insight, prices, sync
otc/                         # listings/offers (+ admin approve/reject, accept/decline)
generate-tour · generate-floor-plan · regenerate-room · save-tour-images   # AI 3D / туры
articles/comments/* · book-consultation · settings/auto-mod · model-config · upload-floor-plan
```

## 2. UI-компоненты — `src/lib/components/`

```
components/
├── NavigationMenu.svelte    # глобальная навигация (бренд, ссылки, RU/EN, logout)
├── Footer.svelte            # глобальный футер (ink-deep, колонки)
├── ROICalculator.svelte     # калькулятор доходности
├── InvestmentCard / ProjectCard / UnitCard / ArticleCard / JobCard / KPICard
├── ProjectCarousel / ProjectTourSection / FloorTourViewer / FloorPlanDiagram
├── LeadQuizWidget / FAQAccordion / AIChatWidget / CookieConsent
├── cabinet/   # CabinetSidebar, CabinetTabs, DataTable, DetailCard, StatusBadge, ConstructionTimeline
├── invest/    # MetricTooltip
├── market/    # MarketChart
└── ui/        # Button, Modal, ProgressBar, Toast, KPICard (примитивы)
```

## 3. Серверный слой — `src/lib/server/`

```
server/
├── db.ts              # Prisma-клиент (default export)
├── auth.ts            # JWT + bcrypt; verifyToken
├── guards.ts / ai-guard.ts   # гварды доступа / AI
├── local-llm.ts       # LLM-gateway: capability-роутинг на two-tier (Ollama)
├── ai.ts / ai-tools.ts / ai-context.ts   # AI-обвязка фронт-эндпоинтов
├── gemini-tour.ts / local-image.ts        # AI 3D-туры / изображения
├── email.ts · rate-limit.ts · settings.ts · upload.ts
├── market/sync.ts     # синхронизация рыночных индексов
├── otc/service.ts     # сервис вторичного рынка
├── seo/               # SEO-AI: orchestrator, analyzer, scorer, rules, ai-client/cache/fallback/semantic, prompts/*.txt
└── ai-core/           # ЯДРО AI-ОРКЕСТРАТОРА (см. §3.1)
```

### 3.1 `server/ai-core/` — оркестратор источников истины
```
ai-core/
├── orchestrator/      # дирижёр: lifecycle одного вопроса, маршрутизация к движкам
├── data-access/       # адаптеры к 15 источникам истины (adapters/) + DataScope
├── identity/          # кто спрашивает: роль, юрлицо, права
├── policy/            # pre/post-check прав и комплаенса (rules/)
├── audit/             # неотключаемый append-only журнал
├── knowledge/         # RAG-движок (Qdrant)
├── management-accounting/investment/   # детерминированный инвест-калькулятор
│                                       #   (assumptions, calc, types, calc.test)
├── accounting/ · reports/ · tasks/ · tools/ · agents/(presets)
└── README.md
```
> Контракт: 11-факторный QueryContext → policy pre-check → движок → policy post-check → audit. Подробности — [08-ai-orchestrator.md](08-ai-orchestrator.md).

## 4. Прочее в `src/lib/`

```
lib/
├── i18n.ts            # словари RU/EN + t() / tStatus()
├── stores/            # locale.ts (UI-локаль + setLocale), platform.ts (auth-стейт)
├── modules/seo/       # фронт-модуль SEO: api/, components/, stores/, types/
├── utils/             # форматтеры, scroll-reveal и т.п.
├── types/             # общие типы
├── assets/            # favicon и т.д.
└── index.ts
src/generated/prisma/  # СГЕНЕРИРОВАННЫЙ Prisma-клиент (НЕ редактировать руками)
```

## 5. Данные — `prisma/`

```
prisma/
├── schema.prisma      # 33 модели; токен-слой Pool/Holding/Transaction/MembershipTier (см. 10-rebrand-groundz §4)
├── migrations/        # именованные миграции (включая rebrand_pool_holding_tokens)
└── seed.ts            # демо-данные (пулы, holdings, транзакции, тарифы, пользователи)
```

## 6. Документация — `docs/`

```
docs/
├── spec/              # ТЗ-спеки 00-vision … 09-investment-engine, 10-rebrand-groundz, 11-file-architecture (этот файл)
├── skills/            # runbooks для AI-кодеров (stack-locks, svelte5, prisma-tenant, design-system, …)
└── superpowers/       # исторические планы/спеки сессий
```

## 7. Куда добавлять новое (правила)

| Хочу добавить | Куда |
|---|---|
| Публичную страницу | `src/routes/(marketing)/<route>/+page.svelte` (+ `+page.server.ts` для данных) |
| Экран кабинета | `src/routes/(cabinet)/<role>/<route>/` + пункт в `components/cabinet/CabinetSidebar.svelte` |
| JSON/AI-эндпоинт | `src/routes/api/<group>/<name>/+server.ts` |
| Переиспользуемый UI | `src/lib/components/` (примитивы — в `ui/`) |
| Серверный сервис | `src/lib/server/<name>.ts`; AI-логика — в `ai-core/` через оркестратор |
| Поле/модель БД | `prisma/schema.prisma` → `prisma migrate` → `prisma generate` (клиент не править руками) |
| Строки RU/EN | `src/lib/i18n.ts` (неймспейсы nav·home·pools·pool·pricing·cab·auth·contact·deal) |
| Новый источник истины (токены/платежи/KYC) | адаптер в `ai-core/data-access/adapters/` + policy-правило + audit-hook |

## 8. Аудит: мёртвые зоны (2026-06-19)

Swagger/OpenAPI в проекте нет — «ручки» = эндпоинты `src/routes/api/**/+server.ts`.

**API-ручки без вызовов с фронта** (бек есть, никто не зовёт):
- `POST /api/otc/admin/listings/[id]/approve` — дубль; админка использует form-action `?/approve` → `approveListing()`.
- `POST /api/otc/admin/listings/[id]/reject` — дубль; form-action `?/reject` → `rejectListing()`.

> Остальные 38 эндпоинтов вызываются. Решение владельца: пока **не удалять** (задокументировано).

**Неиспользуемые компоненты** (не импортируются):
- Мусор: `InvestmentCard`, `KPICard`, `ui/Button`, `ui/KPICard`, `ui/Modal` — оставлены (по решению).
- `LeadQuizWidget`, `ProjectCarousel` — были осиротевшими после переверстки лендинга, **возвращены на лендинг**.

**Крупные файлы (>500 строк)** — кандидаты на разбиение на компоненты:
`admin/tour-gen` (был 1519 → 1463, вынесен `tour-gen.helpers.ts`), `(marketing)/pools` (817),
`pools/[slug]` (757), `components/AIChatWidget` (685), `admin/seo` (673), `modules/seo/SeoPanel` (646),
`knowledge/[slug]` (628), `buyer` (605), `about` (567). Полное разбиение tour-gen (виджеты + общий
`tg__*` style-namespace) требует ручного QA AI-флоу.
