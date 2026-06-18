# AI Core — Orchestrator + 11 Engines

> **AI is NOT a source of truth. AI is the orchestrator of sources of truth.**

Read [docs/spec/08-ai-orchestrator.md](../../../../docs/spec/08-ai-orchestrator.md) and [docs/skills/12-ai-orchestrator.skill.md](../../../../docs/skills/12-ai-orchestrator.skill.md) before touching anything here.

## Layout

```
ai-core/
├── orchestrator/                  # 1. conductor (stateless dispatcher)
├── identity/                      # 2. resolves QueryContext (who/role/scope/redaction)
├── knowledge/                     # 3. RAG (knowledge_base + regulations) — Qdrant
├── data-access/                   # 4. unified gateway to live sources
│   ├── registry.ts
│   └── adapters/                  #    accounting / crm / documents / microservices / event_log
├── reports/                       # 5. report templates + renderer
├── accounting/                    # 6. accounting intelligence (dedupes, reconciliation)
├── management-accounting/         # 7. KPI, P&L, what-if
├── tasks/                         # 8. queue for confirmable / background actions
├── audit/                         # 9. append-only journal
├── agents/                        # 10. specialized agent presets (sales/finance/legal/ops/IR)
│   └── presets/
├── tools/                         # 11. tool registry (role-bound, source-bound)
│   └── tools/
└── policy/                        # 12. financial + compliance + redaction (pre/post-check)
    └── rules/
```

## Engine contract (TBD — Phase 5)

Each engine implements:

```ts
interface Engine {
  id: string;
  capabilities: string[];
  requiredContext: (keyof QueryContext)[];
  sources: SourceId[];
  call(req: EngineRequest, ctx: QueryContext): Promise<EngineResponse>;
  audit(req, res, ctx): AuditEntry;
}
```

Engines are stateless except `audit` (append-only journal) and `tasks` (queue).

## Implementation status

This directory is **empty skeleton** — to be implemented across Phase 4.5–8.0 (see [docs/spec/06-roadmap.md](../../../../docs/spec/06-roadmap.md)).

Existing legacy AI code lives in `src/lib/server/{ai.ts, ai-context.ts, ai-tools.ts, gemini-tour.ts, seo/}` — these will migrate piece by piece into this structure.
