import { redirect } from '@sveltejs/kit';
import db from '$lib/server/db';
import { createPoolSchema } from '$lib/utils/validators';
import { ZodError } from 'zod';
import type { PageServerLoad, Actions } from './$types';

export const load: PageServerLoad = async () => {
  return {};
};

export const actions: Actions = {
  create: async ({ request }) => {
    const formData = await request.formData();
    const raw = Object.fromEntries(formData);

    try {
      const data = createPoolSchema.parse(raw);
      const pool = await db.investmentPool.create({
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
      throw redirect(303, `/admin/investment-pools/${pool.id}/edit`);
    } catch (err) {
      if (err instanceof ZodError) {
        const errors: Record<string, string> = {};
        for (const issue of err.issues) errors[issue.path[0] as string] = issue.message;
        return { errors };
      }
      throw err;
    }
  },
} satisfies Actions;
