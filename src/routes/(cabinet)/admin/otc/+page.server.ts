// src/routes/(cabinet)/admin/otc/+page.server.ts
import db from '$lib/server/db.js';
import { requireRole } from '$lib/server/guards.js';
import { approveListing, rejectListing, cancelListing, ADMIN_LISTING_INCLUDE } from '$lib/server/otc/service.js';
import type { PageServerLoad, Actions } from './$types';

export const load: PageServerLoad = async (event) => {
  requireRole(event, ['internal_team']);

  const [pending, all] = await Promise.all([
    db.otcListing.findMany({
      where: { status: 'pending' },
      include: ADMIN_LISTING_INCLUDE,
      orderBy: { createdAt: 'asc' },
    }),
    db.otcListing.findMany({
      include: ADMIN_LISTING_INCLUDE,
      orderBy: { createdAt: 'desc' },
    }),
  ]);

  return { pending, all };
};

export const actions: Actions = {
  approve: async ({ request, locals }) => {
    if (locals.user?.role !== 'internal_team') return { error: 'Forbidden' };
    const data = await request.formData();
    const id = data.get('id') as string;
    if (!id) return { error: 'id required' };
    await approveListing(id);
    return { success: true };
  },

  reject: async ({ request, locals }) => {
    if (locals.user?.role !== 'internal_team') return { error: 'Forbidden' };
    const data = await request.formData();
    const id = data.get('id') as string;
    const note = (data.get('note') as string)?.trim();
    if (!id || !note) return { error: 'id and note required' };
    await rejectListing(id, note);
    return { success: true };
  },

  cancel: async ({ request, locals }) => {
    if (locals.user?.role !== 'internal_team') return { error: 'Forbidden' };
    const data = await request.formData();
    const id = data.get('id') as string;
    if (!id) return { error: 'id required' };
    await cancelListing(id, locals.user.id, locals.user.role);
    return { success: true };
  },
};
