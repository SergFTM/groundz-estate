<script lang="ts">
  import { formatCurrency, formatDate } from '$lib/utils/formatters';

  let { data } = $props();

  const { kpis, poolRows, monthly } = data;

  const maxMonthly = Math.max(...monthly.map(m => m.count), 1);

  const DEAL_LABEL: Record<string, string> = {
    equity:    'Equity',
    debt_note: 'Debt Note',
    rental:    'Rental',
    club_deal: 'Club Deal',
  };

  const STATUS_STYLE: Record<string, { bg: string; color: string }> = {
    active:    { bg: 'rgba(34,197,94,0.1)',   color: '#22c55e' },
    closed:    { bg: 'rgba(100,100,100,0.1)', color: '#888' },
    completed: { bg: 'rgba(59,130,246,0.1)',  color: '#3b82f6' },
  };
</script>

<svelte:head><title>Reporting — Admin</title></svelte:head>

<div style="max-width:1100px;">
  <div style="margin-bottom:var(--space-6);">
    <span style="font-size:10px;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;color:var(--color-text-muted);">Finance</span>
    <h1 style="font-size:var(--text-2xl);font-weight:700;color:var(--color-text);margin-top:var(--space-1);">Platform Reporting</h1>
  </div>

  <!-- Platform KPIs -->
  <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:var(--space-4);margin-bottom:var(--space-8);">
    {#each [
      { label: 'Total Committed',  value: formatCurrency(kpis.totalCommitted),  accent: true },
      { label: 'Total Funded',     value: formatCurrency(kpis.totalFunded),     accent: true },
      { label: 'Total Pool Goal',  value: formatCurrency(kpis.totalGoal) },
      { label: 'Active Pools',     value: String(kpis.activePools) },
      { label: 'Avg Fill Rate',    value: `${kpis.avgFillRate.toFixed(1)}%` },
      { label: 'Total Investors',  value: String(kpis.totalInvestors) },
    ] as kpi}
      <div style="background:rgba(255,255,255,0.6);backdrop-filter:blur(8px);border:1px solid rgba(0,0,0,0.06);border-radius:var(--radius-lg);padding:var(--space-5);">
        <p style="font-size:10px;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;color:var(--color-text-muted);">{kpi.label}</p>
        <p style="font-size:var(--text-xl);font-weight:700;color:{kpi.accent ? 'var(--color-accent)' : 'var(--color-text)'};margin-top:var(--space-2);">{kpi.value}</p>
      </div>
    {/each}
  </div>

  <!-- Two-column: pool table + investor growth chart -->
  <div style="display:grid;grid-template-columns:1fr 280px;gap:var(--space-6);margin-bottom:var(--space-8);">

    <!-- Pool performance table -->
    <div style="background:rgba(255,255,255,0.55);backdrop-filter:blur(12px);-webkit-backdrop-filter:blur(12px);border:1px solid rgba(0,0,0,0.06);border-radius:var(--radius-lg);overflow:hidden;">
      <div style="padding:var(--space-4) var(--space-5);border-bottom:1px solid rgba(0,0,0,0.06);">
        <p style="font-size:10px;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;color:var(--color-text-muted);">Pool Performance</p>
      </div>
      <div style="overflow-x:auto;">
        <table style="width:100%;border-collapse:collapse;min-width:680px;">
          <thead>
            <tr style="border-bottom:1px solid rgba(0,0,0,0.06);">
              {#each ['Pool','Type','Status','Goal','Raised','Fill %','Yield','Investors','Build %'] as col}
                <th style="padding:var(--space-2) var(--space-4);text-align:left;font-size:var(--text-xs);font-weight:700;letter-spacing:0.06em;text-transform:uppercase;color:var(--color-text-muted);">{col}</th>
              {/each}
            </tr>
          </thead>
          <tbody>
            {#each poolRows as p}
              {@const st = STATUS_STYLE[p.status] ?? STATUS_STYLE.closed}
              <tr style="border-bottom:1px solid rgba(0,0,0,0.04);">
                <td style="padding:var(--space-3) var(--space-4);">
                  <a href="/admin/investment-pools/{p.id}/edit" style="font-size:var(--text-sm);font-weight:600;color:var(--color-text);text-decoration:none;">{p.name}</a>
                </td>
                <td style="padding:var(--space-3) var(--space-4);font-size:var(--text-xs);color:var(--color-text-muted);">{p.dealType ? DEAL_LABEL[p.dealType] ?? p.dealType : '—'}</td>
                <td style="padding:var(--space-3) var(--space-4);">
                  <span style="font-size:10px;font-weight:700;text-transform:uppercase;padding:2px 7px;border-radius:99px;background:{st.bg};color:{st.color};">{p.status}</span>
                </td>
                <td style="padding:var(--space-3) var(--space-4);font-size:var(--text-sm);color:var(--color-text);">{formatCurrency(p.goalAmount)}</td>
                <td style="padding:var(--space-3) var(--space-4);font-size:var(--text-sm);font-weight:700;color:var(--color-accent);">{formatCurrency(p.raisedAmount)}</td>
                <td style="padding:var(--space-3) var(--space-4);">
                  <div style="display:flex;align-items:center;gap:var(--space-2);">
                    <div style="width:48px;height:4px;background:rgba(0,0,0,0.07);border-radius:2px;overflow:hidden;">
                      <div style="height:100%;width:{Math.min(p.fillPct,100)}%;background:var(--color-accent);"></div>
                    </div>
                    <span style="font-size:var(--text-xs);font-weight:700;">{p.fillPct.toFixed(0)}%</span>
                  </div>
                </td>
                <td style="padding:var(--space-3) var(--space-4);font-size:var(--text-sm);color:var(--color-text);">{p.targetYield}%</td>
                <td style="padding:var(--space-3) var(--space-4);font-size:var(--text-sm);color:var(--color-text);">{p.investorCount}</td>
                <td style="padding:var(--space-3) var(--space-4);font-size:var(--text-sm);font-weight:700;color:{p.latestPct !== null ? (p.latestPct >= 75 ? '#22c55e' : 'var(--color-text)') : 'var(--color-text-muted)'};">
                  {p.latestPct !== null ? `${p.latestPct}%` : '—'}
                </td>
              </tr>
            {/each}
          </tbody>
          <tfoot>
            <tr style="border-top:2px solid rgba(0,0,0,0.08);">
              <td colspan="3" style="padding:var(--space-3) var(--space-4);font-size:var(--text-xs);font-weight:700;color:var(--color-text-muted);text-transform:uppercase;letter-spacing:0.06em;">Totals</td>
              <td style="padding:var(--space-3) var(--space-4);font-size:var(--text-sm);font-weight:700;color:var(--color-text);">{formatCurrency(kpis.totalGoal)}</td>
              <td style="padding:var(--space-3) var(--space-4);font-size:var(--text-sm);font-weight:700;color:var(--color-accent);">{formatCurrency(kpis.totalCommitted)}</td>
              <td colspan="4" style="padding:var(--space-3) var(--space-4);font-size:var(--text-sm);font-weight:700;color:var(--color-text);">{kpis.avgFillRate.toFixed(1)}% avg</td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>

    <!-- Investor growth (12-month bar chart) -->
    <div style="background:rgba(255,255,255,0.55);backdrop-filter:blur(12px);-webkit-backdrop-filter:blur(12px);border:1px solid rgba(0,0,0,0.06);border-radius:var(--radius-lg);padding:var(--space-5);">
      <p style="font-size:10px;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;color:var(--color-text-muted);margin-bottom:var(--space-5);">New Investors (12 months)</p>
      <div style="display:flex;align-items:flex-end;gap:4px;height:140px;">
        {#each monthly as m}
          <div style="flex:1;display:flex;flex-direction:column;align-items:center;gap:4px;">
            <span style="font-size:9px;color:var(--color-text-muted);">{m.count > 0 ? m.count : ''}</span>
            <div style="width:100%;background:var(--color-accent);opacity:{m.count > 0 ? 0.8 : 0.15};border-radius:2px 2px 0 0;height:{m.count > 0 ? Math.max((m.count / maxMonthly) * 100, 8) : 6}px;"></div>
            <span style="font-size:8px;color:var(--color-text-muted);transform:rotate(-45deg);white-space:nowrap;transform-origin:top left;margin-top:2px;">{m.month}</span>
          </div>
        {/each}
      </div>
    </div>

  </div>

  <!-- Budget variance alert strip -->
  {#if poolRows.some(p => p.budgetVariancePct !== null && p.budgetVariancePct > 5)}
    <div style="background:rgba(239,68,68,0.06);border:1px solid rgba(239,68,68,0.15);border-radius:var(--radius-lg);padding:var(--space-4) var(--space-5);margin-bottom:var(--space-6);">
      <p style="font-size:10px;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;color:#ef4444;margin-bottom:var(--space-3);">Budget Variance Alerts</p>
      {#each poolRows.filter(p => p.budgetVariancePct !== null && p.budgetVariancePct > 5) as p}
        <div style="display:flex;align-items:center;justify-content:space-between;padding:var(--space-2) 0;border-bottom:1px solid rgba(239,68,68,0.08);">
          <span style="font-size:var(--text-sm);font-weight:600;color:var(--color-text);">{p.name}</span>
          <span style="font-size:var(--text-sm);font-weight:700;color:#ef4444;">+{p.budgetVariancePct!.toFixed(1)}% over budget</span>
          <a href="/admin/investment-pools/{p.id}/construction" style="font-size:var(--text-xs);color:var(--color-accent);text-decoration:none;">View Reports →</a>
        </div>
      {/each}
    </div>
  {/if}

  <!-- Commitment status breakdown -->
  <div style="background:rgba(255,255,255,0.55);backdrop-filter:blur(12px);-webkit-backdrop-filter:blur(12px);border:1px solid rgba(0,0,0,0.06);border-radius:var(--radius-lg);padding:var(--space-5);">
    <p style="font-size:10px;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;color:var(--color-text-muted);margin-bottom:var(--space-5);">Pool Raise Progress</p>
    <div style="display:flex;flex-direction:column;gap:var(--space-4);">
      {#each poolRows as p}
        <div>
          <div style="display:flex;justify-content:space-between;align-items:baseline;margin-bottom:var(--space-1);">
            <a href="/admin/investment-pools/{p.id}/edit" style="font-size:var(--text-sm);font-weight:600;color:var(--color-text);text-decoration:none;">{p.name}</a>
            <span style="font-size:var(--text-xs);color:var(--color-text-muted);">{formatCurrency(p.raisedAmount)} / {formatCurrency(p.goalAmount)}</span>
          </div>
          <div style="width:100%;height:6px;background:rgba(0,0,0,0.06);border-radius:3px;overflow:hidden;">
            <div style="height:100%;width:{Math.min(p.fillPct, 100)}%;background:var(--color-accent);border-radius:3px;"></div>
          </div>
        </div>
      {/each}
    </div>
  </div>
</div>
