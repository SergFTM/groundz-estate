import db from '$lib/server/db';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
  const users = await db.user.findMany({ orderBy: { createdAt: 'desc' } });
  return { users };
};
