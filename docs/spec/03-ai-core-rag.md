# AI Core & RAG Pipeline

## Принципы

1. **Локальные модели только.** Никаких OpenAI/Anthropic/Gemini API в коде.
2. **OpenAI-compatible протокол.** Используем `openai` SDK, но `baseURL` указывает на Ollama.
3. **AI всегда читает из RAG.** Никаких «голых» промптов в production-эндпоинтах — каждый AI-вызов сначала ищет контекст в Qdrant.
4. **Per-tenant изоляция.** Своя Qdrant-коллекция. Никаких cross-tenant утечек.
5. **Кеш обязателен.** Все AI-результаты с одинаковым входом (`hash(prompt)`) кешируются в `AiResponseCache` с TTL.

## Stack

| Компонент | Конкретно |
|---|---|
| LLM runtime | Ollama (`http://ollama:11434`), оба weights загружены параллельно |
| **LLM small (tier 1)** | `llama3.2:3b` — классификация, routing, короткие ответы, извлечение полей, tool args |
| **LLM large (tier 2)** | `qwen2.5:14b` — сложные рассуждения, генерация длинных текстов, schema-agent, анализ документов |
| Embeddings | `nomic-embed-text` (768 dim) через `POST /api/embeddings` |
| Reranker (опц.) | `BAAI/bge-reranker-v2-m3` через TGI |
| Image gen | Automatic1111 SD WebUI (`http://auto1111:7860`), `txt2img` API, SDXL |
| Vector store | Qdrant (per-tenant контейнер), gRPC + REST |
| Gateway | `llm-gateway` (master-app sidecar) — fair queue + tier router |

## Two-tier model strategy

GPU держит обе модели горячими (3B + 14B ≈ 12 GB VRAM). Запросы маршрутизируются на нужный tier по одному из трёх способов:

1. **Явно** — клиент передаёт `tier: 'small' | 'large'` в gateway-запросе.
2. **Эвристика по capability** — gateway map'ит каждый capability → tier (см. таблицу ниже).
3. **AI-классификатор** — для сложных кейсов (chat) gateway делает 1 вызов на small-модель «classify: simple | complex» → роутит дальше. Стоимость классификации ≪ полного ответа.

### Зоны ответственности

| Tier | Модель | Что делает | Примеры эндпоинтов |
|---|---|---|---|
| **small** | `llama3.2:3b` | Классификация, routing, короткие ответы, извлечение JSON-полей, tool args | `/api/seo/suggest-links`, `/api/invest/metric-explain` (FAQ-style), `/api/articles/comments` (auto-mod), schema-agent **classification steps** |
| **large** | `qwen2.5:14b` | Сложные рассуждения, длинная генерация, анализ документов, multi-step JSON | `/api/ai/chat`, `/api/invest/portfolio-insight`, `/api/invest/pool-chat`, `/api/seo/rewrite-section`, `/api/seo/generate-cluster`, `/api/seo/generate-meta`, schema-agent **inference steps** |
| **embed** | `nomic-embed-text` | Векторизация для RAG | ingest pipeline, retrieve queries |
| **image** | SDXL | Изображения | `/api/generate-tour`, `/api/generate-floor-plan`, `/api/regenerate-room` |

### Capability → tier map (default)

```ts
// llm-gateway/router.ts
export const CAPABILITY_TIER: Record<string, 'small' | 'large'> = {
  'seo.audit-page':           'small',  // структурный анализ
  'seo.generate-cluster':     'large',  // creative + reasoning
  'seo.generate-meta':        'small',  // короткий title/desc
  'seo.rewrite-section':      'large',  // длинная генерация
  'seo.suggest-links':        'small',
  'seo.setup-analyze':        'large',
  'invest.metric-explain':    'small',  // FAQ-style ответ
  'invest.portfolio-insight': 'large',
  'invest.pool-chat':         'large',
  'invest.pool-compare':      'large',
  'invest.cashflow-forecast': 'large',
  'invest.risk-narrative':    'large',
  'invest.pipeline-insight':  'large',
  'invest.construction-alert':'small',
  'market.ai-insight':        'large',
  'chat.public':              'small',  // small отвечает на простые, escalate to large если "complex"
  'chat.authenticated':       'large',  // в кабинете — сразу large
  'comments.auto-mod':        'small',  // verdict ok/flag — простая классификация
  'schema-agent.classify':    'small',
  'schema-agent.infer-fields':'large',
  'schema-agent.infer-voice': 'large',
  'rag.ask':                  'large',  // default RAG question answering
  'rag.classify-content-type':'small',  // chunk → 'project'|'unit'|'about'|...
};
```

