import db from '$lib/server/db';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ parent }) => {
  const { user } = await parent();
  const leads = await db.lead.findMany({
    orderBy: { createdAt: 'desc' }
  });
  return { leads, userId: user.id };
};
