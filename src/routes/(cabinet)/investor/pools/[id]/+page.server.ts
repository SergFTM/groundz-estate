import { error } from '@sveltejs/kit';
import db from '$lib/server/db';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params }) => {
  const pool = await db.investmentPool.findUnique({
    where: { id: params.id },
    include: { investments: { include: { user: { select: { name: true } } } } }
  });
  if (!pool) throw error(404, 'Pool not found');
  return { pool };
};
