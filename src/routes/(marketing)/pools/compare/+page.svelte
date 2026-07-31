<script lang="ts">
  import { goto } from '$app/navigation';
  import { page } from '$app/stores';

  let { data } = $props();

  type Pool = typeof data.selected[number];

  // Selected slugs (driven by URL)
  let selectedSlugs = $state<string[]>(
    ($page.url.searchParams.get('pools') ?? '').split(',').filter(Boolean).slice(0, 3)
  );

  function addPool(slug: string) {
    if (selectedSlugs.includes(slug) || selectedSlugs.length >= 3) return;
    const next = [...selectedSlugs, slug];
    goto(`/pools/compare?pools=${next.join(',')}`, { replaceState: false });
  }

  function removePool(slug: string) {
    const next = selectedSlugs.filter(s => s !== slug);
    if (next.length === 0) goto('/pools/compare', { replaceState: false });
    else goto(`/pools/compare?pools=${next.join(',')}`, { replaceState: false });
  }

  // Available pools not yet selected
  let available = $derived(
    data.allPools.filter(p => !selectedSlugs.includes(p.slug ?? ''))
  );

  // AI comparison
  let aiLoading = $state(false);
  let aiText = $state<string | null>(null);
  let lastCompareKey = $state('');

  $effect(() => {
    // Reset AI text when pool selection changes
    const key = selectedSlugs.sort().join('+');
    if (key !== lastCompareKey) {
      aiText = null;
      lastCompareKey = key;
    }
  });

  async function loadComparison() {
    if (data.selected.length < 2 || aiLoading || aiText) return;
    aiLoading = true;
    try {
      const res = await fetch('/api/invest/pool-compare', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pools: data.selected.map(p => ({
            name: p.name,
            irr: p.targetIrr ?? p.targetYield,
            term: p.termMonths,
            minTicket: p.minTicket,
            status: p.status,
            dealType: p.dealType,
            country: p.country,
            progress: p.goalAmount > 0 ? Math.round((p.raisedAmount / p.goalAmount) * 100) : 0,
            investors: p._count.investments,
          }))
        })
      });
      const json = await res.json();
      aiText = json.insight ?? json.error ?? 'Analysis unavailable.';
    } catch {
      aiText = 'Analysis unavailable.';
    } finally {
      aiLoading = false;
    }
  }

  function fmt(n: number): string {
    if (n >= 1_000_000) return `€${(n / 1_000_000).toFixed(1)}M`;
    if (n >= 1000) return `€${(n / 1000).toFixed(0)}k`;
    return `€${n}`;
  }

  const STATUS_COLOR: Record<string, string> = {
    active: '#22c55e', closed: '#9ca3af', completed: '#6366f1',
  };

  // Rows for the comparison table
  type RowDef = { label: string; getValue: (p: Pool) => string; highlight?: (vals: string[]) => (string | null)[] };

  const ROWS: RowDef[] = [
    { label: 'Country',       getValue: p => p.country },
    { label: 'Deal Type',     getValue: p => p.dealType?.replace('_', ' ') ?? '—' },
    { label: 'Status',        getValue: p => p.status },
    { label: 'Target IRR',    getValue: p => `${(p.targetIrr ?? p.targetYield).toFixed(1)}%`,
      highlight: vals => {
        const nums = vals.map(v => parseFloat(v));
        const max = Math.max(...nums);
        return nums.map(n => (n === max ? 'best' : null));
      }
    },
    { label: 'Preferred Return', getValue: p => p.preferredReturn ? `${p.preferredReturn}%` : '—' },
    { label: 'Term',          getValue: p => `${p.termMonths}m`,
      highlight: vals => {
        const nums = vals.map(v => parseInt(v));
        const min = Math.min(...nums);
        return nums.map(n => (n === min ? 'best' : null));
      }
    },
    { label: 'Min Ticket',    getValue: p => fmt(p.minTicket),
      highlight: vals => {
        const nums = vals.map(v => parseFloat(v.replace(/[€kM]/g, '') || '0') * (v.includes('M') ? 1000000 : v.includes('k') ? 1000 : 1));
        const min = Math.min(...nums);
        return nums.map(n => (n === min ? 'best' : null));
      }
    },
    { label: 'Max Ticket',    getValue: p => p.maxTicket ? fmt(p.maxTicket) : 'Unlimited' },
    { label: 'LTV',           getValue: p => p.ltv ? `${p.ltv}%` : '—' },
    { label: 'Capital Type',  getValue: p => p.capitalType?.replace('_', ' ') ?? '—' },
    { label: 'Exit Type',     getValue: p => p.exitType ?? '—' },
    { label: 'Funding',       getValue: p => `${p.goalAmount > 0 ? Math.round((p.raisedAmount / p.goalAmount) * 100) : 0}%`,
      highlight: vals => {
        const nums = vals.map(v => parseInt(v));
        const max = Math.max(...nums);
        return nums.map(n => (n === max ? 'best' : null));
      }
    },
    { label: 'Goal',          getValue: p => fmt(p.goalAmount) },
    { label: 'Raised',        getValue: p => fmt(p.raisedAmount) },
    { label: 'Investors',     getValue: p => String(p._count.investments) },
    { label: 'Construction',  getValue: p => {
        const r = p.constructionReports[0];
        return r ? `${r.overallPct}%` : '—';
      }
    },
    { label: 'Milestones',    getValue: p => {
        const done = p.milestones.filter(m => m.status === 'completed').length;
        return p.milestones.length > 0 ? `${done}/${p.milestones.length}` : '—';
      }
    },
  ];
