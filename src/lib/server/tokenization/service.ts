// src/lib/server/tokenization/service.ts
// DB-backed tokenization flows: eligibility (fail closed), payment intents,
// distributions. On-chain issuance/settlement is delegated to third-party
// providers (spec §1); this module owns the platform-side ledger only.

import { randomBytes } from 'crypto';
import db from '$lib/server/db.js';
import {
  PAYMENT_INTENT_TRANSITIONS,
  DISTRIBUTION_TRANSITIONS,
  assertTransition,
} from './status.js';
import { computePayouts } from './payouts.js';

const INTENT_TTL_MS = 72 * 60 * 60 * 1000; // 72h to fund a primary purchase

// ── Eligibility (fail closed) ───────────────────────────────────────────────

export interface Eligibility {
  allowed: boolean;
  reasons: string[];
}

/** Spec §5: if anything is unknown or unverified, the operation must not proceed. */
export async function checkEligibility(userId: string): Promise<Eligibility> {
  const reasons: string[] = [];

  const user = await db.user.findUnique({ where: { id: userId } });
  if (!user) return { allowed: false, reasons: ['user_not_found'] };
  if (!['investor', 'internal_team'].includes(user.role)) reasons.push('role_not_allowed');

  const kycApproved = await db.document.findFirst({
    where: { userId, category: 'kyc', status: 'approved' },
  });
  if (!kycApproved) reasons.push('kyc_not_approved');

  const wallet = await db.walletAddress.findFirst({
    where: { userId, status: { in: ['verified', 'active'] } },
  });
  if (!wallet) reasons.push('no_verified_wallet');

  return { allowed: reasons.length === 0, reasons };
}

// ── Payment intents (guide: issuer recommendation §1) ───────────────────────

export async function createPaymentIntent(params: {
  userId: string;
  poolId: string;
  tokens: number;
}) {
  const { userId, poolId, tokens } = params;
  if (!Number.isInteger(tokens) || tokens <= 0) throw new Error('tokens must be a positive integer');

  const eligibility = await checkEligibility(userId);
  if (!eligibility.allowed) throw new Error(`not_eligible: ${eligibility.reasons.join(', ')}`);

  const pool = await db.pool.findUnique({ where: { id: poolId } });
  if (!pool) throw new Error('pool_not_found');
  if (pool.status !== 'active') throw new Error('pool_not_active');
  if (!pool.pricePerToken || !pool.totalTokens) throw new Error('pool_not_tokenized');

  const available = pool.totalTokens - pool.tokensSold;
  if (tokens > available) throw new Error(`insufficient_supply: ${available} tokens available`);

  const wallet = await db.walletAddress.findFirst({
    where: { userId, status: { in: ['verified', 'active'] } },
  });

  return db.paymentIntent.create({
    data: {
      userId,
      poolId,
      walletAddressId: wallet?.id ?? null,
      tokens,
      pricePerToken: pool.pricePerToken,
      amount: Math.round(tokens * pool.pricePerToken * 100) / 100,
      paymentReference: `GRNDZ-${randomBytes(6).toString('hex').toUpperCase()}`,
      status: 'awaiting_funds',
      expiresAt: new Date(Date.now() + INTENT_TTL_MS),
    },
  });
}

export async function transitionPaymentIntent(intentId: string, to: string) {
  const intent = await db.paymentIntent.findUnique({ where: { id: intentId } });
  if (!intent) throw new Error('intent_not_found');
  assertTransition(PAYMENT_INTENT_TRANSITIONS, intent.status, to);

  return db.paymentIntent.update({
    where: { id: intentId },
    data: { status: to, ...(to === 'confirmed' ? { confirmedAt: new Date() } : {}) },
  });
}

/**
 * Guide: tokens are issued only after funds are confirmed. Mint = platform-side
 * ledger update (tokensSold, Holding, Transaction); on-chain mint is executed
 * by the third-party issuer and reconciled via webhook later.
 */
