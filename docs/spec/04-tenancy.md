# Multi-Tenancy — Docker-per-Tenant

## Master DB schema (Postgres)

```prisma
// master-app/prisma/master.schema.prisma
datasource db { provider = "postgresql"; url = env("MASTER_DATABASE_URL") }
generator client { provider = "prisma-client" }

model Tenant {
  id              String    @id @default(uuid())
  slug            String    @unique           // "groundz", "acme-realty"
  domain          String    @unique           // "groundz.estate"
  displayName     String
  status          String    @default("bootstrapping")
  // bootstrapping | ingesting | seeding | ready | suspended | failed | deleting
  composeFilePath String                       // /opt/groundz/stacks/{slug}/docker-compose.yml
  brandJson       String                       // финальный brand
  skinJson        String                       // финальный skin
  enabledCaps     String                       // JSON массив
  dbPasswordEnc   String                       // зашифрован master.key
  jwtSecretEnc    String                       // зашифрован master.key
  qdrantApiKeyEnc String?
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt
  ingestJobs      IngestJob[]
  @@index([status])
}

model IngestJob {
  id              String    @id @default(uuid())
  tenantId        String
  startUrl        String
  step            String    // crawl|extract|chunk|embed|upsert|infer-brand|infer-skin|render|migrate|seed|app-up|done
  progress        Int       @default(0)
  totalUrls       Int       @default(0)
  totalChunks     Int       @default(0)
  totalRecords    Int       @default(0)
  error           String?
  logsJson        String                       // массив строк с timestamp
  startedAt       DateTime  @default(now())
  finishedAt      DateTime?
  tenant          Tenant    @relation(fields: [tenantId], references: [id], onDelete: Cascade)
  @@index([tenantId, startedAt])
}

model SuperAdmin {
  id          String   @id @default(uuid())
  email       String   @unique
  password    String                           // bcrypt
  totpSecret  String?                          // 2FA, обязательно после первого логина
  lastLoginAt DateTime?
  createdAt   DateTime @default(now())
}

model AuditLog {
  id        String   @id @default(uuid())
  actor     String                             // super-admin email
  action    String                             // tenant.create | tenant.suspend | ...
  tenantId  String?
  payload   String                             // JSON, без секретов
  ip        String?
  userAgent String?
  createdAt DateTime @default(now())
  @@index([tenantId, createdAt])
}
```

## Tenant DB schema (Postgres)

`tenant-app/prisma/tenant.schema.prisma` — текущая `schema.prisma` целиком, с переходом провайдера на postgresql.

Главное изменение: добавить `customFieldsJson String?` к `Project` и `Unit`.

## Tenant resolution в hooks

```ts
// src/hooks.server.ts (tenant-app)
import { env } from '$env/dynamic/private';
import { getTenantPrisma } from '$lib/server/tenant-db';
import { loadSkin } from '$lib/server/tenant-skin';

const TENANT_SLUG = env.TENANT_SLUG ?? 'groundz';

export const handle: Handle = async ({ event, resolve }) => {
  // 1. Auth
  const token = event.cookies.get('token');
  event.locals.user = token ? verifyToken(token) : null;

  // 2. Tenant resolution
  event.locals.tenant = {
    slug: TENANT_SLUG,
    prisma: getTenantPrisma(),                 // memoized
    skin: await loadSkin(),                    // memoized 60s LRU
  };

  return resolve(event);
};
```

`tenant-app` всегда обслуживает **один** тенант (slug фиксирован env-переменной контейнера). Master app, наоборот, говорит со всеми через Docker socket — но не читает их БД напрямую.

## Compose template

`/opt/groundz/templates/tenant.compose.yml.tmpl`:

```yaml
name: {{slug}}

services:
  app:
    image: groundz-platform:{{version}}
    container_name: {{slug}}-app
    restart: unless-stopped
    env_file: ./.env
    volumes:
      - ./uploads:/app/static/uploads
      - ./tenant:/tenant:ro
    networks: [ tenant-net, ai-net ]
    depends_on:
      db:     { condition: service_healthy }
      qdrant: { condition: service_healthy }
    healthcheck:
      test: ["CMD", "wget", "-qO-", "http://localhost:3000/api/health"]
      interval: 30s
      timeout: 5s
      retries: 5
    labels:
      - traefik.enable=true
      - traefik.docker.network=ai-net
      - traefik.http.routers.{{slug}}.rule=Host(`{{domain}}`)
      - traefik.http.routers.{{slug}}.tls=true
      - traefik.http.routers.{{slug}}.tls.certresolver=le
      - traefik.http.services.{{slug}}.loadbalancer.server.port=3000

  db:
    image: postgres:16-alpine
    container_name: {{slug}}-db
    restart: unless-stopped
    environment:
      POSTGRES_USER: {{slug}}
      POSTGRES_PASSWORD: {{db_pass}}
      POSTGRES_DB: {{slug}}
    volumes: [ ./pgdata:/var/lib/postgresql/data ]
    healthcheck:
      test: ["CMD", "pg_isready", "-U", "{{slug}}"]
      interval: 10s
      timeout: 3s
      retries: 6
    networks: [ tenant-net ]

  qdrant:
    image: qdrant/qdrant:latest
    container_name: {{slug}}-qdrant
    restart: unless-stopped
    volumes: [ ./qdrant:/qdrant/storage ]
    healthcheck:
      test: ["CMD", "wget", "-qO-", "http://localhost:6333/healthz"]
      interval: 10s
      timeout: 3s
      retries: 6
    networks: [ tenant-net ]

networks:
  tenant-net: { name: {{slug}}-net }
  ai-net:     { external: true }
```

