---
name: testing-and-build
description: Use BEFORE merging code or claiming a task complete. Groundz has no unit-test framework yet — proof-of-correctness is svelte-check + build + manual smoke. Never claim done without these passing.
---

# Testing & Build Skill

## Use when
- Завершаешь задачу
- Перед коммитом
- Перед merge

## Required gates (must pass)

```bash
cd groundz-svelte

# 1. Type & a11y check
npm run check            # → 0 errors. Warnings допустимы только если они БЫЛИ до твоих правок.

# 2. Production build
npm run build            # → exit 0, build/ создан
```

## Acceptance:
- `0 ERRORS` в check
- Если warnings — **не больше**, чем на main, и не в файлах, которые ты трогал
- build не падает

## Manual smoke (если меняешь UI)

```bash
npm run dev              # http://localhost:5173
```

Прокликать:
- Главная страница тенанта рендерится
- `/auth/login` → success → редирект по роли
- Cabinet route соответствующий роли работает
- Если затронут AI endpoint — позвать через DevTools/curl с правильным auth

## Database changes

```bash
# При изменении schema.prisma
npx prisma migrate dev --name describe_change      # dev
npx prisma migrate deploy                          # prod (CI / Docker)
```

После migrate — обязательно `npm run check`, потому что Prisma client регенерится, могут всплыть type-errors.

## Manual AI smoke (если меняешь AI код)

Запусти Ollama локально:
```bash
ollama serve &
ollama pull llama3.1:8b
ollama pull nomic-embed-text
```

Установи env:
```bash
LOCAL_LLM_URL=http://localhost:11434/v1
LOCAL_LLM_MODEL=llama3.1:8b
```

Smoke:
```bash
curl -X POST http://localhost:5173/api/health/ai \
  -H "Cookie: token=<super-admin-token>"
# → должно вернуть { llm: { ok: true }, image: { ok: ... } }
```

## Common warnings → как чинить

### `state_referenced_locally`

```svelte
<!-- ❌ -->
let x = data.foo;

<!-- ✅ -->
let x = $derived(data.foo);
```

### `a11y_label_has_associated_control`

```svelte
<!-- ❌ -->
<label>Name</label>
<input />

<!-- ✅ -->
<label for="name">Name</label>
<input id="name" />
```

### `a11y_no_static_element_interactions`

```svelte
<!-- ❌ -->
<div onclick={...}>Click</div>

<!-- ✅ -->
<button type="button" onclick={...}>Click</button>
<!-- или -->
<div role="button" tabindex="0" onclick={...} onkeydown={handleKey}>Click</div>
```

### `css_unused_selector`

Удали неиспользуемый класс или add `:global()` если используется снаружи.

## Build size budget

| Chunk | Soft limit |
|---|---|
| Server `index.js` | < 200 KB |
| `chunks/db.js` (Prisma) | < 200 KB (это норма) |
| Client per-page | < 50 KB |
| Total `chunks/*` | < 500 KB |

Превышение — проверь, не тащишь ли тяжёлую библиотеку в client (например, `@google/genai` уже удалён, `openai` SDK — server-only, должен быть в server bundle).

## Pre-merge audit

```bash
# 1. Никаких console.log в API
grep -rn "console.log" groundz-svelte/src/routes/api/ | grep -v "if (dev)"

# 2. Нет открытых AI endpoints
grep -rL "aiGuard\|locals.user\|requireAuth" groundz-svelte/src/routes/api/*/+server.ts groundz-svelte/src/routes/api/*/*/+server.ts

# 3. Нет cloud AI ключей в коде
grep -rn "OPENAI_API_KEY\|sk-\|api.openai.com" groundz-svelte/src/

# 4. Нет hardcoded slugs или domains
grep -rn "groundz.estate\|TENANT_SLUG = 'groundz'" groundz-svelte/src/lib/ | grep -v "default"

# 5. Migrations всё ещё валидны
cd groundz-svelte && npx prisma validate
```

## Definition of Done

- ☐ `npm run check`: 0 errors
- ☐ `npm run build`: success
- ☐ Если AI endpoint: `aiGuard` стоит, bucket выбран
- ☐ Если UI: visual smoke пройден в браузере
- ☐ Если schema: миграция создана и закоммичена
- ☐ Если security-relevant: пройден pre-merge audit grep'ы
- ☐ Если новая фича: соответствующий skill обновлён, если нужно
- ☐ Документация в `docs/spec/` синхронизирована (если затронуто vision/architecture)

## Anti-patterns

| ❌ | ✅ |
|---|---|
| «У меня build падает локально, но в CI должно пройти» | разбираться сейчас |
| Игнорировать warnings | хотя бы не вводить новые |
| Коммитить с `// TODO: fix later` в security-критичном коде | сделать сейчас или открыть issue |
| Пропускать `prisma generate` после schema changes | regenerate всегда |
