import { json } from '@sveltejs/kit';
import db from '$lib/server/db';
import { sendLeadNotification } from '$lib/server/email';
import { callBookingSchema } from '$lib/utils/validators';
import { rateLimit } from '$lib/server/rate-limit';
import { ZodError } from 'zod';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async (event) => {
  rateLimit(event, 'public');
  const { name, phone, timeSlot, projectSlug } = await event.request.json() as {
    name: string;
    phone: string;
    timeSlot: string;
    projectSlug?: string;
  };

  try {
    callBookingSchema.parse({ name, phone, timeSlot });
  } catch (err) {
    if (err instanceof ZodError) {
      const errors: Record<string, string> = {};
      for (const issue of err.issues) errors[issue.path[0] as string] = issue.message;
      return json({ success: false, errors }, { status: 400 });
    }
    return json({ success: false, errors: { general: 'Invalid data' } }, { status: 400 });
  }

  const lead = await db.lead.create({
    data: {
      source: 'call_booking',
      name,
      phone,
      data: JSON.stringify({ timeSlot, project: projectSlug ?? '' }),
    },
  });

  await sendLeadNotification({ source: 'call_booking', name, phone, data: lead.data });

  return json({ success: true });
};
