# AI Cherry-Picking Integration — Design Spec

**Date:** 2026-03-12
**Status:** Approved
**Scope:** AI assistant with 3-layer context system across all surfaces (public + 4 cabinets)

---

## Goal

Add an AI assistant to the Develta platform that answers questions about properties, investments, leads, and platform data. The AI uses a "cherry-picking" approach: instead of dumping all data into the prompt, it assembles context from exactly 3 layers — only what is relevant to the question — minimising token usage while maximising accuracy.

---

## Architecture

### Approach: Unified AI Service + Role-Based Configuration

One engine (`src/lib/server/ai.ts`), one endpoint (`/api/ai/chat`), one UI component (`AIChatWidget.svelte`). Context and tools are configured per role at runtime. No separate endpoints per role.

**Model:** OpenAI GPT-4o via `openai` npm package.

**New package:** `openai` (official SDK).

---

## The 3-Layer Cherry-Picking System

Every AI request assembles context from exactly 3 layers before calling GPT-4o:

### Layer 3 — Project Documentation (always, ~300 tokens)

Static business context loaded from `src/lib/server/ai-context.ts`. Always injected first into the system prompt. Content varies by role:

- **public** — Company overview, project names, location (Limassol), general value proposition.
- **buyer** — Above + buyer process guide (reservation → contract → payments → handover).
- **investor** — Above + investment pool overview, yield structure, terms.
- **agent** — Above + CRM field definitions (lead statuses, tags, sources), commission structure.
- **admin** — Above + full DB schema summary (model names, key fields, status enums).

### Layer 1 — Knowledge Base Search (conditional, ~200 tokens)

Before calling the AI, extract keywords from the user's message and run a `LIKE` query against `Article` and `FAQ` tables in SQLite. Top 3 matches (by relevance — title + question matches ranked above body matches) have their excerpts (200 chars) injected into the system prompt.

If no matches found, this layer contributes 0 tokens.

### Layer 2 — Live Database (function calling, 0 tokens upfront)

GPT-4o receives a set of OpenAI function definitions (tools) based on the request's role. The AI decides whether to call a tool. If it does, the server executes the corresponding Prisma query and returns the result as a tool message. GPT-4o then formulates the final response.

**Maximum one tool call per request** (sufficient for all real-world queries; prevents runaway loops).

---

## Tool Definitions by Role

| Tool | public | buyer | investor | agent | admin |
|------|:------:|:-----:|:--------:|:-----:|:-----:|
| `searchProjects(status?, location?)` | ✓ | ✓ | ✓ | ✓ | ✓ |
| `searchUnits(projectSlug?, type?, status?, maxPrice?)` | ✓ | ✓ | — | ✓ | ✓ |
| `searchKnowledge(query)` | ✓ | ✓ | ✓ | ✓ | ✓ |
| `getMyUnit()` | — | ✓ | — | — | — |
| `getMyPayments()` | — | ✓ | — | — | — |
| `getMyPools()` | — | — | ✓ | — | — |
| `getMyInvestments()` | — | — | ✓ | — | — |
| `getLeads(status?, tag?)` | — | — | — | ✓ | ✓ |
| `getStats()` | — | — | — | — | ✓ |

All tools return compact JSON (no nested objects, no unused fields) to minimise token usage in the tool result.

---

## File Structure

### New files

```
src/lib/server/
  ai.ts              — Main engine: assemble context, call GPT-4o, handle tool loop
  ai-context.ts      — Layer 3: business context strings per role + Layer 1: keyword search
  ai-tools.ts        — Tool definitions (OpenAI format) + Prisma executors per role

src/routes/api/ai/chat/
  +server.ts         — POST endpoint: parse request, auth guard, call engine, return reply

src/lib/components/
  AIChatWidget.svelte — Shared chat UI (floating or inline, parameterized by role)
```

### Modified files

```
src/routes/(marketing)/+layout.svelte           — Add <AIChatWidget role="public" floating />
src/routes/(cabinet)/+layout.svelte             — Add floating widget for authenticated roles
src/routes/(cabinet)/admin/+page.svelte         — Add inline AIChatWidget panel
.env.example                                    — Add OPENAI_API_KEY
```

---

## API Contract

### `POST /api/ai/chat`

**Request body:**
```typescript
{
  message: string        // user's question, max 500 chars
  role: 'public' | 'buyer' | 'investor' | 'agent' | 'admin'
  userId?: string        // required for buyer/investor/agent (scopes tool results)
  history: Array<{ role: 'user' | 'assistant', content: string }>  // last 6 messages max
}
```

