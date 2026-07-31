import { z } from 'zod';

export const propertySchema = z.object({
	address: z.string().min(1),
	price: z.number().positive(),
	beds: z.number().int().nonnegative(),
	baths: z.number().nonnegative(),
	sqft: z.number().positive(),
	yearBuilt: z.number().int().min(1700).max(2100).optional(),
	annualPropertyTax: z.number().nonnegative().default(0),
	monthlyHoa: z.number().nonnegative().default(0),
	estimatedMonthlyRent: z.number().nonnegative(),
	condition: z.enum(['excellent', 'good', 'average', 'fair', 'poor']).default('average')
});
export type Property = z.infer<typeof propertySchema>;

export const financingSchema = z.object({
	downPaymentPct: z.number().min(0).max(1),
	annualRate: z.number().min(0).max(1),
	termYears: z.number().int().positive(),
	closingCostsPct: z.number().min(0).max(0.1).default(0.025)
});
export type Financing = z.infer<typeof financingSchema>;

export interface BuyAndHoldResult {
	totalCashInvested: number;
	monthlyPI: number;
	monthlyPITI: number;
	noi: number;
	annualCashFlow: number;
	capRate: number;
	cashOnCash: number;
	dscr: number;
	grossRentMultiplier: number;
}

export interface BrrrrResult {
	allInCost: number;
	arv: number;
	equityCreated: number;
	refinanceAmount: number;
	cashLeftInDeal: number;
	infiniteReturn: boolean;
	meets70Rule: boolean;
}

export interface FlipResult {
	totalProjectCost: number;
	netProfit: number;
	profitMarginPct: number;
	roiOnCashInvested: number;
	annualizedRoi: number;
	meets70Rule: boolean;
}
