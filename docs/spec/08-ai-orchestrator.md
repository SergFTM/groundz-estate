# AI Orchestrator — Source-of-Truth Conductor

**Status:** locked, v1.0 (2026-05-05)
**Supersedes part of:** `03-ai-core-rag.md` (RAG остаётся, но теперь — один из 11 движков под оркестратором)

## Главное изменение фундамента

> AI **не источник истины**. AI — **оркестратор источников истины**.

Раньше AI генерировал ответы из RAG. Теперь AI:
1. Идентифицирует, **кто** спрашивает (роль, юрлицо, права)
2. Решает, **где брать** актуальные данные (бухгалтерия / CRM / документы / база знаний / API микросервисов / журналы / regulations)
3. **Получает** данные из правильных источников через согласованные адаптеры
4. **Проверяет** право доступа к каждому полю
5. **Согласует** противоречия между источниками
6. **Объясняет** результат человеку с цитированием источников
7. **Логирует** каждый шаг (что спросили, что показали, на основе чего)

LLM/RAG — это всего лишь два движка из одиннадцати. Они отвечают за «понять вопрос» и «помочь сформулировать ответ» — но **не** за «знать, как обстоят дела».

---

## 15 источников истины (Sources of Truth)

| ID | Источник | Системы (примеры) | Кто пишет | Кто читает | Live? |
|---|---|---|---|---|---|
| `accounting` | Бухгалтерская база | 1С, Xero, QuickBooks, in-house Postgres | бухгалтер | финдир, аудит, налоговая, AI | ✅ |
| `management_accounting` | Управленческая база | OLAP-куб, BI, Postgres / ClickHouse | финдир, контроллёр | CEO, инвесторы, AI | ✅ |
| `crm` | CRM | Bitrix24, HubSpot, Salesforce, in-house | sales, agent | sales, marketing, AI | ✅ |
| `documents` | Документы | S3 / disk / SharePoint, vector index | юрист, sales | владелец сделки, AI | ✅ |
| `contracts` | Договоры | DMS + e-signing (DocuSign, Cryptoarm) | юрист | контрагент, аудит, AI | ✅ |
| `reports` | Отчёты (исторические) | DWH-снапшоты, generated PDF | reporting service | стейкхолдеры, AI | snapshot |
| `regulations` | Регламенты, политики, SOP | Confluence, in-house wiki | C-level, юрист | все, AI | ✅ |
| `iam_roles` | Роли пользователей | LDAP / Keycloak / in-house | HR, admin | каждый запрос, AI | ✅ |
| `iam_permissions` | Права доступа | RBAC/ABAC store | admin | каждый запрос, AI | ✅ |
| `audit_log` | История операций | Append-only журнал, immutable | все системы | compliance, security, AI | ✅ |
| `microservices_api` | API микросервисов | OpenAPI specs + live endpoints | dev | всё, AI | ✅ |
| `knowledge_base` | База знаний | Confluence + RAG-индекс | команда, маркетинг | пользователи, AI | ✅ |
| `event_log` | Журнал событий | Kafka / RabbitMQ / event store | продуктивные сервисы | observability, AI | ✅ |
| `financial_rules` | Финансовые правила | DSL / правила ценообразования / лимиты | финдир | биллинг, бухгалтерия, AI | ✅ |
| `compliance_rules` | Compliance-правила | DSL / KYC/AML / GDPR / отраслевые | compliance officer | каждое действие, AI | ✅ |

**Каждый источник имеет:**
- адаптер (`Adapter`) — единый интерфейс чтения/записи
- схему (`SchemaDescriptor`) — описание таблиц/полей/типов для AI
- метку **trust level** (`authoritative` | `derived` | `cached` | `inferred`)
- TTL свежести
- audit-hook — при чтении пишется в `audit_log`

---

## 11 факторов запроса (Query Context)

Перед ответом AI обязан установить:

```ts
interface QueryContext {
  // Identity
  who:                User;                    // кто спрашивает
  role:               Role;                    // роль (CEO, бухгалтер, sales, агент, инвестор, …)
  legalEntity:        LegalEntityId;           // к какому юрлицу относится

  // Authorization
  dataScope:          DataScope;               // к каким данным имеет доступ
  visibleDocuments:   DocumentFilter;          // какие документы можно показать
  availableReports:   ReportTemplateId[];      // какие отчёты можно формировать
  allowedActions:     ActionId[];              // какие действия можно выполнять
  confirmableActions: ActionId[];              // какие требуют 2FA / подтверждения
  redactionPolicy:    RedactionPolicy;         // что нельзя раскрывать (PII, salary, ...)

  // Knowledge routing
  truthMap:           Record<Topic, SourceId>; // где брать актуальную информацию

  // Explainability
  explainability:     'minimal' | 'standard' | 'audit-ready';   // как объяснить результат
}
```

