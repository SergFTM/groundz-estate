// src/lib/server/tokenization/status.ts
// State machines from docs/spec/12-tokenization-rwa.md §5-6.
// Fail closed: an unknown state or transition is always rejected.

export type TransitionMap = Record<string, readonly string[]>;

export const PAYMENT_INTENT_TRANSITIONS: TransitionMap = {
  created: ['awaiting_funds', 'expired', 'cancelled'],
  awaiting_funds: ['underpaid', 'overpaid', 'confirmed', 'expired', 'cancelled'],
  underpaid: ['confirmed', 'refunded', 'cancelled'],
  overpaid: ['confirmed', 'refunded'],
  confirmed: ['minted', 'refunded'],
  minted: [],
  expired: ['refunded'],
  refunded: [],
  cancelled: [],
};

export const WALLET_TRANSITIONS: TransitionMap = {
  pending: ['verified', 'revoked'],
  verified: ['active', 'expired', 'revoked'],
  active: ['expired', 'revoked'],
  expired: ['active', 'revoked'],
  revoked: [],
};

export const DISTRIBUTION_TRANSITIONS: TransitionMap = {
  draft: ['snapshotted', 'cancelled'],
  snapshotted: ['paying', 'cancelled'],
  paying: ['completed'],
  completed: [],
  cancelled: [],
};

export function canTransition(map: TransitionMap, from: string, to: string): boolean {
  return (map[from] ?? []).includes(to);
}

export class InvalidTransitionError extends Error {
  constructor(from: string, to: string) {
    super(`Invalid transition: ${from} → ${to}`);
    this.name = 'InvalidTransitionError';
  }
}

export function assertTransition(map: TransitionMap, from: string, to: string): void {
  if (!canTransition(map, from, to)) throw new InvalidTransitionError(from, to);
}
