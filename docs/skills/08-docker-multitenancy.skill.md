---
name: docker-multitenancy
description: Use when working with Docker Compose templates, master ↔ tenant orchestration via dockerode, or anything that touches stacks/, infra/, templates/. Each tenant has an isolated stack; AI is shared.
---

# Docker Multi-tenancy Skill

## Use when
- Меняешь `templates/tenant.compose.yml.tmpl` или `tenant.env.tmpl`
- Пишешь код в `master-app/src/lib/server/control-plane/`
- Добавляешь новый сервис в shared `ai-net`
- Пишешь Dockerfile для tenant-app или master-app

## Layout

```
/opt/groundz/
├── infra/
│   ├── ai.compose.yml          # Ollama + Auto1111 + Traefik (shared, поднимается раз)
│   └── master.compose.yml      # master-app + master-db
├── templates/
│   ├── tenant.compose.yml.tmpl # mustache template
│   └── tenant.env.tmpl
├── stacks/                      # generated по тенантам, gitignored
│   ├── groundz/{docker-compose.yml,.env}
│   └── acme-realty/...
├── data/                        # volumes, gitignored
│   ├── ai/{ollama,sd}
│   ├── master/{pgdata}
│   ├── letsencrypt/
│   └── tenants/{slug}/{pgdata,qdrant,uploads,tenant/}
└── secrets/master.key           # AES-256 ключ для шифрования tenant-secrets
```

## Networks

| Network | Тип | Кто в нём |
|---|---|---|
| `ai-net` | external bridge | ollama, auto1111, traefik, **все** tenant-app, master-app |
| `admin-net` | bridge (master-only) | master-app, master-db |
| `{slug}-net` | bridge (per-tenant) | {slug}-app, {slug}-db, {slug}-qdrant |

`ai-net` создаётся **первым**, отдельной командой:
```bash
docker network create ai-net
```

## tenant.compose.yml.tmpl правила

1. `name: {{slug}}` — Docker Compose project name = slug.
2. Сервисы: `app`, `db`, `qdrant` — обязательно. Не более.
3. **Healthchecks обязательны** для db и qdrant (app — depends_on `service_healthy`).
4. Volumes — относительные пути к stack folder: `./pgdata`, `./qdrant`, `./uploads`, `./tenant`.
5. **Traefik labels** только на `app`-сервисе.
6. Внешний `ai-net: { external: true }`.

## Compose-renderer

```ts
// master-app/src/lib/server/control-plane/compose-renderer.ts
import Mustache from 'mustache';
import { readFile, writeFile, mkdir } from 'fs/promises';
import { resolve } from 'path';

export async function renderTenantStack(opts: {
  slug: string;
  domain: string;
  dbPass: string;
  jwtSecret: string;
  smtp: { host: string; port: number; user: string; pass: string };
  imageVersion: string;
}) {
  const stackDir = resolve('/opt/groundz/stacks', opts.slug);
  await mkdir(stackDir, { recursive: true });

  const composeTmpl = await readFile('/opt/groundz/templates/tenant.compose.yml.tmpl', 'utf-8');
  const envTmpl = await readFile('/opt/groundz/templates/tenant.env.tmpl', 'utf-8');

  const view = {
    slug: opts.slug,
    domain: opts.domain,
    db_pass: opts.dbPass,
    jwt_secret: opts.jwtSecret,
    smtp_host: opts.smtp.host,
    smtp_port: opts.smtp.port,
    smtp_user: opts.smtp.user,
    smtp_pass: opts.smtp.pass,
    version: opts.imageVersion,
  };

  await writeFile(resolve(stackDir, 'docker-compose.yml'), Mustache.render(composeTmpl, view));
  await writeFile(resolve(stackDir, '.env'), Mustache.render(envTmpl, view), { mode: 0o600 });

  return stackDir;
}
```

## dockerode wrapper

