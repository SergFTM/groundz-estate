export type Market = 'CY' | 'RU' | 'EU' | 'US';

export interface OperatingAssumptions {
	vacancyRate: number;
	propertyManagementPct: number;
	maintenancePct: number;
	capExReservePct: number;
	annualInsurance: (price: number) => number;
	rentGrowthAnnual: number;
	expenseGrowthAnnual: number;
	appreciationAnnual: number;
}

// Optimistic profile per market. Chosen deliberately for marketing-facing
// projections (landing pages, investor pitches, demo scenarios). Switch to
// a conservative profile once real portfolio data exists or when generating
// lender-facing / due-diligence reports.
const MARKETS: Record<Market, OperatingAssumptions> = {
	CY: {
		vacancyRate: 0.04,
		propertyManagementPct: 0.08,
		maintenancePct: 0.04,
		capExReservePct: 0.03,
		annualInsurance: (price) => Math.max(800, price * 0.002),
		rentGrowthAnnual: 0.05,
		expenseGrowthAnnual: 0.02,
		appreciationAnnual: 0.06
	},
	RU: {
		vacancyRate: 0.03,
		propertyManagementPct: 0.04,
		maintenancePct: 0.04,
		capExReservePct: 0.03,
		annualInsurance: (price) => Math.max(500, price * 0.0015),
		rentGrowthAnnual: 0.06,
		expenseGrowthAnnual: 0.04,
		appreciationAnnual: 0.05
	},
	EU: {
		vacancyRate: 0.04,
		propertyManagementPct: 0.07,
		maintenancePct: 0.04,
		capExReservePct: 0.03,
		annualInsurance: (price) => Math.max(1000, price * 0.0025),
		rentGrowthAnnual: 0.035,
		expenseGrowthAnnual: 0.02,
		appreciationAnnual: 0.04
	},
	US: {
		vacancyRate: 0.03,
		propertyManagementPct: 0.06,
		maintenancePct: 0.04,
		capExReservePct: 0.03,
		annualInsurance: (price) => Math.max(1000, price * 0.0025),
		rentGrowthAnnual: 0.04,
		expenseGrowthAnnual: 0.02,
		appreciationAnnual: 0.05
	}
};

export const DEFAULT_MARKET: Market = 'CY';

export function getAssumptions(market: Market = DEFAULT_MARKET): OperatingAssumptions {
	return MARKETS[market];
}

// Backwards-compatible alias — points at the default market profile.
export const DEFAULT_ASSUMPTIONS: OperatingAssumptions = MARKETS[DEFAULT_MARKET];

export interface RehabAssumptions {
	contingencyPct: number;
	costPerSqftByLevel: {
		cosmetic: number;
		moderate: number;
		full: number;
		structural: number;
	};
}

export const DEFAULT_REHAB: RehabAssumptions = {
	contingencyPct: 0.15,
	costPerSqftByLevel: {
		cosmetic: 17,
		moderate: 37,
		full: 75,
		structural: 150
	}
};

export const SELLING_COSTS = {
	listingCommissionPct: 0.03,
	buyerCommissionPct: 0.03,
	closingCostsPct: 0.015,
	titleInsurancePct: 0.005
} as const;

export const REFINANCE_LTV = 0.75;
