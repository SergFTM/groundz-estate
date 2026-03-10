import db from '$lib/server/db';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ parent }) => {
  const { user } = await parent();

  const [myLeads, totalLeads] = await Promise.all([
    db.lead.findMany({
      where: { agentId: user.id },
      orderBy: { createdAt: 'desc' }
    }),
    db.lead.count()
  ]);

  const myHotLeads = myLeads.filter(l => l.tag === 'hot').length;

  return { myLeads, kpis: { myLeadCount: myLeads.length, myHotLeads, totalLeads } };
};
