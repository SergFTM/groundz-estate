import type OpenAI from 'openai';
import db from '$lib/server/db';
import type { ChatRole } from './ai-context';

// ── Tool definitions ──────────────────────────────────────────────────────────

const SEARCH_PROJECTS: OpenAI.Chat.ChatCompletionTool = {
  type: 'function',
  function: {
    name: 'searchProjects',
    description: 'Search Develta real estate projects by status or location keyword',
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
      const where: Record<string, unknown> = {};
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
      const where: Record<string, unknown> = {};
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
      const where: Record<string, unknown> = {};
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