### Escalation pattern (small → large)

Для chat в публичной части:

```ts
// 1. Small classifies
const verdict = await gateway.complete({
  tier: 'small',
  capability: 'chat.classify',
  prompt: `Question: "${userMsg}"\nIs this simple (factual, short answer) or complex (reasoning, multi-step)?\nReply with one word: simple | complex`,
});

// 2. Route accordingly
if (verdict.trim().toLowerCase().startsWith('simple')) {
  return await gateway.complete({ tier: 'small', capability: 'chat.public', ... });
} else {
  return await gateway.complete({ tier: 'large', capability: 'chat.public', ... });
}
```

Стоимость: 1 быстрый small-вызов (~150 токенов, ~0.3 сек) добавляется к простым запросам, но 90% public-чата — простые → отвечает small целиком (~1 сек), не нагружая large.

### API surface

`localChat()` принимает опциональный `tier`:

```ts
import { localChat } from '$lib/server/local-llm';

// Явный tier
const r = await localChat({ tier: 'small', prompt: 'Classify intent', maxTokens: 50 });

// По capability (gateway сам резолвит)
const r = await localChat({ capability: 'invest.pool-chat', prompt: '...', systemPrompt: '...' });

// Дефолт = large (если ни tier, ни capability не задан)
const r = await localChat({ prompt: '...' });
```

## Файловая структура

```
src/lib/server/
├── local-llm.ts                     # OpenAI SDK → Ollama. Все text-вызовы.
├── local-image.ts                   # Automatic1111 wrapper.
├── ai-guard.ts                      # auth + rate-limit для AI endpoints.
├── rate-limit.ts                    # token bucket.
└── ai-core/
    ├── orchestrator.ts              # provisionTenant(url, slug, domain) + askAI({...})
    ├── ingestor/
    │   ├── crawler.ts               # sitemap + recursive fetch
    │   ├── extractor.ts             # @mozilla/readability + cheerio
    │   ├── chunker.ts               # 600 tokens, 80 overlap
    │   └── embedder.ts              # ollama /api/embeddings
    ├── rag/
    │   ├── qdrant-client.ts         # @qdrant/js-client-rest
    │   ├── ensure-collection.ts     # PUT collections/{slug}_rag, vector size 768
    │   ├── upsert.ts                # bulk insert
    │   ├── retrieve.ts              # search + filter by capability
    │   └── rerank.ts                # опционально
    ├── schema-agent/
    │   ├── infer-brand.ts           # цвета (chroma.js), шрифты, logo, voice
    │   ├── infer-taxonomy.ts        # residential/commercial/mixed/land
    │   ├── infer-unit-fields.ts     # custom поля для Unit
    │   ├── infer-project-fields.ts
    │   ├── infer-voice.ts           # тон копи
    │   └── synthesize.ts            # склейка → brand.json + skin.json
    ├── deployer/
    │   ├── compose-renderer.ts      # mustache templates/tenant.compose.yml.tmpl
    │   ├── docker-client.ts         # dockerode wrapper
    │   ├── migrate-tenant.ts        # docker exec ... prisma migrate deploy
    │   ├── seed-from-rag.ts         # AI → JSON → tenant /api/internal/seed
    │   └── theme-emit.ts            # CSS variables → ./data/{slug}/tenant/theme.css
    └── job-runner.ts                # очередь шагов с retry + SSE-логом
```

## Ingest pipeline (10 шагов)

| # | Шаг | Вход | Выход | Кто пишет |
|---|---|---|---|---|
| 1 | crawl | startUrl | `tmp/{slug}/raw/*.html` | crawler.ts |
| 2 | extract | raw HTML | `{url, title, text, type}[]` | extractor.ts |
| 3 | chunk | text | chunks ~600 tokens | chunker.ts |
| 4 | embed | chunks | `{chunk, vector[768]}[]` | embedder.ts → ollama |
| 5 | upsert | vectors | Qdrant collection `{slug}_rag` | qdrant-client |
| 6 | infer-brand | top-30 chunks | `brand.json` | schema-agent |
| 7 | infer-taxonomy + skin | chunks по фильтру | `skin.json` | schema-agent |
| 8 | render compose + .env | slug, domain, secrets | `stacks/{slug}/` | compose-renderer |
| 9 | docker up db+qdrant; migrate; seed | brand+skin + chunks | tenant Postgres rows | dockerode + seed-from-rag |
| 10 | docker up app | — | running container | dockerode |

