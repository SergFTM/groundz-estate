// src/lib/server/tokenization/payouts.ts
// Pure payout math (guide §7): payout = total × balance / eligible supply.
// Amounts are rounded DOWN to cents so the sum never exceeds the funded total;
// the sub-cent remainder stays with the issuer.

export interface HolderSnapshot {
  userId: string;
  tokens: number;
  walletAddress?: string | null;
}

export interface PayoutLine {
  userId: string;
  walletAddress: string | null;
  snapshotTokens: number;
  grossAmount: number;
  netAmount: number;
}

export function computePayouts(totalAmount: number, holders: HolderSnapshot[]): {
  eligibleSupply: number;
  lines: PayoutLine[];
} {
  const eligible = holders.filter(h => h.tokens > 0);
  const eligibleSupply = eligible.reduce((s, h) => s + h.tokens, 0);
  if (totalAmount <= 0 || eligibleSupply <= 0) return { eligibleSupply, lines: [] };

  const lines = eligible.map(h => {
    const gross = Math.floor((totalAmount * h.tokens / eligibleSupply) * 100) / 100;
    return {
      userId: h.userId,
      walletAddress: h.walletAddress ?? null,
      snapshotTokens: h.tokens,
      grossAmount: gross,
      netAmount: gross, // fees/withholding: extension point, net == gross for MVP
    };
  });

  return { eligibleSupply, lines };
}
