import db from '$lib/server/db';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
  const leads = await db.lead.findMany({
    include: { agent: { select: { id: true, name: true, email: true } } },
    orderBy: { createdAt: 'desc' }
  });
  return { leads };
};