Каждый шаг идемпотентен. При падении возобновляется с последнего успешного.

## Универсальный API ядра

```ts
// orchestrator.ts
export async function askAI(opts: {
  tenantSlug: string;
  capability: string;          // 'seo' | 'invest' | 'chat' | ...
  question: string;
  k?: number;                  // top-k retrieval, default 8
  filter?: Record<string, unknown>;
  systemPrompt?: string;
  history?: Message[];
  jsonMode?: boolean;
}): Promise<{ answer: string; sources: ChunkRef[] }> {
  const tenant = await getTenant(tenantSlug);
  const chunks = await retrieve({
    collection: `${tenantSlug}_rag`,
    query: opts.question,
    k: opts.k ?? 8,
    filter: { capability: opts.capability, ...(opts.filter ?? {}) },
  });
  const ctx = chunks.map((c, i) => `[${i + 1}] ${c.text}`).join('\n\n');
  const prompt = `Контекст:\n${ctx}\n\nВопрос: ${opts.question}\nОтветь, ссылаясь на источники.`;
  const result = await localChat({
    prompt,
    systemPrompt: buildSystemPrompt(tenant, opts.systemPrompt),
    jsonMode: opts.jsonMode,
  });
  return { answer: result.content, sources: chunks };
}
```

## Системный промпт (по умолчанию)

```
You are an AI assistant for {tenant.brand.displayName}, a real estate developer.
Brand voice: {tenant.skin.copyLibrary.voice}.
Always cite chunk numbers in [N] format.
If the answer is not in the context, say "I don't have that information."
Reply in the same language as the user's question.
```

## Schema-Agent промпты (фиксированный шаблон)

```
infer-unit-fields:
  System: "You are a real estate data analyst. Output JSON only."
  User: "
    Standard Unit caркас has: code, type, bedrooms, floor, areaSqm, price, status.
    Looking at these chunks from a developer website, what ADDITIONAL fields should be tracked?
    Output JSON array: [{key, type, label:{en,ru}, required, options?}]
    Rules:
      - field key must be camelCase
      - type ∈ {int, float, string, enum, bool}
      - if type=enum, include options[]
      - max 8 fields
      - skip anything already in standard caркас
    Chunks:
      {top-30 chunks tagged 'unit' or 'pricing'}
  "
```

Все промпты живут в `src/lib/server/ai-core/schema-agent/prompts/*.txt` и параметризуются через mustache.

## Кеш

Таблица `AiResponseCache` (уже есть). Расширить:

```prisma
model AiResponseCache {
  cacheKey   String   @id          // hash of (tenantSlug + capability + prompt + k + filter)
  tenantSlug String
  capability String
  response   String
  model      String
  tokensUsed Int      @default(0)
  expiresAt  DateTime
  createdAt  DateTime @default(now())
  @@index([tenantSlug, capability])
}
```

TTL по умолчанию: 24h для статических вопросов (metric explanations), 4h для портфельных insights, 1h для chat.

## Rate limits (per-tenant в `rate-limit.ts`)

| Bucket | Limit | Применяется |
|---|---|---|
| `public` | 10/min | login, forgot-password, lead-форма |
| `chat` | 30/min | tenant chat widget |
| `text_ai` | 20 / 5 min | SEO/invest insights |
| `image_ai` | 6 / 10 min | image generation |
| `admin_job` | 100/min | uploads, tour saves |
| `ingest` | 1 одновременно на тенанта | ingest pipeline |

## Health check

`GET /api/health/ai` (admin-only):

```json
{
  "llm":   { "ok": true, "model": "llama3.1:8b", "latencyMs": 230, "queueDepth": 3, "inflight": 2 },
  "image": { "ok": true, "model": "sd_xl_base_1.0", "url": "http://auto1111:7860", "queueDepth": 0 },
  "qdrant": { "ok": true, "collections": ["groundz_rag", "acme_rag"] }
}
```

---

# Concurrency Model — Single LLM Server, Many Clients

## Топология

```
   tenant-A app ─┐
   tenant-B app ─┼──> [LLM Gateway sidecar in master-app] ──> Ollama (1 model loaded)
   tenant-C app ─┘                  │
   master-app ───┘                  ├──> Auto1111 (1 SDXL loaded)
                                    └──> metrics + audit
```

