# Groundz AI Coder Skills

Эти файлы — reference для AI-агента, работающего над кодом Groundz. Каждый skill = тематический мини-runbook с локальными правилами, командами, примерами.

**Принципы пользования:**
1. Перед изменением кода в области skill'а — прочитать соответствующий `*.skill.md`.
2. Если skill противоречит запросу пользователя — следовать пользователю, но flag это в ответе.
3. Если skill не покрывает кейс — обновить skill после успешной имплементации, не позже.

## Index

| Skill | Когда применять |
|---|---|
| [01-stack-locks.skill.md](01-stack-locks.skill.md) | любое решение «какую библиотеку взять», «какой паттерн использовать» |
| [02-svelte5-patterns.skill.md](02-svelte5-patterns.skill.md) | компоненты, runes, data flow, реактивность |
| [03-sveltekit-server.skill.md](03-sveltekit-server.skill.md) | роуты, hooks, form actions, +server.ts, env |
| [04-prisma-tenant.skill.md](04-prisma-tenant.skill.md) | работа с БД, миграции, multi-tenant Prisma client |
| [05-local-ai.skill.md](05-local-ai.skill.md) | вызов локального LLM/SD, embeddings, кэш |
| [06-rag-pipeline.skill.md](06-rag-pipeline.skill.md) | ingest, chunking, Qdrant upsert/retrieve |
| [07-capability-development.skill.md](07-capability-development.skill.md) | создать новую capability или изменить существующую |
| [08-docker-multitenancy.skill.md](08-docker-multitenancy.skill.md) | работа с compose templates, dockerode, master ↔ tenant |
| [09-security-checklist.skill.md](09-security-checklist.skill.md) | перед каждым PR: auth, rate-limit, sanitize, secrets |
| [10-design-system.skill.md](10-design-system.skill.md) | стилизация, design tokens, frosted glass, typography |
| [11-testing-and-build.skill.md](11-testing-and-build.skill.md) | npm run check / build, что значат warnings, как валидировать |
| [12-ai-orchestrator.skill.md](12-ai-orchestrator.skill.md) | **AI = оркестратор источников истины.** 11 движков, 15 SoT, QueryContext, Policy/Audit/Adapter contract — открой при любом изменении в `src/lib/server/ai-core/` |
