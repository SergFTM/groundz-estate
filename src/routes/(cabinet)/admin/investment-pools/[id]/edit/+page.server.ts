import { error, redirect } from '@sveltejs/kit';
import db from '$lib/server/db';
import { createPoolSchema } from '$lib/utils/validators';
import { ZodError } from 'zod';
import type { PageServerLoad, Actions } from './$types';

export const load: PageServerLoad = async ({ params }) => {
  const pool = await db.pool.findUnique({
    where: { id: params.id },
    include: {
      investments: {
        include: { user: { select: { id: true, name: true, email: true } } },
        orderBy: { createdAt: 'desc' }
      },
      milestones: { orderBy: { plannedDate: 'asc' } }
    }
  });
  if (!pool) throw error(404, 'Investment pool not found');
  return { pool };
};

export const actions: Actions = {
  update: async ({ request, params }) => {
    const pool = await db.pool.findUnique({ where: { id: params.id } });
    if (!pool) throw error(404, 'Investment pool not found');

    const formData = await request.formData();
    const raw = Object.fromEntries(formData);

    try {
      const data = createPoolSchema.parse(raw);
      await db.pool.update({
        where: { id: params.id },
        data: {
          name: data.name,
          slug: data.slug || null,
          projectName: data.projectName,
          country: data.country,
          city: data.city || null,
          dealType: data.dealType || null,
          goalAmount: data.goalAmount,
          raisedAmount: data.raisedAmount,
          targetYield: data.targetYield,
          targetIrr: data.targetIrr ? Number(data.targetIrr) : null,
          preferredReturn: data.preferredReturn ? Number(data.preferredReturn) : null,
          termMonths: data.termMonths,
          minTicket: data.minTicket,
          maxTicket: data.maxTicket ? Number(data.maxTicket) : null,
          exitType: data.exitType || null,
          capitalType: data.capitalType || null,
          spvName: data.spvName || null,
          ltv: data.ltv ? Number(data.ltv) : null,
          ltc: data.ltc ? Number(data.ltc) : null,
          developerCoinvestPct: data.developerCoinvestPct ? Number(data.developerCoinvestPct) : null,
          status: data.status,
          imageUrl: data.imageUrl || null,
          description: data.description || null,
          locationThesis: data.locationThesis || null,
          demandThesis: data.demandThesis || null,
          constructionThesis: data.constructionThesis || null,
          exitThesis: data.exitThesis || null,
        },
      });
      return { success: true };
    } catch (err) {
      if (err instanceof ZodError) {
        const errors: Record<string, string> = {};
        for (const issue of err.issues) errors[issue.path[0] as string] = issue.message;
        return { errors };
      }
      throw err;
    }
  },

  delete: async ({ params }) => {
    const pool = await db.pool.findUnique({ where: { id: params.id } });
    if (!pool) throw error(404, 'Investment pool not found');

    await db.pool.delete({ where: { id: params.id } });
    throw redirect(303, '/admin/investment-pools');
  },
} satisfies Actions;
