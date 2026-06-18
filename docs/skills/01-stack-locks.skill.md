---
name: stack-locks
description: Use ALWAYS when picking a library, framework, or pattern. Groundz has hard-locked technology choices to keep multi-tenant Docker deployments consistent. Reading this BEFORE adding any dependency is mandatory.
---

# Stack Locks Skill

## Use when
- About to `npm install` something
- About to introduce a new framework / paradigm
- About to swap an AI model / vector DB / image gen
- User asks «давай поставим X» — verify it's allowed

## Hard rules

| Layer | Locked to | Don't ever propose |
|---|---|---|
| Frontend framework | SvelteKit + Svelte 5 runes | Next/Remix/Nuxt/React |
| CSS | Custom CSS + Custom Properties | Tailwind/Bootstrap/MUI |
| DB (prod) | Postgres 16 | MongoDB/MySQL/SQLite-prod |
| ORM | Prisma 7 | Drizzle/TypeORM/raw SQL primary |
| Vector store | Qdrant per-tenant Docker | Pinecone/Weaviate/pgvector primary |
| LLM | Ollama (local) via OpenAI SDK | OpenAI/Anthropic/Gemini cloud |
| Image gen | Automatic1111 SDXL local | DALL-E/Midjourney/external |
| Auth | bcrypt + JWT cookie | next-auth/auth0/clerk |
| Validation | zod 4 | yup/joi/io-ts |
| HTTP | native fetch | axios/got |
| Reverse proxy | Traefik v3 | nginx/caddy/cloudflare |

## Before adding a dependency, ask

1. Это в banned list (см. `docs/spec/07-stack-decisions.md`)?
2. Можно ли решить нативом Node/Web (`crypto`, `fetch`, `URL`, `Intl`)?
3. Есть ли уже в `package.json`?
4. Размер: добавит ли > 500KB к bundle?
5. License: MIT/BSD/Apache OK; GPL/AGPL — escalate.

Если 1=yes или 4-5=fail — **не ставить, спросить**.

## Approved transient utilities (можно ставить без вопросов)

- `mustache` — для compose templates
- `dockerode` — Docker SDK для master
- `@qdrant/js-client-rest` — Qdrant client
- `@mozilla/readability` + `cheerio` + `jsdom` — extractor
- `robots-parser` — crawler
- `chroma-js` — color manipulation в schema-agent
- `otplib` — TOTP для super-admin 2FA
- `isomorphic-dompurify` — sanitize @html

## Forbidden anti-patterns

- `process.env.X` в server-коде → используй `$env/static/private` или `$env/dynamic/private`
- Глобальный singleton Prisma client в multi-tenant контексте → используй `event.locals.tenant.prisma`
- Прямой импорт `db` из `$lib/server/db` в API endpoints (после Phase 0) → через locals
- `fetch('https://api.openai.com/...')` где угодно → ban
- `eval`, `new Function`, dynamic require — ban
- Inline `<style>` или `style="..."` → CSS classes в Svelte `<style>` блоке

## Examples

✅ OK:
```ts
import { localChat } from '$lib/server/local-llm';
const result = await localChat({ prompt, jsonMode: true });
```

❌ Reject:
```ts
import OpenAI from 'openai';
const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
```

✅ OK:
```ts
import { env } from '$env/dynamic/private';
const url = env.LOCAL_LLM_URL ?? 'http://localhost:11434/v1';
```

❌ Reject:
```ts
const url = process.env.LOCAL_LLM_URL ?? 'http://localhost:11434/v1';
```