Все 11 факторов резолвятся **синхронно** до запуска любого engine.

---

## Архитектура AI Core (оркестратор + 11 движков)

```
                              ┌─────────────────────┐
        пользователь  ───►    │   AI Orchestrator   │  ──►  ответ + объяснение + audit-trail
        (chat/UI/API)         │  (Conductor + LLM)  │
                              └──────────┬──────────┘
                                         │ диспетчирует
        ┌──────────────────┬─────────────┼─────────────┬──────────────────────┐
        ▼                  ▼             ▼             ▼                      ▼
 ┌─────────────┐    ┌──────────────┐  ┌──────┐  ┌────────────┐         ┌────────────┐
 │  Identity   │    │  Knowledge   │  │ Data │  │   Report   │   ...   │   Policy   │
 │  & Access   │    │  Retrieval   │  │Access│  │ Generation │         │   Engine   │
 │   Engine    │    │   Engine     │  │Engine│  │   Engine   │         │            │
 └──────┬──────┘    └──────┬───────┘  └──┬───┘  └─────┬──────┘         └─────┬──────┘
        │                  │             │            │                      │
        ▼                  ▼             ▼            ▼                      ▼
   IAM / SSO        knowledge_base  accounting    DWH + templates       compliance_rules
   iam_roles            RAG         crm                                 financial_rules
   iam_permissions                  microservices_api                   regulations
                                    event_log
```

### 11 движков

```
AI Core
  ├── 1. Orchestrator                  — conductor, оркестрирует остальные движки, ничего сам не знает
  ├── 2. Identity & Access Engine      — кто спрашивает, его роль, юрлицо, скоп данных
  ├── 3. Knowledge Retrieval Engine    — RAG поверх knowledge_base + regulations
  ├── 4. Data Access Engine            — единый шлюз к accounting/management/crm/microservices_api
  ├── 5. Report Generation Engine      — собирает отчёты по шаблонам с подстановкой live-данных
  ├── 6. Accounting Intelligence Engine — финансовые проверки, разноска, согласование счетов
  ├── 7. Management Accounting Engine  — KPI, бюджеты, P&L, cash-flow, what-if
  ├── 8. Task / Queue Engine           — очередь действий, требующих apply (background jobs)
  ├── 9. Audit & Logging Engine        — append-only журнал каждого вопроса/ответа/действия
  ├── 10. Agent Registry               — каталог специализированных агентов (sales, ops, finance, legal)
  ├── 11. Tool Registry                — каталог tool'ов с JSON-схемой, привязкой к ролям и источникам
  └── 12. Policy Engine                — гейт перед каждым ответом/действием: compliance + financial + redaction
```

### Контракт каждого движка

```ts
interface Engine {
  id: string;                                          // 'identity-access' | 'data-access' | …
  capabilities: string[];                              // что умеет
  requiredContext: (keyof QueryContext)[];             // какие факторы обязательны
  sources: SourceId[];                                 // к каким источникам обращается
  call(req: EngineRequest, ctx: QueryContext): Promise<EngineResponse>;
  audit: (req: EngineRequest, res: EngineResponse, ctx: QueryContext) => AuditEntry;
}
```

Movement движков:
- **stateless** — не хранят свою БД (кроме Audit и Task — у них есть собственные journal/queue)
- **деклариативны** — заявляют требуемые источники, оркестратор проверяет доступ ДО вызова
- **idempotent** — повторный вызов с тем же запросом и контекстом даёт тот же результат (для read)

---

## Lifecycle одного вопроса

```
1. Receive question (UI/API/chat)
                ▼
2. Identity & Access Engine
   → resolve: who, role, legalEntity, dataScope, visibleDocs, allowedActions, redactionPolicy
                ▼
3. Orchestrator: build QueryContext (11 факторов готовы)
                ▼
4. Orchestrator (LLM small tier): classify intent
   → "user wants: accounts-receivable report for Q1 LegalEntity=ACME, drilled to top-10 customers"
                ▼
5. Orchestrator → Policy Engine
   → can {who} request {intent} on {legalEntity}? → ALLOW / DENY / NEEDS_CONFIRMATION
                ▼
6. Orchestrator: route to engines
   ├── Knowledge Retrieval     → "AR report definition" из regulations + knowledge_base
   ├── Data Access Engine      → запрос к accounting, фильтр по dataScope
   ├── Management Accounting   → агрегация
   ├── Report Generation       → шаблон AR-Q1, подставить данные
                ▼
7. Policy Engine post-check:
   → redact PII по redactionPolicy
   → проверить, что в выдаче нет данных, к которым нет доступа
                ▼
8. Orchestrator (LLM large tier): explain result
   → human-friendly explanation + цитаты источников
                ▼
9. Audit & Logging Engine: write entry
   → who, when, what asked, what shown, which sources cited, decision trail
                ▼
10. Return response to user
```