## .env template

`/opt/groundz/templates/tenant.env.tmpl`:

```
TENANT_SLUG={{slug}}
DATABASE_URL=postgresql://{{slug}}:{{db_pass}}@db:5432/{{slug}}
QDRANT_URL=http://qdrant:6333
QDRANT_COLLECTION={{slug}}_rag
LOCAL_LLM_URL=http://ollama:11434/v1
LOCAL_LLM_MODEL=llama3.1:8b
LOCAL_IMAGE_URL=http://auto1111:7860
LOCAL_IMAGE_MODEL=sdxl
EMBED_MODEL=nomic-embed-text
JWT_SECRET={{jwt_secret}}
SITE_URL=https://{{domain}}
SMTP_HOST={{smtp_host}}
SMTP_PORT=587
SMTP_USER={{smtp_user}}
SMTP_PASS={{smtp_pass}}
SMTP_FROM=noreply@{{domain}}
ADMIN_EMAIL=admin@{{domain}}
NODE_ENV=production
```

## Lifecycle commands (super-admin → docker socket)

| Action | Команда |
|---|---|
| provision | `docker compose -f stacks/{slug}/docker-compose.yml up -d` |
| migrate | `docker compose ... run --rm app pnpm prisma migrate deploy` |
| suspend | `docker compose ... stop` |
| resume | `docker compose ... start` |
| redeploy | `docker compose ... pull && docker compose ... up -d` |
| logs | `docker compose ... logs -f --tail=100 app` |
| backup | `tar czf backup-{slug}-{ts}.tgz ./data/tenants/{slug}/` |
| delete | `docker compose ... down -v` + `rm -rf stacks/{slug} data/tenants/{slug}` |

Все вызовы делает `dockerode` из master-app, после успеха пишут `AuditLog`.

## Tenant-app build

Один Docker image `groundz-platform:{version}`. Никакой кастомизации на этапе build:
- Все строки тенанта читаются из `/tenant/brand.json`, `/tenant/skin.json` (read-only mount).
- Динамические CSS-переменные подмешиваются в `+layout.svelte` из skin.brand.
- Custom fields рендерятся компонентом `<CustomFieldsForm fields={skin.unitFields} />`.

## Domain pre-flight checks

При создании тенанта super-admin проверяет:
1. DNS A/AAAA `{domain}` → IP хоста (`dig +short {domain}`).
2. Порт 80/443 открыт.
3. Slug ещё не существует.
4. Compose template корректно рендерится (mustache validation).

Если DNS не настроен — статус `ready_pending_dns`, Traefik подхватит после propagation.

## Backup & restore

- **Backup:** ежедневный cron на хосте — `pg_dump` каждой tenant DB + `qdrant snapshot` + tar tenant folder.
- **Restore:** super-admin выбирает snapshot → `docker compose down` → restore volume → `up`.
- **DR:** snapshot хранится в S3-совместимом хранилище (опц.) или на втором диске.

## Безопасность

| Угроза | Защита |
|---|---|
| Tenant A читает БД tenant B | разные Docker networks, разные Postgres users, разные mounted volumes |
| Tenant контейнер ходит в master | Traefik не маршрутит admin-domain без auth + 2FA, master-net не подключён к tenant-app |
| Docker socket exfiltration | сокет смонтирован только в master-app, ro:false но isolated |
| Master-app компромент | 2FA + IP allowlist + audit log + лимит neighbours admin сети |
| AI runtime DoS из tenant | rate-limit per-tenant + нагрузочный лимит на shared GPU (per-call timeout 60s) |
| Утечка skin.json (содержит брэнд-инфу не критично) | mount as `:ro` |
| RAG poisoning через crawl | санитайз текста, лимит на количество chunks/документ, ручная апрува super-admin перед prod |
