# AI Cherry-Picking Integration — Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a 3-layer cherry-picking AI assistant (GPT-4o) to every platform surface — public marketing + all 4 cabinets — with role-scoped context, knowledge-base search, and live DB function calling.

**Architecture:** One unified engine (`ai.ts`) assembles context from 3 layers before every request: static business context (Layer 3, ~300 tokens), keyword LIKE search on Article+FAQ (Layer 1, ~200 tokens conditional), and OpenAI function calling against Prisma (Layer 2, 0 tokens upfront). One shared `AIChatWidget.svelte` renders floating or inline, parameterized by role.

**Tech Stack:** SvelteKit + Svelte 5 runes, OpenAI SDK (`openai` npm), Prisma + SQLite, `$env/static/private` for API key, TypeScript throughout.

**Spec:** `docs/superpowers/specs/2026-03-12-ai-cherry-picking-design.md`

---

## Chunk 1: Foundation — Package, `ai-context.ts`, `ai-tools.ts`

### Task 1: Install `openai` package and add env key

**Files:**
- Modify: `package.json` (via npm install)
- Modify: `.env.example`
- Modify: `.env` (local, gitignored — add real key for testing)

- [ ] **Step 1: Install the openai SDK**

```bash
cd groundz-svelte
npm install openai
```

Expected: `package.json` `dependencies` now includes `"openai": "^x.x.x"`

- [ ] **Step 2: Add key to `.env.example`**

Append to `.env.example`:
```
# AI
OPENAI_API_KEY=sk-...
```

- [ ] **Step 3: Add real key to local `.env`**

Append to `.env` (already gitignored):
```
OPENAI_API_KEY=sk-<your-real-key>
```

- [ ] **Step 4: Run TypeScript check to confirm no regressions**

```bash
npm run check
```

Expected: 0 errors

- [ ] **Step 5: Commit**

```bash
git add package.json package-lock.json .env.example
git commit -m "feat: install openai SDK, add OPENAI_API_KEY to env.example"
```

---

### Task 2: Create `src/lib/server/ai-context.ts` — Layer 3 (business context) + Layer 1 (KB search)

**Files:**
- Create: `src/lib/server/ai-context.ts`

**What this file does:** Two exports — `getBusinessContext(role, userId?)` returns a role-appropriate static system prompt string (userId is optional, reserved for future per-user context personalisation); `searchKnowledgeBase(message)` extracts keywords from the user message and runs LIKE queries against `Article` and `FAQ` tables, returning the top 3 combined results (title/question matches ranked above body matches) as excerpts of 200 chars each, or `''` if no matches.

**Important distinction:** `searchKnowledgeBase` here is the Layer 1 pre-call search — it runs automatically before every AI request and injects results into the system prompt. This is separate from the `searchKnowledge` OpenAI function tool in `ai-tools.ts`, which is a Layer 2 tool the AI can call on-demand during function calling.

**Prisma notes for this file:**
- `db.article.findMany(...)` — model is `Article` in schema
- `db.fAQ.findMany(...)` — model is `FAQ` in schema, Prisma client camelCases to `fAQ`
- `Article` fields: `title`, `excerpt` (nullable), `content`
- `FAQ` fields: `question`, `answer`

- [ ] **Step 1: Create the file with full implementation**

Create `src/lib/server/ai-context.ts`:

```typescript
import db from '$lib/server/db';

export type ChatRole = 'public' | 'buyer' | 'investor' | 'agent' | 'internal_team';

const PUBLIC_CONTEXT = `You are an AI assistant for Groundz, a premium real estate developer in Limassol, Cyprus. You help prospective buyers and investors learn about projects and investment opportunities.
Groundz develops luxury residential properties in prime Limassol locations.
Current projects: Sungardo, Antigone Court, Symphony Residence, Cascada Residence, Ptolemy Studios.
Be professional, helpful, and accurate. If you don't know something, say so. Answer in the same language the user writes in.`;

const BUYER_CONTEXT = `${PUBLIC_CONTEXT}

You are speaking with a registered buyer.
Buyer journey: reservation (€5,000 deposit) → contract signing → staged payment schedule → construction updates → handover.
You can look up their specific unit, payment schedule, and documents.`;

const INVESTOR_CONTEXT = `${PUBLIC_CONTEXT}

You are speaking with a registered investor in Groundz investment pools.
Investment pools offer fixed yields (typically 8–12% annually) with terms of 12–36 months and minimum tickets from €10,000.
You can look up their pool allocations and investment history.`;

const AGENT_CONTEXT = `${PUBLIC_CONTEXT}

You are speaking with a Groundz sales agent.
CRM lead statuses: new → contacted → converted | lost.
Lead tags: hot (high intent), warm (interested), cold (low priority).
Lead sources: website, referral, social, portal, direct.
You can look up leads and filter by status or tag.`;

const INTERNAL_TEAM_CONTEXT = `${PUBLIC_CONTEXT}

You are speaking with an internal Groundz team member with full platform access.
Key models and their status enums:
- User: roles buyer | investor | agent | internal_team
- Project: status active | coming_soon | completed
- Unit: type studio | 1bed | 2bed | 3bed | penthouse; status available | reserved | sold
- Payment: status paid | upcoming | overdue
- Lead: status new | contacted | converted | lost; tag hot | warm | cold
- InvestmentPool: status active | closed | completed
- Document: status pending | approved | action_required
- Commission: status pending | approved | paid
You can access platform-wide statistics and all data.`;

