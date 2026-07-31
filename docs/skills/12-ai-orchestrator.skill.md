---
name: ai-orchestrator
description: Use whenever touching src/lib/server/ai-core/. AI is NOT a source of truth — it's an orchestrator. 11 engines + 15 sources of truth + 11-factor QueryContext. Never write a "smart endpoint" that calls LLM directly with hardcoded knowledge.
---

# AI Orchestrator Skill

## Use when
- Создаёшь endpoint который дёргает AI
- Меняешь что-либо в `src/lib/server/ai-core/`
- Добавляешь новый Source of Truth (adapter)
- Добавляешь новую Capability которая зовёт AI
- Видишь паттерн «LLM генерит факт» — это запрещено

## The single rule

> **AI does not know. AI orchestrates.**

Любой ответ AI — это:
1. Вопрос → **Identity** резолвит контекст пользователя
2. Intent classify (small LLM)
3. **Policy** pre-check
4. **Data Access** + **Knowledge** дёргают источники
5. Сборка через **Report** / **Accounting** / **Management** / etc.
6. **Policy** post-check + redaction
7. Explainer (large LLM): «вот ответ, источник такой-то, on такая-то дата»
8. **Audit** append
9. Return

Никогда не: «LLM, ответь по своему знанию». Всегда: «LLM, **сформулируй ответ из этих чанков из этих источников** с цитатами».

## 15 sources of truth (memorize)

```
authoritative:  accounting · management_accounting · crm · iam_roles · iam_permissions
                contracts · financial_rules · compliance_rules · regulations
append-only:    audit_log · event_log
content/derived: documents · knowledge_base · reports
external:       microservices_api
```

Каждый источник — через `Adapter`. Никогда напрямую через `prisma` или `fetch` к 1С.

## 11 engines (memorize)

```
1. Orchestrator           ── conductor
2. Identity & Access      ── who/role/legalEntity/dataScope/redaction
3. Knowledge Retrieval    ── RAG (knowledge_base + regulations)
4. Data Access            ── adapters к accounting/crm/microservices/event_log
5. Report Generation      ── шаблоны + live данные
6. Accounting Intelligence── дубликаты, разноска, согласование
7. Management Accounting  ── KPI, P&L, what-if
8. Tasks / Queue          ── background jobs requiring confirmation
9. Audit & Logging        ── append-only journal
10. Agent Registry        ── presets: sales/finance/legal/ops/IR
11. Tool Registry         ── tool calling с привязкой к ролям + источникам
12. Policy                ── pre-check + post-check (financial + compliance + redaction)
```

(Считается 11, потому что Orchestrator — координатор остальных.)

## QueryContext (11 factors) — резолвится первым

```ts
const ctx = await identity.resolve(event.locals.user, event.locals.tenant);
// → who, role, legalEntity, dataScope, visibleDocuments, availableReports,
//   allowedActions, confirmableActions, redactionPolicy, truthMap, explainability
```

Без QueryContext НЕ запускать ни один engine. Если IAM не резолвится → 401.

## Каноничный flow в endpoint

```ts
// src/routes/api/ai/ask/+server.ts
import { aiGuard } from '$lib/server/ai-guard';
import { orchestrator } from '$lib/server/ai-core/orchestrator/conductor';

export const POST = async (event) => {
  const user = aiGuard(event, { roles: 'any', bucket: 'chat' });

  const { question, agent: agentId } = await event.request.json();

  // ВСЁ остальное делает orchestrator
  const response = await orchestrator.ask({
    tenant: event.locals.tenant,
    user,
    agent: agentId,         // 'sales' | 'finance' | 'legal' | 'ops' | 'investor-relations'
    question,
    explainability: 'standard',
  });

  return json(response);    // { answer, sources, decisions, auditId, ... }
};
```

Endpoint больше **не** строит prompt, **не** подбирает RAG-чанки, **не** редактирует ответ — это всё внутри orchestrator.

## Adapter contract

Когда добавляешь новый источник:

```ts
// src/lib/server/ai-core/data-access/adapters/accounting-1c.ts
import type { SourceAdapter } from '../types';

export const accounting1cAdapter: SourceAdapter<AccountingQuery, AccountingRow[]> = {
  id: 'accounting',
  trustLevel: 'authoritative',
  schema: { /* describe tables/fields for AI */ },

  async health() {
    const r = await fetch(env.ACCOUNTING_1C_URL + '/health');
    return { ok: r.ok, latencyMs: 0, lastSyncAt: new Date() };
  },

  async read(query, scope) {
    // ОБЯЗАТЕЛЬНО фильтр по scope.legalEntity и scope.dataScope
    // ОБЯЗАТЕЛЬНО запись в audit при чтении
    const rows = await fetchFrom1C(query, scope);
    return rows;
  },

  describe() { /* для AI tool registry */ },
};
```

