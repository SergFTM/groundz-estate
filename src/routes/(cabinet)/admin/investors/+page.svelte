<script lang="ts">
  import { formatCurrency, formatDate } from '$lib/utils/formatters';
  import { onMount } from 'svelte';

  let { data } = $props();

  let search = $state('');
  let filter = $state<'all' | 'approved' | 'pending' | 'missing'>('all');

  let rows = $derived(
    data.rows.filter(r => {
      const matchesSearch = !search ||
        r.name?.toLowerCase().includes(search.toLowerCase()) ||
        r.email.toLowerCase().includes(search.toLowerCase());
      const matchesFilter = filter === 'all' || r.kycStatus === filter;
      return matchesSearch && matchesFilter;
    })
  );

  const KYC_STYLE = {
    approved: { bg: 'rgba(34,197,94,0.1)',  color: '#22c55e', label: 'KYC OK' },
    pending:  { bg: 'rgba(245,158,11,0.1)', color: '#f59e0b', label: 'Pending' },
    missing:  { bg: 'rgba(239,68,68,0.1)',  color: '#ef4444', label: 'Missing' },
  };

  const TOTALS = $derived({
    investors: data.rows.length,
    totalCommitted: data.rows.reduce((s, r) => s + r.totalCommitted, 0),
    funded: data.rows.reduce((s, r) => s + r.funded, 0),
    kycOk: data.rows.filter(r => r.kycStatus === 'approved').length,
  });

  // AI pipeline insight
  let aiSummary = $state<string | null>(null);
  let aiActions = $state<Record<string, string>>({});
  let aiLoading = $state(false);

  onMount(async () => {
    if (!data.rows.length) return;
    aiLoading = true;
    try {
      const res = await fetch('/api/invest/pipeline-insight', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rows: data.rows }),
      });
      if (res.ok) {
        const payload = await res.json();
        aiSummary = payload.summary ?? null;
        aiActions = payload.actions ?? {};
      }
    } catch { /* silent fail */ } finally {
      aiLoading = false;
    }
  });
</script>

<svelte:head><title>Investor Pipeline — Admin</title></svelte:head>