const CONTEXT_BY_ROLE: Record<ChatRole, string> = {
  public: PUBLIC_CONTEXT,
  buyer: BUYER_CONTEXT,
  investor: INVESTOR_CONTEXT,
  agent: AGENT_CONTEXT,
  internal_team: INTERNAL_TEAM_CONTEXT,
};

// userId reserved for future per-user personalisation — unused in v1 but included per spec signature
export function getBusinessContext(role: ChatRole, _userId?: string): string {
  return CONTEXT_BY_ROLE[role];
}

export async function searchKnowledgeBase(message: string): Promise<string> {
  const keywords = message
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .filter((w) => w.length > 3)
    .slice(0, 5);

  if (keywords.length === 0) return '';

  // Title/question matches are higher quality — fetch them separately so they rank first
  const titleMatches = keywords.flatMap((k) => [
    { title: { contains: k } },
    { question: { contains: k } },
  ]);
  const bodyMatches = keywords.flatMap((k) => [
    { excerpt: { contains: k } },
    { content: { contains: k } },
    { answer: { contains: k } },
  ]);

  const articleTitleWhere = keywords.flatMap((k) => [{ title: { contains: k } }]);
  const articleBodyWhere = keywords.flatMap((k) => [
    { excerpt: { contains: k } },
    { content: { contains: k } },
  ]);
  const faqTitleWhere = keywords.flatMap((k) => [{ question: { contains: k } }]);
  const faqBodyWhere = keywords.flatMap((k) => [{ answer: { contains: k } }]);

  void titleMatches; void bodyMatches; // unused — kept for clarity

  const [articlesByTitle, articlesByBody, faqsByTitle, faqsByBody] = await Promise.all([
    db.article.findMany({ where: { OR: articleTitleWhere }, select: { title: true, excerpt: true }, take: 3 }),
    db.article.findMany({ where: { OR: articleBodyWhere }, select: { title: true, excerpt: true }, take: 3 }),
    db.fAQ.findMany({ where: { OR: faqTitleWhere }, select: { question: true, answer: true }, take: 3 }),
    db.fAQ.findMany({ where: { OR: faqBodyWhere }, select: { question: true, answer: true }, take: 3 }),
  ]);

  // Deduplicate and rank: title/question matches first, then body matches
  type ArticleEntry = { title: string; excerpt: string | null };
  type FaqEntry = { question: string; answer: string };

  const seenArticles = new Set<string>();
  const rankedArticles: ArticleEntry[] = [];
  for (const a of [...articlesByTitle, ...articlesByBody]) {
    if (!seenArticles.has(a.title)) { seenArticles.add(a.title); rankedArticles.push(a); }
  }

  const seenFaqs = new Set<string>();
  const rankedFaqs: FaqEntry[] = [];
  for (const f of [...faqsByTitle, ...faqsByBody]) {
    if (!seenFaqs.has(f.question)) { seenFaqs.add(f.question); rankedFaqs.push(f); }
  }

  // Interleave articles and FAQs, take top 3 combined
  const combined: string[] = [];
  let ai = 0, fi = 0;
  while (combined.length < 3 && (ai < rankedArticles.length || fi < rankedFaqs.length)) {
    if (ai < rankedArticles.length) {
      const a = rankedArticles[ai++];
      combined.push(`- Article "${a.title}": ${(a.excerpt ?? '').slice(0, 200)}`);
    }
    if (combined.length < 3 && fi < rankedFaqs.length) {
      const f = rankedFaqs[fi++];
      combined.push(`- FAQ: ${f.question} → ${f.answer.slice(0, 200)}`);
    }
  }

  if (combined.length === 0) return '';
  return ['Relevant knowledge base entries:', ...combined].join('\n');
}
```

- [ ] **Step 2: Run TypeScript check**

```bash
npm run check
```

Expected: 0 errors (the `db.fAQ` call should resolve since `FAQ` model exists in schema)

- [ ] **Step 3: Commit**

```bash
git add src/lib/server/ai-context.ts
git commit -m "feat: add ai-context.ts — Layer 3 business context + Layer 1 KB search"
```

---

### Task 3: Create `src/lib/server/ai-tools.ts` — OpenAI tool definitions + Prisma executors

**Files:**
- Create: `src/lib/server/ai-tools.ts`

**What this file does:** Two exports — `getToolsForRole(role)` returns the OpenAI tool definitions array for that role; `executeTool(name, args, role, userId)` executes the named tool via Prisma and returns a compact JSON string.

**Prisma schema corrections (important — schema differs from spec):**
- `Project.status`: `active | coming_soon | completed` (NOT `planning | construction | completed`)
- `Unit.areaSqm` (NOT `area`)
- `InvestorInvestment.userId` (NOT `investorId`) — use `where: { userId }` to scope to the logged-in investor
- `Payment.paidDate` (NOT `paidAt`)
- Tools must only expose fields that exist in the schema

- [ ] **Step 1: Create the file**

Create `src/lib/server/ai-tools.ts`:

```typescript
import type OpenAI from 'openai';
import db from '$lib/server/db';
import type { ChatRole } from './ai-context';

// ── Tool definitions ──────────────────────────────────────────────────────────

