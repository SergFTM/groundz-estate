// /admin/investment-pools/[id]/tokenization — RWA issuance operations for a pool
// (docs/spec/12-tokenization-rwa.md). Platform-side ledger only: on-chain mint
// and settlement belong to third-party providers.
import { error, fail } from '@sveltejs/kit';
import type { RequestEvent } from '@sveltejs/kit';
import db from '$lib/server/db';
import {
  createPaymentIntent,
  transitionPaymentIntent,
  mintPaymentIntent,
  snapshotDistribution,
  transitionDistribution,
  markPayoutPaid,
} from '$lib/server/tokenization/service';
import type { PageServerLoad, Actions } from './$types';

// Only transitions an operator may trigger manually from this screen
const MANUAL_INTENT_TRANSITIONS = ['confirmed', 'underpaid', 'overpaid', 'expired', 'refunded', 'cancelled'];

// Layout guards do not run for POST actions — every action re-checks the role.
function requireAdmin(locals: RequestEvent['locals']) {
  if (!locals.user || locals.user.role !== 'internal_team') throw error(403, 'Forbidden');
}

export const load: PageServerLoad = async ({ params }) => {
  const pool = await db.pool.findUnique({
    where: { id: params.id },
    include: {
      paymentIntents: {
        include: { user: { select: { id: true, name: true, email: true } }, walletAddress: true },
        orderBy: { createdAt: 'desc' },
      },
      distributions: {
        include: {
          payouts: {
            include: { user: { select: { id: true, name: true, email: true } } },
            orderBy: { grossAmount: 'desc' },
          },
        },
        orderBy: { createdAt: 'desc' },
      },
    },
  });
  if (!pool) throw error(404, 'Investment pool not found');

  const investors = await db.user.findMany({
    where: { role: 'investor' },
    select: { id: true, name: true, email: true },
    orderBy: { name: 'asc' },
  });

  const pendingWallets = await db.walletAddress.findMany({
    where: { status: 'pending' },
    include: { user: { select: { name: true, email: true } } },
    orderBy: { createdAt: 'desc' },
  });

  return { pool, investors, pendingWallets };
};

export const actions: Actions = {
  createIntent: async ({ request, params, locals }) => {
    requireAdmin(locals);
    const form = await request.formData();
    const userId = String(form.get('userId') ?? '');
    const tokens = Number(form.get('tokens'));
    if (!userId || !Number.isInteger(tokens) || tokens <= 0) {
      return fail(400, { action: 'createIntent', error: 'Investor and a positive integer token amount are required' });
    }
    try {
      await createPaymentIntent({ userId, poolId: params.id, tokens });
      return { action: 'createIntent', success: true };
    } catch (e) {
      return fail(400, { action: 'createIntent', error: (e as Error).message });
    }
  },

  intentTransition: async ({ request, locals }) => {
    requireAdmin(locals);
    const form = await request.formData();
    const intentId = String(form.get('intentId') ?? '');
    const to = String(form.get('to') ?? '');
    if (!MANUAL_INTENT_TRANSITIONS.includes(to)) {
      return fail(400, { action: 'intentTransition', error: `Manual transition to "${to}" is not allowed` });
    }
    try {
      await transitionPaymentIntent(intentId, to);
      return { action: 'intentTransition', success: true };
    } catch (e) {
      return fail(400, { action: 'intentTransition', error: (e as Error).message });
    }
  },

  mintIntent: async ({ request, locals }) => {
    requireAdmin(locals);
    const form = await request.formData();
    const intentId = String(form.get('intentId') ?? '');
    try {
      await mintPaymentIntent(intentId);
      return { action: 'mintIntent', success: true };
    } catch (e) {
      return fail(400, { action: 'mintIntent', error: (e as Error).message });
    }
  },

  createDistribution: async ({ request, params, locals }) => {
    requireAdmin(locals);
    const form = await request.formData();
    const periodLabel = String(form.get('periodLabel') ?? '').trim();
    const kind = String(form.get('kind') ?? 'rental');
    const totalAmount = Number(form.get('totalAmount'));
    const formula = String(form.get('formula') ?? '').trim();
    if (!periodLabel || !Number.isFinite(totalAmount) || totalAmount <= 0 || !['rental', 'exit'].includes(kind)) {
      return fail(400, { action: 'createDistribution', error: 'Label, kind and a positive total amount are required' });
    }
    await db.distribution.create({
      data: { poolId: params.id, periodLabel, kind, totalAmount, formula: formula || null },
    });
    return { action: 'createDistribution', success: true };
  },

  snapshotDistribution: async ({ request, locals }) => {
    requireAdmin(locals);
    const form = await request.formData();
    try {
      await snapshotDistribution(String(form.get('distributionId') ?? ''));
      return { action: 'snapshotDistribution', success: true };
    } catch (e) {
      return fail(400, { action: 'snapshotDistribution', error: (e as Error).message });
    }
  },

  startPaying: async ({ request, locals }) => {
    requireAdmin(locals);
    const form = await request.formData();
    try {
      await transitionDistribution(String(form.get('distributionId') ?? ''), 'paying');
      return { action: 'startPaying', success: true };
    } catch (e) {
      return fail(400, { action: 'startPaying', error: (e as Error).message });
    }
  },

  markPaid: async ({ request, locals }) => {
    requireAdmin(locals);
    const form = await request.formData();
    try {
      await markPayoutPaid(String(form.get('payoutId') ?? ''), String(form.get('reference') ?? '') || undefined);
      return { action: 'markPaid', success: true };
    } catch (e) {
      return fail(400, { action: 'markPaid', error: (e as Error).message });
    }
  },

  walletTransition: async ({ request, locals }) => {
    requireAdmin(locals);
    const form = await request.formData();
    const walletId = String(form.get('walletId') ?? '');
    const to = String(form.get('to') ?? '');
    if (!['verified', 'revoked'].includes(to)) {
      return fail(400, { action: 'walletTransition', error: 'Only verify or revoke are allowed here' });
    }
    const wallet = await db.walletAddress.findUnique({ where: { id: walletId } });
    if (!wallet || wallet.status !== 'pending') {
      return fail(400, { action: 'walletTransition', error: 'Wallet not found or not pending' });
    }
    await db.walletAddress.update({
      where: { id: walletId },
      data: { status: to, ...(to === 'verified' ? { verifiedAt: new Date() } : {}) },
    });
    return { action: 'walletTransition', success: true };
  },
};
