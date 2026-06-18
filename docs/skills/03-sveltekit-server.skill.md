---
name: sveltekit-server
description: Use when adding/modifying SvelteKit server code — +server.ts API endpoints, +page.server.ts loaders/actions, hooks.server.ts, env access. Groundz has strict patterns for tenant resolution, auth, and rate limiting.
---

# SvelteKit Server Skill

## Use when
- Создаёшь `+server.ts` (API endpoint)
- Создаёшь `+page.server.ts` (load + actions)
- Меняешь `hooks.server.ts`
- Читаешь env-variables

## Env access

```ts
// ✅ Static private (build-time)
import { JWT_SECRET, DATABASE_URL } from '$env/static/private';

// ✅ Dynamic private (runtime)
import { env } from '$env/dynamic/private';
const url = env.LOCAL_LLM_URL ?? 'http://localhost:11434/v1';

// ❌ NEVER
const x = process.env.X;
```

## API endpoint template

```ts
// src/routes/api/{namespace}/{action}/+server.ts
import { json, error } from '@sveltejs/kit';
import { aiGuard } from '$lib/server/ai-guard';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async (event) => {
  // 1. Auth + rate limit FIRST
  const user = aiGuard(event, { roles: ['internal_team'], bucket: 'text_ai' });

  // 2. Parse body
  const body = await event.request.json().catch(() => null);
  if (!body) throw error(400, 'Invalid JSON');

  // 3. Validate with zod
  const parsed = mySchema.safeParse(body);
  if (!parsed.success) throw error(400, parsed.error.message);

  // 4. Tenant DB
  const { prisma } = event.locals.tenant;

  // 5. Business logic
  const result = await doWork(parsed.data, prisma);

  // 6. Return
  return json(result);
};
```

## Page server template

```ts
// src/routes/foo/+page.server.ts
import { fail, redirect } from '@sveltejs/kit';
import { rateLimit } from '$lib/server/rate-limit';
import { someSchema } from '$lib/utils/validators';
import type { PageServerLoad, Actions } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
  const items = await locals.tenant.prisma.item.findMany();
  return { items };
};

export const actions: Actions = {
  default: async (event) => {
    rateLimit(event, 'public');
    const formData = await event.request.formData();
    const result = someSchema.safeParse(Object.fromEntries(formData));
    if (!result.success) {
      const errors: Record<string, string> = {};
      for (const issue of result.error.issues) errors[issue.path[0] as string] = issue.message;
      return fail(400, { errors, values: { /* preserve */ } });
    }
    // ...
    throw redirect(303, '/success');
  },
};
```

## hooks.server.ts pattern

```ts
import type { Handle } from '@sveltejs/kit';
import { verifyToken } from '$lib/server/auth';
import { getTenantPrisma } from '$lib/server/tenant-db';
import { loadSkin } from '$lib/server/tenant-skin';
import { env } from '$env/dynamic/private';

const TENANT_SLUG = env.TENANT_SLUG ?? 'groundz';

export const handle: Handle = async ({ event, resolve }) => {
  const token = event.cookies.get('token');
  event.locals.user = token ? verifyToken(token) : null;
  if (!event.locals.user && token) {
    event.cookies.delete('token', { path: '/' });
  }

  event.locals.tenant = {
    slug: TENANT_SLUG,
    prisma: getTenantPrisma(),
    skin: await loadSkin(),
  };

  return resolve(event);
};
```

## Rules

1. **Auth первым.** До чтения body, до DB, до AI вызовов.
2. **Никогда не `throw redirect` в API endpoints** (`+server.ts`) — только в `+page.server.ts`.
3. **Не возвращай Prisma модели напрямую** если в них есть password/secret поля — выбирай через `select`.
4. **Cookie всегда** `httpOnly: true, secure: !dev, sameSite: 'lax'`.
5. **Form actions используют SvelteKit CSRF** автоматически — для cross-origin API endpoints rate-limit обязателен.
6. **Логи без PII** — никогда не `console.log` email, phone, password, JWT.

## Common mistakes

| ❌ | ✅ |
|---|---|
| `import db from '$lib/server/db'` в API endpoint | `event.locals.tenant.prisma` |
| `console.log(\`reset link: ${url}\`)` в prod | `if (dev) console.log(...)` |
| `throw redirect()` в `+server.ts` | `return json({...}, { status: 302 })` или fix вызывающий код |
| body parse без try/catch | `await request.json().catch(() => null)` |
| Возврат `prisma.user.findMany()` целиком | `prisma.user.findMany({ select: { id, email, name } })` |