const SEARCH_PROJECTS: OpenAI.Chat.ChatCompletionTool = {
  type: 'function',
  function: {
    name: 'searchProjects',
    description: 'Search Groundz real estate projects by status or location keyword',
    parameters: {
      type: 'object',
      properties: {
        status: {
          type: 'string',
          enum: ['active', 'coming_soon', 'completed'],
          description: 'Filter by project status',
        },
        location: { type: 'string', description: 'Location keyword to search for' },
      },
    },
  },
};

const SEARCH_UNITS: OpenAI.Chat.ChatCompletionTool = {
  type: 'function',
  function: {
    name: 'searchUnits',
    description: 'Search units across projects by type, status, or price',
    parameters: {
      type: 'object',
      properties: {
        projectSlug: { type: 'string', description: 'Filter by project slug' },
        type: { type: 'string', enum: ['studio', '1bed', '2bed', '3bed', 'penthouse'] },
        status: { type: 'string', enum: ['available', 'reserved', 'sold'] },
        maxPrice: { type: 'number', description: 'Maximum price in EUR' },
      },
    },
  },
};

const SEARCH_KNOWLEDGE: OpenAI.Chat.ChatCompletionTool = {
  type: 'function',
  function: {
    name: 'searchKnowledge',
    description: 'Search articles and FAQs in the knowledge base by query',
    parameters: {
      type: 'object',
      properties: {
        query: { type: 'string', description: 'Search query' },
      },
      required: ['query'],
    },
  },
};

const GET_MY_UNIT: OpenAI.Chat.ChatCompletionTool = {
  type: 'function',
  function: {
    name: 'getMyUnit',
    description: "Get the authenticated buyer's unit details",
    parameters: { type: 'object', properties: {} },
  },
};

const GET_MY_PAYMENTS: OpenAI.Chat.ChatCompletionTool = {
  type: 'function',
  function: {
    name: 'getMyPayments',
    description: "Get the authenticated buyer's payment schedule",
    parameters: { type: 'object', properties: {} },
  },
};

const GET_MY_POOLS: OpenAI.Chat.ChatCompletionTool = {
  type: 'function',
  function: {
    name: 'getMyPools',
    description: "Get the authenticated investor's pool allocations",
    parameters: { type: 'object', properties: {} },
  },
};

const GET_MY_INVESTMENTS: OpenAI.Chat.ChatCompletionTool = {
  type: 'function',
  function: {
    name: 'getMyInvestments',
    description: "Get the authenticated investor's investment history",
    parameters: { type: 'object', properties: {} },
  },
};

const GET_LEADS: OpenAI.Chat.ChatCompletionTool = {
  type: 'function',
  function: {
    name: 'getLeads',
    description: 'Get CRM leads, optionally filtered by status or tag',
    parameters: {
      type: 'object',
      properties: {
        status: { type: 'string', enum: ['new', 'contacted', 'converted', 'lost'] },
        tag: { type: 'string', enum: ['hot', 'warm', 'cold'] },
      },
    },
  },
};

const GET_STATS: OpenAI.Chat.ChatCompletionTool = {
  type: 'function',
  function: {
    name: 'getStats',
    description: 'Get platform-wide statistics: lead counts, unit counts, user counts, active pools, overdue payments',
    parameters: { type: 'object', properties: {} },
  },
};

const TOOLS_BY_ROLE: Record<ChatRole, OpenAI.Chat.ChatCompletionTool[]> = {
  public: [SEARCH_PROJECTS, SEARCH_UNITS, SEARCH_KNOWLEDGE],
  buyer: [SEARCH_PROJECTS, SEARCH_UNITS, SEARCH_KNOWLEDGE, GET_MY_UNIT, GET_MY_PAYMENTS],
  investor: [SEARCH_PROJECTS, SEARCH_KNOWLEDGE, GET_MY_POOLS, GET_MY_INVESTMENTS],
  agent: [SEARCH_PROJECTS, SEARCH_UNITS, SEARCH_KNOWLEDGE, GET_LEADS],
  internal_team: [SEARCH_PROJECTS, SEARCH_UNITS, SEARCH_KNOWLEDGE, GET_LEADS, GET_STATS],
};

export function getToolsForRole(role: ChatRole): OpenAI.Chat.ChatCompletionTool[] {
  return TOOLS_BY_ROLE[role];
}

// ── Tool executors ────────────────────────────────────────────────────────────

