<script lang="ts">
  import { goto } from '$app/navigation';
  import StatusBadge from '$lib/components/cabinet/StatusBadge.svelte';
  import { formatCurrency } from '$lib/utils/formatters';

  let { data } = $props();
</script>

<svelte:head>
  <title>Investment Pools — Admin — Develta</title>
</svelte:head>

<div>
  <div style="display:flex;align-items:flex-end;justify-content:space-between;margin-bottom:var(--space-6);">
    <div>
      <span style="font-size:10px;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;color:var(--color-text-muted);">Finance</span>
      <h1 style="font-size:var(--text-2xl);font-weight:700;color:var(--color-text);margin-top:var(--space-1);">Investment Pools</h1>
    </div>
    <a href="/admin/investment-pools/new" class="btn btn--primary">+ New Pool</a>
  </div>

  {#if data.pools.length === 0}
    <div style="background:rgba(255,255,255,0.55);backdrop-filter:blur(12px);-webkit-backdrop-filter:blur(12px);border:1px solid rgba(0,0,0,0.06);border-radius:var(--radius-lg);padding:var(--space-16);text-align:center;color:var(--color-text-muted);font-size:var(--text-sm);">
      No investment pools yet. <a href="/admin/investment-pools/new" style="color:var(--color-accent);">Create one</a>.
    </div>
  {:else}
    <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(340px,1fr));gap:var(--space-4);">
      {#each data.pools as pool}
        <button
          type="button"
          onclick={() => goto(`/admin/investment-pools/${pool.id}/edit`)}
          style="background:rgba(255,255,255,0.55);backdrop-filter:blur(12px);-webkit-backdrop-filter:blur(12px);border:1px solid rgba(0,0,0,0.06);border-radius:var(--radius-lg);padding:var(--space-6);text-align:left;cursor:pointer;transition:box-shadow var(--transition-fast),transform var(--transition-fast);width:100%;"
          onmouseenter={(e) => { (e.currentTarget as HTMLElement).style.boxShadow = '0 4px 20px rgba(0,0,0,0.08)'; (e.currentTarget as HTMLElement).style.transform = 'translateY(-1px)'; }}
          onmouseleave={(e) => { (e.currentTarget as HTMLElement).style.boxShadow = ''; (e.currentTarget as HTMLElement).style.transform = ''; }}
        >
          <div style="display:flex;align-items:flex-start;justify-content:space-between;margin-bottom:var(--space-3);">
            <h3 style="font-size:var(--text-base);font-weight:700;color:var(--color-text);">{pool.name}</h3>
            <StatusBadge status={pool.status} />
          </div>
          <p style="font-size:var(--text-sm);color:var(--color-text-muted);margin-bottom:var(--space-3);">{pool.projectName}</p>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:var(--space-2);margin-bottom:var(--space-3);">
            <div>
              <span style="font-size:var(--text-xs);color:var(--color-text-muted);display:block;">Goal</span>
              <span style="font-size:var(--text-sm);font-weight:600;">{formatCurrency(pool.goalAmount)}</span>
            </div>
            <div>
              <span style="font-size:var(--text-xs);color:var(--color-text-muted);display:block;">Raised</span>
              <span style="font-size:var(--text-sm);font-weight:600;">{formatCurrency(pool.raisedAmount)}</span>
            </div>
            <div>
              <span style="font-size:var(--text-xs);color:var(--color-text-muted);display:block;">Yield</span>
              <span style="font-size:var(--text-sm);font-weight:600;">{pool.targetYield}% p.a.</span>
            </div>
            <div>
              <span style="font-size:var(--text-xs);color:var(--color-text-muted);display:block;">Investors</span>
              <span style="font-size:var(--text-sm);font-weight:600;">{pool._count.investments}</span>
            </div>
          </div>
          <div style="background:rgba(0,0,0,0.06);border-radius:99px;height:6px;overflow:hidden;">
            <div style="background:var(--color-accent);height:100%;border-radius:99px;width:{Math.min(100, (pool.raisedAmount / pool.goalAmount) * 100)}%;"></div>
          </div>
        </button>
      {/each}
    </div>
  {/if}
</div>
