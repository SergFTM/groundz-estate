import { error } from '@sveltejs/kit';
import db from '$lib/server/db';
import { updateLeadSchema } from '$lib/utils/validators';
import type { PageServerLoad, Actions } from './$types';

export const load: PageServerLoad = async ({ params, locals }) => {
  const lead = await db.lead.findUnique({ where: { id: params.id } });
  if (!lead) throw error(404, 'Lead not found');
  const canEdit = lead.agentId === locals.user!.id;
  return { lead, canEdit };
};

export const actions: Actions = {
  updateLead: async ({ request, params, locals }) => {
    const lead = await db.lead.findUnique({ where: { id: params.id } });
    if (!lead || lead.agentId !== locals.user!.id) {
      throw error(403, 'Not authorized to edit this lead');
    }
    const parsed = updateLeadSchema.safeParse(Object.fromEntries(await request.formData()));
    if (!parsed.success) return { error: parsed.error.flatten().fieldErrors };
    const updateData: Record<string, unknown> = {};
    if (parsed.data.tag) updateData.tag = parsed.data.tag;
    if (parsed.data.status) updateData.status = parsed.data.status;
    if (parsed.data.name) updateData.name = parsed.data.name;
    if (parsed.data.phone) updateData.phone = parsed.data.phone;
    await db.lead.update({ where: { id: params.id }, data: updateData });
    return { success: true };
  }
};
