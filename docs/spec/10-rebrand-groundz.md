# 10 — Rebrand: Develta → GROUNDZ ESTATE

> **STATUS: DRAFT / SKELETON (2026-06-18).** Каркас собран из хэндофф-брифа. Секции с пометкой `TODO` заполняются владельцем продукта, после чего документ переводится в `Locked` и дата проставляется в [00-vision.md](00-vision.md).
>
> Источник истории: ребренд + токенизированный/AI-слой поверх **существующего** инвест-движка (см. [09-investment-engine.md](09-investment-engine.md), [08-ai-orchestrator.md](08-ai-orchestrator.md)). Это **не** проект с нуля.

## 0. Scope & принцип

Что делаем: ребренд `Develta` → `GROUNDZ ESTATE` + токенизированный слой инвестиций + AI-слой во фронтенде.

Визуальный источник истины: прототип **`Develta Tokenized.dc.html`**.
> ⚠️ Прототип в репозитории отсутствует. **TODO:** положить файл в `groundz-svelte/static/prototype/` (или указать путь) — без него редизайн делается «по описанию».

**Не трогаем (immutable):**
- AI-оркестратор и контракт `orchestrator.ask()` — см. [08-ai-orchestrator.md](08-ai-orchestrator.md). AI = оркестратор источников истины, не источник.
- Multi-tenancy (Docker-per-tenant, DB-per-tenant, Qdrant-per-tenant) — см. [04-tenancy.md](04-tenancy.md).
- 11-факторный QueryContext, Policy pre/post-check, non-bypassable Audit.
- Стек-локи: SvelteKit + Svelte 5 runes, кастомный CSS (без Tailwind), локальный AI — см. [07-stack-decisions.md](07-stack-decisions.md), [docs/skills/01-stack-locks.skill.md](../skills/01-stack-locks.skill.md).

## 1. Ребренд (naming)

| Было | Стало |
|------|-------|
| Develta | GROUNDZ ESTATE |

**TODO:** зафиксировать: tone of voice, написание (GROUNDZ vs Groundz vs GROUNDZ ESTATE по контекстам), favicon/OG, юр. название, домен, e-mail-домены, упоминания в `seed.ts` и контенте.

## 2. Дизайн-токены — ✅ РЕАЛИЗОВАНО (R0, сверено с прототипом)

> **Шрифт-решение:** заголовки — **Ivyora** (locked-решение + правило self-hosted). Прототип местами использует **Cormorant** (Google), но его НЕ принимаем, чтобы не нарушать self-hosted и не плодить зависимость. Если нужен Cormorant — self-host `.woff2` отдельной задачей. IBM Plex Mono — для цифр (`.num`), `.woff2` ещё не добавлен (системный fallback).

Расширяет [docs/skills/10-design-system.skill.md](../skills/10-design-system.skill.md). Токены живут в `src/app.css`; tenant-skin переопределяет через injected `:root` (см. skill). Custom CSS, **Tailwind запрещён**.

| Токен | Значение | Заметка |
|-------|----------|---------|
| `--color-primary` | `#104e49` (зелёный) | основной бренд GROUNDZ |
| `--color-accent` (sage) | **TODO: hex** | sage-палитра |
| `--font-heading` | `Ivyora` | заголовки |
| `--font-body` | `Helvetica Now` | текст |
| `--font-mono` | `IBM Plex Mono` | **только цифры/метрики** (yield, IRR, суммы) |

**TODO:** полная палитра (sage-шкала, фоны, бордеры, states), точные имена `@font-face` и наличие `.woff2` в `static/fonts/`, правила «где mono» (таблицы/калькуляторы/тикеры). Сверить с прототипом.

## 3. Информационная архитектура и роуты — ✅ РЕАЛИЗОВАНО (R2)

> **Сделано:** `(marketing)/investment` → `(marketing)/pools` (все 4 экрана: листинг, `[slug]`, `compare`, `[slug]/commit`). 44 ссылки `/investment` → `/pools` (admin `/admin/investment-pools` и `/invest/*`-лендинг не тронуты). **301-редирект** `/investment*` → `/pools*` в `hooks.server.ts` (с сохранением под-путей и query). Новый роут **`/pricing`** ([+page.server.ts](../../src/routes/(marketing)/pricing/+page.server.ts) грузит `MembershipTier`, есть empty-state до сидов). `/pricing` добавлен в навигацию и футер. `npm run check` = 0 ошибок.