export async function executeTool(
  name: string,
  args: Record<string, unknown>,
  _role: ChatRole,
  userId?: string
): Promise<string> {
  switch (name) {
    case 'searchProjects': {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const where: Record<string, any> = {};
      if (args.status) where.status = args.status;
      if (args.location) where.location = { contains: String(args.location).toLowerCase() };
      const projects = await db.project.findMany({
        where,
        select: { name: true, slug: true, status: true, location: true, description: true },
        take: 5,
      });
      return JSON.stringify(projects);
    }

    case 'searchUnits': {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const where: Record<string, any> = {};
      if (args.projectSlug) where.project = { slug: args.projectSlug };
      if (args.type) where.type = args.type;
      if (args.status) where.status = args.status;
      if (args.maxPrice) where.price = { lte: Number(args.maxPrice) };
      const units = await db.unit.findMany({
        where,
        select: {
          code: true,
          type: true,
          status: true,
          price: true,
          floor: true,
          areaSqm: true,
          project: { select: { name: true, slug: true } },
        },
        take: 10,
      });
      return JSON.stringify(units);
    }

    case 'searchKnowledge': {
      const query = String(args.query ?? '');
      const kw = query
        .toLowerCase()
        .split(/\s+/)
        .filter((w) => w.length > 2);
      if (kw.length === 0) return '[]';
      const [articles, faqs] = await Promise.all([
        db.article.findMany({
          where: { OR: kw.flatMap((k) => [{ title: { contains: k } }, { excerpt: { contains: k } }]) },
          select: { title: true, excerpt: true },
          take: 3,
        }),
        db.fAQ.findMany({
          where: { OR: kw.flatMap((k) => [{ question: { contains: k } }, { answer: { contains: k } }]) },
          select: { question: true, answer: true },
          take: 3,
        }),
      ]);
      return JSON.stringify([...articles, ...faqs]);
    }

    case 'getMyUnit': {
      if (!userId) return JSON.stringify({ error: 'userId required' });
      const unit = await db.unit.findFirst({
        where: { buyerId: userId },
        select: {
          code: true,
          type: true,
          status: true,
          price: true,
          floor: true,
          areaSqm: true,
          project: { select: { name: true } },
        },
      });
      return JSON.stringify(unit ?? null);
    }

    case 'getMyPayments': {
      if (!userId) return JSON.stringify({ error: 'userId required' });
      const payments = await db.payment.findMany({
        where: { userId },
        select: { amount: true, status: true, dueDate: true, paidDate: true, description: true },
        orderBy: { dueDate: 'asc' },
      });
      return JSON.stringify(payments);
    }

    case 'getMyPools': {
      if (!userId) return JSON.stringify({ error: 'userId required' });
      const investments = await db.investorInvestment.findMany({
        where: { userId },
        select: {
          amount: true,
          pool: { select: { name: true, targetYield: true, status: true, termMonths: true } },
        },
      });
      return JSON.stringify(investments);
    }

    case 'getMyInvestments': {
      if (!userId) return JSON.stringify({ error: 'userId required' });
      const investments = await db.investorInvestment.findMany({
        where: { userId },
        select: {
          amount: true,
          createdAt: true,
          pool: { select: { name: true, targetYield: true } },
        },
        orderBy: { createdAt: 'desc' },
      });
      return JSON.stringify(investments);
    }

    case 'getLeads': {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const where: Record<string, any> = {};
      if (args.status) where.status = args.status;
      if (args.tag) where.tag = args.tag;
      const leads = await db.lead.findMany({
        where,
        select: { name: true, email: true, phone: true, status: true, tag: true, source: true, createdAt: true },
        orderBy: { createdAt: 'desc' },
        take: 20,
      });
      return JSON.stringify(leads);
    }

    case 'getStats': {
      const [
        totalLeads, hotLeads, totalUnits, availableUnits, soldUnits,
        totalUsers, activePools, overduePayments,
      ] = await Promise.all([
        db.lead.count(),
        db.lead.count({ where: { tag: 'hot' } }),
        db.unit.count(),
        db.unit.count({ where: { status: 'available' } }),
        db.unit.count({ where: { status: 'sold' } }),
        db.user.count(),
        db.investmentPool.count({ where: { status: 'active' } }),
        db.payment.count({ where: { status: 'overdue' } }),
      ]);
      return JSON.stringify({
        totalLeads, hotLeads, totalUnits, availableUnits, soldUnits,
        totalUsers, activePools, overduePayments,
      });
    }

    default:
      return JSON.stringify({ error: `Unknown tool: ${name}` });
  }
}
```

- [ ] **Step 2: Run TypeScript check**

```bash
npm run check
```

Expected: 0 errors

- [ ] **Step 3: Commit**

```bash
git add src/lib/server/ai-tools.ts
git commit -m "feat: add ai-tools.ts — OpenAI tool definitions + Prisma executors per role"
```

---

## Chunk 2: Engine + API Endpoint

### Task 4: Create `src/lib/server/ai.ts` — main engine

**Files:**
- Create: `src/lib/server/ai.ts`

**What this file does:** Imports `OPENAI_API_KEY` from `$env/static/private`. Creates one `OpenAI` client instance. Exports `chat(params)` which: (1) builds system prompt from Layer 3 + Layer 1, (2) calls GPT-4o with role-scoped tools, (3) if the response has a tool call — executes it via `ai-tools.ts` and makes a second call — then returns the final reply. Max one tool call per request.

- [ ] **Step 1: Create the file**

Create `src/lib/server/ai.ts`:

```typescript
import OpenAI from 'openai';
import { OPENAI_API_KEY } from '$env/static/private';
import type { ChatRole } from './ai-context';
import { getBusinessContext, searchKnowledgeBase } from './ai-context';
import { getToolsForRole, executeTool } from './ai-tools';

export type { ChatRole };

export interface Message {
  role: 'user' | 'assistant';
  content: string;
}

const openai = new OpenAI({ apiKey: OPENAI_API_KEY });