**Каждый шаг 1–9 идемпотентен.** Шаг 9 атомарно завершает транзакцию: если audit упал, ответ не отдаётся.

---

## Engines в деталях

### 1. Orchestrator
- Роль: **conductor**, не владелец знания
- Использует tier `small` для intent classification, `large` для explanation
- Файлы: `src/lib/server/ai-core/orchestrator/`
  - `conductor.ts` — главный flow
  - `intent-classifier.ts` — small LLM
  - `explainer.ts` — large LLM с системным промптом «процитируй источники»
  - `step-runner.ts` — последовательное выполнение plan'а

### 2. Identity & Access Engine
- Источники: `iam_roles`, `iam_permissions`, SSO (Keycloak / OIDC)
- Возвращает: `User`, `Role`, `LegalEntity`, `DataScope`, `RedactionPolicy`, `AllowedActions`
- Кэш: 60 сек для same-session
- Файлы: `src/lib/server/ai-core/identity/`

### 3. Knowledge Retrieval Engine
- Источники: `knowledge_base`, `regulations` (Qdrant + per-tenant collection)
- Это **бывший RAG** — теперь под оркестратором, один из 11
- Возвращает: chunks с источником и timestamp
- Файлы: `src/lib/server/ai-core/knowledge/` (бывший `ai-core/rag/`)

### 4. Data Access Engine
- Источники: `accounting`, `management_accounting`, `crm`, `microservices_api`, `event_log`
- Унифицированный интерфейс через `Adapter`
- ВСЕ запросы фильтруются `DataScope` пользователя
- Поддерживает live-запросы и time-range
- Файлы: `src/lib/server/ai-core/data-access/`
  - `registry.ts` — каталог адаптеров
  - `adapters/` — `accounting-1c.ts`, `accounting-xero.ts`, `crm-bitrix.ts`, `crm-hubspot.ts`, …
  - `query.ts` — `select(source, table, filter, scope)`

### 5. Report Generation Engine
- Источники: `reports` (templates) + результаты Data Access
- Шаблоны = декларация, какие данные нужны, как агрегировать, как форматировать
- Возвращает: HTML / PDF / xlsx
- Файлы: `src/lib/server/ai-core/reports/`
  - `templates/` — `ar-aging.yml`, `pnl-monthly.yml`, …
  - `renderer.ts`

### 6. Accounting Intelligence Engine
- Источник: `accounting` + `financial_rules`
- Что умеет: классификация проводки, поиск дубликатов, согласование счёт-факта/договор/оплата
- Файлы: `src/lib/server/ai-core/accounting/`

### 7. Management Accounting Engine
- Источник: `management_accounting` + `financial_rules`
- Что умеет: KPI, P&L, cash-flow forecast, what-if симуляции, бюджет vs факт
- Файлы: `src/lib/server/ai-core/management-accounting/`

### 8. Task / Queue Engine
- Источник: собственный (master DB Tasks table)
- Что умеет: ставить в очередь действия, требующие подтверждения или фоновой обработки (отправка договора, генерация отчёта)
- Файлы: `src/lib/server/ai-core/tasks/`
  - `queue.ts` — fair queue per-tenant, аналогично llm-gateway
  - `runner.ts` — workers
  - `action-handlers/` — handler на каждый ActionId

### 9. Audit & Logging Engine
- Источник: собственный (`audit_log`, append-only)
- Каждая запись содержит: timestamp, who, action, intent, sourcesQueried, dataReturned (хеш), decision, explanation, parentRequestId
- Read-only для всех кроме compliance officer
- Файлы: `src/lib/server/ai-core/audit/`

### 10. Agent Registry
- Каталог специализированных агентов:
  - `agent.sales` — отвечает на вопросы по сделкам, использует CRM + documents
  - `agent.finance` — отвечает на финвопросы, использует accounting + management
  - `agent.legal` — договоры + regulations
  - `agent.ops` — журнал событий + microservices_api
  - `agent.investor-relations` — отчёты + reports + management
