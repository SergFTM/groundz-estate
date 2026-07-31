// /investor/wallet — wallet addresses, payment intents and payouts of the investor
import { fail } from '@sveltejs/kit';
import db from '$lib/server/db';
import type { PageServerLoad, Actions } from './$types';

const EVM_ADDRESS_RE = /^0x[a-fA-F0-9]{40}$/;

export const load: PageServerLoad = async ({ parent }) => {
  const { user } = await parent();

  const [wallets, paymentIntents, payouts] = await Promise.all([
    db.walletAddress.findMany({ where: { userId: user.id }, orderBy: { createdAt: 'desc' } }),
    db.paymentIntent.findMany({
      where: { userId: user.id },
      include: { pool: { select: { name: true, slug: true, tokenSymbol: true } } },
      orderBy: { createdAt: 'desc' },
    }),
    db.distributionPayout.findMany({
      where: { userId: user.id },
      include: { distribution: { include: { pool: { select: { name: true } } } } },
      orderBy: { createdAt: 'desc' },
    }),
  ]);

  return { wallets, paymentIntents, payouts };
};

export const actions: Actions = {
  addWallet: async ({ request, locals }) => {
    const user = locals.user;
    if (!user) return fail(401, { error: 'Not authenticated' });

    const form = await request.formData();
    const address = String(form.get('address') ?? '').trim();
    const label = String(form.get('label') ?? '').trim();

    if (!EVM_ADDRESS_RE.test(address)) {
      return fail(400, { error: 'Enter a valid EVM address (0x + 40 hex characters)' });
    }

    const existing = await db.walletAddress.findUnique({ where: { address } });
    if (existing) {
      return fail(400, { error: 'This address is already registered' });
    }

    // Ownership-signature verification is a phase-2 item (spec §6, step 2);
    // until then addresses are created as "pending" and verified by the team.
    await db.walletAddress.create({
      data: { userId: user.id, address, label: label || null },
    });
    return { success: true };
  },
};