<div style="max-width:1100px;">
  <div style="margin-bottom:var(--space-6);">
    <span style="font-size:10px;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;color:var(--color-text-muted);">CRM</span>
    <h1 style="font-size:var(--text-2xl);font-weight:700;color:var(--color-text);margin-top:var(--space-1);">Investor Pipeline</h1>
  </div>

  <!-- KPIs -->
  <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:var(--space-4);margin-bottom:var(--space-4);">
    {#each [
      { label: 'Total Investors', value: String(TOTALS.investors) },
      { label: 'Total Committed', value: formatCurrency(TOTALS.totalCommitted), accent: true },
      { label: 'Total Funded',    value: formatCurrency(TOTALS.funded) },
      { label: 'KYC Approved',    value: `${TOTALS.kycOk} / ${TOTALS.investors}` },
    ] as kpi}
      <div style="background:rgba(255,255,255,0.6);backdrop-filter:blur(8px);border:1px solid rgba(0,0,0,0.06);border-radius:var(--radius-lg);padding:var(--space-5);">
        <p style="font-size:10px;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;color:var(--color-text-muted);">{kpi.label}</p>
        <p style="font-size:var(--text-xl);font-weight:700;color:{kpi.accent ? 'var(--color-accent)' : 'var(--color-text)'};margin-top:var(--space-2);">{kpi.value}</p>
      </div>
    {/each}
  </div>

  <!-- AI Pipeline Summary -->
  <div style="margin-bottom:var(--space-5);min-height:48px;">
    {#if aiLoading}
      <div style="display:flex;align-items:center;gap:var(--space-2);padding:var(--space-3) var(--space-4);background:rgba(255,255,255,0.5);border:1px solid rgba(0,0,0,0.06);border-radius:var(--radius-md);">
        <span style="font-size:14px;">✦</span>
        <span style="font-size:var(--text-xs);color:var(--color-text-muted);">Analysing pipeline…</span>
      </div>
    {:else if aiSummary}
      <div style="display:flex;align-items:flex-start;gap:var(--space-3);padding:var(--space-3) var(--space-4);background:rgba(255,255,255,0.5);border:1px solid rgba(0,0,0,0.06);border-radius:var(--radius-md);">
        <span style="font-size:14px;flex-shrink:0;margin-top:1px;color:var(--color-accent);">✦</span>
        <p style="font-size:var(--text-sm);color:var(--color-text);line-height:1.5;margin:0;">{aiSummary}</p>
      </div>
    {/if}
  </div>

  <!-- Filters -->
  <div style="display:flex;gap:var(--space-3);align-items:center;margin-bottom:var(--space-5);flex-wrap:wrap;">
    <input
      class="form-input"
      type="text"
      placeholder="Search by name or email…"
      bind:value={search}
      style="max-width:280px;font-size:var(--text-sm);"
    />
    <div style="display:flex;gap:var(--space-2);">
      {#each (['all','approved','pending','missing'] as const) as f}
        <button
          onclick={() => filter = f}
          style="font-size:var(--text-xs);font-weight:700;padding:var(--space-1) var(--space-3);border-radius:var(--radius-md);border:1px solid {filter === f ? 'var(--color-accent)' : 'rgba(0,0,0,0.12)'};background:{filter === f ? 'var(--color-accent)' : 'transparent'};color:{filter === f ? '#fff' : 'var(--color-text-muted)'};cursor:pointer;text-transform:capitalize;"
        >{f === 'all' ? 'All' : f === 'approved' ? 'KYC OK' : f === 'pending' ? 'KYC Pending' : 'KYC Missing'}</button>
      {/each}
    </div>
  </div>

  <div style="background:rgba(255,255,255,0.55);backdrop-filter:blur(12px);-webkit-backdrop-filter:blur(12px);border:1px solid rgba(0,0,0,0.06);border-radius:var(--radius-lg);overflow:hidden;">
    <div style="overflow-x:auto;">
      <table style="width:100%;border-collapse:collapse;min-width:850px;">
        <thead>
          <tr style="border-bottom:1px solid rgba(0,0,0,0.06);">
            {#each ['Investor','KYC','Pools','Committed','Funded','Latest Pool','Joined','Next Action'] as col}
              <th style="padding:var(--space-3) var(--space-4);text-align:left;font-size:var(--text-xs);font-weight:700;letter-spacing:0.06em;text-transform:uppercase;color:var(--color-text-muted);">{col}</th>
            {/each}
          </tr>
        </thead>
        <tbody>
          {#each rows as r}
            {@const kyc = KYC_STYLE[r.kycStatus as keyof typeof KYC_STYLE]}
            {@const action = aiActions[r.id]}
            <tr style="border-bottom:1px solid rgba(0,0,0,0.04);">
              <td style="padding:var(--space-3) var(--space-4);">
                <a href="/admin/users/{r.id}" style="font-size:var(--text-sm);font-weight:600;color:var(--color-text);text-decoration:none;">{r.name ?? '—'}</a>
                <p style="font-size:var(--text-xs);color:var(--color-text-muted);">{r.email}</p>
              </td>
              <td style="padding:var(--space-3) var(--space-4);">
                <span style="font-size:10px;font-weight:700;text-transform:uppercase;padding:2px 8px;border-radius:99px;background:{kyc.bg};color:{kyc.color};">{kyc.label}</span>
              </td>
              <td style="padding:var(--space-3) var(--space-4);font-size:var(--text-sm);color:var(--color-text);">{r.poolCount}</td>
              <td style="padding:var(--space-3) var(--space-4);font-size:var(--text-sm);font-weight:700;color:var(--color-text);">{r.totalCommitted > 0 ? formatCurrency(r.totalCommitted) : '—'}</td>
              <td style="padding:var(--space-3) var(--space-4);font-size:var(--text-sm);font-weight:700;color:#22c55e;">{r.funded > 0 ? formatCurrency(r.funded) : '—'}</td>
              <td style="padding:var(--space-3) var(--space-4);font-size:var(--text-xs);color:var(--color-text-muted);">{r.latestPool ?? '—'}</td>
              <td style="padding:var(--space-3) var(--space-4);font-size:var(--text-xs);color:var(--color-text-muted);white-space:nowrap;">{formatDate(r.createdAt)}</td>
              <td style="padding:var(--space-3) var(--space-4);">
                {#if aiLoading}
                  <span style="font-size:10px;color:var(--color-text-muted);opacity:0.5;">…</span>
                {:else if action}
                  <span style="font-size:var(--text-xs);color:var(--color-accent);font-weight:500;">✦ {action}</span>
                {:else}
                  <span style="font-size:var(--text-xs);color:var(--color-text-muted);">—</span>
                {/if}
              </td>
            </tr>
          {/each}
        </tbody>
      </table>
    </div>
    {#if rows.length === 0}
      <p style="padding:var(--space-8);text-align:center;font-size:var(--text-sm);color:var(--color-text-muted);">No investors found.</p>
    {/if}
  </div>
</div>