- Каждый agent — preset (system prompt + allowed engines + allowed sources + tier)
- Файлы: `src/lib/server/ai-core/agents/`
  - `registry.ts`
  - `presets/sales.ts`, `presets/finance.ts`, …

### 11. Tool Registry
- Каталог tool'ов для LLM tool-calling
- Каждый tool: JSON-схема, привязка к роли (`requiredRoles`), привязка к источнику (`source`), audit hook
- Tool НЕ выполняется без проверки IAM + Policy
- Файлы: `src/lib/server/ai-core/tools/`
  - `registry.ts`
  - `tools/` — `get-account-balance.ts`, `search-deals.ts`, `generate-pnl.ts`, …

### 12. Policy Engine
- Источники: `financial_rules`, `compliance_rules`, `redactionPolicy` (из IAM)
- Гейт **до** ответа (pre-check) и **после** (post-check):
  - **pre-check:** разрешено ли intent + действие пользователю?
  - **post-check:** redact PII / salaries / sensitive fields из ответа
- Файлы: `src/lib/server/ai-core/policy/`
  - `pre-check.ts`
  - `post-check.ts`
  - `rules/` — DSL: финансовые лимиты, KYC, GDPR, отраслевые

---

## Структура файлов

```
src/lib/server/ai-core/
├── orchestrator/
│   ├── conductor.ts                # главный flow
│   ├── intent-classifier.ts        # small LLM
│   ├── explainer.ts                # large LLM
│   └── step-runner.ts
├── identity/
│   ├── resolver.ts                 # User → QueryContext
│   ├── data-scope.ts
│   └── redaction.ts
├── knowledge/                      # бывший rag/
│   ├── qdrant-client.ts
│   ├── retrieve.ts
│   └── ensure-collection.ts
├── data-access/
│   ├── registry.ts
│   ├── query.ts
│   └── adapters/
│       ├── accounting-1c.ts
│       ├── accounting-xero.ts
│       ├── accounting-quickbooks.ts
│       ├── accounting-internal.ts
│       ├── management-internal.ts
│       ├── crm-bitrix.ts
│       ├── crm-hubspot.ts
│       ├── crm-salesforce.ts
│       ├── crm-internal.ts
│       ├── documents-s3.ts
│       ├── microservices-rest.ts
│       └── event-log-kafka.ts
├── reports/
│   ├── renderer.ts
│   └── templates/
├── accounting/
├── management-accounting/
├── tasks/
│   ├── queue.ts
│   ├── runner.ts
│   └── action-handlers/
├── audit/
│   ├── writer.ts
│   ├── reader.ts
│   └── schema.ts
├── agents/
│   ├── registry.ts
│   └── presets/
│       ├── sales.ts
│       ├── finance.ts
│       ├── legal.ts
│       ├── ops.ts
│       └── investor-relations.ts
├── tools/
│   ├── registry.ts
│   └── tools/
└── policy/
    ├── pre-check.ts
    ├── post-check.ts
    └── rules/
        ├── financial.ts
        ├── compliance-gdpr.ts
        ├── compliance-kyc.ts
        └── redaction.ts
```

---

## Adapter контракт для Source-of-Truth

```ts
interface SourceAdapter<TQuery, TResult> {
  id: SourceId;
  trustLevel: 'authoritative' | 'derived' | 'cached' | 'inferred';
  schema: SchemaDescriptor;                            // машинно-читаемое описание полей
  health(): Promise<{ ok: boolean; latencyMs: number; lastSyncAt?: Date }>;
  read(query: TQuery, scope: DataScope): Promise<TResult>;
  write?(input: WriteInput, scope: DataScope): Promise<WriteResult>;  // optional
  describe(): SchemaDescriptor;                        // для AI: что есть в этом источнике
}
```

**Пример:** AI спрашивает «какой остаток на счёте?» →
1. IAM проверяет: пользователь может запрашивать счета юрлица X
2. Orchestrator: intent = `accounting.account-balance`
3. Tool Registry: tool `get-account-balance(legalEntityId, accountCode)`
4. Data Access Engine → Adapter `accounting-1c` (если у тенанта 1С) или `accounting-xero`
5. Adapter возвращает live-данные
6. Policy: redact (если пользователь не CFO — округлить до тысяч)
7. Explainer: «остаток на 25.12.2026 — €1.2M; источник: 1С, синхронизировано 5 минут назад»
8. Audit: запись

---

## Multi-tenant aspect

Каждый тенант имеет свой набор adapter'ов:
- ACME подключила 1С + Bitrix24 + S3 для documents
- Beta подключила Xero + HubSpot + SharePoint

