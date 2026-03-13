import prisma from '$lib/server/db.js';
import { fail } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types';

export const load: PageServerLoad = async () => {
  const [revisions, recentAudits] = await Promise.all([
    prisma.seoContentRevision.findMany({
      where: { status: { in: ['pending', 'approved', 'rejected'] } },
      orderBy: { createdAt: 'desc' },
      take: 50,
      include: { pageProfile: { select: { route: true, articleId: true } } },
    }),
    prisma.seoAudit.findMany({
      orderBy: { createdAt: 'desc' },
      take: 30,
      include: { pageProfile: { select: { route: true } } },
    }),
  ]);

  return { revisions, recentAudits };
};

export const actions: Actions = {
  updateRevision: async ({ request }) => {
    const data = await request.formData();
    const id = data.get('id')?.toString();
    const status = data.get('status')?.toString() as 'approved' | 'rejected' | 'applied';

    if (!id || !status) return fail(400, { error: 'Missing fields' });

    await prisma.seoContentRevision.update({ where: { id }, data: { status } });
    return { success: true };
  },
};
