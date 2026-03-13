import prisma from '$lib/server/db.js';
import { fail } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types';

export const load: PageServerLoad = async () => {
  const clusters = await prisma.seoKeywordCluster.findMany({
    orderBy: { createdAt: 'desc' },
    include: { _count: { select: { pageProfiles: true } } },
  });
  return { clusters };
};

export const actions: Actions = {
  create: async ({ request }) => {
    const data = await request.formData();
    const name = data.get('name')?.toString().trim();
    const locale = data.get('locale')?.toString();
    const intent = data.get('intent')?.toString();
    const primaryTerm = data.get('primaryTerm')?.toString().trim();
    const termsRaw = data.get('terms')?.toString().trim() ?? '';

    if (!name || !locale || !intent || !primaryTerm) {
      return fail(400, { error: 'All fields required' });
    }

    const terms = termsRaw.split(',').map(t => t.trim()).filter(Boolean);

    await prisma.seoKeywordCluster.create({
      data: { name, locale, intent, primaryTerm, termsJson: JSON.stringify(terms) },
    });

    return { success: true };
  },

  delete: async ({ request }) => {
    const data = await request.formData();
    const id = data.get('id')?.toString();
    if (!id) return fail(400, { error: 'Missing id' });
    await prisma.seoKeywordCluster.delete({ where: { id } });
    return { success: true };
  },
};
