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
      const pool = await db.pool.create({
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
