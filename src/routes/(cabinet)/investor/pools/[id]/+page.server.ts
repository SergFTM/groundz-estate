import { error, fail } from '@sveltejs/kit';
import db from '$lib/server/db';
import type { PageServerLoad, Actions } from './$types';

export const load: PageServerLoad = async ({ params, parent }) => {
  const { user } = await parent();

  const [pool, myCommit] = await Promise.all([
    db.pool.findUnique({
      where: { id: params.id },
      include: {
        investments: { include: { user: { select: { name: true } } } },
        documents:   { orderBy: { uploadedAt: 'desc' } },
        milestones:  { orderBy: { plannedDate: 'asc' } },
      },
    }),
    db.holding.findFirst({
      where: { poolId: params.id, userId: user.id },
    }),
  ]);

  if (!pool) throw error(404, 'Pool not found');
  return { pool, myCommit };
};

export const actions: Actions = {
  invest: async ({ request, params, locals }) => {
    if (!locals.user) return fail(401, { error: 'Not authenticated' });

    const pool = await db.pool.findUnique({ where: { id: params.id } });
    if (!pool) throw error(404, 'Pool not found');

    if (pool.status !== 'active') {
      return fail(400, { error: 'This pool is no longer accepting investments' });
    }

    const formData = await request.formData();
    const amountStr = formData.get('amount') as string;
    const amount = parseFloat(amountStr);

    if (isNaN(amount) || amount <= 0) {
      return fail(400, { error: 'Please enter a valid amount' });
    }

    if (amount < pool.minTicket) {
      return fail(400, { error: `Minimum investment is €${pool.minTicket.toLocaleString()}` });
    }

    const remaining = pool.goalAmount - pool.raisedAmount;
    if (amount > remaining) {
      return fail(400, { error: `Maximum available investment is €${remaining.toLocaleString()}` });
    }

    await db.holding.create({
      data: {
        userId: locals.user.id,
        poolId: params.id,
        amount,
      }
    });

    await db.pool.update({
      where: { id: params.id },
      data: { raisedAmount: { increment: amount } }
    });

    return { investSuccess: true };
  }
} satisfies Actions;
