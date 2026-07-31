# Bootstrap Flow — URL → Live Mirror

## Полный сценарий: «загнал URL — получил платформу»

```
[Super-admin UI]                  [Master app]                    [Docker / Tenant]
     |                                 |                                  |
     |  POST /super/tenants            |                                  |
     |  { url, slug, domain }          |                                  |
     |-------------------------------->|                                  |
     |                                 |  1. validate                     |
     |                                 |  2. pre-flight DNS               |
     |                                 |  3. generate secrets             |
     |                                 |  4. render compose + .env        |
     |                                 |  5. INSERT Tenant {status: 'bootstrapping'} |
     |                                 |---------------------------- compose up -d db qdrant
     |                                 |  6. wait healthcheck             |
     |                                 |---------------------------- run --rm app prisma migrate deploy
     |  SSE /super/tenants/{id}/stream |  7. ingest:                      |
     |<--------------------------------|     - crawl                      |
     |  { step, progress, log }        |     - extract                    |
     |                                 |     - chunk                      |
     |                                 |     - embed → ollama (ai-net)    |
     |                                 |     - upsert → tenant qdrant     |
     |                                 |  8. schema-agent:                |
     |                                 |     - infer-brand                |
     |                                 |     - infer-taxonomy             |
     |                                 |     - infer-unit-fields          |
     |                                 |     - infer-project-fields       |
     |                                 |     - infer-voice                |
     |                                 |     → write brand.json + skin.json|
     |                                 |     to ./data/tenants/{slug}/tenant/ |
     |                                 |  9. seed:                        |
     |                                 |     - AI generates Project[] JSON |
     |                                 |     - AI generates Unit[] JSON   |
     |                                 |     - AI generates FAQ[]         |
     |                                 |     - INSERT via tenant /api/internal/seed |
     |                                 |  10. compose up -d app           |
     |                                 |  11. wait app healthcheck        |
     |                                 |  12. UPDATE Tenant {status: 'ready'} |
     |                                 |  13. AuditLog entry              |
     |                                 |                                  |
     |  status = ready                 |                                  |
     |<--------------------------------|                                  |
     |                                 |                                  |
     |  open https://{domain}           |---------------- traefik route → tenant-app:3000
```

## Шаги детально

### 1. Validate

```ts
const slug = z.string().regex(/^[a-z][a-z0-9-]{1,30}$/).parse(input.slug);
const domain = z.string().regex(/^[a-z0-9.-]+\.[a-z]{2,}$/).parse(input.domain);
const url = new URL(input.url);                  // throws on invalid
```

### 2. Pre-flight DNS

```ts
import dns from 'node:dns/promises';
const ips = await dns.resolve4(domain).catch(() => []);
if (!ips.includes(HOST_PUBLIC_IP) && !args.skipDnsCheck)
  throw new Error('DNS A-record не указывает на хост');
```

### 3. Secrets

```ts
const dbPass = randomBytes(24).toString('base64url');
const jwtSecret = randomBytes(32).toString('hex');
```

### 4. Render

Mustache из `templates/tenant.compose.yml.tmpl` + `.env.tmpl`.
Запись в `/opt/groundz/stacks/{slug}/`.

### 5. INSERT Tenant
status='bootstrapping', composeFilePath=..., dbPasswordEnc=encrypt(dbPass), jwtSecretEnc=...

### 6. compose up db qdrant
```ts
await dockerode.compose.up({ cwd: composeDir, services: ['db', 'qdrant'], detach: true });
await waitHealthy(['{slug}-db', '{slug}-qdrant'], 60_000);
```

### 7. Migrate
```ts
await dockerode.compose.run({ service: 'app', rm: true, cmd: ['pnpm', 'prisma', 'migrate', 'deploy'] });
```

### 8. Ingest pipeline (запускается в master-app)

```ts
async function ingest({ tenantSlug, startUrl, jobId }) {
  await ensureCollection(tenantSlug);
  const urls = await crawler.run(startUrl, { maxDepth: 2, maxPages: 100, respectRobots: true });
  await jobLog(jobId, 'crawl', { totalUrls: urls.length });

  const documents = [];
  for (const url of urls) {
    const html = await fetchHtml(url);
    documents.push(extractor.extract(html, url));
  }
  await jobLog(jobId, 'extract', { totalDocs: documents.length });

  const chunks = documents.flatMap(d => chunker.chunk(d));
  await jobLog(jobId, 'chunk', { totalChunks: chunks.length });

  const vectors = await embedder.embedBatch(chunks);          // ollama
  await qdrant.upsert(tenantSlug + '_rag', vectors);
  await jobLog(jobId, 'embed', { embedded: vectors.length });
}
```

### 9. Schema-agent

Каждый агент — короткий вызов `localChat` с jsonMode и zod-валидацией ответа.
Результаты собираются в `synthesize.ts` → `brand.json` + `skin.json`.

### 10. Seed

Master-app не пишет напрямую в tenant Postgres. Вместо этого tenant-app expose-ит **internal endpoint** `/api/internal/seed`, защищённый через `Authorization: Bearer {INTERNAL_SEED_TOKEN}` (env-secret, известный только master).

```ts
POST http://{slug}-app:3000/api/internal/seed
Body: { type: 'project'|'unit'|'faq', records: [...] }
```

Master-app зовёт endpoint через `ai-net`. Tenant-app проверяет токен → `prisma.create*`.

### 11. compose up app
```ts
await dockerode.compose.up({ cwd: composeDir, services: ['app'], detach: true });
await waitHealthy([`{slug}-app`], 90_000);
```

### 12. Status ready

`UPDATE Tenant SET status = 'ready', updatedAt = NOW()`.

### 13. AuditLog

```ts
await master.auditLog.create({
  data: {
    actor: superAdmin.email,
    action: 'tenant.create',
    tenantId,
    payload: JSON.stringify({ slug, domain, totalChunks, totalRecords }),
    ip: event.getClientAddress(),
  },
});
```

## Resumable steps (idempotency)

Каждый step:
1. Проверяет состояние ДО (например, для `embed`: какие чанки уже есть в Qdrant?).
2. Делает работу только над дельтой.
3. Пишет state в `IngestJob.step` и `progress`.

При retry job-runner начинает с `step + 1` если предыдущий шаг != 'failed'.

## Estimated duration (single tenant, 100 страниц сайта)

| Шаг | Время |
|---|---|
| 1–6 (создание стека) | 30 сек |
| 7 (migrate) | 10 сек |
| 8 (ingest, 100 pages × ~5 chunks) | ~3 мин (crawl + embed) |
| 9 (schema-agent, 5 промптов) | ~1 мин |
| 10 (seed, ~20 проектов × 100 юнитов) | ~3 мин |
| 11 (app start) | 15 сек |
| **Всего** | **~8 мин** |

## Edge cases

| Случай | Поведение |
|---|---|
| URL отдаёт 401/403 | пропустить, лог-варн |
| Sitemap отсутствует | fallback: BFS обход с `<a href>` лимит 100 страниц |
| Сайт отдаёт SPA без SSR | fallback: Playwright headless (опционально, отдельный сервис) |
| Контента слишком мало (< 5 chunks) | абортить ingest, вернуть `INSUFFICIENT_CONTENT` |
| Schema-agent вернул мусор (zod fail) | retry 1 раз с другой температурой, потом fallback на default skin |
| Domain не зарезолвился | tenant создан со status `ready_pending_dns`, Traefik подхватит позже |
| Postgres миграция упала | rollback: `compose down -v`, status `failed`, audit log |
