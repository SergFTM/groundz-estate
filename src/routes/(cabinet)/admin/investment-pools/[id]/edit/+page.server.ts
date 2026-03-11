import { error, redirect } from '@sveltejs/kit';
import db from '$lib/server/db';
import { createPoolSchema } from '$lib/utils/validators';
import { ZodError } from 'zod';
import type { PageServerLoad, Actions } from './$types';

export const load: PageServerLoad = async ({ params }) => {
  const pool = await db.investmentPool.findUnique({
    where: { id: params.id },
    include: {
      investments: {
        include: { user: { select: { id: true, name: true, email: true } } },
        orderBy: { createdAt: 'desc' }
      }
    }
  });
  if (!pool) throw error(404, 'Investment pool not found');
  return { pool };
};

export const actions: Actions = {
  update: async ({ request, params }) => {
    const pool = await db.investmentPool.findUnique({ where: { id: params.id } });
    if (!pool) throw error(404, 'Investment pool not found');

    const formData = await request.formData();
    const raw = Object.fromEntries(formData);

    try {
      const data = createPoolSchema.parse(raw);
      await db.investmentPool.update({
        where: { id: params.id },
        data: {
          name: data.name,
          projectName: data.projectName,
          goalAmount: data.goalAmount,
          raisedAmount: data.raisedAmount,
          targetYield: data.targetYield,
          termMonths: data.termMonths,
          minTicket: data.minTicket,
          status: data.status,
          imageUrl: data.imageUrl || null,
          description: data.description || null,
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
    const pool = await db.investmentPool.findUnique({ where: { id: params.id } });
    if (!pool) throw error(404, 'Investment pool not found');

    await db.investmentPool.delete({ where: { id: params.id } });
    throw redirect(303, '/admin/investment-pools');
  },
} satisfies Actions;
