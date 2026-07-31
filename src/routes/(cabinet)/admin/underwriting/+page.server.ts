import { ZodError, z } from 'zod';
import {
	brrrr,
	buyAndHold,
	flip,
	type Market,
	propertySchema
} from '$lib/server/ai-core/management-accounting/investment';
import type { Actions, PageServerLoad } from './$types';

const financingFormSchema = z.object({
	downPaymentPct: z.coerce.number().min(0).max(1),
	annualRate: z.coerce.number().min(0).max(1),
	termYears: z.coerce.number().int().positive(),
	closingCostsPct: z.coerce.number().min(0).max(0.1).default(0.025)
});

const propertyFormSchema = propertySchema.extend({
	price: z.coerce.number().positive(),
	beds: z.coerce.number().int().nonnegative(),
	baths: z.coerce.number().nonnegative(),
	sqft: z.coerce.number().positive(),
	yearBuilt: z.coerce.number().int().min(1700).max(2100).optional(),
	annualPropertyTax: z.coerce.number().nonnegative().default(0),
	monthlyHoa: z.coerce.number().nonnegative().default(0),
	estimatedMonthlyRent: z.coerce.number().nonnegative()
});

const rehabSchema = z.object({
	rehabCost: z.coerce.number().nonnegative().default(0),
	arv: z.coerce.number().nonnegative().default(0),
	holdingMonths: z.coerce.number().nonnegative().default(0),
	holdingCostPerMonth: z.coerce.number().nonnegative().default(0)
});

const marketSchema = z.enum(['CY', 'RU', 'EU', 'US']).default('CY');

export const load: PageServerLoad = async () => {
	return {};
};

export const actions: Actions = {
	analyze: async ({ request }) => {
		const formData = await request.formData();
		const raw = Object.fromEntries(formData);

		try {
			const property = propertyFormSchema.parse(raw);
			const financing = financingFormSchema.parse(raw);
			const rehab = rehabSchema.parse(raw);
			const market = marketSchema.parse(raw.market) as Market;

			const buyHoldResult = buyAndHold(property, financing, market);

			const includeBrrrrFlip = rehab.arv > 0;
			const brrrrResult = includeBrrrrFlip
				? brrrr(
						property,
						rehab.rehabCost,
						rehab.arv,
						rehab.holdingMonths,
						rehab.holdingCostPerMonth,
						financing.closingCostsPct
					)
				: null;
			const flipResult = includeBrrrrFlip
				? flip(
						property,
						rehab.rehabCost,
						rehab.arv,
						rehab.holdingMonths,
						rehab.holdingCostPerMonth,
						financing.closingCostsPct
					)
				: null;

			return {
				ok: true as const,
				market,
				property,
				financing,
				buyHold: buyHoldResult,
				brrrr: brrrrResult,
				flip: flipResult,
				input: raw
			};
		} catch (err) {
			if (err instanceof ZodError) {
				const errors: Record<string, string> = {};
				for (const issue of err.issues) errors[issue.path[0] as string] = issue.message;
				return { ok: false as const, errors, input: raw };
			}
			throw err;
		}
	}
} satisfies Actions;
