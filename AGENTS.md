# Instructions for AI Coding Agents

You are working on **Groundz Platform** — a multi-tenant generator for premium real estate developer sites + operational platforms.

**Foundational principle:** AI is **NOT a source of truth**. AI is the **orchestrator of sources of truth** (accounting, CRM, documents, regulations, IAM, journals, microservices, ...). It resolves an 11-factor QueryContext, dispatches to 11 specialized engines, gates every step through Policy, and writes everything to an append-only Audit. See [docs/spec/08-ai-orchestrator.md](docs/spec/08-ai-orchestrator.md).

## Mandatory before any code change

1. **Read [README.md](README.md)** for project orientation (1 minute).
2. **Read the relevant skill** in [docs/skills/](docs/skills/README.md) before touching corresponding area:
   - **Anything in `src/lib/server/ai-core/` → `docs/skills/12-ai-orchestrator.skill.md` (MANDATORY)**
   - `.svelte` files → `docs/skills/02-svelte5-patterns.skill.md`
   - `+server.ts` / `+page.server.ts` → `docs/skills/03-sveltekit-server.skill.md`
   - Prisma / DB → `docs/skills/04-prisma-tenant.skill.md`
   - LLM/SD/embeddings → `docs/skills/05-local-ai.skill.md`
   - RAG / Qdrant / crawl → `docs/skills/06-rag-pipeline.skill.md`
   - New capability → `docs/skills/07-capability-development.skill.md`
   - Docker / compose → `docs/skills/08-docker-multitenancy.skill.md`
   - Security review → `docs/skills/09-security-checklist.skill.md`
   - CSS / design → `docs/skills/10-design-system.skill.md`
   - Before merge → `docs/skills/11-testing-and-build.skill.md`
   - Picking a library → `docs/skills/01-stack-locks.skill.md`
3. **Honor [docs/spec/07-stack-decisions.md](docs/spec/07-stack-decisions.md)** — locked stack, banned list. Don't propose Tailwind, OpenAI cloud, MongoDB, etc.

## Key invariants (NEVER violate)

- 🔒 **AI = orchestrator, NOT source of truth.** Never let LLM "remember" facts. Always: Adapter → data → LLM formulates from chunks with citations.
- 🔒 **11-factor QueryContext** must be resolved before any engine call.
- 🔒 **Policy Engine** pre-check + post-check on every AI response.
- 🔒 **Audit Engine** append-only, non-bypassable. No audit → no response.
- 🔒 Local AI only (Ollama + Auto1111). No `OPENAI_API_KEY`, `ANTHROPIC_API_KEY`, `GOOGLE_API_KEY` in code.
- 🔒 Two-tier LLM: `llama3.2:3b` (small) + `qwen2.5:14b` (large), routed via `capability` parameter.
- 🔒 Single LLM server, all clients go through `llm-gateway` (fair queue + per-tenant limits).
- 🔒 Multi-tenancy: Docker-per-tenant, DB-per-tenant, Qdrant-per-tenant.
- 🔒 Capability-Frame: 10 fixed capabilities, AI extends only via Skin (brand, customFields, voice, connected sources).
- 🔒 SvelteKit + Svelte 5 runes. Custom CSS only (no Tailwind).
- 🔒 `import db from '$lib/server/db'` — legacy. Use `event.locals.tenant.prisma` after Phase 0.
- 🔒 `process.env.X` forbidden — use `$env/static/private` or `$env/dynamic/private`.
- 🔒 **No direct Prisma access for "domain" data inside endpoints** that call AI — go through Adapter (Data Access Engine).

## Definition of Done (DoD)

Before claiming a task complete, in `groundz-svelte/`:

```sh
npm run check     # → 0 errors, no NEW warnings
npm run build     # → success
```

For security-relevant changes, additionally run pre-merge audit greps from
`docs/skills/09-security-checklist.skill.md`.

## Current phase

Phase 0 (foundation: SQLite→Postgres, adapter-node, finish hardening).
See [docs/spec/06-roadmap.md](docs/spec/06-roadmap.md).

## Where to record discoveries

- New convention worth keeping → update relevant `docs/skills/*.skill.md`.
- Architectural change → update `docs/spec/0*.md` and bump TZ version (date in `docs/spec/00-vision.md`).
- Per-session memory (Claude Code) → see `~/.claude/projects/.../memory/MEMORY.md`.
- Don't create ad-hoc design-doc files outside `docs/` unless explicitly asked.

## Communication style

- Russian for user-facing chat replies (project owner is RU-speaking).
- English for code, comments, commit messages, PR titles.
- Concise: state results and decisions, not deliberation. Match request scope.
