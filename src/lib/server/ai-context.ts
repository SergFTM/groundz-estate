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
Lead sources: quiz, newsletter, brochure, call_booking.
You can look up leads and filter by status or tag.`;

const INTERNAL_TEAM_CONTEXT = `${PUBLIC_CONTEXT}

You are speaking with an internal Groundz team member with full platform access.
Key models and their status enums:
- User: roles buyer | investor | agent | internal_team
- Project: status active | coming_soon | completed
- Unit: type studio | 1bed | 2bed | 3bed | penthouse; status available | reserved | sold
- Payment: status paid | upcoming | overdue
- Lead: status new | contacted | converted | lost; tag hot | warm | cold
- Pool: status active | closed | completed
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

  // Title/question matches are higher quality — fetch separately so they rank first
  const articleTitleWhere = keywords.flatMap((k) => [{ title: { contains: k } }]);
  const articleBodyWhere = keywords.flatMap((k) => [
    { excerpt: { contains: k } },
    { content: { contains: k } },
  ]);
  const faqTitleWhere = keywords.flatMap((k) => [{ question: { contains: k } }]);
  const faqBodyWhere = keywords.flatMap((k) => [{ answer: { contains: k } }]);

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
