import { fail } from '@sveltejs/kit';
import db from '$lib/server/db';
import { sendLeadNotification } from '$lib/server/email';
import { contactSchema } from '$lib/utils/validators';
import { ZodError } from 'zod';
import type { Actions } from './$types';

export const actions = {
  sendMessage: async ({ request }) => {
    const formData = await request.formData();
    const name = formData.get('name') as string;
    const email = formData.get('email') as string;
    const phone = (formData.get('phone') as string) || undefined;
    const message = formData.get('message') as string;

    try {
      contactSchema.parse({ name, email, phone, message });
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
        source: 'contact',
        name,
        email,
        phone: phone || null,
        data: JSON.stringify({ message }),
      },
    });

    await sendLeadNotification({
      source: 'contact',
      name,
      email,
      phone: phone || null,
      data: lead.data,
    });

    return { success: true };
  },
} satisfies Actions;
