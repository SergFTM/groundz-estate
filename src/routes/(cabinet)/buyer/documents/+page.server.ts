import db from '$lib/server/db';
import { fail } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types';

export const load: PageServerLoad = async ({ parent }) => {
  const { user } = await parent();
  const documents = await db.document.findMany({
    where: { userId: user.id },
    orderBy: { uploadedAt: 'desc' }
  });
  return { documents };
};

export const actions: Actions = {
  upload: async ({ request, locals }) => {
    if (!locals.user) return fail(401, { error: 'Not authenticated' });

    const formData = await request.formData();
    const name = (formData.get('name') as string)?.trim();
    const category = formData.get('category') as string;

    if (!name || name.length < 2) {
      return fail(400, { error: 'Document name is required' });
    }
    if (!['contract', 'passport', 'tax', 'floor_plan'].includes(category)) {
      return fail(400, { error: 'Invalid category' });
    }

    await db.document.create({
      data: {
        userId: locals.user.id,
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
