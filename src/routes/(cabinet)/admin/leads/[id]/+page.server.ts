import { error } from '@sveltejs/kit';
import db from '$lib/server/db';
import { updateLeadSchema } from '$lib/utils/validators';
import type { PageServerLoad, Actions } from './$types';

export const load: PageServerLoad = async ({ params }) => {
  const lead = await db.lead.findUnique({
    where: { id: params.id },
    include: {
      agent: { select: { id: true, name: true, email: true } },
      user: { select: { id: true, name: true, email: true } }
    }
  });
  if (!lead) throw error(404, 'Lead not found');

  const agents = await db.user.findMany({
    where: { role: 'agent' },
    select: { id: true, name: true, email: true }
  });

  return { lead, agents };
};

export const actions: Actions = {
  updateLead: async ({ request, params }) => {
    const formData = await request.formData();
    const raw = Object.fromEntries(formData);
    const parsed = updateLeadSchema.safeParse(raw);

    if (!parsed.success) {
      return { error: parsed.error.flatten().fieldErrors };
    }

    const data: Record<string, unknown> = {};
    if (parsed.data.tag) data.tag = parsed.data.tag;
    if (parsed.data.status) data.status = parsed.data.status;
    if (parsed.data.agentId !== undefined) {
      data.agentId = parsed.data.agentId || null;
    }
    if (parsed.data.name) data.name = parsed.data.name;
    if (parsed.data.phone) data.phone = parsed.data.phone;

    await db.lead.update({ where: { id: params.id }, data });
    return { success: true };
  }
};
