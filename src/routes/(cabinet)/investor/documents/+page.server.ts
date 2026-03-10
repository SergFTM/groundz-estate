import db from '$lib/server/db';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ parent }) => {
  const { user } = await parent();
  const documents = await db.document.findMany({
    where: { userId: user.id },
    orderBy: { uploadedAt: 'desc' }
  });
  return { documents };
};
