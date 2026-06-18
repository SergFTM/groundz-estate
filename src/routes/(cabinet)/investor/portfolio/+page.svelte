<script lang="ts">
  import { formatCurrency, formatDate } from '$lib/utils/formatters';

  let { data } = $props();
  const { investments, totalCommitted, totalTokens, transactions, charts } = data;

  function fmtTokens(n: number): string { return n.toLocaleString('en-US'); }

  const TX_LABEL: Record<string, string> = {
    buy: 'Buy', sell: 'Sell', distribution: 'Distribution', fee: 'Fee'
  };
  function txColor(type: string): string {
    return type === 'buy' ? 'var(--color-primary)'
      : type === 'distribution' ? '#22c55e'
      : type === 'sell' ? '#ca8a04'
      : 'var(--color-text-muted)';
  }

  // AI diversification analysis
  let aiLoading = $state(false);
  let aiAnalysis = $state<string | null>(null);

  async function analyzeDiversification() {
    if (aiAnalysis || aiLoading) return;
    aiLoading = true;
    try {
      const res = await fetch('/api/invest/portfolio-insight', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          investorId: 'portfolio-diversification',
          portfolioData: {
            totalInvested: totalCommitted,
            poolCount: investments.length,
            activePools: investments.filter((i: any) => i.pool.status === 'active').length,
            avgYield: totalCommitted > 0
              ? investments.reduce((s: number, i: any) => s + i.pool.targetYield * i.amount, 0) / totalCommitted
              : 0,
            investments: investments.map((i: any) => ({ pool: i.pool, amount: i.amount })),
            diversification: charts,
          }
        })
      });
      const json = await res.json();
      aiAnalysis = json.insight ?? json.error ?? 'Analysis unavailable.';
    } catch {
      aiAnalysis = 'Analysis unavailable.';
    } finally {
      aiLoading = false;
    }
  }

  // Chart helpers
  function barPct(value: number, total: number): number {
    return total > 0 ? Math.round((value / total) * 100) : 0;
  }

  function toChartRows(obj: Record<string, number>): { label: string; amount: number; pct: number }[] {
    const total = Object.values(obj).reduce((s, v) => s + v, 0);
    return Object.entries(obj)
      .filter(([, v]) => v > 0)
      .sort(([, a], [, b]) => b - a)
      .map(([label, amount]) => ({ label, amount, pct: barPct(amount, total) }));
  }

  const LABEL_MAP: Record<string, string> = {
    equity: 'Equity', debt_note: 'Debt Note', rental: 'Rental', club_deal: 'Club Deal',
    unspecified: 'Unspecified', soft_commit: 'Soft Commit', pending: 'Pending',
    funded: 'Funded', cancelled: 'Cancelled'
  };
  function lbl(s: string): string { return LABEL_MAP[s] ?? s; }

  // Months left until exit
  function monthsLeft(inv: any): number {
    const exit = new Date(inv.createdAt);
    exit.setMonth(exit.getMonth() + inv.pool.termMonths);
    return Math.max(0, Math.round((exit.getTime() - Date.now()) / (1000 * 60 * 60 * 24 * 30)));
  }
</script>

<svelte:head>
  <title>My Portfolio — Groundz</title>
</svelte:head>

