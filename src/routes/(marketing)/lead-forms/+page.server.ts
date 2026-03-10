import { fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { newsletterSchema, brochureSchema, callBookingSchema } from '$lib/utils/validators';
import db from '$lib/server/db';
import { notifyManager } from '$lib/server/email';
import { ZodError } from 'zod';

export const load: PageServerLoad = async () => {
	const projects = await db.project.findMany({
		where: { status: 'active' },
		orderBy: { name: 'asc' }
	});
	return { projects };
};

function extractZodErrors(err: ZodError): Record<string, string> {
	const errors: Record<string, string> = {};
	for (const issue of err.issues) {
		const field = issue.path[0] as string;
		errors[field] = issue.message;
	}
	return errors;
}

export const actions = {
	newsletter: async ({ request }) => {
		const formData = await request.formData();
		const email = formData.get('email') as string;
		const gdprConsent = formData.get('gdprConsent') as string;

		try {
			newsletterSchema.parse({ email, gdprConsent });
		} catch (err) {
			if (err instanceof ZodError) {
				return fail(400, { errors: extractZodErrors(err), form: 'newsletter' as const });
			}
			return fail(400, { errors: { general: 'Invalid form data' }, form: 'newsletter' as const });
		}

		await db.lead.create({
			data: {
				source: 'newsletter',
				email
			}
		});

		await notifyManager({ source: 'newsletter', email });

		return { success: true, form: 'newsletter' as const };
	},

	brochure: async ({ request }) => {
		const formData = await request.formData();
		const name = formData.get('name') as string;
		const email = formData.get('email') as string;
		const phone = formData.get('phone') as string;
		const project = formData.get('project') as string;

		try {
			brochureSchema.parse({ name, email, phone, project });
		} catch (err) {
			if (err instanceof ZodError) {
				return fail(400, { errors: extractZodErrors(err), form: 'brochure' as const });
			}
			return fail(400, { errors: { general: 'Invalid form data' }, form: 'brochure' as const });
		}

		await db.lead.create({
			data: {
				source: 'brochure',
				name,
				email,
				phone,
				data: JSON.stringify({ project })
			}
		});

		await notifyManager({ source: 'brochure', name, email, phone });

		return { success: true, form: 'brochure' as const };
	},

	callBooking: async ({ request }) => {
		const formData = await request.formData();
		const name = formData.get('name') as string;
		const phone = formData.get('phone') as string;
		const timeSlot = formData.get('timeSlot') as string;
		const message = formData.get('message') as string;

		try {
			callBookingSchema.parse({ name, phone, timeSlot, message: message || undefined });
		} catch (err) {
			if (err instanceof ZodError) {
				return fail(400, { errors: extractZodErrors(err), form: 'callBooking' as const });
			}
			return fail(400, { errors: { general: 'Invalid form data' }, form: 'callBooking' as const });
		}

		await db.lead.create({
			data: {
				source: 'call_booking',
				name,
				phone,
				data: JSON.stringify({ timeSlot, message })
			}
		});

		await notifyManager({ source: 'call_booking', name, phone });

		return { success: true, form: 'callBooking' as const };
	}
} satisfies Actions;