Регистрация в `data-access/registry.ts`:
```ts
import { accounting1cAdapter } from './adapters/accounting-1c';
sourceRegistry.register(accounting1cAdapter);
```

## Tool definition

```ts
// src/lib/server/ai-core/tools/tools/get-account-balance.ts
export const getAccountBalanceTool: Tool = {
  name: 'get_account_balance',
  description: 'Returns the current balance of an accounting account for a legal entity.',
  parameters: { /* JSON-Schema */ },
  requiredRoles: ['cfo', 'finance', 'accountant', 'auditor'],
  source: 'accounting',
  async run(args, ctx) {
    if (!ctx.dataScope.legalEntities.includes(args.legalEntityId)) {
      throw new ToolForbidden('legal entity not in scope');
    }
    const adapter = sourceRegistry.get('accounting');
    return adapter.read({ kind: 'balance', accountCode: args.accountCode, legalEntityId: args.legalEntityId }, ctx.dataScope);
  },
};
```

Tool НЕ зовётся напрямую LLM'ом. Tool зарегистрирован в Tool Registry; orchestrator передаёт LLM **только те tool'ы**, к которым у пользователя есть права.

## Policy DSL

```yaml
# src/lib/server/ai-core/policy/rules/financial.yml
- id: max-payment-without-approval
  trigger: action.kind == 'payment.create'
  condition: action.amount > 10000
  effect: needs_confirmation
  approver_role: cfo

- id: salary-redaction
  trigger: response.contains_field == 'employee.salary'
  condition: query.user.role != 'hr'
  effect: redact

- id: cross-entity-conflict
  trigger: data.source != data.cross_check_source
  condition: data.field == 'deal.amount'
  effect: escalate
  message: 'Accounting и CRM расходятся по сумме сделки — нужна проверка'
```

## Audit format

Каждый ответ AI обязан создать запись:

```ts
{
  id: 'aud_...',
  timestamp: '2026-05-05T10:23:45Z',
  tenantId: 'groundz',
  user: { id, email, role, legalEntity },
  question: '<original>',
  intent: 'accounting.account-balance',
  enginesInvoked: ['identity','policy:pre','data-access:accounting','policy:post','explainer','audit'],
  sourcesQueried: [
    { source: 'accounting', adapter: '1c', records: ['acct:51:2026-05-05'], hash: 'sha256:...' }
  ],
  decisions: [
    { engine: 'policy', action: 'allow' },
    { engine: 'policy', action: 'redact', field: 'comments' }
  ],
  responseHash: 'sha256:...',
  parentRequestId: null,
  durationMs: 842,
}
```

## Anti-patterns

| ❌ | ✅ |
|---|---|
| Endpoint сам зовёт `localChat()` с фактами в промпте | через `orchestrator.ask()` |
| Hardcoded system prompt «You are a CFO assistant» в endpoint | preset в Agent Registry |
| Прямой `prisma.invoice.findMany()` в API endpoint, который зовёт AI | через Adapter `accounting-internal` |
| LLM возвращает число «у нас остаток 1.2M» из своих знаний | LLM формирует ответ ИЗ ЧАНКА «balance: 1234567 EUR (1С, 2026-05-05)» |
| Один источник → один ответ без cross-check | Policy `cross-entity-conflict` где это финполя |
| Audit-запись опциональна | non-bypassable, fail closed |
| Tool без `requiredRoles` | каждый tool привязан к ролям |
| RAG в чистом виде без Identity | Identity первый, RAG один из 11 |
| Возвращать stack-trace или внутренние пути в `error()` | generic message + audit detail |

## Definition of Done для AI changes

- ☐ QueryContext резолвится до engine calls
- ☐ Источник истины — через Adapter, не через прямой Prisma
- ☐ Policy pre-check выполнен
- ☐ Policy post-check выполнен (redaction)
- ☐ Audit запись создана (даже при ошибке — fail-record)
- ☐ Tool calls — только зарегистрированные с проверкой роли
- ☐ Объяснение результата содержит цитирование источника
- ☐ Конфликт между источниками не игнорируется (DSL или escalate)
