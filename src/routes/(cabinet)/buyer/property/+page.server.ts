import db from '$lib/server/db';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ parent }) => {
  const { user } = await parent();
  const units = await db.unit.findMany({
    where: { buyerId: user.id },
    include: { project: true }
  });
  return { units };
};
