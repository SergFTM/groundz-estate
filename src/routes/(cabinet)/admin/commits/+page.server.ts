import db from '$lib/server/db';
import { fail } from '@sveltejs/kit';
import { z } from 'zod';
import type { PageServerLoad, Actions } from './$types';

export const load: PageServerLoad = async () => {
  const commits = await db.investorInvestment.findMany({
    include: {
      user: { select: { id: true, name: true, email: true } },
      pool: { select: { id: true, name: true, slug: true, status: true } },
    },
    orderBy: { createdAt: 'desc' },
  });
  return { commits };
};

const updateSchema = z.object({
  id: z.string().min(1),
  status: z.enum(['soft_commit', 'pending', 'funded', 'cancelled']),
  notes: z.string().max(500).optional().or(z.literal('')),
});

export const actions: Actions = {
  update: async ({ request, locals }) => {
    if (!locals.user || locals.user.role !== 'internal_team') {
      return fail(403, { error: 'Forbidden' });
    }

    const data = Object.fromEntries(await request.formData());
    const parsed = updateSchema.safeParse(data);
    if (!parsed.success) {
      return fail(400, { error: parsed.error.issues[0]?.message ?? 'Invalid input' });
    }

    await db.investorInvestment.update({
      where: { id: parsed.data.id },
      data: {
        status: parsed.data.status,
        notes: parsed.data.notes || null,
      },
    });

    return { success: true };
  },
} satisfies Actions;
