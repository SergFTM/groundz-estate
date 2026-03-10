import db from '$lib/server/db';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
  const [totalLeads, hotLeads, activeUnits, totalUnits, overduePayments, recentLeads, upcomingPayments] =
    await Promise.all([
      db.lead.count(),
      db.lead.count({ where: { tag: 'hot' } }),
      db.unit.count({ where: { status: 'available' } }),
      db.unit.count(),
      db.payment.findMany({
        where: { status: 'overdue' },
        include: { user: true, unit: true }
      }),
      db.lead.findMany({
        orderBy: { createdAt: 'desc' },
        take: 5
      }),
      db.payment.findMany({
        where: { status: { in: ['upcoming', 'overdue'] } },
        include: { user: true, unit: true },
        orderBy: { dueDate: 'asc' },
        take: 5
      })
    ]);

  const overdueTotal = overduePayments.reduce((sum, p) => sum + p.amount, 0);

  return {
    kpis: { totalLeads, hotLeads, activeUnits, totalUnits, overdueCount: overduePayments.length, overdueTotal },
    recentLeads,
    upcomingPayments
  };
};
