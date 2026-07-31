# Groundz Platform — Specification

**Locked v1.0 (2026-05-05)** — единый источник истины по архитектуре, стеку и плану. Любое изменение здесь = ТЗ-апдейт.

## Reading order

1. [00-vision.md](00-vision.md) — что строим, для кого, ценность, immutable принципы
2. [01-architecture.md](01-architecture.md) — топология (shared AI + per-tenant Docker)
3. [02-capabilities.md](02-capabilities.md) — иммутабельный каркас (Capability-Frame)
4. [03-ai-core-rag.md](03-ai-core-rag.md) — локальный AI стек + RAG (Knowledge Engine)
5. [04-tenancy.md](04-tenancy.md) — мульти-тенант через Docker-per-tenant
6. [05-bootstrap-flow.md](05-bootstrap-flow.md) — URL → live mirror за ~15 минут
7. [06-roadmap.md](06-roadmap.md) — фазы 0-9, acceptance criteria
8. [07-stack-decisions.md](07-stack-decisions.md) — locked tech, banned list
9. **[08-ai-orchestrator.md](08-ai-orchestrator.md)** — AI = оркестратор источников истины. 11 движков, 15 SoT, 11-факторный QueryContext, lifecycle одного вопроса, Policy/Audit/Agents/Tools
10. [09-investment-engine.md](09-investment-engine.md) — детерминированный калькулятор инвест-сценариев (Buy-Hold / BRRRR / Flip), per-market assumptions, math invariants

## TL;DR

> Мультитенантный конструктор сайтов и операционных платформ для застройщиков. Один URL → AI разворачивает зеркало с собственным брендом, БД, кабинетом, инвест-модулем, SEO-AI. **AI = оркестратор источников истины** (бухгалтерия, CRM, документы, регламенты, IAM, журналы, microservices) — не «знает сам», а спрашивает источники с проверкой прав и compliance. Ядро состоит из оркестратора + 11 специализированных движков. Стек — локальные модели (Ollama + Auto1111) shared между всеми тенантами; всё остальное — изолированный Docker-стек на каждого. Capability-каркас фиксированный, AI расширяет только динамические поля.

## Companion

[../skills/](../skills/README.md) — runbooks для AI-кодеров, работающих над платформой.

## Mantra

1. **AI = оркестратор источников истины, не источник.**
2. Резолв 11-факторного QueryContext до любого engine call.
3. Adapter ко всему: 15 SoT, единый интерфейс, всегда DataScope.
4. Policy pre-check + post-check обязательны.
5. Audit-everything append-only, non-bypassable.
6. Локально, никаких cloud AI keys.
7. Каждый тенант = свой Docker stack.
8. Capability immutable, skin dynamic.
9. RAG читает только свою коллекцию.
10. Auth + rate-limit на каждом AI endpoint.
11. Build green = right to merge.
