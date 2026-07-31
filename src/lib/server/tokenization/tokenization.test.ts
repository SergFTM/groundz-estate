import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
	PAYMENT_INTENT_TRANSITIONS,
	WALLET_TRANSITIONS,
	DISTRIBUTION_TRANSITIONS,
	canTransition,
	assertTransition,
	InvalidTransitionError,
} from './status';
import { computePayouts } from './payouts';

describe('state machines', () => {
	it('allows the happy path of a payment intent', () => {
		const path = ['created', 'awaiting_funds', 'confirmed', 'minted'];
		for (let i = 0; i < path.length - 1; i++) {
			assert.ok(canTransition(PAYMENT_INTENT_TRANSITIONS, path[i], path[i + 1]), `${path[i]} → ${path[i + 1]}`);
		}
	});

	it('rejects skipping funds confirmation (fail closed)', () => {
		assert.equal(canTransition(PAYMENT_INTENT_TRANSITIONS, 'created', 'minted'), false);
		assert.equal(canTransition(PAYMENT_INTENT_TRANSITIONS, 'awaiting_funds', 'minted'), false);
	});

	it('terminal states have no exits', () => {
		for (const s of ['minted', 'refunded', 'cancelled']) {
			assert.equal(PAYMENT_INTENT_TRANSITIONS[s].length, 0, s);
		}
		assert.equal(DISTRIBUTION_TRANSITIONS['completed'].length, 0);
		assert.equal(WALLET_TRANSITIONS['revoked'].length, 0);
	});

	it('unknown states are rejected, not allowed', () => {
		assert.equal(canTransition(PAYMENT_INTENT_TRANSITIONS, 'weird', 'minted'), false);
		assert.throws(() => assertTransition(PAYMENT_INTENT_TRANSITIONS, 'weird', 'minted'), InvalidTransitionError);
	});

	it('revoked wallet cannot come back', () => {
		assert.equal(canTransition(WALLET_TRANSITIONS, 'revoked', 'active'), false);
	});
});

describe('computePayouts', () => {
	it('splits proportionally to snapshot balance', () => {
		const { eligibleSupply, lines } = computePayouts(1000, [
			{ userId: 'a', tokens: 750 },
			{ userId: 'b', tokens: 250 },
		]);
		assert.equal(eligibleSupply, 1000);
		assert.equal(lines.find(l => l.userId === 'a')?.grossAmount, 750);
		assert.equal(lines.find(l => l.userId === 'b')?.grossAmount, 250);
	});

	it('never pays out more than the funded total (floor rounding)', () => {
		const { lines } = computePayouts(100, [
			{ userId: 'a', tokens: 1 },
			{ userId: 'b', tokens: 1 },
			{ userId: 'c', tokens: 1 },
		]);
		const sum = lines.reduce((s, l) => s + l.grossAmount, 0);
		assert.ok(sum <= 100, `sum ${sum}`);
		assert.equal(lines[0].grossAmount, 33.33);
	});

	it('excludes zero-token holders and handles empty input', () => {
		const { lines } = computePayouts(100, [
			{ userId: 'a', tokens: 0 },
			{ userId: 'b', tokens: 10 },
		]);
		assert.equal(lines.length, 1);
		assert.equal(computePayouts(100, []).lines.length, 0);
		assert.equal(computePayouts(0, [{ userId: 'a', tokens: 5 }]).lines.length, 0);
	});

	it('carries the wallet address into the payout line', () => {
		const { lines } = computePayouts(50, [{ userId: 'a', tokens: 5, walletAddress: '0xabc' }]);
		assert.equal(lines[0].walletAddress, '0xabc');
	});
});
