---
name: rag-pipeline
description: Use when working on the ingest pipeline, Qdrant collections, retrieval, or anything in src/lib/server/ai-core/. Each tenant has its OWN Qdrant collection — never query across tenants.
---

# RAG Pipeline Skill

## Use when
- Crawling/extracting content
- Создаёшь чанки или embedding
- Работаешь с Qdrant (upsert, search, delete)
- Имплементируешь schema-agent

## Pipeline стадии

```
URL → crawl → extract → chunk → embed → upsert → retrieve → ask
```

## Crawler

```ts
// src/lib/server/ai-core/ingestor/crawler.ts
export interface CrawlOptions {
  maxDepth?: number;          // default 2
  maxPages?: number;          // default 100
  respectRobots?: boolean;    // default true
  sameOrigin?: boolean;       // default true
}

export async function crawl(startUrl: string, opts: CrawlOptions = {}): Promise<string[]> {
  // 1. fetch /sitemap.xml; if 200 — use it as primary
  // 2. else BFS from startUrl, collect <a href> within same origin
  // 3. dedupe, normalize
  // 4. respect robots.txt via robots-parser
  // returns ordered URL list
}
```

Правила:
- Уважать `robots.txt` всегда (исключение: super-admin override).
- User-Agent: `Groundz-Bot/1.0 (+https://groundz.estate/bot)`.
- Лимит per-host concurrency: 3.
- Timeout per fetch: 15 сек.

## Extractor

```ts
import { Readability } from '@mozilla/readability';
import { JSDOM } from 'jsdom';

export interface ExtractedDoc {
  url: string;
  title: string;
  text: string;          // clean main content
  contentType: 'project' | 'unit' | 'pricing' | 'about' | 'article' | 'faq' | 'contact' | 'other';
  metadata: Record<string, unknown>;
}

export function extract(html: string, url: string): ExtractedDoc {
  const dom = new JSDOM(html, { url });
  const article = new Readability(dom.window.document).parse();
  // + heuristics: detect contentType by URL pattern + DOM markers
  // + regex extract: prices €, area m², bedrooms count
}
```

## Chunker

```ts
const TARGET_TOKENS = 600;
const OVERLAP = 80;

export function chunk(doc: ExtractedDoc): Chunk[] {
  // Split on \n\n (paragraphs), greedy-pack until ~600 tokens.
  // If a paragraph > 1200 tokens — split on sentence boundary.
  // Add overlap = last 80 tokens of previous chunk to next.
}

interface Chunk {
  id: string;                   // uuid
  docId: string;
  text: string;
  contentType: string;
  url: string;
  position: number;
}
```

Token estimate: `text.length / 4` для english/русский (грубо).

## Qdrant client

```ts
// src/lib/server/ai-core/rag/qdrant-client.ts
import { QdrantClient } from '@qdrant/js-client-rest';
import { env } from '$env/dynamic/private';

export const qdrant = new QdrantClient({ url: env.QDRANT_URL ?? 'http://qdrant:6333' });
```

## Ensure collection

```ts
export async function ensureCollection(slug: string) {
  const name = `${slug}_rag`;
  const exists = await qdrant.getCollections()
    .then(r => r.collections.some(c => c.name === name));
  if (!exists) {
    await qdrant.createCollection(name, {
      vectors: { size: 768, distance: 'Cosine' },        // nomic-embed-text size
    });
  }
  return name;
}
```

## Upsert

```ts
export async function upsertChunks(slug: string, chunks: Chunk[], vectors: number[][]) {
  const collection = `${slug}_rag`;
  const points = chunks.map((c, i) => ({
    id: c.id,
    vector: vectors[i],
    payload: {
      docId: c.docId,
      url: c.url,
      contentType: c.contentType,
      position: c.position,
      text: c.text,
    },
  }));
  // Bulk upsert in batches of 256
  for (let i = 0; i < points.length; i += 256) {
    await qdrant.upsert(collection, { points: points.slice(i, i + 256), wait: false });
  }
}
```

## Retrieve

```ts
export async function retrieve(opts: {
  slug: string;
  query: string;
  k?: number;
  filter?: { contentType?: string };
}): Promise<{ text: string; url: string; score: number }[]> {
  const collection = `${opts.slug}_rag`;
  const vector = await embed(opts.query);
  const filter = opts.filter?.contentType
    ? { must: [{ key: 'contentType', match: { value: opts.filter.contentType } }] }
    : undefined;
  const result = await qdrant.search(collection, {
    vector,
    limit: opts.k ?? 8,
    filter,
    with_payload: true,
  });
  return result.map(r => ({
    text: (r.payload as any).text,
    url: (r.payload as any).url,
    score: r.score,
  }));
}
```

## Schema-agent шаблон

```ts
import { localChat } from '$lib/server/local-llm';
import { z } from 'zod';

const UnitFieldsSchema = z.array(z.object({
  key: z.string().regex(/^[a-z][a-zA-Z0-9]+$/),
  type: z.enum(['int','float','string','enum','bool']),
  label: z.object({ en: z.string(), ru: z.string() }),
  required: z.boolean(),
  options: z.array(z.string()).optional(),
})).max(8);

export async function inferUnitFields(slug: string): Promise<z.infer<typeof UnitFieldsSchema>> {
  const chunks = await retrieve({ slug, query: 'apartment unit features price area bedrooms', k: 30,
                                  filter: { contentType: 'unit' } });
  const ctx = chunks.map(c => c.text).join('\n\n');

  const result = await localChat({
    systemPrompt: 'You output JSON only. No prose.',
    prompt: `Standard caркас of Unit: code, type, bedrooms, floor, areaSqm, price, status.
Looking at this content, suggest ADDITIONAL fields specific to this developer.
Return JSON array, max 8 items.

Content:
${ctx}`,
    jsonMode: true,
    temperature: 0.2,
    maxTokens: 1500,
  });

  const parsed = UnitFieldsSchema.safeParse(JSON.parse(result.content));
  if (!parsed.success) {
    // retry once with stricter prompt; if still failing → return []
    return [];
  }
  return parsed.data;
}
```

## Rules

1. **Per-tenant collections only.** Никогда `qdrant.search` без префикса slug.
2. **Idempotency.** Чанки имеют детерминированный `id` (хеш `docId+position`) — повторный upsert безопасен.
3. **Deletion.** При удалении тенанта — `qdrant.deleteCollection(slug + '_rag')` обязательно.
4. **Embed model совместимость.** Если меняется EMBED_MODEL → пересоздавать коллекции (vector size может отличаться).
5. **Логи без content.** В IngestJob.logs пишем только метрики (totalUrls, totalChunks), не сами тексты.

## Anti-patterns

| ❌ | ✅ |
|---|---|
| Один глобальный Qdrant collection | per-tenant |
| Хранить embedding в Postgres | Qdrant |
| Embed без батчинга | batch 16-32 |
| Поиск без фильтра contentType | используй filter для специфичных capabilities |
| Хардкод `text.slice(0, 1500)` для контекста | pack чанки до budget tokens |
