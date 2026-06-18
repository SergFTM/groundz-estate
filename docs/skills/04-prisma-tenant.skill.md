---
name: prisma-tenant
description: Use when modifying schema.prisma, writing migrations, or accessing the database. Groundz runs DB-per-tenant in production (Postgres), never use a global Prisma singleton in tenant-scoped code.
---

# Prisma + Tenancy Skill

## Use when
- Меняешь `prisma/schema.prisma` или планируешь миграцию
- Пишешь запрос к БД
- Видишь `import db from '$lib/server/db'` (legacy pattern)

## Two schemas

| Schema | Path | DB | Кто использует |
|---|---|---|---|
| Master | `master-app/prisma/master.schema.prisma` | master Postgres | super-admin app |
| Tenant | `tenant-app/prisma/tenant.schema.prisma` | per-tenant Postgres | tenant app |

Текущий `groundz-svelte/prisma/schema.prisma` сейчас единый — будет разделён в Phase 0.

## Tenant client (per-request)

```ts
// src/lib/server/tenant-db.ts
import { PrismaClient } from '../../generated/prisma/client.js';
import { env } from '$env/dynamic/private';

let _client: PrismaClient | null = null;

export function getTenantPrisma(): PrismaClient {
  if (_client) return _client;
  _client = new PrismaClient({
    datasources: { db: { url: env.DATABASE_URL } },
  });
  return _client;
}
```

В tenant-app slug фиксирован env'ом → один Prisma client на процесс.
В master-app — отдельный client для master DB.

Для **межтенантных** операций (master читает чужую БД — обычно НЕ делает) используется HTTP-вызов к internal endpoint того тенанта.

## Schema rules

```prisma
generator client {
  provider = "prisma-client"
  output   = "../src/generated/prisma"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}
```

- **Все модели** имеют `id String @id @default(uuid())` (или composite key где явно нужно).
- **createdAt + updatedAt** на mutable моделях.
- **Cascade deletes:** через `onDelete: Cascade` на FK.
- **Custom fields:** на `Project` и `Unit` поле `customFieldsJson String?` для skin-driven данных.
- **Indexes:** ставить на поля, по которым фильтруем (`@@index([status])`, `@@index([tenantId, createdAt])` в master).

## Migration commands

```bash
# Dev: накатить миграцию
npx prisma migrate dev --name add_tenant_skin

# Prod (в tenant-app контейнере):
npx prisma migrate deploy

# Reset (только dev, удаляет данные):
npx prisma migrate reset --force
```

**Никогда** в production не делай `prisma db push` — теряет migration history.

## Query patterns

```ts
// ✅ Select только нужное
const users = await prisma.user.findMany({
  select: { id: true, email: true, name: true, role: true },
});

// ✅ Транзакция для multi-step
await prisma.$transaction([
  prisma.lead.create({ data: leadData }),
  prisma.notification.create({ data: notifData }),
]);

// ✅ Pagination
const items = await prisma.unit.findMany({
  where: { projectId, status: 'available' },
  orderBy: { createdAt: 'desc' },
  skip: (page - 1) * limit,
  take: limit,
});

// ✅ Включение relation с select
const pool = await prisma.investmentPool.findUnique({
  where: { id },
  include: {
    milestones: { orderBy: { plannedDate: 'asc' } },
    _count: { select: { investments: true } },
  },
});
```

## Anti-patterns

| ❌ | ✅ |
|---|---|
| `prisma.user.findMany()` без `select` (вернёт password) | `select: { id, email, name }` |
| `prisma.$queryRaw` без причины | использовать ORM API |
| Не закрывать связи с CASCADE → orphan rows | `onDelete: Cascade` или `SetNull` |
| Глобальный singleton в multi-tenant master | per-tenant resolution |
| `findUnique({ where: { email } })` без `@unique` на email | проверь schema |

## SQLite legacy notes

Текущий код использует `@prisma/adapter-better-sqlite3`. После Phase 0:

- удалить `@prisma/adapter-better-sqlite3` и `better-sqlite3` из package.json
- `db.ts` упростить: `new PrismaClient({ datasources: { db: { url } } })`
- `prisma.config.ts` — оставить или удалить (Prisma 7 авто-detects schema)

## customFieldsJson example

```ts
// Skin определяет fields:
const fields = tenant.skin.unitFields;
// [{ key: 'parkingSpots', type: 'int', label: { en: 'Parking', ru: 'Парковка' }, required: false }]

// При insert:
const customFields = { parkingSpots: 2, viewType: 'sea' };
await prisma.unit.create({
  data: {
    ...standardFields,
    customFieldsJson: JSON.stringify(customFields),
  },
});

// При render:
const cf = JSON.parse(unit.customFieldsJson ?? '{}');
fields.forEach(f => render(f, cf[f.key]));
```
