<script lang="ts">
  import { formatDate } from '$lib/utils/formatters';

  let { data } = $props();
  const { pools } = data;

  // Per-pool AI alert state
  let aiState = $state<Record<string, { loading: boolean; text: string | null }>>({});

  async function loadAlert(poolId: string, poolName: string, overallPct: number, budgetVariancePct: number, delayed: number, latestNotes: string | null) {
    if (aiState[poolId]?.text || aiState[poolId]?.loading) return;
    aiState = { ...aiState, [poolId]: { loading: true, text: null } };

    // Upcoming milestones in next 30 days
    const poolData = pools.find(p => p.pool.id === poolId);
    const now = Date.now();
    const upcoming = poolData?.milestones.filter(m =>
      m.status !== 'completed' &&
      new Date(m.plannedDate).getTime() > now &&
      new Date(m.plannedDate).getTime() - now < 30 * 24 * 60 * 60 * 1000
    ).length ?? 0;

    try {
      const res = await fetch('/api/invest/construction-alert', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          poolId,
          constructionData: {
            poolName,
            overallPct,
            budgetVariancePct,
            delayedMilestones: delayed,
            upcomingMilestones: upcoming,
            latestNotes,
          }
        })
      });
      const json = await res.json();
      aiState = { ...aiState, [poolId]: { loading: false, text: json.insight ?? json.error ?? 'Analysis unavailable.' } };
    } catch {
      aiState = { ...aiState, [poolId]: { loading: false, text: 'Analysis unavailable.' } };
    }
  }

  function milestoneIcon(status: string): string {
    if (status === 'completed') return '✅';
    if (status === 'in_progress') return '🔄';
    if (status === 'delayed') return '⚠️';
    return '⏳';
  }

  function isOverdue(plannedDate: string | Date, status: string): boolean {
    return status !== 'completed' && new Date(plannedDate).getTime() < Date.now();
  }

  function daysOverdue(plannedDate: string | Date): number {
    return Math.floor((Date.now() - new Date(plannedDate).getTime()) / (1000 * 60 * 60 * 24));
  }
</script>

<svelte:head>
  <title>Construction Monitoring — Groundz</title>
</svelte:head>

