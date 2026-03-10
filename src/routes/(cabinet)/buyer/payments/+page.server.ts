import db from '$lib/server/db';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ parent }) => {
  const { user } = await parent();
  const payments = await db.payment.findMany({
    where: { userId: user.id },
    include: { unit: { select: { code: true } } },
    orderBy: { dueDate: 'asc' }
  });
  return { payments };
};
