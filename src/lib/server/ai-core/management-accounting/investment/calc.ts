import {
	DEFAULT_ASSUMPTIONS,
	REFINANCE_LTV,
	SELLING_COSTS,
	getAssumptions,
	type Market,
	type OperatingAssumptions
} from './assumptions';

function resolve(assumptions: OperatingAssumptions | Market | undefined): OperatingAssumptions {
	if (!assumptions) return DEFAULT_ASSUMPTIONS;
	if (typeof assumptions === 'string') return getAssumptions(assumptions);
	return assumptions;
}
import type { BrrrrResult, BuyAndHoldResult, FlipResult, Financing, Property } from './types';

export function monthlyMortgagePayment(loanAmount: number, annualRate: number, termYears: number): number {
	if (loanAmount <= 0) return 0;
	const n = termYears * 12;
	if (annualRate === 0) return loanAmount / n;
	const r = annualRate / 12;
	return (loanAmount * r) / (1 - Math.pow(1 + r, -n));
}

export function noi(
	property: Property,
	assumptions?: OperatingAssumptions | Market
): number {
	const a = resolve(assumptions);
	const grossRent = property.estimatedMonthlyRent * 12;
	const operating =
		grossRent * a.vacancyRate +
		grossRent * a.propertyManagementPct +
		grossRent * a.maintenancePct +
		grossRent * a.capExReservePct +
		property.annualPropertyTax +
		property.monthlyHoa * 12 +
		a.annualInsurance(property.price);
	return grossRent - operating;
}

export function buyAndHold(
	property: Property,
	financing: Financing,
	assumptions?: OperatingAssumptions | Market
): BuyAndHoldResult {
	const a = resolve(assumptions);
	const downPayment = property.price * financing.downPaymentPct;
	const closingCosts = property.price * financing.closingCostsPct;
	const loanAmount = property.price - downPayment;
	const monthlyPI = monthlyMortgagePayment(loanAmount, financing.annualRate, financing.termYears);
	const monthlyTaxesInsuranceHoa =
		property.annualPropertyTax / 12 +
		a.annualInsurance(property.price) / 12 +
		property.monthlyHoa;
	const monthlyPITI = monthlyPI + monthlyTaxesInsuranceHoa;

	const annualNoi = noi(property, a);
	const annualDebtService = monthlyPI * 12;
	const annualCashFlow = annualNoi - annualDebtService;
	const grossAnnualRent = property.estimatedMonthlyRent * 12;

	return {
		totalCashInvested: downPayment + closingCosts,
		monthlyPI,
		monthlyPITI,
		noi: annualNoi,
		annualCashFlow,
		capRate: annualNoi / property.price,
		cashOnCash: annualCashFlow / (downPayment + closingCosts),
		dscr: annualDebtService === 0 ? Infinity : annualNoi / annualDebtService,
		grossRentMultiplier: property.price / grossAnnualRent
	};
}

export function meets70Rule(arv: number, purchasePrice: number, rehabCost: number): boolean {
	return purchasePrice + rehabCost <= arv * 0.7;
}

export function brrrr(
	property: Property,
	rehabCost: number,
	arv: number,
	holdingMonths: number,
	holdingCostPerMonth: number,
	closingCostsPct = 0.025
): BrrrrResult {
	const closingCosts = property.price * closingCostsPct;
	const holdingTotal = holdingMonths * holdingCostPerMonth;
	const allInCost = property.price + closingCosts + rehabCost + holdingTotal;
	const refinanceAmount = arv * REFINANCE_LTV;
	const cashLeftInDeal = allInCost - refinanceAmount;

	return {
		allInCost,
		arv,
		equityCreated: arv - allInCost,
		refinanceAmount,
		cashLeftInDeal,
		infiniteReturn: cashLeftInDeal <= 0,
		meets70Rule: meets70Rule(arv, property.price, rehabCost)
	};
}

export function flip(
	property: Property,
	rehabCost: number,
	arv: number,
	holdingMonths: number,
	holdingCostPerMonth: number,
	closingCostsPct = 0.025
): FlipResult {
	const buyingClosing = property.price * closingCostsPct;
	const holdingTotal = holdingMonths * holdingCostPerMonth;
	const sellingCosts =
		arv *
		(SELLING_COSTS.listingCommissionPct +
			SELLING_COSTS.buyerCommissionPct +
			SELLING_COSTS.closingCostsPct +
			SELLING_COSTS.titleInsurancePct);
	const totalProjectCost = property.price + buyingClosing + rehabCost + holdingTotal + sellingCosts;
	const netProfit = arv - totalProjectCost;
	const cashInvested = property.price + buyingClosing + rehabCost + holdingTotal;
	const roiOnCashInvested = netProfit / cashInvested;

	return {
		totalProjectCost,
		netProfit,
		profitMarginPct: netProfit / arv,
		roiOnCashInvested,
		annualizedRoi: holdingMonths === 0 ? roiOnCashInvested : (roiOnCashInvested / holdingMonths) * 12,
		meets70Rule: meets70Rule(arv, property.price, rehabCost)
	};
}