export async function chat(params: {
  message: string;
  role: ChatRole;
  userId?: string;
  history: Message[];
}): Promise<{ reply: string; toolUsed?: string }> {
  const { message, role, userId, history } = params;

  // Layer 3: static business context (pass userId per spec signature — unused in v1 but available for future personalisation)
  const businessContext = getBusinessContext(role, userId);

  // Layer 1: conditional knowledge base search
  const kbContext = await searchKnowledgeBase(message);

  const systemContent = kbContext ? `${businessContext}\n\n${kbContext}` : businessContext;

  // Layer 2: role-scoped tools (0 tokens upfront — only paid if AI calls a tool)
  const tools = getToolsForRole(role);

  const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
    { role: 'system', content: systemContent },
    ...history.slice(-6).map((m) => ({
      role: m.role as 'user' | 'assistant',
      content: m.content,
    })),
    { role: 'user', content: message },
  ];

  const response = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages,
    tools: tools.length > 0 ? tools : undefined,
    tool_choice: tools.length > 0 ? 'auto' : undefined,
  });

  const choice = response.choices[0];

  // No tool call — return directly
  if (!choice.message.tool_calls || choice.message.tool_calls.length === 0) {
    return { reply: choice.message.content ?? '' };
  }

  // Execute first tool call only (max one per request)
  const toolCall = choice.message.tool_calls[0];
  let toolArgs: Record<string, unknown> = {};
  try {
    toolArgs = JSON.parse(toolCall.function.arguments ?? '{}') as Record<string, unknown>;
  } catch {
    // malformed args — proceed with empty object
  }

  const toolResult = await executeTool(toolCall.function.name, toolArgs, role, userId);

  // Second call with tool result
  const followUp = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages: [
      ...messages,
      choice.message,
      {
        role: 'tool',
        tool_call_id: toolCall.id,
        content: toolResult,
      },
    ],
  });

  return {
    reply: followUp.choices[0].message.content ?? '',
    toolUsed: toolCall.function.name,
  };
}
```

- [ ] **Step 2: Run TypeScript check**

```bash
npm run check
```

Expected: 0 errors

- [ ] **Step 3: Commit**

```bash
git add src/lib/server/ai.ts
git commit -m "feat: add ai.ts — 3-layer cherry-picking engine with GPT-4o function calling"
```

---

### Task 5: Create `src/routes/api/ai/chat/+server.ts` — POST endpoint

**Files:**
- Create: `src/routes/api/ai/chat/+server.ts`

**What this file does:** POST `/api/ai/chat`. Validates request body (message required, role must be valid enum, max 500 chars). Auth guard: non-public roles require a valid session, `userId` in body must match `locals.user.id`, role in body must match `locals.user.role`. Calls `chat()` engine. Returns `{ reply, toolUsed? }` or catches errors and returns the generic Russian fallback message with 500 status — never leaks OpenAI errors to the client.

**Note on `locals.user`:** The app's `hooks.server.ts` populates `locals.user` from the JWT cookie. The type is defined in `src/app.d.ts` as `{ id: string; email: string; role: string; name?: string } | null`.

- [ ] **Step 1: Create the directory and file**

Create `src/routes/api/ai/chat/+server.ts`:

```typescript
import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { chat } from '$lib/server/ai';
import type { ChatRole, Message } from '$lib/server/ai';

const VALID_ROLES: ChatRole[] = ['public', 'buyer', 'investor', 'agent', 'internal_team'];

export const POST: RequestHandler = async ({ request, locals }) => {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    throw error(400, 'invalid JSON body');
  }

  if (!body || typeof body !== 'object') throw error(400, 'invalid request body');

  const { message, role, userId, history } = body as Record<string, unknown>;

  if (typeof message !== 'string' || !message.trim()) {
    throw error(400, 'message is required');
  }

  if (!VALID_ROLES.includes(role as ChatRole)) {
    throw error(400, 'invalid role');
  }

  const chatRole = role as ChatRole;

  // Auth guard for non-public roles
  if (chatRole !== 'public') {
    if (typeof userId !== 'string' || !userId) throw error(400, 'userId required for authenticated roles');
    if (!locals.user) throw error(401, 'authentication required');
    if (userId !== locals.user.id) throw error(403, 'userId mismatch');
    if (locals.user.role !== chatRole) throw error(403, 'role mismatch');
  }

  // Normalise history — keep last 6, skip malformed entries
  const safeHistory: Message[] = Array.isArray(history)
    ? (history as unknown[])
        .filter(
          (m): m is Message =>
            typeof m === 'object' &&
            m !== null &&
            ((m as Message).role === 'user' || (m as Message).role === 'assistant') &&
            typeof (m as Message).content === 'string'
        )
        .slice(-6)
    : [];

  try {
    const result = await chat({
      message: message.slice(0, 500),
      role: chatRole,
      userId: typeof userId === 'string' ? userId : undefined,
      history: safeHistory,
    });
    return json(result);
  } catch {
    return json({ reply: 'Что-то пошло не так. Попробуй ещё раз.' }, { status: 500 });
  }
};
```

- [ ] **Step 2: Run TypeScript check**

```bash
npm run check
```

Expected: 0 errors

- [ ] **Step 3: Smoke test the public endpoint**

Start dev server if not running:
```bash
npm run dev
```

Test public role with curl:
```bash
curl -s -X POST http://localhost:5173/api/ai/chat \
  -H "Content-Type: application/json" \
  -d '{"message":"What projects does Groundz have?","role":"public","history":[]}' \
  | head -c 500
```

Expected: JSON with `reply` field containing text about Groundz projects (GPT-4o response)

- [ ] **Step 4: Test auth guard — unauthenticated cabinet role**

```bash
curl -s -X POST http://localhost:5173/api/ai/chat \
  -H "Content-Type: application/json" \
  -d '{"message":"What are my payments?","role":"buyer","userId":"fake-id","history":[]}' \
  | cat
