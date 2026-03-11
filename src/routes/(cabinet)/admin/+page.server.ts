import db from '$lib/server/db';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
  const [
    totalLeads, hotLeads, activeUnits, totalUnits, overduePayments, recentLeads, upcomingPayments,
    totalUsers, usersByRole, investmentAgg, activePools, pendingDocuments, pendingCommissions,
    convertedLeads, newLeadsThisWeek, soldUnits, reservedUnits, revenuePaidAgg, leadsByStatus, unitsByType
  ] =
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
      }),
      db.user.count(),
      db.user.groupBy({ by: ['role'], _count: true }),
      db.investorInvestment.aggregate({ _sum: { amount: true } }),
      db.investmentPool.count({ where: { status: 'active' } }),
      db.document.count({ where: { status: 'pending' } }),
      db.commission.count({ where: { status: 'pending' } }),
      // New: conversion & sales metrics
      db.lead.count({ where: { status: 'converted' } }),
      db.lead.count({ where: { createdAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } } }),
      db.unit.count({ where: { status: 'sold' } }),
      db.unit.count({ where: { status: 'reserved' } }),
      db.payment.aggregate({ _sum: { amount: true }, where: { status: 'paid' } }),
      // New: breakdown groupings
      db.lead.groupBy({ by: ['status'], _count: true }),
      db.unit.groupBy({ by: ['type'], _count: true }),
    ]);

  const overdueTotal = overduePayments.reduce((sum, p) => sum + p.amount, 0);
  const totalInvestmentRaised = investmentAgg._sum.amount ?? 0;
  const conversionRate = totalLeads === 0 ? 0 : Math.round((convertedLeads / totalLeads) * 100);
  const totalRevenuePaid = revenuePaidAgg._sum.amount ?? 0;

  // Convert groupBy arrays to plain objects for easy template access
  const leadStatusCounts = Object.fromEntries(
    leadsByStatus.map(({ status, _count }) => [status, _count])
  ) as Record<string, number>;

  const unitTypeCounts = Object.fromEntries(
    unitsByType.map(({ type, _count }) => [type, _count])
  ) as Record<string, number>;

  return {
    kpis: {
      totalLeads, hotLeads, activeUnits, totalUnits,
      overdueCount: overduePayments.length, overdueTotal,
      totalUsers, totalInvestmentRaised, activePools,
      pendingDocuments, pendingCommissions,
      convertedLeads, conversionRate, newLeadsThisWeek,
      soldUnits, reservedUnits, totalRevenuePaid,
    },
    usersByRole,
    recentLeads,
    upcomingPayments,
    leadStatusCounts,
    unitTypeCounts,
  };
};
