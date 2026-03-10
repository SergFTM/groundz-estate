import { error, fail } from '@sveltejs/kit';
import db from '$lib/server/db';
import { sendLeadNotification } from '$lib/server/email';
import { callBookingSchema } from '$lib/utils/validators';
import { ZodError } from 'zod';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params }) => {
  const project = await db.project.findUnique({
    where: { slug: params.slug },
    include: {
      units: { orderBy: { code: 'asc' } },
      constructionPhases: {
        orderBy: { sortOrder: 'asc' },
        include: { media: true },
      },
    },
  });

  if (!project) throw error(404, 'Project not found');

  return { project };
};

export const actions = {
  bookConsultation: async ({ request, params }) => {
    const formData = await request.formData();
    const name = formData.get('name') as string;
    const phone = formData.get('phone') as string;
    const timeSlot = formData.get('timeSlot') as string;

    try {
      callBookingSchema.parse({ name, phone, timeSlot });
    } catch (err) {
      if (err instanceof ZodError) {
        const errors: Record<string, string> = {};
        for (const issue of err.issues) errors[issue.path[0] as string] = issue.message;
        return fail(400, { errors });
      }
      return fail(400, { errors: { general: 'Invalid form data' } });
    }

    const lead = await db.lead.create({
      data: {
        source: 'call_booking',
        name,
        phone,
        data: JSON.stringify({ timeSlot, project: params.slug }),
      },
    });

    await sendLeadNotification({ source: 'call_booking', name, phone, data: lead.data });

    return { success: true };
  },
} satisfies Actions;