Все клиенты (любого тенанта) **не звонят** в Ollama напрямую. Они проходят через **LLM Gateway** — маленький HTTP-сервис, который держит:

- глобальную очередь FIFO с per-tenant fair scheduling
- семафор inflight (по числу одновременных запросов модель может тянуть)
- backpressure (HTTP 429 если очередь переполнена)
- метрики (queue depth, latency p50/p95, error rate per tenant)

## Зачем gateway

Ollama сам по себе обрабатывает запросы **последовательно** на одной модели (с GPU bottleneck). Без очереди:
- 10 одновременных tenant-запросов → GPU OOM или жёсткие задержки
- Один «жадный» тенант → DoS остальных
- Нет видимости в систему

LLM Gateway решает все три проблемы.

## Реализация

`master-app/src/lib/server/llm-gateway/`

```
llm-gateway/
├── server.ts            # HTTP endpoint /v1/chat/completions, /v1/embeddings, /sd/txt2img
├── queue.ts             # per-tenant FIFO + global round-robin
├── semaphore.ts         # inflight limiter (default 2 для LLM, 1 для SD)
├── metrics.ts           # Prometheus counters/histograms
└── audit.ts             # пишет в master.AuditLog при каждом вызове
```

Gateway слушает на `http://llm-gateway:8080` внутри `ai-net`. Tenant-app вместо `LOCAL_LLM_URL=http://ollama:11434/v1` получает `LOCAL_LLM_URL=http://llm-gateway:8080/v1`. Tenant-app не замечает разницы — gateway эмулирует OpenAI-совместимый интерфейс.

## Per-tenant fair scheduling (round-robin между тенантами)

```ts
class FairQueue {
  private queues = new Map<string, JobRequest[]>();   // tenantSlug → FIFO
  private order: string[] = [];                       // active tenants in rotation

  enqueue(tenantSlug: string, job: JobRequest) {
    if (!this.queues.has(tenantSlug)) {
      this.queues.set(tenantSlug, []);
      this.order.push(tenantSlug);
    }
    this.queues.get(tenantSlug)!.push(job);
  }

  dequeue(): JobRequest | null {
    for (let i = 0; i < this.order.length; i++) {
      const slug = this.order.shift()!;
      const q = this.queues.get(slug)!;
      const job = q.shift();
      if (q.length > 0) this.order.push(slug);
      else this.queues.delete(slug);
      if (job) return job;
    }
    return null;
  }
}
```

Это даёт **fairness**: 100 запросов от тенанта A не задержат тенанта B — каждый получает свой слот в круге.

## Concurrency budget (per-tier semaphores)

| Resource | Model | Inflight max | Queue max | Job timeout | Reasoning |
|---|---|---|---|---|---|
| LLM small | `llama3.2:3b` | **4** | 64 | 20s | 3B fit ~3 GB VRAM, лёгкая, 4 параллельно ОК |
| LLM large | `qwen2.5:14b` | **2** | 32 | 90s | 14B Q4 ≈ 9 GB, 2 параллельно — потолок |
| Embeddings | `nomic-embed-text` | **8** | 256 | 30s | embed cheap (137M params) |
| Image | `SDXL` | **1** | 8 | 120s | 1024×1024 ≈ 10-20 сек, GPU целиком |

**Важно:** small и large держат разные семафоры. Тяжёлый large-запрос **не блокирует** быстрые small-запросы, потому что у них раздельные слоты. GPU делит время per Ollama scheduling (он сам менеджит KV cache между моделями).

Числа конфигурируются через env (master-app):

```
LLM_SMALL_MODEL=llama3.2:3b
LLM_SMALL_INFLIGHT_MAX=4
LLM_SMALL_QUEUE_MAX=64
LLM_SMALL_JOB_TIMEOUT_MS=20000

LLM_LARGE_MODEL=qwen2.5:14b
LLM_LARGE_INFLIGHT_MAX=2
LLM_LARGE_QUEUE_MAX=32
LLM_LARGE_JOB_TIMEOUT_MS=90000

EMBED_MODEL=nomic-embed-text
EMBED_INFLIGHT_MAX=8
EMBED_QUEUE_MAX=256

IMAGE_MODEL=sdxl
IMAGE_INFLIGHT_MAX=1
IMAGE_QUEUE_MAX=8
```

## Backpressure

