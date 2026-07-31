<script lang="ts">
  import { formatCurrency, formatDate } from '$lib/utils/formatters';

  let { data } = $props();
  const { projections, kpis, timeline } = data;

  let aiLoading = $state(false);
  let aiText = $state<string | null>(null);

  async function loadForecast() {
    if (aiText || aiLoading) return;
    aiLoading = true;
    try {
      const res = await fetch('/api/invest/cashflow-forecast', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          investorId: 'cashflow',
          cashflowData: {
            totalInvested: kpis.totalInvested,
            totalProjectedReturn: kpis.totalProjectedReturn,
            weightedYield: kpis.weightedYield,
            projections: projections.map(p => ({
              poolName: p.poolName,
              amount: p.amount,
              yieldRate: p.yieldRate,
              exitDate: p.exitDate,
              totalReturn: p.totalReturn,
              totalPayout: p.totalPayout,
            })),
            timeline,
          }
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

  // Timeline bar chart helpers
  function maxTotal(tl: typeof timeline): number {
    return Math.max(...tl.map(t => t.total), 1);
  }

  function pct(value: number, max: number): number {
    return Math.round((value / max) * 100);
  }

  const DEAL_TYPE_LABEL: Record<string, string> = {
    equity: 'Equity', debt_note: 'Debt Note', rental: 'Rental',
    club_deal: 'Club Deal', unspecified: '—',
  };
  function dtLabel(s: string | null): string {
    return s ? (DEAL_TYPE_LABEL[s] ?? s) : '—';
  }
</script>

<svelte:head>
  <title>Cashflow Forecast — Groundz</title>
</svelte:head>

<div style="max-width:1000px;">
  <div style="margin-bottom:var(--space-6);">
    <span style="font-size:10px;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;color:var(--color-text-muted);">INVESTOR</span>
    <h1 style="font-size:var(--text-2xl);font-weight:700;color:var(--color-text);margin-top:var(--space-1);">Cashflow Forecast</h1>
  </div>

  {#if projections.length === 0}
    <div style="background:rgba(255,255,255,0.55);backdrop-filter:blur(12px);-webkit-backdrop-filter:blur(12px);border:1px solid rgba(0,0,0,0.06);border-radius:var(--radius-lg);padding:var(--space-12);text-align:center;">
      <p style="color:var(--color-text-muted);font-size:var(--text-sm);margin-bottom:var(--space-4);">No investments to project yet.</p>
      <a href="/pools" style="color:var(--color-accent);font-weight:600;text-decoration:none;">Browse Investment Pools →</a>
    </div>

  {:else}

    <!-- KPI strip -->
    <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:var(--space-4);margin-bottom:var(--space-6);">
      {#each [
        { label: 'Total Invested',          value: formatCurrency(kpis.totalInvested) },
        { label: 'Projected Return',        value: formatCurrency(kpis.totalProjectedReturn), accent: true },
        { label: 'Total Projected Payout',  value: formatCurrency(kpis.totalProjectedPayout) },
        { label: 'Weighted Yield',          value: kpis.weightedYield.toFixed(1) + '%', accent: true },
      ] as kpi}
        <div style="background:rgba(255,255,255,0.6);backdrop-filter:blur(8px);-webkit-backdrop-filter:blur(8px);border:1px solid rgba(0,0,0,0.06);border-radius:var(--radius-lg);padding:var(--space-5);">
          <p style="font-size:10px;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;color:var(--color-text-muted);">{kpi.label}</p>
          <p style="font-size:var(--text-2xl);font-weight:700;color:{kpi.accent ? 'var(--color-accent)' : 'var(--color-text)'};margin-top:var(--space-2);line-height:1.2;">{kpi.value}</p>
        </div>
      {/each}
    </div>

    <!-- Exit timeline chart -->
    {#if timeline.length > 0}
      <div style="background:rgba(255,255,255,0.55);backdrop-filter:blur(12px);-webkit-backdrop-filter:blur(12px);border:1px solid rgba(0,0,0,0.06);border-radius:var(--radius-lg);padding:var(--space-6);margin-bottom:var(--space-6);">
        <p style="font-size:10px;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;color:var(--color-text-muted);margin-bottom:var(--space-5);">Exit Timeline by Year</p>
        <div style="display:flex;flex-direction:column;gap:var(--space-4);">
          {#each timeline as t}
            {@const max = maxTotal(timeline)}
            <div>
              <div style="display:flex;justify-content:space-between;align-items:baseline;margin-bottom:var(--space-2);">
                <span style="font-size:var(--text-sm);font-weight:700;color:var(--color-text);">{t.year}</span>
                <span style="font-size:var(--text-xs);color:var(--color-text-muted);">
                  {formatCurrency(t.return)} return + {formatCurrency(t.principal)} principal
                </span>
              </div>
              <!-- Stacked bar: principal (base) + return (top) -->
              <div style="height:12px;background:rgba(0,0,0,0.06);border-radius:6px;overflow:hidden;display:flex;">
                <div style="height:100%;width:{pct(t.principal, max)}%;background:rgba(99,102,241,0.45);"></div>
                <div style="height:100%;width:{pct(t.return, max)}%;background:var(--color-accent);"></div>
              </div>
              <div style="display:flex;gap:var(--space-4);margin-top:var(--space-1);">
                <span style="font-size:10px;color:rgba(99,102,241,0.8);display:flex;align-items:center;gap:4px;"><span style="width:8px;height:8px;border-radius:2px;background:rgba(99,102,241,0.45);display:inline-block;"></span>Principal</span>
                <span style="font-size:10px;color:var(--color-accent);display:flex;align-items:center;gap:4px;"><span style="width:8px;height:8px;border-radius:2px;background:var(--color-accent);display:inline-block;"></span>Return</span>
              </div>
            </div>
          {/each}
        </div>
      </div>
    {/if}

    <!-- Per-investment projection table -->
    <div style="background:rgba(255,255,255,0.55);backdrop-filter:blur(12px);-webkit-backdrop-filter:blur(12px);border:1px solid rgba(0,0,0,0.06);border-radius:var(--radius-lg);overflow:hidden;margin-bottom:var(--space-6);">
      <div style="padding:var(--space-4) var(--space-6);border-bottom:1px solid rgba(0,0,0,0.06);">
        <p style="font-size:10px;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;color:var(--color-text-muted);">Per-Investment Projection</p>
      </div>
      <div style="overflow-x:auto;">
        <table style="width:100%;border-collapse:collapse;min-width:700px;">
          <thead>
            <tr style="border-bottom:1px solid rgba(0,0,0,0.06);">
              {#each ['Pool','Strategy','Principal','Yield','Term','Exit Date','Projected Return','Total Payout'] as col}
                <th style="padding:var(--space-3) var(--space-4);text-align:left;font-size:var(--text-xs);font-weight:700;letter-spacing:0.06em;text-transform:uppercase;color:var(--color-text-muted);">{col}</th>
              {/each}
            </tr>
          </thead>
          <tbody>
            {#each projections as p}
              <tr style="border-bottom:1px solid rgba(0,0,0,0.04);">
                <td style="padding:var(--space-3) var(--space-4);">
                  <a href="/pools/{p.poolSlug}" style="font-size:var(--text-sm);font-weight:600;color:var(--color-text);text-decoration:none;">{p.poolName}</a>
                </td>
                <td style="padding:var(--space-3) var(--space-4);font-size:var(--text-xs);color:var(--color-text-muted);">{dtLabel(p.dealType)}</td>
                <td style="padding:var(--space-3) var(--space-4);font-size:var(--text-sm);font-weight:700;color:var(--color-text);">{formatCurrency(p.amount)}</td>
                <td style="padding:var(--space-3) var(--space-4);font-size:var(--text-sm);font-weight:600;color:var(--color-accent);">{p.yieldRate.toFixed(1)}%</td>
                <td style="padding:var(--space-3) var(--space-4);font-size:var(--text-sm);color:var(--color-text-muted);">{p.termMonths}m</td>
                <td style="padding:var(--space-3) var(--space-4);font-size:var(--text-sm);color:var(--color-text-muted);">{formatDate(p.exitDate)}</td>
                <td style="padding:var(--space-3) var(--space-4);font-size:var(--text-sm);font-weight:700;color:#22c55e;">+{formatCurrency(p.totalReturn)}</td>
                <td style="padding:var(--space-3) var(--space-4);font-size:var(--text-sm);font-weight:700;color:var(--color-text);">{formatCurrency(p.totalPayout)}</td>
              </tr>
            {/each}
          </tbody>
          <tfoot>
            <tr style="border-top:2px solid rgba(0,0,0,0.08);background:rgba(0,0,0,0.02);">
              <td colspan="2" style="padding:var(--space-3) var(--space-4);font-size:var(--text-xs);font-weight:700;text-transform:uppercase;color:var(--color-text-muted);">Total</td>
              <td style="padding:var(--space-3) var(--space-4);font-size:var(--text-sm);font-weight:700;">{formatCurrency(kpis.totalInvested)}</td>
              <td colspan="3"></td>
              <td style="padding:var(--space-3) var(--space-4);font-size:var(--text-sm);font-weight:700;color:#22c55e;">+{formatCurrency(kpis.totalProjectedReturn)}</td>
              <td style="padding:var(--space-3) var(--space-4);font-size:var(--text-sm);font-weight:700;">{formatCurrency(kpis.totalProjectedPayout)}</td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>

    <!-- AI Cashflow Forecast -->
    <div style="background:linear-gradient(135deg,rgba(212,169,68,0.08) 0%,rgba(212,169,68,0.03) 100%);border:1px solid rgba(212,169,68,0.2);border-radius:var(--radius-lg);padding:var(--space-6);">
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:var(--space-3);">
        <p style="font-size:10px;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;color:#d4a944;">AI Cashflow Forecast</p>
        {#if !aiText}
          <button
            onclick={loadForecast}
            disabled={aiLoading}
            style="font-size:var(--text-xs);font-weight:700;color:#d4a944;background:rgba(212,169,68,0.12);border:1px solid rgba(212,169,68,0.25);border-radius:var(--radius-md);padding:var(--space-1) var(--space-3);cursor:pointer;"
          >
            {aiLoading ? 'Analyzing…' : 'Generate Forecast ✦'}
          </button>
        {/if}
      </div>
      {#if aiText}
        <p style="font-size:var(--text-sm);color:var(--color-text);line-height:1.7;">{aiText}</p>
      {:else if aiLoading}
        <div style="display:flex;gap:var(--space-2);align-items:center;">
          <div style="width:6px;height:6px;border-radius:50%;background:#d4a944;animation:pulse 1s infinite;"></div>
          <p style="font-size:var(--text-sm);color:var(--color-text-muted);">Modeling your cashflow…</p>
        </div>
      {:else}
        <p style="font-size:var(--text-sm);color:var(--color-text-muted);">Get an AI assessment of your projected returns, exit concentration risk, and reinvestment recommendations.</p>
      {/if}
    </div>

  {/if}
</div>

<style>
  @keyframes pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.3; }
  }
</style>
