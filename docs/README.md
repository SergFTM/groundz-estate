# Groundz — Documentation Index

Open `../README.md` first if you haven't.

## Two main directories

### [`spec/`](spec/README.md) — Technical Specification (TZ)
8 markdown files + index. **Locked v1.0 (2026-05-05)**. Single source of truth for architecture, stack, multi-tenancy, AI core, RAG, bootstrap flow, roadmap.

Read in order: 00 → 01 → 02 → 03 → 04 → 05 → 06 → 07.

### [`skills/`](skills/README.md) — AI Coder Skills
11 markdown files + index. Per-topic runbooks loaded by AI agent (or human) before touching corresponding code area.

| Working on... | Read skill |
|---|---|
| Picking a library | 01-stack-locks |
| `.svelte` file | 02-svelte5-patterns |
| `+server.ts` / `+page.server.ts` | 03-sveltekit-server |
| `schema.prisma` / DB | 04-prisma-tenant |
| LLM/SD calls, tier routing | 05-local-ai |
| Crawl / chunks / Qdrant | 06-rag-pipeline |
| New capability | 07-capability-development |
| Compose / dockerode | 08-docker-multitenancy |
| Before any PR | 09-security-checklist |
| Styling | 10-design-system |
| Before merge | 11-testing-and-build |

## Other docs (legacy, may be outdated)

- `ai-tour-prompts.md` — старые prompt'ы для tour gen (заменены SDXL pipeline)
- `image-map.md` — карта статичных изображений
- `site-content.md` — контент марект-страниц для seed

Эти файлы — для истории. При расхождении с `spec/` — `spec/` побеждает.