```

Expected: 401 error response

- [ ] **Step 5: Commit**

```bash
git add src/routes/api/ai/chat/+server.ts
git commit -m "feat: add /api/ai/chat POST endpoint with role-based auth guard"
```

---

## Chunk 3: UI Component + Integration

### Task 6: Create `src/lib/components/AIChatWidget.svelte`

**Files:**
- Create: `src/lib/components/AIChatWidget.svelte`

**What this file does:** Shared chat UI component with two modes. Floating mode (`floating={true}`): renders a fixed FAB button bottom-right; clicking it toggles a 380×500px panel. Inline mode (`floating={false}`, default): always-visible full-width panel with no toggle. State: `$state` message array, input string, loading bool, error bool. Sends to `/api/ai/chat`, appends response to messages. Enter key submits (Shift+Enter = newline). Uses only existing design system CSS variables — no new custom properties.

- [ ] **Step 1: Create the component**

Create `src/lib/components/AIChatWidget.svelte`:

```svelte
<script lang="ts">
  interface Message {
    role: 'user' | 'assistant';
    content: string;
  }

  interface Props {
    role: 'public' | 'buyer' | 'investor' | 'agent' | 'internal_team';
    userId?: string;
    floating?: boolean;
  }

  let { role, userId, floating = false }: Props = $props();

  let open = $state(!floating);
  let messages = $state<Message[]>([]);
  let input = $state('');
  let loading = $state(false);
  let hasError = $state(false);

  async function send() {
    const text = input.trim();
    if (!text || loading) return;

    messages = [...messages, { role: 'user', content: text }];
    input = '';
    loading = true;
    hasError = false;

    try {
      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text,
          role,
          userId,
          history: messages.slice(-7, -1),
        }),
      });

      if (!res.ok) throw new Error('Request failed');

      const data = (await res.json()) as { reply: string };
      messages = [...messages, { role: 'assistant', content: data.reply }];
    } catch {
      hasError = true;
      messages = messages.slice(0, -1);
    } finally {
      loading = false;
    }
  }

  function handleKeydown(e: KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  }
</script>

