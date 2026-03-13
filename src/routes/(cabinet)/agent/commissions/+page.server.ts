import db from '$lib/server/db';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ parent }) => {
  const { user } = await parent();
  const commissions = await db.commission.findMany({
    where: { agentId: user.id },
    orderBy: { createdAt: 'desc' }
  });
  const totals = {
    pending: commissions.filter(c => c.status === 'pending').reduce((s, c) => s + c.amount, 0),
    approved: commissions.filter(c => c.status === 'approved').reduce((s, c) => s + c.amount, 0),
    paid: commissions.filter(c => c.status === 'paid').reduce((s, c) => s + c.amount, 0),
  };
  return { commissions, totals };
};
