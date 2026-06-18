---
name: local-ai
description: Use whenever calling AI — text generation, embeddings, image generation. Groundz runs everything locally (Ollama + Automatic1111). Cloud AI APIs are forbidden. Always cache and rate-limit.
---

# Local AI Skill

## Use when
- Текстовый AI вызов (chat completion, JSON output)
- Embedding для RAG
- Генерация изображений
- Health check AI стека

## Stack — single LLM server, fair queue, two-tier router

| Component | URL (in Docker `ai-net`) | Назначение |
|---|---|---|
| **llm-gateway** | `http://llm-gateway:8080` | **единственный вход**, fair queue + tier router + per-tenant rate-limit |
| ollama (за gateway) | `http://ollama:11434` | оба weight'а загружены одновременно |
| auto1111 (за gateway) | `http://auto1111:7860` | SDXL base 1.0 |

**Tenant-app никогда не звонит в ollama напрямую.** Все вызовы идут через gateway.

`LOCAL_LLM_URL` в env tenant-app = `http://llm-gateway:8080/v1` (НЕ `http://ollama:11434/v1`).

## Two-tier model strategy

| Tier | Модель | Когда использовать |
|---|---|---|
| **small** | `llama3.2:3b` | классификация, routing, короткие ответы, извлечение JSON-полей, tool args, content-type detection, comment auto-mod |
| **large** | `qwen2.5:14b` | сложные рассуждения, длинная генерация, multi-step JSON, schema-agent inference, анализ документов, кабинетный chat |

### Правило большого пальца
- **Ответ ≤ 100 токенов или классификация** → tier `small`
- **Ответ > 200 токенов или нужно reasoning по нескольким источникам** → tier `large`
- **Public chat** → escalation: small classifies → small или large отвечает
- **Authenticated chat** (cabinet) → сразу large
- **Schema-agent inference** (brand voice, unit fields) → large
- **Schema-agent classify** (что это за чанк: project/unit/about) → small

### API использования

```ts
import { localChat } from '$lib/server/local-llm';

// Способ 1: явный tier
const r = await localChat({
  tier: 'small',
  prompt: 'Classify: simple | complex',
  maxTokens: 8,
});

// Способ 2: capability — gateway сам резолвит tier по карте
const r = await localChat({
  capability: 'invest.pool-chat',     // → large (по карте)
  prompt: '...',
  systemPrompt: '...',
});

// Способ 3: дефолт (large) — НЕ предпочтительно, явность лучше
const r = await localChat({ prompt: '...' });
```

## Text completion

```ts
import { localChat } from '$lib/server/local-llm';

const result = await localChat({
  prompt: 'Кратко опиши инвест-пул...',
  systemPrompt: 'Ты — финансовый аналитик. Отвечай по-русски.',
  temperature: 0.3,
  maxTokens: 600,
  jsonMode: false,                  // true → response_format: json_object
});
// → { content, inputTokens, outputTokens }
```

## Tool calling (Ollama supports OpenAI tool format)

```ts
import { getLocalLLM, LOCAL_LLM_MODEL } from '$lib/server/local-llm';

const client = getLocalLLM();
const response = await client.chat.completions.create({
  model: LOCAL_LLM_MODEL,
  messages: [...],
  tools: [{
    type: 'function',
    function: {
      name: 'search_projects',
      description: '...',
      parameters: { type: 'object', properties: {...} },
    },
  }],
  tool_choice: 'auto',
});
```

## Embeddings

```ts
// src/lib/server/ai-core/ingestor/embedder.ts
import { env } from '$env/dynamic/private';

export async function embed(text: string): Promise<number[]> {
  const url = env.LOCAL_LLM_URL?.replace('/v1', '') ?? 'http://ollama:11434';
  const r = await fetch(`${url}/api/embeddings`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ model: env.EMBED_MODEL ?? 'nomic-embed-text', prompt: text }),
  });
  if (!r.ok) throw new Error(`Embed failed: ${r.status}`);
  const data = await r.json() as { embedding: number[] };
  return data.embedding;
}

export async function embedBatch(texts: string[]): Promise<number[][]> {
  const result: number[][] = [];
  for (const t of texts) result.push(await embed(t));   // ollama batches internally
  return result;
}
```

