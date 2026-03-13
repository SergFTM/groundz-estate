// src/lib/modules/seo/stores/seoStore.ts
// Svelte stores for the SEO panel

import { writable, derived } from 'svelte/store';
import type { SeoAuditResult, SeoIssue, SeoContentRevision } from '../types/seoTypes.js';

export const auditResultStore = writable<SeoAuditResult | null>(null);
export const isLoadingStore = writable<boolean>(false);
export const aiAvailableStore = writable<boolean>(true);
export const pendingRevisionsStore = writable<SeoContentRevision[]>([]);

export const criticalIssuesStore = derived(
  auditResultStore,
  ($audit): SeoIssue[] =>
    $audit?.issues.filter(i => i.severity === 'critical' || i.severity === 'high') ?? []
);

export const scoreStore = derived(
  auditResultStore,
  ($audit): number | null => $audit?.score ?? null
);
