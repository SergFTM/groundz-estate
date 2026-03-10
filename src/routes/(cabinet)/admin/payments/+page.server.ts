import db from '$lib/server/db';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
  const payments = await db.payment.findMany({
    include: {
      user: { select: { name: true, email: true } },
      unit: { select: { code: true } }
    },
    orderBy: { dueDate: 'asc' }
  });
  return { payments };
};
