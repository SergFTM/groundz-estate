---
name: capability-development
description: Use when adding a new capability to Groundz or modifying an existing one. Capabilities are immutable building blocks — they always exist on every tenant and AI can only enhance them via skin, not remove them.
---

# Capability Development Skill

## Use when
- Создаёшь новую capability
- Меняешь bootstrap-логику существующей capability
- Добавляешь модель/роут/endpoint в capability

## Capability anatomy

```
src/lib/server/capabilities/{capability-id}/
├── manifest.ts             # contract (id, models, routes, bootstrap)
├── prompts/                # AI prompt templates if applicable
├── README.md               # что capability делает
└── (optional) helpers/     # private capability-internal code
```

## Manifest template

```ts
// src/lib/server/capabilities/seo-optimizer/manifest.ts
import type { Capability, BootstrapCtx } from '../types';

export const SEO_OPTIMIZER: Capability = {
  id: 'seo-optimizer',
  always_enabled: true,
  models: [
    'SeoKeywordCluster',
    'SeoPageProfile',
    'SeoAudit',
    'SeoContentRevision',
    'InternalLinkSuggestion',
  ],
  routes: ['/admin/seo', '/admin/seo/setup', '/admin/seo/[id]'],
  apiEndpoints: [
    '/api/seo/audit-page',
    '/api/seo/generate-cluster',
    '/api/seo/generate-meta',
    '/api/seo/rewrite-section',
    '/api/seo/suggest-links',
    '/api/seo/setup/analyze',
    '/api/seo/setup/apply',
    '/api/seo/page/[id]',
  ],
  ragNamespace: 'seo',
  bootstrap: async (ctx: BootstrapCtx) => {
    // Caркас уже создан миграциями. Здесь — auto-setup задачи.
    // Например: запустить seo/setup/analyze при первом ingest.
    if (ctx.firstRun) {
      await ctx.queue.push('seo:auto-setup', { tenantSlug: ctx.tenantSlug });
    }
  },
};
```

## Bootstrap context

```ts
interface BootstrapCtx {
  tenantSlug: string;
  prisma: PrismaClient;            // tenant DB
  skin: TenantSkin;                // brand + customFields + voice
  qdrantCollection: string;
  firstRun: boolean;               // true при первом provision
  queue: { push: (job: string, payload: unknown) => Promise<void> };
  logger: (msg: string) => void;
}
```

## Rules

1. **Immutability.** `always_enabled: true`. Capability не удаляется через UI.
2. **No cross-capability imports.** Capability A не делает `import { x } from '../capability-b/...'`. Используй публичные интерфейсы или events.
3. **Tenant isolation.** Все Prisma-вызовы через `ctx.prisma`, никогда через global db.
4. **Skin awareness.** UI capability читает `tenant.skin` для customFields и `tenant.skin.copyLibrary.voice` для AI промптов.
5. **AI через ai-core.** Capability **не вызывает** `localChat` напрямую — только через `askAI({ tenantSlug, capability: 'seo', question })`. Это даёт автоматический RAG + кэш.

## Adding a new capability — checklist

1. ☐ Создай папку `src/lib/server/capabilities/{id}/`.
2. ☐ Создай `manifest.ts` по шаблону.
3. ☐ Зарегистрируй в `src/lib/server/capabilities/registry.ts`.
4. ☐ Добавь модели в `prisma/tenant.schema.prisma`.
5. ☐ Создай миграцию: `npx prisma migrate dev --name add_{id}_models`.
6. ☐ Создай routes/endpoints.
7. ☐ Защити endpoints `aiGuard()` или `requireRole()`.
8. ☐ Документируй в `README.md` capability.
9. ☐ Добавь в `docs/spec/02-capabilities.md` строку в таблицу.
10. ☐ Прогон `npm run check && npm run build` без новых ошибок.

## Naming conventions

- Capability ID: kebab-case (`seo-optimizer`, `lead-capture`)
- Prisma модели: PascalCase (`SeoKeywordCluster`)
- Routes: lowercase, под admin: `/admin/{capability}/...`
- API endpoints: `/api/{capability}/{action}`

## Skin-aware UI

```svelte
<script lang="ts">
  import { page } from '$app/stores';

  const skin = $derived($page.data.tenant.skin);
  const customFields = $derived(skin.unitFields ?? []);
</script>

<form>
  <!-- стандартные поля каркаса -->
  <input name="bedrooms" />

  <!-- динамические из skin -->
  {#each customFields as field}
    <CustomFieldInput {field} />
  {/each}
</form>
```

## AI prompt с brand voice

```ts
const tenant = event.locals.tenant;
const voice = tenant.skin.copyLibrary?.voice
  ?? 'Professional, concise, factual.';

const result = await askAI({
  tenantSlug: tenant.slug,
  capability: 'seo',
  question: 'Generate meta description for this page',
  systemPrompt: `You are an SEO expert. Match this brand voice: ${voice}`,
});
```

## Anti-patterns

| ❌ | ✅ |
|---|---|
| Опциональная capability через `if (config.seoEnabled)` | always_enabled, скрывать в UI через `enabledCaps` |
| Capability X импортирует service из capability Y | events / public interfaces |
| Прямой `localChat()` из endpoint | через `askAI()` ядра (RAG + cache) |
| Жёсткий список Project fields в форме | + динамические из `skin.projectFields` |