{#if floating}
  <button class="ai-fab" onclick={() => (open = !open)} aria-label="AI Assistant">
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
    </svg>
  </button>
{/if}

{#if open}
  <div class="ai-panel" class:ai-panel--floating={floating}>
    {#if floating}
      <div class="ai-panel__header">
        <span class="ai-panel__title">AI Assistant</span>
        <button class="ai-panel__close" onclick={() => (open = false)} aria-label="Close">✕</button>
      </div>
    {:else}
      <div class="ai-panel__header">
        <span class="ai-panel__title">AI Assistant</span>
      </div>
    {/if}

    <div class="ai-panel__messages">
      {#if messages.length === 0}
        <p class="ai-panel__empty">Задайте вопрос о проектах, инвестициях или платформе.</p>
      {/if}
      {#each messages as msg (msg)}
        <div class="ai-msg" class:ai-msg--user={msg.role === 'user'} class:ai-msg--ai={msg.role === 'assistant'}>
          {msg.content}
        </div>
      {/each}
      {#if loading}
        <div class="ai-msg ai-msg--ai">
          <span class="ai-dots"><span>.</span><span>.</span><span>.</span></span>
        </div>
      {/if}
      {#if hasError}
        <p class="ai-panel__error">Что-то пошло не так. Попробуй ещё раз.</p>
      {/if}
    </div>

    <div class="ai-panel__input">
      <textarea
        bind:value={input}
        onkeydown={handleKeydown}
        placeholder="Написать сообщение..."
        rows="2"
        disabled={loading}
      ></textarea>
      <button onclick={send} disabled={loading || !input.trim()} class="ai-panel__send" aria-label="Send">
        →
      </button>
    </div>
  </div>
{/if}

<style>
  /* FAB button */
  .ai-fab {
    position: fixed;
    bottom: var(--space-6);
    right: var(--space-6);
    width: 52px;
    height: 52px;
    border-radius: 50%;
    background: var(--color-accent);
    color: white;
    border: none;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.2);
    z-index: 200;
    transition: transform var(--transition-fast);
  }

  .ai-fab:hover {
    transform: scale(1.06);
  }

  /* Panel */
  .ai-panel {
    background: rgba(255, 255, 255, 0.88);
    backdrop-filter: blur(8px);
    -webkit-backdrop-filter: blur(8px);
    border: 1px solid rgba(0, 0, 0, 0.08);
    border-radius: var(--radius-lg);
    display: flex;
    flex-direction: column;
    overflow: hidden;
  }

  .ai-panel--floating {
    position: fixed;
    bottom: calc(var(--space-6) + 64px);
    right: var(--space-6);
    width: 380px;
    height: 500px;
    z-index: 199;
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.15);
  }

  /* Header */
  .ai-panel__header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: var(--space-3) var(--space-5);
    border-bottom: 1px solid rgba(0, 0, 0, 0.06);
    flex-shrink: 0;
  }

  .ai-panel__title {
    font-size: var(--text-sm);
    font-weight: 700;
    color: var(--color-text);
    letter-spacing: 0.02em;
  }

  .ai-panel__close {
    background: none;
    border: none;
    cursor: pointer;
    color: var(--color-text-muted);
    font-size: 14px;
    padding: 0;
    line-height: 1;
    transition: color var(--transition-fast);
  }

  .ai-panel__close:hover {
    color: var(--color-text);
  }

  /* Messages */
  .ai-panel__messages {
    flex: 1;
    overflow-y: auto;
    padding: var(--space-4);
    display: flex;
    flex-direction: column;
    gap: var(--space-3);
  }

  .ai-panel__empty {
    font-size: var(--text-sm);
    color: var(--color-text-muted);
    text-align: center;
    margin-top: var(--space-8);
    line-height: 1.5;
  }

  .ai-msg {
    padding: var(--space-3) var(--space-4);
    border-radius: var(--radius-md);
    font-size: var(--text-sm);
    font-family: var(--font-body);
    line-height: 1.6;
    max-width: 88%;
    white-space: pre-wrap;
    word-break: break-word;
  }

  .ai-msg--user {
    background: var(--color-accent);
    color: white;
    align-self: flex-end;
    border-bottom-right-radius: 4px;
  }

  .ai-msg--ai {
    background: rgba(0, 0, 0, 0.05);
    color: var(--color-text);
    align-self: flex-start;
    border-bottom-left-radius: 4px;
  }

  /* Loading dots */
  .ai-dots span {
    animation: ai-blink 1.4s infinite both;
  }
  .ai-dots span:nth-child(2) { animation-delay: 0.2s; }
  .ai-dots span:nth-child(3) { animation-delay: 0.4s; }

  @keyframes ai-blink {
    0%, 80%, 100% { opacity: 0.2; }
    40% { opacity: 1; }
  }

  .ai-panel__error {
    font-size: var(--text-xs);
    color: #ef4444;
    text-align: center;
    padding: 0 var(--space-2);
  }

  /* Input row */
  .ai-panel__input {
    padding: var(--space-3) var(--space-4);
    border-top: 1px solid rgba(0, 0, 0, 0.06);
    display: flex;
    gap: var(--space-2);
    align-items: flex-end;
    flex-shrink: 0;
  }

  .ai-panel__input textarea {
    flex: 1;
    resize: none;
    border: 1px solid rgba(0, 0, 0, 0.12);
    border-radius: var(--radius-md);
    padding: var(--space-2) var(--space-3);
    font-size: var(--text-sm);
    font-family: var(--font-body);
    background: rgba(255, 255, 255, 0.9);
    color: var(--color-text);
    outline: none;
    transition: border-color var(--transition-fast);
    line-height: 1.4;
  }

  .ai-panel__input textarea:focus {
    border-color: var(--color-accent);
  }

  .ai-panel__input textarea:disabled {
    opacity: 0.6;
  }

  .ai-panel__send {
    background: var(--color-accent);
    color: white;
    border: none;
    border-radius: var(--radius-md);
    width: 36px;
    height: 36px;
    cursor: pointer;
    font-size: 18px;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: opacity var(--transition-fast);
    flex-shrink: 0;
    line-height: 1;
  }

  .ai-panel__send:disabled {
    opacity: 0.35;
    cursor: not-allowed;
  }
</style>
```

- [ ] **Step 2: Run TypeScript check**

```bash
npm run check
```

Expected: 0 errors

- [ ] **Step 3: Commit**

```bash
git add src/lib/components/AIChatWidget.svelte
git commit -m "feat: add AIChatWidget.svelte — floating + inline chat UI, Svelte 5 runes"
```

---

### Task 7: Create marketing layout and wire up all surfaces

**Files:**
- Create: `src/routes/(marketing)/+layout.svelte` — marketing shell with floating AI widget (public role, no userId)
- Modify: `src/routes/(cabinet)/+layout.svelte` — add floating widget for authenticated roles
- Modify: `src/routes/(cabinet)/admin/+page.svelte` — add inline widget panel
- Modify: `.env.example` — already done in Task 1 (skip if committed)

**Context for cabinet layout:**
- `data.user.id` is available (from `+layout.server.ts` which calls `requireAuth`)
- `data.user.role` is already used for the `isAdmin` derived and tab routing
- The floating widget should NOT render for `internal_team` role in the cabinet layout (they get an inline panel in the admin page instead) — or render for all roles since they are in different routes. Actually: render floating for ALL cabinet roles; the admin page additionally has an inline panel. The floating widget in cabinet passes `userId` and `role` from the server data.

**Context for marketing layout:**
- This file does not exist yet — create it
- No `+layout.server.ts` for marketing (public, no auth)
- Pass `role="public"` and no `userId`
- The layout just needs to render `{@render children()}` plus the widget

- [ ] **Step 1: Create `src/routes/(marketing)/+layout.svelte`**

```svelte
<script lang="ts">
  import AIChatWidget from '$lib/components/AIChatWidget.svelte';
  let { children } = $props();
</script>

{@render children()}

<AIChatWidget role="public" floating />
```

- [ ] **Step 2: Modify `src/routes/(cabinet)/+layout.svelte`**

Add import at top of `<script>`:
```typescript
import AIChatWidget from '$lib/components/AIChatWidget.svelte';
```

Add after the closing `</div>` of `.cabinet` (before `<style>`):
```svelte
<AIChatWidget role={data.user.role as 'buyer' | 'investor' | 'agent' | 'internal_team'} userId={data.user.id} floating />
```

Full resulting file for reference:
```svelte
<script lang="ts">
  import CabinetSidebar from '$lib/components/cabinet/CabinetSidebar.svelte';
  import CabinetTabs from '$lib/components/cabinet/CabinetTabs.svelte';
  import AIChatWidget from '$lib/components/AIChatWidget.svelte';

  let { data, children } = $props();

  const buyerTabs = [
    { label: 'Overview', href: '/buyer' },
    { label: 'My Property', href: '/buyer/property' },
    { label: 'Construction', href: '/buyer/construction' },
    { label: 'Payments', href: '/buyer/payments' },
    { label: 'Documents', href: '/buyer/documents' }
  ];

  const investorTabs = [
    { label: 'Portfolio', href: '/investor' },
    { label: 'Pools', href: '/investor/pools' },
    { label: 'Documents', href: '/investor/documents' }
  ];

  const agentTabs = [
    { label: 'Dashboard', href: '/agent' },
    { label: 'All Leads', href: '/agent/leads' },
    { label: 'My Clients', href: '/agent/clients' },
    { label: 'Commissions', href: '/agent/commissions' }
  ];

  let isAdmin = $derived(data.user.role === 'internal_team');
  let tabs = $derived.by(() => {
    switch (data.user.role) {
      case 'buyer': return buyerTabs;
      case 'investor': return investorTabs;
      case 'agent': return agentTabs;
      default: return [];
    }
  });
</script>

<div class="cabinet" class:cabinet--with-sidebar={isAdmin}>
  {#if isAdmin}
    <CabinetSidebar />
  {:else}
    <CabinetTabs {tabs} />
  {/if}

  <div class="cabinet__content">
    {@render children()}
  </div>
</div>

<AIChatWidget role={data.user.role as 'buyer' | 'investor' | 'agent' | 'internal_team'} userId={data.user.id} floating />

<style>
  .cabinet {
    display: flex;
    flex-direction: column;
    min-height: calc(100vh - var(--header-height));
  }

  .cabinet--with-sidebar {
    flex-direction: row;
  }

  .cabinet__content {
    flex: 1;
    padding: var(--space-8);
    background: var(--color-bg);
    min-width: 0;
  }

  @media (max-width: 768px) {
    .cabinet__content {
      padding: var(--space-4);
    }
  }
</style>
```

- [ ] **Step 3: Add inline widget to admin dashboard**

In `src/routes/(cabinet)/admin/+page.svelte`, add the import at the top of the `<script>` block:
```typescript
import AIChatWidget from '$lib/components/AIChatWidget.svelte';
```

At the bottom of the `.admin-dash` div (before the closing `</div>`), add a new section:
```svelte
  <div class="admin-dash__ai">
    <AIChatWidget role="internal_team" userId={data.userId} />
  </div>
```

Wait — `data.userId` is not available from `+page.server.ts` for admin. The `userId` comes from the layout's `data.user.id`. In SvelteKit, page data and layout data are merged — `data.user` from the cabinet layout server is available on any child page via `$page.data` or via the inherited `data` prop.

**Correction:** The admin page's `data` prop includes the parent layout's data. So `data.user.id` is available. Use `data.user?.id` to be safe:

```svelte
  <div class="admin-dash__ai">
    <AIChatWidget role="internal_team" userId={data.user?.id} />
  </div>
```

Add to the `<style>` block in `+page.svelte`:
```css
  .admin-dash__ai {
    margin-top: var(--space-8);
    border-radius: var(--radius-lg);
    overflow: hidden;
    height: 500px;
  }
```

- [ ] **Step 4: Run TypeScript check**

```bash
npm run check
```

Expected: 0 errors. If there's a type error about `data.user` on the admin page (because admin's `+page.server.ts` doesn't return `user`), fix by importing `$page` or casting:

If TypeScript complains that `data.user` doesn't exist on the admin page type, change the admin page import approach — pass userId from the layout via a different mechanism. The cleanest fix: add a type assertion in the admin page. In the admin page script:

```typescript
// data.user is inherited from the cabinet layout server load
const userId = (data as typeof data & { user: { id: string } }).user?.id;
```

Then use `{userId}` in the widget.

- [ ] **Step 5: Smoke test in browser**

1. Navigate to `http://localhost:5173/` (marketing page) — should see floating chat button bottom-right
2. Click the button — 380×500 panel opens
3. Type "What projects does Groundz have?" and press Enter — response appears
4. Navigate to `http://localhost:5173/auth/login`, log in as `buyer@groundz.estate` / `groundz123`
5. Should see floating chat button in cabinet — click it, ask "What are my payments?" — response appears
6. Log in as `team@groundz.estate` / `groundz123` — navigate to `/admin` — should see inline AI panel at the bottom of the dashboard

- [ ] **Step 6: Commit**

```bash
git add src/routes/(marketing)/+layout.svelte \
        src/routes/(cabinet)/+layout.svelte \
        src/routes/(cabinet)/admin/+page.svelte
git commit -m "feat: wire up AIChatWidget on all surfaces — public floating, cabinet floating, admin inline"
```

---

## Final verification checklist

- [ ] `npm run check` passes with 0 errors
- [ ] Public marketing chat responds to project questions (calls `searchProjects` tool)
- [ ] Unauthenticated request to buyer/investor/agent/internal_team role returns 401
- [ ] Buyer chat can answer "what are my payments?" (calls `getMyPayments`)
- [ ] Investor chat can answer "what pools am I in?" (calls `getMyPools`)
- [ ] Agent chat can answer "show me my hot leads" (calls `getLeads`)
- [ ] Internal team chat can answer "give me platform stats" (calls `getStats`)
- [ ] Admin inline panel is visible on `/admin` dashboard
- [ ] Error state shown when API is unavailable (shows Russian fallback)
- [ ] Floating panel closes/opens correctly
- [ ] `toolUsed` field in API response matches expected tool name
