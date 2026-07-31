// In-memory token-bucket rate limiter — per (key, bucket).
// For multi-instance deployments, swap the Map for Redis (ioredis) or upstash.
// Buckets are tuned for AI endpoints which are expensive on local GPU.

import { error, type RequestEvent } from '@sveltejs/kit';

interface BucketState {
  tokens: number;
  updatedAt: number;
}

interface BucketSpec {
  capacity: number;
  refillPerSec: number;
}

const BUCKETS: Record<string, BucketSpec> = {
  // public endpoints (form submissions, comments)
  public:    { capacity: 10,  refillPerSec: 10 / 60 },     // 10 / minute
  // authenticated chat (cheap)
  chat:      { capacity: 30,  refillPerSec: 30 / 60 },     // 30 / minute
  // text generation (medium cost)
  text_ai:   { capacity: 20,  refillPerSec: 20 / 300 },    // 20 / 5 minutes
  // image generation (expensive — 5-30s GPU each)
  image_ai:  { capacity: 6,   refillPerSec: 6 / 600 },     // 6 / 10 minutes
  // admin background jobs
  admin_job: { capacity: 100, refillPerSec: 100 / 60 },
};

const store = new Map<string, BucketState>();

function take(key: string, bucket: keyof typeof BUCKETS): { ok: boolean; retryAfterSec: number } {
  const spec = BUCKETS[bucket];
  const now = Date.now();
  const state = store.get(key);

  if (!state) {
    store.set(key, { tokens: spec.capacity - 1, updatedAt: now });
    return { ok: true, retryAfterSec: 0 };
  }

  const elapsedSec = (now - state.updatedAt) / 1000;
  const refilled = Math.min(spec.capacity, state.tokens + elapsedSec * spec.refillPerSec);

  if (refilled < 1) {
    const retry = Math.ceil((1 - refilled) / spec.refillPerSec);
    state.tokens = refilled;
    state.updatedAt = now;
    return { ok: false, retryAfterSec: retry };
  }

  state.tokens = refilled - 1;
  state.updatedAt = now;
  return { ok: true, retryAfterSec: 0 };
}

function clientKey(event: RequestEvent): string {
  const userId = event.locals.user?.id;
  if (userId) return `u:${userId}`;
  // Fallback to IP. Trust X-Forwarded-For only if behind a known proxy.
  const fwd = event.request.headers.get('x-forwarded-for');
  const ip = fwd?.split(',')[0]?.trim() || event.getClientAddress();
  return `ip:${ip}`;
}

/**
 * Throws 429 if the caller is over budget. Use at the top of a handler
 * after auth has been checked.
 */
export function rateLimit(event: RequestEvent, bucket: keyof typeof BUCKETS): void {
  const key = `${bucket}:${clientKey(event)}`;
  const result = take(key, bucket);
  if (!result.ok) {
    throw error(429, `Rate limit exceeded. Try again in ${result.retryAfterSec}s.`);
  }
}

/** Periodic cleanup of stale buckets — call from a cron, optional. */
export function pruneRateLimitStore(maxAgeMs = 30 * 60 * 1000): void {
  const cutoff = Date.now() - maxAgeMs;
  for (const [key, state] of store) {
    if (state.updatedAt < cutoff) store.delete(key);
  }
}