Новые/изменённые публичные роуты (группа `(marketing)`):

| Роут | Назначение | Текущий аналог |
|------|------------|----------------|
| `/pools` | листинг пулов | `(marketing)/investment` / `/invest` |
| `/pools/[slug]` | детальная пула | `(marketing)/investment/[slug]` |
| `/pricing` | тарифы/membership | — (новый) |
| кабинет инвестора | портфель/холдинги | `(cabinet)/investor/*` (уже есть) |

**TODO:** решить — `/pools` это **переименование** существующих `/investment` маршрутов (с redirect старых URL ради SEO) или новые рядом. Зафиксировать полную карту IA, навигацию, редиректы 301, и связь `/pricing` ↔ `MembershipTier`. Сверить с прототипом.

## 4. Данные (Prisma) — РЕШЕНИЕ: расширяем существующее — ✅ РЕАЛИЗОВАНО (R1)

> **Сделано (миграция `20260618122131_rebrand_pool_holding_tokens`):** модели переименованы `Pool`/`Holding` через `@@map` (имена таблиц `InvestmentPool`/`InvestorInvestment` сохранены → данные не тронуты). Добавлены `Pool.{tokenSymbol,totalTokens,pricePerToken,tokensSold}`, `Holding.tokens`, новые `Transaction` (userId/poolId?/holdingId?/type/tokens/amount/status) и `MembershipTier` (slug/name/price/minTicket/maxTicket?/perks/order/active). Код (29 файлов) переведён на `db.pool`/`db.holding`. `npm run check` = 0 ошибок. Relation-поля (`investments`, `pool`, `investment`) оставлены как есть.

**Подход (зафиксирован): расширить существующие модели, без дублей.** Карта:

| Новая сущность | Базируется на | Действие |
|----------------|---------------|----------|
| `Pool` | `InvestmentPool` ([schema.prisma:150](../../prisma/schema.prisma)) | переименование/надстройка; slug, dealType, targetYield/targetIrr, status уже есть |
| `Holding` | `InvestorInvestment` ([schema.prisma:191](../../prisma/schema.prisma)) | надстройка + токенизация (доли/токены поверх `amount`) |
| `Transaction` | — | **новая** модель (движения: buy/sell/distribution/fee) |
| `MembershipTier` | — | **новая** модель (тарифы, лимиты тикета, доступ) |

Правила:
- Никаких параллельных дублей `InvestmentPool` + `Pool`. Если переименование — через миграцию с сохранением данных.
- Связи `Milestone`, `ConstructionReport`, `Document`, `OtcListing` сейчас завязаны на `InvestmentPool`/`InvestorInvestment` — при переименовании обновить FK и relation-имена.
- Tenant-scoping сохраняется (`event.locals.tenant.prisma`, не глобальный `db`).

**TODO:** поля токенизации (`tokenSymbol`? `totalTokens`? `pricePerToken`? `Holding.tokens`?), enum'ы статусов `Transaction`, поля `MembershipTier` (название, цена, minTicket, перки), миграционный план (rename vs add), seed-данные.

## 5. Компоненты для форка — 🟡 ЧАСТИЧНО (R3)

> **Прототип получен** (`GROUNDZ ESTATE - Prototype (standalone).html` в корне). Токены R0 сверены с ним: `--ink #104e49`, `--ink-deep #0c3a35`, `--acc #7a8c6e`, `--acc-dk #5f7257`, `--pos #4f8a5b` (→ `--color-positive`), mono IBM Plex Mono. ⚠️ прототип использует **Cormorant** для части заголовков наряду с Ivyora — расхождение с locked-решением (и Google-шрифт vs self-hosted), решение за владельцем.
> **Сделано:** листинг `/pools` (карточка: токен-слой + `.num` + зелёный IRR/фильтры/табы) **и** детальная `/pools/[slug]` (KPI mono, IRR/токены зелёным, token-KPI `tokensSold/totalTokens` + price/token, green commit-CTA, `.num` на суммах). `InvestmentCard.svelte` — мёртвый (не импортируется).
> **Сделано (добор):** `ROICalculator` (green-контролы + mono), `compare`-экран (green CTA), invest-флоу `[slug]/commit` (green CTA — это и есть «invest-модалка»: в приложении это страница, не модалка; `ui/Modal.svelte` не используется нигде).
> **Осталось:** «пресейл-модуль» как компонент в приложении отсутствует (секция прототипа без таргета) — нужно решение, строить ли отдельный пресейл-блок на детальной пула.

