import db from '$lib/server/db';
import { fail } from '@sveltejs/kit';
import { z } from 'zod';
import { sendInvestorApplicationNotification } from '$lib/server/email';
import type { Actions } from './$types';

const applySchema = z.object({
  name:            z.string().min(2, 'Full name is required'),
  email:           z.string().email('Valid email is required'),
  phone:           z.string().min(7, 'Phone number is required'),
  nationality:     z.string().min(2, 'Nationality is required'),
  investorType:    z.enum(['individual', 'company', 'family_office'], { message: 'Please select investor type' }),
  ticketSize:      z.enum(['25k_100k', '100k_500k', '500k_plus'], { message: 'Please select ticket size' }),
  dealTypeInterest: z.string().min(1, 'Please select at least one deal type'),
  timeHorizon:     z.enum(['short', 'medium', 'long'], { message: 'Please select time horizon' }),
  accreditedConfirm: z.string().refine(v => v === 'on', { message: 'Please confirm you are an accredited/qualified investor' }),
  gdprConsent:     z.string().refine(v => v === 'on', { message: 'Please accept privacy policy' }),
  message:         z.string().max(1000).optional().or(z.literal('')),
});

export const actions: Actions = {
  default: async ({ request }) => {
    const raw = Object.fromEntries(await request.formData());
    const parsed = applySchema.safeParse(raw);

    if (!parsed.success) {
      return fail(400, { error: parsed.error.issues[0]?.message ?? 'Invalid input' });
    }

    const {
      name, email, phone, nationality, investorType,
      ticketSize, dealTypeInterest, timeHorizon, message,
    } = parsed.data;

    await db.lead.create({
      data: {
        source: 'investor_application',
        status: 'new',
        name,
        email,
        phone,
        data: JSON.stringify({
          nationality,
          investorType,
          ticketSize,
          dealTypeInterest,
          timeHorizon,
          message: message || null,
        }),
      },
    });

    // Fire-and-forget — SMTP errors must not block the user response
    void sendInvestorApplicationNotification({
      name, email, phone, nationality, investorType,
      ticketSize, dealTypeInterest, timeHorizon,
      message: message || null,
    });

    return { success: true };
  },
};
