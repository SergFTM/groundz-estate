import db from '$lib/server/db';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
  const faqs = await db.fAQ.findMany({
    orderBy: { sortOrder: 'asc' },
  });
  return { faqs };
};
