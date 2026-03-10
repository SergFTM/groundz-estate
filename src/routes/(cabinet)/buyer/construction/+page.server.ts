import db from '$lib/server/db';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ parent }) => {
  const { user } = await parent();
  const unit = await db.unit.findFirst({
    where: { buyerId: user.id },
    include: {
      project: {
        include: {
          constructionPhases: {
            orderBy: { sortOrder: 'asc' },
            include: { media: true }
          }
        }
      }
    }
  });
  const phases = unit?.project?.constructionPhases ?? [];
  return { unit, phases };
};