Если очередь полна → gateway отдаёт `HTTP 429 Too Many Requests` с заголовком `Retry-After: 5`.
Tenant-app в `local-llm.ts` видит 429 → передаёт ошибку `LocalAiError('queue_full')` вверх — endpoint возвращает 503 клиенту.

## Per-tenant rate limits (на gateway)

В дополнение к per-endpoint rate-limit'ам в tenant-app, gateway держит **глобальный** лимит на тенанта:

| Bucket | Rate |
|---|---|
| `chat` | 60 req / min / tenant |
| `text_ai` | 30 req / 5 min / tenant |
| `image_ai` | 8 req / 10 min / tenant |
| `embed` | 200 req / min / tenant (для ingest) |

Tenant ID gateway узнаёт из заголовка `X-Tenant-Slug` (master-app проксирует от tenant-app, ставя slug по сети `ai-net` reverse-lookup).

## Batching (опционально, фаза 4+)

Для embedder — batch up to 16 в одном запросе к Ollama. Gateway собирает `embed` запросы в скользящем окне 50ms → группирует в один batch.

LLM батчинг: Ollama сам не поддерживает true continuous batching (как vLLM). Если потребуется — переезд на vLLM (тот же OpenAI-API, поэтому код не меняется).

## Метрики (Prometheus)

```
groundz_llm_queue_depth{resource="llm",tenant="groundz"} 3
groundz_llm_inflight{resource="llm"} 2
groundz_llm_request_duration_seconds{resource="llm",tenant="groundz",quantile="0.95"} 4.2
groundz_llm_requests_total{resource="llm",tenant="acme",status="ok"} 1234
groundz_llm_requests_total{resource="llm",tenant="acme",status="429"} 5
groundz_llm_queue_full_total 12
```

## Failure modes

| Случай | Поведение gateway |
|---|---|
| Ollama упал | health=down, новые запросы → 503; in-flight job получает retry 1 раз через 2s, затем error |
| Один тенант шлёт 1000 запросов | его очередь растёт до tenant-cap 32 → следующие 429; другие тенанты не страдают благодаря round-robin |
| Job timeout (60s) | worker отменяет, gateway возвращает 504, метрика `groundz_llm_timeouts_total` |
| Gateway сам перегружен | global queue 256 → 429 для всех |
| Ollama вернул ошибку (OOM, model not loaded) | gateway пытается reload модели; если не помогло — 503 |

## Reliability cluster (фаза будущего)

При росте — несколько Ollama replicas за gateway, gateway делает round-robin upstream. Один и тот же сетевой контракт.

## Code skeleton

```ts
// llm-gateway/queue.ts
export class JobRunner {
  private queue = new FairQueue();
  private semaphore = new Semaphore(LLM_INFLIGHT_MAX);

  async submit(tenantSlug: string, req: ChatRequest): Promise<ChatResponse> {
    if (this.queue.size(tenantSlug) >= TENANT_QUEUE_CAP) {
      throw new HttpError(429, 'tenant_queue_full');
    }
    if (this.queue.totalSize >= GLOBAL_QUEUE_MAX) {
      throw new HttpError(429, 'global_queue_full');
    }

    return new Promise((resolve, reject) => {
      this.queue.enqueue(tenantSlug, { req, resolve, reject, enqueuedAt: Date.now() });
      this.tick();
    });
  }

  private async tick() {
    if (!this.semaphore.canAcquire()) return;
    const job = this.queue.dequeue();
    if (!job) return;
    this.semaphore.acquire();
    try {
      const result = await this.callOllama(job.req);
      metrics.observeLatency(Date.now() - job.enqueuedAt, job.tenantSlug);
      job.resolve(result);
    } catch (err) {
      job.reject(err);
    } finally {
      this.semaphore.release();
      this.tick();                    // pick up next
    }
  }
}
```

## Tenant-app side: тонкий клиент

`src/lib/server/local-llm.ts` уже использует OpenAI SDK с `baseURL` из env. После добавления gateway просто меняем env:

```
# было
LOCAL_LLM_URL=http://ollama:11434/v1
# стало
LOCAL_LLM_URL=http://llm-gateway:8080/v1
```

Код tenant-app **не меняется**. Дополнительно — клиент шлёт `X-Tenant-Slug` header автоматически:

```ts
new OpenAI({
  baseURL: env.LOCAL_LLM_URL,
  apiKey: 'gw-' + env.TENANT_SLUG,           // фейковый, но gateway достаёт slug отсюда
  defaultHeaders: { 'X-Tenant-Slug': env.TENANT_SLUG },
});
```