**TODO:** список компонентов из прототипа, которые форкаем/адаптируем (карточка пула, calculator, фильтры, invest-модалка, тикеры цифр на IBM Plex Mono). Указать исходные `.svelte` в `src/lib/components/` и что меняется. Прототип подтверждён: экраны, RU/EN, калькуляторы, фильтры, invest-модалка работают.

## 6. AI-слой фронтенда

Все AI-вызовы идут через `orchestrator.ask()` — **никаких ad-hoc system prompts в route-коде** (Hard rule #11). Существующие эндпоинты: `/api/invest/*` (pool-chat, pool-compare, portfolio-insight, risk-narrative, metric-explain, cashflow-forecast …), `/api/ai/chat`, `/api/market/ai-insight`.

**Аудит R5:** `/api/invest/*` компилируются под `Pool`/`Holding` (свип `db.pool`/`db.holding`), бренд в промптах = «Groundz», `Transaction` пока не используется ни одним AI-эндпоинтом. AI-вызовы идут через `callAI`/`localChat` (gateway по `capability`). ⚠️ **пред-существующий долг:** инвест-эндпоинты держат ad-hoc `systemPrompt` в route-коде (формально расходится с Hard rule #11), но инвест-оркестратор бриф просил **не трогать** — выносить в `orchestrator.ask()` это отдельная архитектурная задача, не часть ребренда.

## 7. i18n (RU + EN) — 🟡 ФУНДАМЕНТ (R6)

> **Сделано (dependency-free, без новой зависимости):** [`$lib/i18n.ts`](../../src/lib/i18n.ts) (словари en/ru + `t(locale,key)`), [`$lib/stores/locale.ts`](../../src/lib/stores/locale.ts) (store + `setLocale` через cookie + reload для корректного SSR), локаль резолвится в [`+layout.server.ts`](../../src/routes/+layout.server.ts) из cookie `locale`, проставляется `<html lang>`. Рабочий **переключатель EN/RU** в навигации; ссылки nav + Invest/Cabinet/Login переведены.
> **Сделано (добор):** hero лендинга, `/pricing`, и листинг `/pools` (hero, trust-бар ×6, фильтр «Страна»/«Все», compare-ссылка, empty-state, метки метрик карточки) переведены через `t()`; цифры на `.num`. Словарь: `nav.*`, `home.*`, `pricing.*`, `pools.*`, `common.*`.
> **Сделано (добор):** детальная `/pools/[slug]` — back-ссылка, KPI-метки (+токены), заголовки секций (Why This Pool / Yield Scenarios / Construction Milestones), тезисы, сайдбар (Funding/Capital/Exit/Investors), CTA (Commit/Login to Invest), talk-to-team. Неймспейс `pool.*`.
> **Сделано (добор):** кабинет инвестора `(cabinet)/investor/portfolio` — заголовки, сводка (Commitments/Total/tokens), empty-states, заголовки таблиц (holdings + транзакции), заголовки графиков, типы транзакций (Buy/Sell/Distribution/Fee). Неймспейс `cab.*`.
> **Осталось:** market-indices/AI-секция и deal-type табы на `/pools`, enum-метки статусов/стратегий в графиках портфеля (`LABEL_MAP`), формы (login/apply), прочие секции лендинга. Прототип содержит обе локали — брать тексты оттуда.

## 8. Definition of Done

```sh
cd groundz-svelte
npm run check        # 0 errors, без новых warnings
npm run build        # success
```
Плюс для публичных страниц — Lighthouse targets из [docs/skills/10-design-system.skill.md](../skills/10-design-system.skill.md) (Perf ≥ 90, A11y ≥ 95, BP ≥ 95, SEO ≥ 95).

## 9. Открытые вопросы (для архитектора/дев-агента)

1. `/pools` — rename `/investment` (+301) или новые роуты?
2. `Pool`/`Holding` — точные новые поля токенизации и миграционная стратегия (rename vs add).
3. Где находится прототип `Develta Tokenized.dc.html` (нужен как visual SoT).
4. Полная палитра sage + точные `@font-face` (Ivyora / Helvetica Now / IBM Plex Mono).