<div style="max-width:900px;">
  <div style="margin-bottom:var(--space-6);">
    <span style="font-size:10px;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;color:var(--color-text-muted);">INVESTOR</span>
    <h1 style="font-size:var(--text-2xl);font-weight:700;color:var(--color-text);margin-top:var(--space-1);">Construction Monitoring</h1>
  </div>

  {#if pools.length === 0}
    <div style="background:rgba(255,255,255,0.55);backdrop-filter:blur(12px);-webkit-backdrop-filter:blur(12px);border:1px solid rgba(0,0,0,0.06);border-radius:var(--radius-lg);padding:var(--space-12);text-align:center;">
      <p style="color:var(--color-text-muted);font-size:var(--text-sm);margin-bottom:var(--space-4);">No investments to monitor yet.</p>
      <a href="/pools" style="color:var(--color-accent);font-weight:600;text-decoration:none;">Browse Investment Pools →</a>
    </div>

  {:else}
    {#each pools as { pool, milestones, completedCount, overallPct, delayed, report, budgetVariancePct, investment }}
      {@const ai = aiState[pool.id]}
      <div style="background:rgba(255,255,255,0.55);backdrop-filter:blur(12px);-webkit-backdrop-filter:blur(12px);border:1px solid rgba(0,0,0,0.06);border-radius:var(--radius-lg);overflow:hidden;margin-bottom:var(--space-6);">

        <!-- Pool header -->
        <div style="padding:var(--space-5) var(--space-6);border-bottom:1px solid rgba(0,0,0,0.06);display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:var(--space-3);">
          <div>
            <a href="/pools/{pool.slug}" style="font-size:var(--text-base);font-weight:700;color:var(--color-text);text-decoration:none;">{pool.name}</a>
            {#if delayed.length > 0}
              <span style="margin-left:var(--space-2);font-size:10px;font-weight:700;text-transform:uppercase;padding:2px 8px;border-radius:99px;background:rgba(239,68,68,0.1);color:#ef4444;">
                {delayed.length} delayed
              </span>
            {/if}
          </div>
          <div style="display:flex;gap:var(--space-4);align-items:center;">
            <span style="font-size:var(--text-xs);color:var(--color-text-muted);">{completedCount}/{milestones.length} milestones</span>
            {#if report}
              <span style="font-size:var(--text-xs);color:var(--color-text-muted);">Report: {formatDate(report.reportDate)}</span>
            {/if}
          </div>
        </div>

        <div style="padding:var(--space-6);display:flex;flex-direction:column;gap:var(--space-6);">

          <!-- Overall progress bar -->
          <div>
            <div style="display:flex;justify-content:space-between;margin-bottom:var(--space-2);">
              <span style="font-size:var(--text-xs);font-weight:700;letter-spacing:0.06em;text-transform:uppercase;color:var(--color-text-muted);">Overall Completion</span>
              <span style="font-size:var(--text-sm);font-weight:700;color:var(--color-text);">{overallPct}%</span>
            </div>
            <div style="height:10px;background:rgba(0,0,0,0.07);border-radius:5px;overflow:hidden;">
              <div style="height:100%;width:{overallPct}%;background:var(--color-accent);border-radius:5px;transition:width 0.5s ease;"></div>
            </div>
          </div>

          <!-- Budget strip (only if report exists) -->
          {#if report}
            <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:var(--space-4);">
              <div style="background:rgba(0,0,0,0.03);border-radius:var(--radius-md);padding:var(--space-3) var(--space-4);">
                <p style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;color:var(--color-text-muted);margin-bottom:var(--space-1);">Budget</p>
                <p style="font-size:var(--text-sm);font-weight:700;color:var(--color-text);">€{report.budgetTotal.toLocaleString()}</p>
              </div>
              <div style="background:rgba(0,0,0,0.03);border-radius:var(--radius-md);padding:var(--space-3) var(--space-4);">
                <p style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;color:var(--color-text-muted);margin-bottom:var(--space-1);">Spent</p>
                <p style="font-size:var(--text-sm);font-weight:700;color:var(--color-text);">€{report.budgetSpent.toLocaleString()}</p>
              </div>
              <div style="background:rgba(0,0,0,0.03);border-radius:var(--radius-md);padding:var(--space-3) var(--space-4);">
                <p style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;color:var(--color-text-muted);margin-bottom:var(--space-1);">Variance</p>
                <p style="font-size:var(--text-sm);font-weight:700;color:{budgetVariancePct > 5 ? '#ef4444' : budgetVariancePct > 0 ? '#ca8a04' : '#22c55e'};">
                  {budgetVariancePct > 0 ? '+' : ''}{budgetVariancePct.toFixed(1)}%
                </p>
              </div>
            </div>
          {/if}

          <!-- Milestones list -->
          {#if milestones.length > 0}
            <div>
              <p style="font-size:10px;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;color:var(--color-text-muted);margin-bottom:var(--space-3);">Milestones</p>
              <div style="display:flex;flex-direction:column;gap:var(--space-2);">
                {#each milestones as ms}
                  {@const overdue = isOverdue(ms.plannedDate, ms.status)}
                  <div style="display:flex;align-items:flex-start;gap:var(--space-3);padding:var(--space-3);background:{ms.status === 'completed' ? 'rgba(34,197,94,0.05)' : overdue ? 'rgba(239,68,68,0.05)' : 'rgba(0,0,0,0.02)'};border-radius:var(--radius-md);border:1px solid {ms.status === 'completed' ? 'rgba(34,197,94,0.12)' : overdue ? 'rgba(239,68,68,0.15)' : 'rgba(0,0,0,0.05)'};">
                    <span style="font-size:14px;line-height:1.4;flex-shrink:0;">{milestoneIcon(ms.status)}</span>
                    <div style="flex:1;min-width:0;">
                      <div style="display:flex;align-items:center;gap:var(--space-2);flex-wrap:wrap;">
                        <span style="font-size:var(--text-sm);font-weight:600;color:var(--color-text);">{ms.name}</span>
                        {#if overdue}
                          <span style="font-size:10px;font-weight:700;color:#ef4444;background:rgba(239,68,68,0.1);padding:1px 6px;border-radius:99px;">{daysOverdue(ms.plannedDate)}d overdue</span>
                        {/if}
                        {#if ms.completionPct > 0 && ms.completionPct < 100}
                          <span style="font-size:10px;color:var(--color-text-muted);">{ms.completionPct}%</span>
                        {/if}
                      </div>
                      {#if ms.description}
                        <p style="font-size:var(--text-xs);color:var(--color-text-muted);margin-top:2px;">{ms.description}</p>
                      {/if}
                      <p style="font-size:var(--text-xs);color:var(--color-text-muted);margin-top:2px;">
                        Planned: {formatDate(ms.plannedDate)}
                        {#if ms.actualDate} · Completed: {formatDate(ms.actualDate)}{/if}
                      </p>
                    </div>
                  </div>
                {/each}
              </div>
            </div>
          {:else}
            <p style="font-size:var(--text-sm);color:var(--color-text-muted);">No milestones defined for this pool yet.</p>
          {/if}

          <!-- AI Construction Alert -->
          <div style="background:linear-gradient(135deg,rgba(212,169,68,0.08) 0%,rgba(212,169,68,0.03) 100%);border:1px solid rgba(212,169,68,0.2);border-radius:var(--radius-md);padding:var(--space-4) var(--space-5);">
            <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:var(--space-2);">
              <p style="font-size:10px;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;color:#d4a944;">AI Construction Alert</p>
              {#if !ai?.text}
                <button
                  onclick={() => loadAlert(pool.id, pool.name, overallPct, budgetVariancePct, delayed.length, report?.notes ?? null)}
                  disabled={ai?.loading}
                  style="font-size:var(--text-xs);font-weight:700;color:#d4a944;background:rgba(212,169,68,0.12);border:1px solid rgba(212,169,68,0.25);border-radius:var(--radius-md);padding:var(--space-1) var(--space-3);cursor:pointer;"
                >
                  {ai?.loading ? 'Analyzing…' : 'Get Alert ✦'}
                </button>
              {/if}
            </div>
            {#if ai?.text}
              <p style="font-size:var(--text-sm);color:var(--color-text);line-height:1.7;">{ai.text}</p>
            {:else if ai?.loading}
              <div style="display:flex;gap:var(--space-2);align-items:center;">
                <div style="width:6px;height:6px;border-radius:50%;background:#d4a944;animation:pulse 1s infinite;"></div>
                <p style="font-size:var(--text-sm);color:var(--color-text-muted);">Analyzing construction data…</p>
              </div>
            {:else}
              <p style="font-size:var(--text-sm);color:var(--color-text-muted);">Get an AI assessment of progress, delays, and budget status for this pool.</p>
            {/if}
          </div>

        </div>
      </div>
    {/each}
  {/if}
</div>

<style>
  @keyframes pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.3; }
  }
</style>
