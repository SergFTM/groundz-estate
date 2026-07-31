# Claude Code Instructions

This project follows the conventions in [AGENTS.md](AGENTS.md). Read that file first.

Quick links:
- **Project orientation:** [README.md](README.md)
- **Specification (TZ):** [docs/spec/](docs/spec/README.md)
- **AI coder skills:** [docs/skills/](docs/skills/README.md)
- **Rebrand → GROUNDZ ESTATE:** [docs/spec/10-rebrand-groundz.md](docs/spec/10-rebrand-groundz.md) — ребренд, дизайн-токены, токенизация инвест-слоя, AI-слой фронта (DRAFT)
- **Файловая архитектура:** [docs/spec/11-file-architecture.md](docs/spec/11-file-architecture.md) — карта папок/файлов + куда добавлять новое

## Hard rules (do not violate)

1. **AI = orchestrator of sources of truth, NOT a source.** LLM formulates answers FROM adapter data WITH citations. LLM never "knows" facts. See [docs/spec/08-ai-orchestrator.md](docs/spec/08-ai-orchestrator.md) and [docs/skills/12-ai-orchestrator.skill.md](docs/skills/12-ai-orchestrator.skill.md).
2. **11-factor QueryContext** resolved before any engine call. **Policy** pre-check + post-check. **Audit** non-bypassable.
3. Local AI only (Ollama + Automatic1111). No cloud AI APIs in code.
4. Two-tier LLM: `llama3.2:3b` (small) + `qwen2.5:14b` (large). Route via `capability` parameter.
5. One LLM server (`llm-gateway`), fair queue, per-tenant rate limits.
6. Multi-tenancy: Docker-per-tenant, DB-per-tenant, Qdrant-per-tenant.
7. Capability-Frame fixed; only Skin (brand, customFields, voice, sources) is dynamic.
8. SvelteKit + Svelte 5 runes. Custom CSS (no Tailwind).
9. Use `event.locals.tenant.prisma`, not global `db` (after Phase 0).
10. Use `$env/static/private` / `$env/dynamic/private`, never `process.env`.
11. Endpoints calling AI go through `orchestrator.ask()` — no ad-hoc system prompts in route code.

## Definition of Done

```sh
cd groundz-svelte
npm run check        # 0 errors, no new warnings
npm run build        # success
```

## Communication

- Russian to user, English in code/commits.
- Concise. State decisions, not deliberation.

## On task completion

- If you discovered a new convention worth keeping → update the relevant skill in `docs/skills/`.
- If you made an architectural change → update `docs/spec/` and the date in `docs/spec/00-vision.md`.
- Auto-memory (across sessions) lives in `~/.claude/projects/.../memory/MEMORY.md`.
