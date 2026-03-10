import db from '$lib/server/db';
import { documentActionSchema } from '$lib/utils/validators';
import type { PageServerLoad, Actions } from './$types';

export const load: PageServerLoad = async () => {
  const documents = await db.document.findMany({
    include: { user: { select: { name: true, email: true } } },
    orderBy: { uploadedAt: 'desc' }
  });
  return { documents };
};

export const actions: Actions = {
  approveDocument: async ({ request }) => {
    const parsed = documentActionSchema.safeParse(Object.fromEntries(await request.formData()));
    if (!parsed.success) return { error: 'Invalid document ID' };
    await db.document.update({ where: { id: parsed.data.id }, data: { status: 'approved' } });
    return { success: true };
  },
  rejectDocument: async ({ request }) => {
    const parsed = documentActionSchema.safeParse(Object.fromEntries(await request.formData()));
    if (!parsed.success) return { error: 'Invalid document ID' };
    await db.document.update({ where: { id: parsed.data.id }, data: { status: 'action_required' } });
    return { success: true };
  }
};