<div style="max-width:1100px;">
  <div style="margin-bottom:var(--space-6);">
    <span style="font-size:10px;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;color:var(--color-text-muted);">INVESTOR</span>
    <h1 style="font-size:var(--text-2xl);font-weight:700;color:var(--color-text);margin-top:var(--space-1);">My Portfolio</h1>
  </div>

  {#if investments.length === 0}
    <div style="background:rgba(255,255,255,0.55);backdrop-filter:blur(12px);-webkit-backdrop-filter:blur(12px);border:1px solid rgba(0,0,0,0.06);border-radius:var(--radius-lg);padding:var(--space-12);text-align:center;">
      <p style="color:var(--color-text-muted);font-size:var(--text-sm);margin-bottom:var(--space-4);">No investments yet.</p>
      <a href="/pools" style="color:var(--color-accent);font-weight:600;text-decoration:none;">Browse Investment Pools →</a>
    </div>

  {:else}
    <!-- Investment Table -->
    <div style="background:rgba(255,255,255,0.55);backdrop-filter:blur(12px);-webkit-backdrop-filter:blur(12px);border:1px solid rgba(0,0,0,0.06);border-radius:var(--radius-lg);overflow:hidden;margin-bottom:var(--space-6);">
      <div style="display:flex;align-items:center;justify-content:space-between;padding:var(--space-5) var(--space-6);border-bottom:1px solid rgba(0,0,0,0.06);">
        <p style="font-size:10px;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;color:var(--color-text-muted);">Commitments ({investments.length})</p>
        <p style="font-size:var(--text-sm);font-weight:700;color:var(--color-text);">
          {#if totalTokens > 0}<span class="num" style="color:var(--color-primary);">{fmtTokens(totalTokens)}</span> tokens · {/if}Total <span class="num">{formatCurrency(totalCommitted)}</span>
        </p>
      </div>
      <div style="overflow-x:auto;">
        <table style="width:100%;border-collapse:collapse;min-width:700px;">
          <thead>
            <tr style="border-bottom:1px solid rgba(0,0,0,0.06);">
              {#each ['Pool','Country','Strategy','Amount','Tokens','Status','Yield','Term Left','Date'] as col}
                <th style="padding:var(--space-3) var(--space-4);text-align:left;font-size:var(--text-xs);font-weight:700;letter-spacing:0.06em;text-transform:uppercase;color:var(--color-text-muted);">{col}</th>
              {/each}
            </tr>
          </thead>
          <tbody>
            {#each investments as inv}
              <tr style="border-bottom:1px solid rgba(0,0,0,0.04);">
                <td style="padding:var(--space-3) var(--space-4);">
                  <a href="/pools/{inv.pool.slug}" style="font-size:var(--text-sm);font-weight:600;color:var(--color-text);text-decoration:none;">{inv.pool.name}</a>
                </td>
                <td style="padding:var(--space-3) var(--space-4);font-size:var(--text-sm);color:var(--color-text-muted);">{inv.pool.country}</td>
                <td style="padding:var(--space-3) var(--space-4);font-size:var(--text-xs);color:var(--color-text-muted);">{lbl(inv.pool.dealType ?? 'unspecified')}</td>
                <td style="padding:var(--space-3) var(--space-4);font-size:var(--text-sm);font-weight:700;color:var(--color-text);" class="num">{formatCurrency(inv.amount)}</td>
                <td style="padding:var(--space-3) var(--space-4);font-size:var(--text-sm);color:var(--color-text-muted);" class="num">{inv.tokens ? fmtTokens(inv.tokens) : '—'}</td>
                <td style="padding:var(--space-3) var(--space-4);">
                  <span style="font-size:10px;font-weight:700;text-transform:uppercase;padding:2px 7px;border-radius:99px;
                    background:{inv.status === 'funded' ? 'rgba(34,197,94,0.12)' : inv.status === 'pending' ? 'rgba(234,179,8,0.12)' : 'rgba(212,169,68,0.1)'};
                    color:{inv.status === 'funded' ? '#22c55e' : inv.status === 'pending' ? '#ca8a04' : '#d4a944'};">
                    {lbl(inv.status)}
                  </span>
                </td>
                <td style="padding:var(--space-3) var(--space-4);font-size:var(--text-sm);font-weight:600;color:var(--color-primary);" class="num">{(inv.pool.targetIrr ?? inv.pool.targetYield).toFixed(1)}%</td>
                <td style="padding:var(--space-3) var(--space-4);font-size:var(--text-sm);color:var(--color-text-muted);">{monthsLeft(inv)}m</td>
                <td style="padding:var(--space-3) var(--space-4);font-size:var(--text-sm);color:var(--color-text-muted);">{formatDate(inv.createdAt)}</td>
              </tr>
            {/each}
          </tbody>
        </table>
      </div>
    </div>

    <!-- Charts grid -->
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:var(--space-5);margin-bottom:var(--space-6);">

      <!-- By Geography -->
      <div style="background:rgba(255,255,255,0.55);backdrop-filter:blur(12px);-webkit-backdrop-filter:blur(12px);border:1px solid rgba(0,0,0,0.06);border-radius:var(--radius-lg);padding:var(--space-6);">
        <p style="font-size:10px;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;color:var(--color-text-muted);margin-bottom:var(--space-4);">By Geography</p>
        <div style="display:flex;flex-direction:column;gap:var(--space-3);">
          {#each toChartRows(charts.byCountry) as row}
            <div>
              <div style="display:flex;justify-content:space-between;margin-bottom:var(--space-1);">
                <span style="font-size:var(--text-sm);font-weight:600;">{row.label}</span>
                <span style="font-size:var(--text-xs);color:var(--color-text-muted);">{row.pct}% · {formatCurrency(row.amount)}</span>
              </div>
              <div style="height:6px;background:rgba(0,0,0,0.06);border-radius:3px;overflow:hidden;">
                <div style="height:100%;width:{row.pct}%;background:var(--color-accent);border-radius:3px;transition:width 0.4s ease;"></div>
              </div>
            </div>
          {/each}
        </div>
      </div>

      <!-- By Strategy -->
      <div style="background:rgba(255,255,255,0.55);backdrop-filter:blur(12px);-webkit-backdrop-filter:blur(12px);border:1px solid rgba(0,0,0,0.06);border-radius:var(--radius-lg);padding:var(--space-6);">
        <p style="font-size:10px;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;color:var(--color-text-muted);margin-bottom:var(--space-4);">By Strategy</p>
        <div style="display:flex;flex-direction:column;gap:var(--space-3);">
          {#each toChartRows(charts.byStrategy) as row}
            <div>
              <div style="display:flex;justify-content:space-between;margin-bottom:var(--space-1);">
                <span style="font-size:var(--text-sm);font-weight:600;">{lbl(row.label)}</span>
                <span style="font-size:var(--text-xs);color:var(--color-text-muted);">{row.pct}% · {formatCurrency(row.amount)}</span>
              </div>
              <div style="height:6px;background:rgba(0,0,0,0.06);border-radius:3px;overflow:hidden;">
                <div style="height:100%;width:{row.pct}%;background:#6366f1;border-radius:3px;transition:width 0.4s ease;"></div>
              </div>
            </div>
          {/each}
        </div>
      </div>

      <!-- By Commitment Status -->
      <div style="background:rgba(255,255,255,0.55);backdrop-filter:blur(12px);-webkit-backdrop-filter:blur(12px);border:1px solid rgba(0,0,0,0.06);border-radius:var(--radius-lg);padding:var(--space-6);">
        <p style="font-size:10px;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;color:var(--color-text-muted);margin-bottom:var(--space-4);">By Commitment Stage</p>
        <div style="display:flex;flex-direction:column;gap:var(--space-3);">
          {#each toChartRows(charts.byStatus) as row}
            {@const color = row.label === 'funded' ? '#22c55e' : row.label === 'pending' ? '#eab308' : '#d4a944'}
            <div>
              <div style="display:flex;justify-content:space-between;margin-bottom:var(--space-1);">
                <span style="font-size:var(--text-sm);font-weight:600;">{lbl(row.label)}</span>
                <span style="font-size:var(--text-xs);color:var(--color-text-muted);">{row.pct}% · {formatCurrency(row.amount)}</span>
              </div>
              <div style="height:6px;background:rgba(0,0,0,0.06);border-radius:3px;overflow:hidden;">
                <div style="height:100%;width:{row.pct}%;background:{color};border-radius:3px;transition:width 0.4s ease;"></div>
              </div>
            </div>
          {/each}
        </div>
      </div>

      <!-- By Maturity -->
      <div style="background:rgba(255,255,255,0.55);backdrop-filter:blur(12px);-webkit-backdrop-filter:blur(12px);border:1px solid rgba(0,0,0,0.06);border-radius:var(--radius-lg);padding:var(--space-6);">
        <p style="font-size:10px;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;color:var(--color-text-muted);margin-bottom:var(--space-4);">By Time to Exit</p>
        <div style="display:flex;flex-direction:column;gap:var(--space-3);">
          {#each toChartRows(charts.byMaturity) as row}
            <div>
              <div style="display:flex;justify-content:space-between;margin-bottom:var(--space-1);">
                <span style="font-size:var(--text-sm);font-weight:600;">{row.label}</span>
                <span style="font-size:var(--text-xs);color:var(--color-text-muted);">{row.pct}% · {formatCurrency(row.amount)}</span>
              </div>
              <div style="height:6px;background:rgba(0,0,0,0.06);border-radius:3px;overflow:hidden;">
                <div style="height:100%;width:{row.pct}%;background:#0ea5e9;border-radius:3px;transition:width 0.4s ease;"></div>
              </div>
            </div>
          {/each}
        </div>
      </div>
    </div>

    <!-- Transaction feed -->
    <div style="background:rgba(255,255,255,0.55);backdrop-filter:blur(12px);-webkit-backdrop-filter:blur(12px);border:1px solid rgba(0,0,0,0.06);border-radius:var(--radius-lg);overflow:hidden;margin-bottom:var(--space-6);">
      <div style="padding:var(--space-5) var(--space-6);border-bottom:1px solid rgba(0,0,0,0.06);">
        <p style="font-size:10px;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;color:var(--color-text-muted);">Recent transactions</p>
      </div>
      {#if transactions.length === 0}
        <p style="padding:var(--space-6);font-size:var(--text-sm);color:var(--color-text-muted);text-align:center;">No transactions yet. Token buys, distributions and fees will appear here.</p>
      {:else}
        <div style="overflow-x:auto;">
          <table style="width:100%;border-collapse:collapse;min-width:560px;">
            <thead>
              <tr style="border-bottom:1px solid rgba(0,0,0,0.06);">
                {#each ['Date','Type','Pool','Tokens','Amount','Status'] as col}
                  <th style="padding:var(--space-3) var(--space-4);text-align:left;font-size:var(--text-xs);font-weight:700;letter-spacing:0.06em;text-transform:uppercase;color:var(--color-text-muted);">{col}</th>
                {/each}
              </tr>
            </thead>
            <tbody>
              {#each transactions as tx}
                <tr style="border-bottom:1px solid rgba(0,0,0,0.04);">
                  <td style="padding:var(--space-3) var(--space-4);font-size:var(--text-sm);color:var(--color-text-muted);" class="num">{formatDate(tx.createdAt)}</td>
                  <td style="padding:var(--space-3) var(--space-4);font-size:var(--text-sm);font-weight:700;color:{txColor(tx.type)};">{TX_LABEL[tx.type] ?? tx.type}</td>
                  <td style="padding:var(--space-3) var(--space-4);font-size:var(--text-sm);">
                    {#if tx.pool?.slug}<a href="/pools/{tx.pool.slug}" style="color:var(--color-text);text-decoration:none;font-weight:600;">{tx.pool.name}</a>{:else}<span style="color:var(--color-text-muted);">—</span>{/if}
                  </td>
                  <td style="padding:var(--space-3) var(--space-4);font-size:var(--text-sm);color:var(--color-text-muted);" class="num">{tx.tokens ? fmtTokens(tx.tokens) : '—'}</td>
                  <td style="padding:var(--space-3) var(--space-4);font-size:var(--text-sm);font-weight:700;color:var(--color-text);" class="num">{formatCurrency(tx.amount)}</td>
                  <td style="padding:var(--space-3) var(--space-4);font-size:var(--text-xs);color:var(--color-text-muted);text-transform:uppercase;">{tx.status}</td>
                </tr>
              {/each}
            </tbody>
          </table>
        </div>
      {/if}
    </div>

    <!-- AI Diversification Analysis -->
    <div style="background:linear-gradient(135deg,rgba(212,169,68,0.08) 0%,rgba(212,169,68,0.03) 100%);border:1px solid rgba(212,169,68,0.2);border-radius:var(--radius-lg);padding:var(--space-6);">
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:var(--space-3);">
        <p style="font-size:10px;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;color:#d4a944;">AI Diversification Analysis</p>
        {#if !aiAnalysis}
          <button
            onclick={analyzeDiversification}
            disabled={aiLoading}
            style="font-size:var(--text-xs);font-weight:700;color:#d4a944;background:rgba(212,169,68,0.12);border:1px solid rgba(212,169,68,0.25);border-radius:var(--radius-md);padding:var(--space-1) var(--space-3);cursor:pointer;transition:opacity 0.2s;"
          >
            {aiLoading ? 'Analyzing…' : 'Analyze Diversification ✦'}
          </button>
        {/if}
      </div>
      {#if aiAnalysis}
        <p style="font-size:var(--text-sm);color:var(--color-text);line-height:1.7;">{aiAnalysis}</p>
      {:else if !aiLoading}
        <p style="font-size:var(--text-sm);color:var(--color-text-muted);">Get an AI assessment of your portfolio concentration, geographic exposure, and strategy mix.</p>
      {:else}
        <div style="display:flex;gap:var(--space-2);align-items:center;">
          <div style="width:6px;height:6px;border-radius:50%;background:#d4a944;animation:pulse 1s infinite;"></div>
          <p style="font-size:var(--text-sm);color:var(--color-text-muted);">Analyzing portfolio structure…</p>
        </div>
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
