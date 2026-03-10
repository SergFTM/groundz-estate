import { fail } from '@sveltejs/kit';
import type { Actions } from './$types';
import { quizSchema } from '$lib/utils/validators';
import db from '$lib/server/db';
import { sendLeadNotification } from '$lib/server/email';
import { ZodError } from 'zod';

export const actions = {
	default: async ({ request }) => {
		const formData = await request.formData();

		const timing = formData.get('timing') as string;
		const purpose = formData.get('purpose') as string;
		const budget = formData.get('budget') as string;
		const installment = formData.get('installment') as string;
		const name = formData.get('name') as string;
		const phone = formData.get('phone') as string;

		try {
			quizSchema.parse({ timing, purpose, budget, installment, name, phone });
		} catch (err) {
			if (err instanceof ZodError) {
				const errors: Record<string, string> = {};
				for (const issue of err.issues) {
					const field = issue.path[0] as string;
					errors[field] = issue.message;
				}

				let step = 5;
				if (errors.timing) step = 1;
				else if (errors.purpose) step = 2;
				else if (errors.budget) step = 3;
				else if (errors.installment) step = 4;

				return fail(400, { errors, step });
			}
			return fail(400, { errors: { general: 'Invalid form data' }, step: 1 });
		}

		let tag: 'hot' | 'warm' | 'cold' = 'warm';

		const isHighBudget = budget.includes('€500') || budget.includes('€1');
		const isUrgent = timing === '1-3 месяца';
		const isLowBudget = budget === 'до €200k';
		const isJustLooking = timing === 'интересуюсь';

		if (isHighBudget && isUrgent) {
			tag = 'hot';
		} else if (isLowBudget && isJustLooking) {
			tag = 'cold';
		}

		await db.lead.create({
			data: {
				source: 'quiz',
				name,
				phone,
				data: JSON.stringify({ timing, purpose, budget, installment }),
				tag
			}
		});

		await sendLeadNotification({ source: 'quiz', name, phone });

		return { success: true };
	}
} satisfies Actions;
