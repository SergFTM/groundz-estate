import db from '$lib/server/db';
import { fail } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types';

const VALID_CATEGORIES = [
  'contract', 'passport', 'tax', 'proof_of_funds',
  'kyc', 'floor_plan', 'subscription_agreement', 'other'
];

export const load: PageServerLoad = async ({ parent }) => {
  const { user } = await parent();

  // Get investor's pool ids for the pool selector
  const investments = await db.holding.findMany({
    where: { userId: user.id },
    include: { pool: { select: { id: true, name: true } } },
    orderBy: { createdAt: 'desc' },
  });

  const documents = await db.document.findMany({
    where: { userId: user.id },
    include: { pool: { select: { id: true, name: true } } },
    orderBy: { uploadedAt: 'desc' },
  });

  const myPoolIds = [...new Set(investments.map(i => i.pool.id))];
  const myPools = investments.map(i => ({ id: i.pool.id, name: i.pool.name }))
    .filter((p, idx, arr) => arr.findIndex(x => x.id === p.id) === idx);

  return { documents, myPools };
};

export const actions: Actions = {
  upload: async ({ request, locals }) => {
    if (!locals.user) return fail(401, { error: 'Not authenticated' });

    const formData = await request.formData();
    const name = (formData.get('name') as string)?.trim();
    const category = formData.get('category') as string;
    const poolId = (formData.get('poolId') as string) || null;

    if (!name || name.length < 2) {
      return fail(400, { error: 'Document name is required' });
    }
    if (!VALID_CATEGORIES.includes(category)) {
      return fail(400, { error: 'Invalid category' });
    }

    await db.document.create({
      data: {
        userId: locals.user.id,
        poolId: poolId || null,
        name,
        category,
        fileUrl: '/uploads/placeholder.pdf',
        fileSize: 0,
        status: 'pending',
      }
    });

    return { uploadSuccess: true };
  }
} satisfies Actions;