```ts
// master-app/src/lib/server/control-plane/docker-client.ts
import Docker from 'dockerode';
import { execFile } from 'child_process';
import { promisify } from 'util';

const docker = new Docker({ socketPath: '/var/run/docker.sock' });
const exec = promisify(execFile);

export async function composeUp(stackDir: string, services: string[] = []) {
  const args = ['compose', '-f', `${stackDir}/docker-compose.yml`, 'up', '-d'];
  if (services.length) args.push(...services);
  return exec('docker', args);
}

export async function composeDown(stackDir: string, removeVolumes = false) {
  const args = ['compose', '-f', `${stackDir}/docker-compose.yml`, 'down'];
  if (removeVolumes) args.push('-v');
  return exec('docker', args);
}

export async function composeRunCommand(stackDir: string, service: string, cmd: string[]) {
  return exec('docker', ['compose', '-f', `${stackDir}/docker-compose.yml`,
                          'run', '--rm', service, ...cmd]);
}

export async function waitHealthy(containerName: string, timeoutMs = 60_000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    const c = docker.getContainer(containerName);
    const info = await c.inspect().catch(() => null);
    if (info?.State?.Health?.Status === 'healthy') return;
    await new Promise(r => setTimeout(r, 2000));
  }
  throw new Error(`${containerName} did not become healthy in ${timeoutMs}ms`);
}

export async function streamLogs(containerName: string, onLine: (line: string) => void) {
  const c = docker.getContainer(containerName);
  const stream = await c.logs({ follow: true, stdout: true, stderr: true, tail: 100 });
  // ... parse stream chunks → lines → onLine
}
```

## Internal seed endpoint (master → tenant)

```ts
// tenant-app: src/routes/api/internal/seed/+server.ts
import { json, error } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';

export const POST = async ({ request, locals }) => {
  const auth = request.headers.get('authorization')?.replace('Bearer ', '');
  if (auth !== env.INTERNAL_SEED_TOKEN) throw error(401);

  const { type, records } = await request.json();
  // INSERT через locals.tenant.prisma
  // Только разрешённые типы: 'project','unit','article','faq','job','pool'
};
```

`INTERNAL_SEED_TOKEN` — генерится раз при provision, известен только master (Tenant.internalTokenEnc) и tenant-app (через .env).

## Dockerfile patterns

### tenant-app

```dockerfile
# tenant-app/Dockerfile
FROM node:20-alpine AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci

FROM node:20-alpine AS build
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npx prisma generate && npm run build

FROM node:20-alpine AS run
WORKDIR /app
COPY --from=build /app/build ./build
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/package.json ./package.json
COPY --from=build /app/prisma ./prisma
ENV NODE_ENV=production
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=5s --retries=5 \
  CMD wget -qO- http://localhost:3000/api/health || exit 1
CMD ["node", "build"]
```

### master-app

Аналогично, но без prisma миграций при build (master имеет свою master-схему).

## Secrets

```ts
// master-app/src/lib/server/control-plane/secrets.ts
import { readFileSync } from 'fs';
import { createCipheriv, createDecipheriv, randomBytes, createHash } from 'crypto';

const KEY = createHash('sha256').update(readFileSync('/opt/groundz/secrets/master.key')).digest();

export function encrypt(plain: string): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv('aes-256-gcm', KEY, iv);
  const enc = Buffer.concat([cipher.update(plain, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return Buffer.concat([iv, tag, enc]).toString('base64');
}

export function decrypt(token: string): string {
  const buf = Buffer.from(token, 'base64');
  const iv = buf.subarray(0, 12);
  const tag = buf.subarray(12, 28);
  const enc = buf.subarray(28);
  const dec = createDecipheriv('aes-256-gcm', KEY, iv);
  dec.setAuthTag(tag);
  return dec.update(enc) + dec.final('utf8');
}

export function newSecret(bytes = 32): string {
  return randomBytes(bytes).toString('base64url');
}
```

## Anti-patterns

| ❌ | ✅ |
|---|---|
| Один глобальный compose, все тенанты в одной БД | per-tenant stack |
| Hardcoded slugs в template | Mustache view |
| Открытые порты Postgres/Qdrant наружу | только внутрь tenant-net |
| Docker socket mount в tenant-контейнер | НИКОГДА; только master |
| Хранить `tenant.dbPassword` в plain text | encrypt с master.key |
| `docker exec ... rm -rf` для cleanup | `docker compose down -v` + удаление папки |
