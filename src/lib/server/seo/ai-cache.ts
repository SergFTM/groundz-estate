// src/lib/server/seo/ai-cache.ts
// Simple in-process cache for AI responses (SQLite-backed persistence is P2).
// Key: sha256(pageId + contentHash + clusterId), TTL configurable per type.

import { createHash } from 'crypto';

interface CacheEntry<T> {
  value: T;
  expiresAt: number;
}

const META_TTL_MS = 24 * 60 * 60 * 1000;      // 24 h
const SEMANTIC_TTL_MS = 12 * 60 * 60 * 1000;  // 12 h

const store = new Map<string, CacheEntry<unknown>>();

export function buildCacheKey(params: {
  pageId?: string;
  contentHash: string;
  clusterId?: string;
  type: 'meta' | 'semantic';
}): string {
  const raw = `${params.pageId ?? ''}:${params.contentHash}:${params.clusterId ?? ''}:${params.type}`;
  return createHash('sha256').update(raw).digest('hex');
}

export function getCache<T>(key: string): T | null {
  const entry = store.get(key) as CacheEntry<T> | undefined;
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    store.delete(key);
    return null;
  }
  return entry.value;
}

export function setCache<T>(key: string, value: T, type: 'meta' | 'semantic'): void {
  const ttl = type === 'meta' ? META_TTL_MS : SEMANTIC_TTL_MS;
  store.set(key, { value, expiresAt: Date.now() + ttl });
}

export function invalidateByPageId(pageId: string): void {
  for (const key of store.keys()) {
    if (key.includes(pageId)) store.delete(key);
  }
}

export function contentHash(text: string): string {
  return createHash('md5').update(text).digest('hex').slice(0, 12);
}
