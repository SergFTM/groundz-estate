import db from '$lib/server/db';
import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params, locals }) => {
  const pool = await db.investmentPool.findUnique({
    where: { slug: params.slug },
    include: {
      _count: { select: { investments: true } },
      milestones: { orderBy: { plannedDate: 'asc' } },
      constructionReports: { orderBy: { reportDate: 'desc' }, take: 1 },
    },
  });

  if (!pool) throw error(404, 'Investment pool not found');

  // Check if current user already has a commitment for this pool
  const myCommit = locals.user
    ? await db.investorInvestment.findFirst({
        where: { userId: locals.user.id, poolId: pool.id },
        orderBy: { createdAt: 'desc' },
      })
    : null;

  return { pool, user: locals.user ?? null, myCommit };
};