Конфигурация в `tenant.skin.sources`:

```json
{
  "accounting":      { "adapter": "1c", "config": { "url": "...", "auth": "..." } },
  "crm":             { "adapter": "bitrix", "config": {...} },
  "documents":       { "adapter": "s3",     "config": {...} },
  "iam_roles":       { "adapter": "keycloak", "config": {...} },
  ...
}
```

Bootstrap pipeline на новом тенанте теперь включает:
- Шаг 11: probe доступных источников (схема, health)
- Шаг 12: AI генерирует initial mapping (какие role → какие dataScope) на основе обнаруженных систем
- Шаг 13: human approval initial mapping (super-admin одобряет)
- Шаг 14: status = `ready`

---

## Правила (что AI **не** делает)

1. **Не хранит факты** локально — всегда дёргает источник через adapter
2. **Не отвечает** без QueryContext — если IAM не резолвится, отказ
3. **Не действует** без Policy.preCheck — даже read-операция гейтится для sensitive sources
4. **Не возвращает** PII без проверки redactionPolicy
5. **Не пишет** напрямую в источник — только через `Adapter.write` с обязательным audit
6. **Не использует** один источник, если можно подтвердить из двух (cross-check)
7. **При противоречии** между источниками — оркестратор останавливается и эскалирует к человеку, не «угадывает»

---

## Trust resolution при противоречии

```
accounting (authoritative)  vs  crm (derived)
                          ▼
                Policy.conflictResolution
                          ▼
              «accounting wins для финансовых полей,
               crm wins для контактных»
                          ▼
              если правила нет → ESCALATE_TO_HUMAN
```

DSL-правило хранится в `compliance_rules`:
```yaml
- id: revenue-truth
  field: deal.amount
  authoritative_source: accounting
  fallback_sources: [crm]
  on_conflict: escalate
```

---

## Объяснимость (Explainability)

Каждый ответ AI содержит:

```ts
interface AiResponse {
  answer: string;                                      // human-readable
  confidence: 'high' | 'medium' | 'low';
  sources: Array<{
    sourceId: SourceId;
    table?: string;
    recordIds?: string[];
    citation: string;
    timestamp: Date;
  }>;
  redactedFields?: string[];                           // что было скрыто
  decisions: Array<{                                   // декомпозиция: какие движки участвовали
    engine: string;
    action: string;
    result: 'ok' | 'blocked' | 'redacted';
  }>;
  auditId: string;                                     // → ссылка на запись в audit_log
  followUp?: {
    requiresConfirmation?: boolean;
    confirmationToken?: string;
  };
}
```

Уровни `explainability`:
- **minimal** — только `answer`
- **standard** — `answer` + `sources` + `auditId`
- **audit-ready** — всё включая `decisions`

Уровень определяется ролью: CEO → minimal, аудитор → audit-ready.

---

## Связь с предыдущими решениями

- **Capability-Frame (`02-capabilities.md`)** — capabilities (catalog, seo, invest, …) ОСТАЮТСЯ. Они теперь — потребители движков, а не контейнеры AI-логики.
- **RAG (`03-ai-core-rag.md`)** — Knowledge Retrieval Engine = тот же RAG, но с явной ролью «один из 11».
- **Two-tier LLM** — остаётся: Orchestrator использует small для классификации intent, large для explainer.
- **llm-gateway** — остаётся: все вызовы LLM из любого engine идут через него.
- **Multi-tenancy** — остаётся: per-tenant Docker stack + per-tenant Qdrant. Дополнительно — per-tenant adapter config.

---

## Что нужно сделать (новые задачи в roadmap)

Roadmap расширяется. Phase 4–7 теперь работают над оркестратором, не «просто RAG»:

| Фаза | Что добавилось |
|---|---|
| Phase 4 | Knowledge Retrieval Engine (= старый RAG ingest) — без изменений |
| Phase 4.5 | **Adapter framework** + 3 первых адаптера (accounting-internal, crm-internal, documents-s3) |
| Phase 5 | Schema-agent + **Identity & Access Engine** + DataScope generator |
| Phase 6 | Seeder + **Policy Engine** (initial financial + GDPR rules) |
| Phase 6.5 | **Tool Registry** + **Agent Registry** (5 presets) |
| Phase 7 | End-to-end: Orchestrator + Audit + Report Generation |
| Phase 7.5 | **Conflict resolution rules** + escalation UX в super-admin |
| Phase 8 | Operational: добавить ещё 3–5 адаптеров (1C, Xero, Bitrix, HubSpot, Keycloak) |