export async function mintPaymentIntent(intentId: string) {
  const intent = await db.paymentIntent.findUnique({ where: { id: intentId } });
  if (!intent) throw new Error('intent_not_found');
  assertTransition(PAYMENT_INTENT_TRANSITIONS, intent.status, 'minted');

  return db.$transaction(async (tx) => {
    const pool = await tx.pool.findUnique({ where: { id: intent.poolId } });
    if (!pool?.totalTokens) throw new Error('pool_not_tokenized');
    if (pool.tokensSold + intent.tokens > pool.totalTokens) throw new Error('insufficient_supply');

    await tx.pool.update({
      where: { id: pool.id },
      data: {
        tokensSold: { increment: intent.tokens },
        raisedAmount: { increment: intent.amount },
      },
    });

    const existing = await tx.holding.findFirst({
      where: { userId: intent.userId, poolId: intent.poolId },
    });
    const holding = existing
      ? await tx.holding.update({
          where: { id: existing.id },
          data: {
            amount: { increment: intent.amount },
            tokens: { increment: intent.tokens },
            status: 'funded',
          },
        })
      : await tx.holding.create({
          data: {
            userId: intent.userId,
            poolId: intent.poolId,
            amount: intent.amount,
            tokens: intent.tokens,
            status: 'funded',
          },
        });

    await tx.transaction.create({
      data: {
        userId: intent.userId,
        poolId: intent.poolId,
        holdingId: holding.id,
        type: 'buy',
        tokens: intent.tokens,
        amount: intent.amount,
        status: 'completed',
        note: `Primary purchase ${intent.paymentReference}`,
      },
    });

    return tx.paymentIntent.update({
      where: { id: intent.id },
      data: { status: 'minted' },
    });
  });
}

// ── Distributions (guide §7: snapshot → payout lines → paid) ────────────────

export async function snapshotDistribution(distributionId: string) {
  const distribution = await db.distribution.findUnique({ where: { id: distributionId } });
  if (!distribution) throw new Error('distribution_not_found');
  assertTransition(DISTRIBUTION_TRANSITIONS, distribution.status, 'snapshotted');

  const holdings = await db.holding.findMany({
    where: { poolId: distribution.poolId, status: 'funded', tokens: { gt: 0 } },
    include: { user: { include: { walletAddresses: { where: { status: { in: ['verified', 'active'] } }, take: 1 } } } },
  });

  const { eligibleSupply, lines } = computePayouts(
    distribution.totalAmount,
    holdings.map(h => ({
      userId: h.userId,
      tokens: h.tokens ?? 0,
      walletAddress: h.user.walletAddresses[0]?.address ?? null,
    }))
  );
  if (lines.length === 0) throw new Error('no_eligible_holders');

  return db.$transaction(async (tx) => {
    await tx.distributionPayout.createMany({
      data: lines.map(l => ({
        distributionId,
        userId: l.userId,
        walletAddress: l.walletAddress,
        snapshotTokens: l.snapshotTokens,
        grossAmount: l.grossAmount,
        netAmount: l.netAmount,
        currency: distribution.currency,
      })),
    });
    return tx.distribution.update({
      where: { id: distributionId },
      data: { status: 'snapshotted', snapshotAt: new Date(), eligibleSupply },
    });
  });
}

export async function markPayoutPaid(payoutId: string, reference?: string) {
  const payout = await db.distributionPayout.findUnique({
    where: { id: payoutId },
    include: { distribution: true },
  });
  if (!payout) throw new Error('payout_not_found');
  if (payout.status === 'paid') return payout;

  return db.$transaction(async (tx) => {
    const updated = await tx.distributionPayout.update({
      where: { id: payoutId },
      data: { status: 'paid', paidAt: new Date(), reference: reference ?? null },
    });

    await tx.transaction.create({
      data: {
        userId: payout.userId,
        poolId: payout.distribution.poolId,
        type: 'distribution',
        tokens: payout.snapshotTokens,
        amount: payout.netAmount,
        status: 'completed',
        note: `${payout.distribution.periodLabel} (${payout.distribution.kind})`,
      },
    });

    const remaining = await tx.distributionPayout.count({
      where: { distributionId: payout.distributionId, status: { not: 'paid' } },
    });
    if (remaining === 0) {
      await tx.distribution.update({
        where: { id: payout.distributionId },
        data: { status: 'completed' },
      });
    }
    return updated;
  });
}

export async function transitionDistribution(distributionId: string, to: string) {
  const distribution = await db.distribution.findUnique({ where: { id: distributionId } });
  if (!distribution) throw new Error('distribution_not_found');
  assertTransition(DISTRIBUTION_TRANSITIONS, distribution.status, to);
  return db.distribution.update({ where: { id: distributionId }, data: { status: to } });
}
