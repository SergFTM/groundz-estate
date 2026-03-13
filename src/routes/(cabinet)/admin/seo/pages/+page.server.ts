import prisma from '$lib/server/db.js';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
  const profiles = await prisma.seoPageProfile.findMany({
    orderBy: { lastAuditAt: 'desc' },
    include: {
      primaryCluster: { select: { name: true } },
      audits: { orderBy: { createdAt: 'desc' }, take: 1 },
    },
  });

  return { profiles };
};