## Image generation

```ts
import { generateLocalImage, LocalImageError } from '$lib/server/local-image';

const b64 = await generateLocalImage({
  prompt: 'minimalist living room, mediterranean, daytime',
  negativePrompt: 'people, text, watermark',
  width: 1280,
  height: 832,
  steps: 32,
  cfgScale: 7,
});
// b64 → save to disk
```

## Caching

Все AI вызовы из API endpoints кешируются в `AiResponseCache`.

```ts
import { createHash } from 'crypto';

function buildCacheKey(opts: { tenantSlug: string; capability: string; payload: unknown }) {
  const json = JSON.stringify(opts);
  return createHash('sha256').update(json).digest('hex').slice(0, 32);
}

// Pattern:
const cacheKey = buildCacheKey({ tenantSlug, capability: 'invest', payload: { poolId, hash } });
const cached = await prisma.aiResponseCache.findUnique({ where: { cacheKey } });
if (cached && cached.expiresAt > new Date()) return JSON.parse(cached.response);

const result = await localChat({...});

await prisma.aiResponseCache.upsert({
  where: { cacheKey },
  create: { cacheKey, response: JSON.stringify(result.content), model: 'llama3.1:8b',
            tokensUsed: result.inputTokens + result.outputTokens,
            expiresAt: new Date(Date.now() + 4 * 60 * 60 * 1000) },
  update: { response: ..., expiresAt: ... },
});
```

TTL по умолчанию:
- Static explainers (metric explanations) → 24h
- Portfolio insights → 4h
- Pool chat → 1h (но history делает их фактически unique)

## Rate limiting

Каждый AI endpoint оборачивается в `aiGuard`:

```ts
import { aiGuard } from '$lib/server/ai-guard';

export const POST: RequestHandler = async (event) => {
  aiGuard(event, {
    roles: ['internal_team'],     // или 'any', или конкретные
    bucket: 'text_ai',            // или 'image_ai', 'chat', 'public', 'admin_job'
    allowAnonymous: false,
  });
  // ...
};
```

Buckets (см. `rate-limit.ts`):
- `public` 10/мин — лидформы, login
- `chat` 30/мин — chat widgets
- `text_ai` 20 / 5 мин — генерации текста
- `image_ai` 6 / 10 мин — SD generation
- `admin_job` 100/мин — bulk operations

## Error handling

```ts
import { LocalAiError } from '$lib/server/local-llm';

try {
  const result = await localChat({...});
} catch (err) {
  if (err instanceof LocalAiError) {
    if (err.code === 'unavailable') return json({ error: 'AI offline' }, { status: 503 });
    if (err.code === 'timeout') return json({ error: 'AI timeout' }, { status: 504 });
  }
  throw err;
}
```

## Anti-patterns

| ❌ | ✅ |
|---|---|
| `new OpenAI({ apiKey: '...' })` с реальным cloud key | Ollama через `localChat()` |
| Прямой fetch к `http://ollama:11434` минуя gateway | через `llm-gateway:8080` |
| Использовать large tier для классификации intent или yes/no | tier `small` |
| Использовать small tier для длинной генерации текста | tier `large` |
| Без кэша на повторные одинаковые запросы | `AiResponseCache` с TTL |
| Без `aiGuard()` на `/api/(seo|invest|...)` | guard обязателен |
| Длинные промпты без обрезки user input | `message.slice(0, 500)` |
| JSON-парсинг без try/catch | `try { JSON.parse(raw) } catch { ... fallback }` |
| Кешировать персональные инсайты глобально | ключ должен включать `userId`/`tenantSlug` |
| Параллельный запуск 50 image-job'ов | gateway держит inflight=1 для image — лучше batch |
| Игнорировать 429 от gateway | retry с `Retry-After` header или возврат 503 клиенту |

## Health check

```ts
// /api/health/ai (admin-only)
import { localChat } from '$lib/server/local-llm';
import { checkLocalImageHealth } from '$lib/server/local-image';

const llm = await localChat({ prompt: 'reply ok', maxTokens: 8 }).catch(e => ({ error: e.message }));
const image = await checkLocalImageHealth();
// + check qdrant: GET /collections
```
