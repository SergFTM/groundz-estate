import db from '$lib/server/db';
import { requireRole } from '$lib/server/guards';
import { fail } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types';

export const load: PageServerLoad = async (event) => {
  requireRole(event, ['internal_team']);
  const tiers = await db.membershipTier.findMany({ orderBy: { order: 'asc' } });
  return { tiers };
};

function parsePerks(raw: string | null): string {
  const list = (raw ?? '')
    .split('\n')
    .map((s) => s.trim())
    .filter(Boolean);
  return JSON.stringify(list);
}

function fields(data: FormData) {
  return {
    slug: (data.get('slug') as string)?.trim(),
    name: (data.get('name') as string)?.trim(),
    price: parseFloat((data.get('price') as string) || '0'),
    minTicket: parseFloat((data.get('minTicket') as string) || '0'),
    maxTicket: data.get('maxTicket') ? parseFloat(data.get('maxTicket') as string) : null,
    order: parseInt((data.get('order') as string) || '0', 10),
    perks: parsePerks(data.get('perks') as string),
  };
}

const FORBIDDEN = (role?: string) => role !== 'internal_team';

export const actions: Actions = {
  create: async ({ request, locals }) => {
    if (FORBIDDEN(locals.user?.role)) return fail(403, { error: 'Forbidden' });
    const f = fields(await request.formData());
    if (!f.slug || !f.name) return fail(400, { error: 'slug и name обязательны' });
    try {
      await db.membershipTier.create({ data: { ...f, active: true } });
    } catch {
      return fail(400, { error: 'Не удалось создать (slug должен быть уникальным)' });
    }
    return { success: true };
  },

  update: async ({ request, locals }) => {
    if (FORBIDDEN(locals.user?.role)) return fail(403, { error: 'Forbidden' });
    const data = await request.formData();
    const id = data.get('id') as string;
    if (!id) return fail(400, { error: 'id required' });
    await db.membershipTier.update({ where: { id }, data: fields(data) });
    return { success: true };
  },

  toggle: async ({ request, locals }) => {
    if (FORBIDDEN(locals.user?.role)) return fail(403, { error: 'Forbidden' });
    const data = await request.formData();
    const id = data.get('id') as string;
    const active = data.get('active') === 'true';
    if (!id) return fail(400, { error: 'id required' });
    await db.membershipTier.update({ where: { id }, data: { active: !active } });
    return { success: true };
  },

  remove: async ({ request, locals }) => {
    if (FORBIDDEN(locals.user?.role)) return fail(403, { error: 'Forbidden' });
    const data = await request.formData();
    const id = data.get('id') as string;
    if (!id) return fail(400, { error: 'id required' });
    await db.membershipTier.delete({ where: { id } });
    return { success: true };
  },
};
