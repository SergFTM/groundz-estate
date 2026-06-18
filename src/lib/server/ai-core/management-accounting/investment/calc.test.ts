import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
	brrrr,
	buyAndHold,
	flip,
	meets70Rule,
	monthlyMortgagePayment,
	noi
} from './calc';
import { getAssumptions } from './assumptions';
import type { Financing, Property } from './types';

const close = (a: number, b: number, tol = 1) =>
	Math.abs(a - b) <= tol || `expected ${a} ≈ ${b} (tol ${tol})`;

const sampleProperty: Property = {
	address: 'Test 1, Limassol, CY',
	price: 400_000,
	beds: 3,
	baths: 2,
	sqft: 1500,
	yearBuilt: 2015,
	annualPropertyTax: 1200,
	monthlyHoa: 0,
	estimatedMonthlyRent: 2200,
	condition: 'good'
};

const sampleFinancing: Financing = {
	downPaymentPct: 0.3,
	annualRate: 0.045,
	termYears: 25,
	closingCostsPct: 0.025
};

describe('monthlyMortgagePayment', () => {
	it('returns 0 for zero loan', () => {
		assert.equal(monthlyMortgagePayment(0, 0.05, 30), 0);
	});

	it('handles zero rate as linear amortization', () => {
		assert.equal(monthlyMortgagePayment(120_000, 0, 10), 1000);
	});

	it('matches the standard amortization formula', () => {
		// $200k @ 6% / 30y → $1199.10
		const m = monthlyMortgagePayment(200_000, 0.06, 30);
		assert.ok(close(m, 1199.1, 1), `got ${m}`);
	});
});

describe('noi', () => {
	it('subtracts all operating expenses from gross rent', () => {
		const result = noi(sampleProperty, 'CY');
		const grossRent = sampleProperty.estimatedMonthlyRent * 12; // 26400
		assert.ok(result > 0, 'NOI should be positive for this property');
		assert.ok(result < grossRent, 'NOI must be less than gross rent');
	});

	it('produces lower NOI on a market with higher management fees', () => {
		const cy = noi(sampleProperty, 'CY'); // pm 8%
		const ru = noi(sampleProperty, 'RU'); // pm 4%
		assert.ok(ru > cy, 'lower management % → higher NOI');
	});
});

describe('buyAndHold', () => {
	it('reports positive cash flow for a yield-friendly Limassol unit', () => {
		const r = buyAndHold(sampleProperty, sampleFinancing, 'CY');
		assert.ok(r.totalCashInvested > 0);
		assert.ok(r.monthlyPI > 0);
		assert.ok(r.capRate > 0 && r.capRate < 0.15, `capRate sane: ${r.capRate}`);
		assert.ok(r.dscr > 0, 'DSCR positive');
	});

	it('positive leverage: lower down payment lifts cash-on-cash when cap rate > rate', () => {
		// Use a yield-friendly property (cap rate ~8%) so leverage is decisively positive
		// against the 4.5% mortgage rate.
		const yieldy: Property = { ...sampleProperty, estimatedMonthlyRent: 3500 };
		const small = buyAndHold(yieldy, { ...sampleFinancing, downPaymentPct: 0.2 }, 'CY');
		const big = buyAndHold(yieldy, { ...sampleFinancing, downPaymentPct: 0.5 }, 'CY');
		assert.ok(
			small.cashOnCash > big.cashOnCash,
			`expected positive leverage: small ${small.cashOnCash} > big ${big.cashOnCash}`
		);
	});

	it('respects explicit assumptions override', () => {
		const custom = getAssumptions('US');
		const r = buyAndHold(sampleProperty, sampleFinancing, custom);
		assert.ok(Number.isFinite(r.noi));
	});
});

describe('meets70Rule', () => {
	it('passes when purchase + rehab ≤ 70% of ARV', () => {
		assert.equal(meets70Rule(500_000, 300_000, 50_000), true); // 350 ≤ 350
		assert.equal(meets70Rule(500_000, 300_000, 49_999), true);
	});
	it('fails when purchase + rehab > 70% of ARV', () => {
		assert.equal(meets70Rule(500_000, 300_000, 60_000), false); // 360 > 350
	});
});

describe('brrrr', () => {
	it('flags infinite return when refi covers all cash in', () => {
		// purchase 200k + closing 5k + rehab 50k + holding 6k = 261k all-in
		// ARV 400k * 0.75 = 300k refi → cash left = -39k → infinite
		const r = brrrr(
			{ ...sampleProperty, price: 200_000 },
			50_000,
			400_000,
			6,
			1000,
			0.025
		);
		assert.equal(r.infiniteReturn, true);
		assert.ok(r.cashLeftInDeal < 0);
	});

	it('detects deals that violate the 70% rule', () => {
		// purchase 350k + rehab 50k = 400k > 0.7 * 500k = 350k → fails
		const r = brrrr({ ...sampleProperty, price: 350_000 }, 50_000, 500_000, 4, 1000);
		assert.equal(r.meets70Rule, false);
	});
});

describe('flip', () => {
	it('produces positive profit on a textbook deal', () => {
		// purchase 200k + closing 5k + rehab 50k + holding 6k + selling ~30k = ~291k
		// ARV 350k → ~59k profit
		const r = flip({ ...sampleProperty, price: 200_000 }, 50_000, 350_000, 6, 1000);
		assert.ok(r.netProfit > 0);
		assert.ok(r.profitMarginPct > 0.1, `margin ${r.profitMarginPct}`);
		assert.ok(r.annualizedRoi > r.roiOnCashInvested, 'annualizing should scale up sub-year ROI');
	});

	it('returns negative profit when ARV barely covers costs', () => {
		const r = flip({ ...sampleProperty, price: 300_000 }, 50_000, 320_000, 6, 1500);
		assert.ok(r.netProfit < 0);
	});
});
