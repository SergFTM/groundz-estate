import db from '$lib/server/db';
import { fail, redirect } from '@sveltejs/kit';
import { z } from 'zod';
import type { PageServerLoad, Actions } from './$types';

const reportSchema = z.object({
  reportDate: z.string().min(1, 'Date required'),
  overallPct: z.coerce.number().int().min(0).max(100),
  budgetTotal: z.coerce.number().min(0),
  budgetSpent: z.coerce.number().min(0),
  notes: z.string().max(1000).optional().or(z.literal('')),
});

export const load: PageServerLoad = async ({ params }) => {
  const pool = await db.pool.findUnique({
    where: { id: params.id },
    select: { id: true, name: true },
  });
  if (!pool) throw redirect(302, '/admin/investment-pools');

  const reports = await db.constructionReport.findMany({
    where: { poolId: params.id },
    orderBy: { reportDate: 'desc' },
  });

  return { pool, reports };
};

export const actions: Actions = {
  create: async ({ request, locals, params }) => {
    if (!locals.user || locals.user.role !== 'internal_team') {
      return fail(403, { error: 'Forbidden' });
    }

    const data = Object.fromEntries(await request.formData());
    const parsed = reportSchema.safeParse(data);
    if (!parsed.success) {
      return fail(400, { error: parsed.error.issues[0]?.message ?? 'Invalid input' });
    }

    const { reportDate, overallPct, budgetTotal, budgetSpent, notes } = parsed.data;
    const budgetVariance = budgetSpent - budgetTotal;

    await db.constructionReport.create({
      data: {
        poolId: params.id,
        reportDate: new Date(reportDate),
        overallPct,
        budgetTotal,
        budgetSpent,
        budgetVariance,
        notes: notes || null,
      },
    });

    return { success: true };
  },

  delete: async ({ request, locals }) => {
    if (!locals.user || locals.user.role !== 'internal_team') {
      return fail(403, { error: 'Forbidden' });
    }
    const data = Object.fromEntries(await request.formData());
    const id = String(data.id ?? '');
    if (!id) return fail(400, { error: 'ID required' });
    await db.constructionReport.delete({ where: { id } });
    return { success: true };
  },
} satisfies Actions;
