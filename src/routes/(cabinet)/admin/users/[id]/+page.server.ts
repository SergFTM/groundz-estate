import { error } from '@sveltejs/kit';
import db from '$lib/server/db';
import { updateRoleSchema } from '$lib/utils/validators';
import type { PageServerLoad, Actions } from './$types';

export const load: PageServerLoad = async ({ params }) => {
  const user = await db.user.findUnique({
    where: { id: params.id },
    include: {
      payments: { include: { unit: true }, orderBy: { dueDate: 'asc' } },
      documents: true,
      leads: true
    }
  });
  if (!user) throw error(404, 'User not found');
  return { targetUser: user };
};

export const actions: Actions = {
  updateRole: async ({ request, params }) => {
    const formData = await request.formData();
    const parsed = updateRoleSchema.safeParse(Object.fromEntries(formData));
    if (!parsed.success) return { error: 'Invalid role' };
    await db.user.update({ where: { id: params.id }, data: { role: parsed.data.role } });
    return { success: true };
  }
};
