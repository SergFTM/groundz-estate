---
name: security-checklist
description: Use BEFORE every PR or major commit. Groundz handles investor money, KYC documents, and tenant data — every endpoint must pass auth + rate-limit + sanitization checks.
---

# Security Checklist Skill

## Use when
- Перед коммитом или PR
- При создании/изменении API endpoint
- При изменении auth flow
- При работе с user input или uploads

## Per-endpoint checklist

```
☐ Auth: require role / allow anonymous (документировано)
☐ Rate-limit: bucket выбран (public/chat/text_ai/image_ai/admin_job)
☐ Input validation: zod схема для тела запроса
☐ Output filtering: select только нужные поля Prisma (не возвращать password/secret)
☐ Error responses: не утекают stack-trace или internal paths
☐ Logging: без PII (email, phone, password)
☐ CSRF: form-actions автоматом; cross-origin API → проверь rate-limit
☐ IDOR: для resourceId сравни с locals.user.id если ресурс пользовательский
```

## Auth patterns

### Cookie

```ts
cookies.set('token', token, {
  path: '/',
  maxAge: 3600,
  httpOnly: true,
  secure: !dev,                     // ОБЯЗАТЕЛЬНО !dev
  sameSite: 'lax',
});
```

### Guard в API

```ts
import { aiGuard } from '$lib/server/ai-guard';

export const POST = async (event) => {
  const user = aiGuard(event, {
    roles: ['internal_team'],       // 'any' если любой авторизованный
    bucket: 'admin_job',
    allowAnonymous: false,
  });
  // ...
};
```

### Guard в page-server

```ts
import { requireAuth, requireRole } from '$lib/server/guards';

export const load = (event) => {
  const user = requireRole(event, ['investor', 'internal_team']);
  // ...
};
```

## IDOR check

```ts
// ❌ Vulnerable
export const POST = async ({ request, locals }) => {
  const { investorId, data } = await request.json();
  return await prisma.investorInvestment.findMany({ where: { userId: investorId } });
};

// ✅ Secure
export const POST = async (event) => {
  const user = aiGuard(event, { roles: ['investor', 'internal_team'] });
  const { investorId, data } = await event.request.json();
  if (user.role === 'investor' && investorId !== user.id) throw error(403);
  // ...
};
```

## Secrets handling

| Что | Как хранить |
|---|---|
| `JWT_SECRET` | env var, ≥32 байт случайных |
| Tenant DB passwords | `Tenant.dbPasswordEnc` (AES-256-GCM с master.key) |
| Tenant JWT secrets | `Tenant.jwtSecretEnc` |
| Internal seed token | `Tenant.internalTokenEnc` |
| OpenAI key (если случайно остался в legacy) | удалить |
| SMTP pass | env var, не лог |
| User passwords | bcrypt cost=12, никогда plain text |

**Никогда:**
- `console.log(secret)` или `console.log(token)`
- Возврат password hash в API response
- Запись secret в `IngestJob.logsJson`
- Передача secret через URL query string

## Input sanitization

### `@html` rendering

```svelte
<!-- ❌ Trust-on-faith -->
{@html article.content}

<!-- ✅ Sanitized -->
<script>
  import DOMPurify from 'isomorphic-dompurify';
  let { article } = $props();
  let safe = $derived(DOMPurify.sanitize(article.content));
</script>
{@html safe}
```

### File uploads

```ts
const ALLOWED = ['image/jpeg','image/png','image/webp','application/pdf'];
const MAX = 20 * 1024 * 1024;

if (!ALLOWED.includes(file.type)) throw error(400, 'Bad type');
if (file.size > MAX) throw error(400, 'Too large');

// Use UUID filename — DON'T use user-supplied name
const ext = file.name.split('.').pop()?.toLowerCase().replace(/[^a-z0-9]/g, '') ?? 'bin';
const filename = `${randomUUID()}.${ext}`;
```

## Rate-limiting

См. [05-local-ai.skill.md](05-local-ai.skill.md). Минимум:

| Endpoint | Bucket |
|---|---|
| `/auth/login` | `public` (anonymous) |
| `/auth/forgot-password` | `public` |
| Lead/contact формы | `public` |
| `/api/ai/chat` | `chat` |
| `/api/seo/*`, `/api/invest/*` | `text_ai` |
| `/api/generate-tour`, `/api/generate-floor-plan` | `image_ai` |
| `/api/upload-*`, `/api/save-*` | `admin_job` |
| Public GET catalogs | (no limit, кеш) |

## Audit log

Все super-admin действия в master-app:

```ts
await master.auditLog.create({
  data: {
    actor: superAdmin.email,
    action: 'tenant.suspend',
    tenantId,
    payload: JSON.stringify({ reason }),     // никаких секретов
    ip: getClientIp(event),
  },
});
```

## Logging без PII

```ts
// ❌
console.log(`Sending reset to ${email}: ${url}`);

// ✅
if (dev) console.log(`Reset for user`, { hashed: hash(email) });
```

## CSP / Headers (для tenant-app)

`hooks.server.ts` resolve hook:

```ts
return resolve(event, {
  transformPageChunk: ({ html }) => html,
  filterSerializedResponseHeaders: () => true,
  preload: () => true,
});

// Add headers via custom layer:
const response = await resolve(event);
response.headers.set('X-Content-Type-Options', 'nosniff');
response.headers.set('X-Frame-Options', 'DENY');
response.headers.set('Strict-Transport-Security', 'max-age=63072000; includeSubDomains');
return response;
```

## Pre-merge audit script

```bash
# Должен быть в CI
grep -rn "console.log" src/routes/api/        # → должно быть пусто или в `if (dev)`
grep -rn "secure: false" src/routes/auth/     # → 0 совпадений
grep -rn "@html" src/routes --include="*.svelte" # → каждое место имеет DOMPurify
grep -rL "locals.user\\|aiGuard\\|requireAuth" src/routes/api/*/+server.ts | head -20
```

## Anti-patterns

| ❌ | ✅ |
|---|---|
| `error(500, err.message)` (утечка) | `error(500, 'Internal error')` + log |
| `select: undefined` (вернёт всё) | explicit `select` |
| `redirect 302` после login без validate next | `next.startsWith('/')` check |
| Доверие `X-Forwarded-For` без proxy | проверь, что Traefik trusted |
| `crypto.createHash('md5')` для security | `sha256` минимум |
| 1000 ms bcrypt cost | cost=12 (ms ~250 на современном CPU) |