**Response (200):**
```typescript
{
  reply: string          // AI's text response
  toolUsed?: string      // name of tool called, if any (for debug/logging)
}
```

**Error responses:**
- `400` — missing message or invalid role
- `401` — authenticated role requested without valid session
- `403` — userId mismatch (user requesting another user's data)
- `500` — OpenAI API error (returns generic fallback message, never leaks API errors)

### Auth Guard Logic

- `role=public` → no session required
- `role=buyer|investor|agent|admin` → session required; `userId` in body must match `session.userId`; role in body must match `session.user.role` (prevents role escalation)

---

## `AIChatWidget.svelte` Props

```typescript
interface Props {
  role: 'public' | 'buyer' | 'investor' | 'agent' | 'admin'
  userId?: string      // passed from +layout.svelte server data
  floating?: boolean   // true = fixed bottom-right button, false = inline panel
}
```

**Floating mode:** Fixed bottom-right button (matches frosted glass design system). Click to open/close panel. Panel is 380px wide, 500px tall.

**Inline mode:** Full-width panel, no toggle button, always visible.

**Conversation state:** `$state` array of `{role, content}` messages. Cleared on page navigation (no persistence needed for v1).

**Loading state:** Shows animated dots while awaiting response. Input disabled during request.

**Error state:** Shows "Что-то пошло не так. Попробуй ещё раз." on fetch error.

---

## `src/lib/server/ai.ts` — Engine Logic

```typescript
export async function chat(params: {
  message: string
  role: ChatRole
  userId?: string
  history: Message[]
}): Promise<{ reply: string; toolUsed?: string }>
```

**Internal flow:**
1. Build system prompt: Layer 3 context (from `ai-context.ts`) + Layer 1 KB results (from `ai-context.ts`)
2. Get tools for role (from `ai-tools.ts`)
3. First OpenAI call: `gpt-4o`, system prompt, history (last 6), user message, tools
4. If response has `tool_calls`: execute tool via `ai-tools.ts` executor, make second OpenAI call with tool result
5. Return final `content` as `reply`

**Token budget:**
- Layer 3: ~300 tokens
- Layer 1: ~200 tokens (if found)
- History: ~600 tokens (6 messages × ~100 tokens avg)
- Tool result: ~200 tokens
- Total input: ~1300 tokens per request → well within GPT-4o limits

---

## `src/lib/server/ai-context.ts`

**Two exports:**

```typescript
// Layer 3: returns role-appropriate business context string
export function getBusinessContext(role: ChatRole, userId?: string): string

// Layer 1: keyword LIKE search on Article + FAQ
export async function searchKnowledgeBase(message: string): Promise<string>
// Returns formatted excerpts string, or '' if no matches
// Searches: article.title, article.excerpt, faq.question, faq.answer
// Returns top 3 results, 200 chars each
```

---

## `src/lib/server/ai-tools.ts`

**Two exports:**

```typescript
// Returns OpenAI tool definitions array for the given role
export function getToolsForRole(role: ChatRole): OpenAI.Chat.ChatCompletionTool[]

// Executes a tool call and returns result as string
export async function executeTool(
  name: string,
  args: Record<string, unknown>,
  role: ChatRole,
  userId?: string
): Promise<string>
```

Each tool executor runs a targeted Prisma query. Results serialized to compact JSON string. `userId` scopes `getMyUnit`, `getMyPayments`, `getMyPools`, `getMyInvestments` to the requesting user only.

---

## Environment

```env
OPENAI_API_KEY=sk-...
```

Added to `.env.example`. The engine throws a startup error if key is missing.

---

## Design System Integration

`AIChatWidget.svelte` uses existing CSS custom properties:
- `var(--color-bg-glass)` / `backdrop-filter: blur(8px)` — frosted glass panel
- `var(--color-accent)` — send button + AI message background
- `var(--radius-lg)` — panel corners
- `var(--font-body)` — message text
- No new CSS variables needed

---

## Out of Scope (v1)

- Streaming responses (SSE) — add in v2
- Conversation persistence (DB storage of chat history) — add in v2
- Vector/semantic search (embeddings) — keyword LIKE is sufficient for current KB size
- Rate limiting per user — add before production deploy
- Multi-turn tool calling (more than one tool per request) — not needed for current use cases