</script>

<svelte:head>
  <title>Compare Investment Pools — Groundz</title>
  <meta name="description" content="Compare Groundz investment pools side-by-side — IRR, terms, deal structure, funding progress, and AI analysis." />
</svelte:head>

<div class="compare-page">
  <!-- Header -->
  <div class="compare-header">
    <a href="/pools" class="compare-back">← All Pools</a>
    <h1 class="compare-title">Compare Investment Pools</h1>
    <p class="compare-sub">Select up to 3 pools to compare side-by-side.</p>
  </div>

  <!-- Pool selector -->
  <div class="compare-selector">
    <div class="selector-slots">
      {#each data.selected as pool}
        <div class="selector-chip selector-chip--selected">
          <span>{pool.name}</span>
          <button onclick={() => removePool(pool.slug ?? '')} aria-label="Remove">×</button>
        </div>
      {/each}
      {#if data.selected.length < 3}
        <div class="selector-add">
          <select
            class="selector-dropdown"
            onchange={e => { const v = (e.target as HTMLSelectElement).value; if (v) { addPool(v); (e.target as HTMLSelectElement).value = ''; } }}
          >
            <option value="">+ Add pool to compare…</option>
            {#each available as p}
              <option value={p.slug ?? ''}>{p.name} ({p.country})</option>
            {/each}
          </select>
        </div>
      {/if}
    </div>
  </div>

  {#if data.selected.length < 2}
    <div class="compare-empty">
      <p>Select at least 2 pools to see the comparison.</p>
    </div>

  {:else}
    <!-- Comparison table -->
    <div class="compare-table-wrap">
      <table class="compare-table">
        <thead>
          <tr>
            <th class="compare-table__row-label"></th>
            {#each data.selected as pool}
              <th class="compare-table__pool-head">
                <a href="/pools/{pool.slug}" class="compare-table__pool-name">{pool.name}</a>
                <span class="compare-table__status" style="color:{STATUS_COLOR[pool.status] ?? '#9ca3af'}">
                  {pool.status}
                </span>
                <span class="compare-table__country">{pool.country}</span>
              </th>
            {/each}
          </tr>
        </thead>
        <tbody>
          {#each ROWS as row}
            {@const vals = data.selected.map(p => row.getValue(p))}
            {@const highlights = row.highlight ? row.highlight(vals) : vals.map(() => null)}
            <tr class="compare-table__row">
              <td class="compare-table__row-label">{row.label}</td>
              {#each vals as val, i}
                <td class="compare-table__cell" class:compare-table__cell--best={highlights[i] === 'best'}>
                  {val}
                  {#if highlights[i] === 'best'}
                    <span class="compare-table__best-badge">best</span>
                  {/if}
                </td>
              {/each}
            </tr>
          {/each}
        </tbody>
        <tfoot>
          <tr>
            <td></td>
            {#each data.selected as pool}
              <td class="compare-table__cta-cell">
                {#if pool.status === 'active'}
                  <a href="/pools/{pool.slug}/commit" class="compare-table__cta">Commit →</a>
                {:else}
                  <a href="/pools/{pool.slug}" class="compare-table__cta compare-table__cta--view">View →</a>
                {/if}
              </td>
            {/each}
          </tr>
        </tfoot>
      </table>
    </div>

    <!-- AI Comparison -->
    <div class="compare-ai">
      <div class="compare-ai__head">
        <p class="compare-ai__label">AI Comparison Analysis</p>
        {#if !aiText}
          <button
            onclick={loadComparison}
            disabled={aiLoading}
            class="compare-ai__btn"
          >
            {aiLoading ? 'Analyzing…' : 'Compare with AI ✦'}
          </button>
        {/if}
      </div>
      {#if aiText}
        <p class="compare-ai__text">{aiText}</p>
      {:else if aiLoading}
        <div class="compare-ai__loading">
          <div class="compare-ai__dot"></div>
          <span>Comparing pools…</span>
        </div>
      {:else}
        <p class="compare-ai__hint">Get an AI assessment of risk-adjusted returns, key differentiators, and which investor profile suits each pool.</p>
      {/if}
    </div>
  {/if}
</div>

<style>
  .compare-page {
    max-width: 1100px; margin: 0 auto;
    padding: var(--space-10) var(--space-6);
    display: flex; flex-direction: column; gap: var(--space-8);
  }

  .compare-back {
    font-size: var(--text-sm); color: var(--color-text-muted);
    text-decoration: none; display: inline-block; margin-bottom: var(--space-3);
  }
  .compare-back:hover { color: var(--color-text); }

  .compare-title {
    font-size: var(--text-3xl); font-weight: 700; color: var(--color-text); margin: 0 0 var(--space-2);
  }
  .compare-sub { font-size: var(--text-sm); color: var(--color-text-muted); margin: 0; }

  /* Selector */
  .selector-slots {
    display: flex; flex-wrap: wrap; gap: var(--space-3); align-items: center;
  }
  .selector-chip {
    display: flex; align-items: center; gap: var(--space-2);
    padding: var(--space-2) var(--space-4);
    background: rgba(212,169,68,0.1); border: 1px solid rgba(212,169,68,0.25);
    border-radius: var(--radius-md); font-size: var(--text-sm); font-weight: 600; color: #a07820;
  }
  .selector-chip button {
    background: none; border: none; cursor: pointer; color: #a07820;
    font-size: 16px; line-height: 1; padding: 0; opacity: 0.6;
  }
  .selector-chip button:hover { opacity: 1; }
  .selector-dropdown {
    padding: var(--space-2) var(--space-4);
    border: 1px solid rgba(0,0,0,0.12); border-radius: var(--radius-md);
    font-size: var(--text-sm); background: rgba(255,255,255,0.8);
    color: var(--color-text); cursor: pointer; outline: none;
  }

  /* Empty state */
  .compare-empty {
    text-align: center; padding: var(--space-16);
    background: rgba(255,255,255,0.55); backdrop-filter: blur(12px);
    border: 1px solid rgba(0,0,0,0.06); border-radius: var(--radius-lg);
    font-size: var(--text-sm); color: var(--color-text-muted);
  }

  /* Comparison table */
  .compare-table-wrap {
    overflow-x: auto;
    background: rgba(255,255,255,0.55); backdrop-filter: blur(12px); -webkit-backdrop-filter: blur(12px);
    border: 1px solid rgba(0,0,0,0.06); border-radius: var(--radius-lg); overflow: hidden;
  }
  .compare-table { width: 100%; border-collapse: collapse; min-width: 560px; }

  .compare-table thead th { padding: var(--space-5) var(--space-5); text-align: left; }
  .compare-table__row-label {
    font-size: var(--text-xs); font-weight: 700; text-transform: uppercase;
    letter-spacing: 0.06em; color: var(--color-text-muted);
    width: 160px; white-space: nowrap;
  }
  .compare-table__pool-head {
    border-left: 1px solid rgba(0,0,0,0.06);
    display: table-cell;
  }
  .compare-table__pool-name {
    display: block; font-size: var(--text-base); font-weight: 700;
    color: var(--color-text); text-decoration: none; margin-bottom: var(--space-1);
  }
  .compare-table__pool-name:hover { color: var(--color-primary); }
  .compare-table__status {
    display: block; font-size: 10px; font-weight: 700; text-transform: uppercase;
    letter-spacing: 0.08em;
  }
  .compare-table__country {
    display: block; font-size: var(--text-xs); color: var(--color-text-muted); margin-top: 2px;
  }

  .compare-table__row { border-top: 1px solid rgba(0,0,0,0.05); }
  .compare-table__row:nth-child(even) { background: rgba(0,0,0,0.015); }

  .compare-table__row-label {
    padding: var(--space-3) var(--space-5);
  }
  .compare-table__cell {
    padding: var(--space-3) var(--space-5);
    border-left: 1px solid rgba(0,0,0,0.05);
    font-size: var(--text-sm); color: var(--color-text);
    vertical-align: middle;
  }
  .compare-table__cell--best {
    background: rgba(34,197,94,0.06);
    font-weight: 700; color: #16a34a;
  }
  .compare-table__best-badge {
    margin-left: var(--space-1); font-size: 9px; font-weight: 700; text-transform: uppercase;
    color: #16a34a; background: rgba(34,197,94,0.12); padding: 1px 5px; border-radius: 99px;
  }

  .compare-table tfoot td {
    padding: var(--space-4) var(--space-5);
    border-top: 2px solid rgba(0,0,0,0.08);
  }
  .compare-table__cta {
    display: inline-block; padding: var(--space-2) var(--space-5);
    background: var(--color-primary); color: #fff; font-size: var(--text-xs); font-weight: 700;
    border-radius: var(--radius-md); text-decoration: none; transition: opacity var(--transition-fast);
  }
  .compare-table__cta:hover { opacity: 0.85; }
  .compare-table__cta--view {
    background: rgba(0,0,0,0.06); color: var(--color-text);
  }

  /* AI block */
  .compare-ai {
    background: linear-gradient(135deg, rgba(212,169,68,0.08), rgba(212,169,68,0.03));
    border: 1px solid rgba(212,169,68,0.2); border-radius: var(--radius-lg);
    padding: var(--space-6);
  }
  .compare-ai__head {
    display: flex; align-items: center; justify-content: space-between;
    margin-bottom: var(--space-3);
  }
  .compare-ai__label {
    font-size: 10px; font-weight: 700; letter-spacing: 0.1em;
    text-transform: uppercase; color: #d4a944; margin: 0;
  }
  .compare-ai__btn {
    font-size: var(--text-xs); font-weight: 700; color: #d4a944;
    background: rgba(212,169,68,0.12); border: 1px solid rgba(212,169,68,0.25);
    border-radius: var(--radius-md); padding: var(--space-1) var(--space-3);
    cursor: pointer; transition: opacity 0.15s;
  }
  .compare-ai__btn:disabled { opacity: 0.5; cursor: default; }
  .compare-ai__text, .compare-ai__hint {
    font-size: var(--text-sm); line-height: 1.7; margin: 0;
  }
  .compare-ai__text { color: var(--color-text); }
  .compare-ai__hint { color: var(--color-text-muted); }
  .compare-ai__loading {
    display: flex; gap: var(--space-2); align-items: center;
    font-size: var(--text-sm); color: var(--color-text-muted);
  }
  .compare-ai__dot {
    width: 6px; height: 6px; border-radius: 50%; background: #d4a944;
    animation: pulse 1s infinite;
  }
  @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.3; } }
</style>
