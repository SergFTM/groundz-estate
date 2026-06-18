<script lang="ts">
  import { formatCurrency } from '$lib/utils/formatters';
  import StatusBadge from '$lib/components/cabinet/StatusBadge.svelte';
  import ProgressBar from '$lib/components/ui/ProgressBar.svelte';

  let { data } = $props();

  const adminUser = data as typeof data & { user?: { id: string; role: string } };
</script>

<svelte:head>
  <title>Admin Dashboard — Groundz</title>
</svelte:head>

<div class="admin-dash">
  <div class="admin-dash__header">
    <span class="admin-dash__label">CRM Overview</span>
    <h1 class="admin-dash__title">Dashboard</h1>
  </div>

  <div class="admin-dash__kpis">
    <div class="kpi-card">
      <span class="kpi-card__label">Total Leads</span>
      <span class="kpi-card__value">{data.kpis.totalLeads}</span>
    </div>
    <div class="kpi-card">
      <span class="kpi-card__label">Hot Leads</span>
      <span class="kpi-card__value kpi-card__value--danger">{data.kpis.hotLeads}</span>
    </div>
    <div class="kpi-card">
      <span class="kpi-card__label">Active Units</span>
      <span class="kpi-card__value">{data.kpis.activeUnits}</span>
      <span class="kpi-card__sub">of {data.kpis.totalUnits} total</span>
    </div>
    <div class="kpi-card">
      <span class="kpi-card__label">Overdue Payments</span>
      <span class="kpi-card__value kpi-card__value--warning">{data.kpis.overdueCount}</span>
      <span class="kpi-card__sub">{formatCurrency(data.kpis.overdueTotal)} total</span>
    </div>
  </div>

  <div class="admin-dash__kpis admin-dash__kpis--secondary">
    <div class="kpi-card">
      <span class="kpi-card__label">Total Users</span>
      <span class="kpi-card__value">{data.kpis.totalUsers}</span>
    </div>
    <div class="kpi-card">
      <span class="kpi-card__label">Investment Raised</span>
      <span class="kpi-card__value kpi-card__value--success">{formatCurrency(data.kpis.totalInvestmentRaised)}</span>
    </div>
    <div class="kpi-card">
      <span class="kpi-card__label">Active Pools</span>
      <span class="kpi-card__value">{data.kpis.activePools}</span>
    </div>
    <div class="kpi-card">
      <span class="kpi-card__label">Pending Documents</span>
      <span class="kpi-card__value kpi-card__value--warning">{data.kpis.pendingDocuments}</span>
    </div>
  </div>

  <div class="admin-dash__kpis">
    <div class="kpi-card">
      <span class="kpi-card__label">Conversion Rate</span>
      <span class="kpi-card__value">{data.kpis.conversionRate}%</span>
      <span class="kpi-card__sub">{data.kpis.convertedLeads} of {data.kpis.totalLeads} leads</span>
    </div>
    <div class="kpi-card">
      <span class="kpi-card__label">Units Sold</span>
      <span class="kpi-card__value kpi-card__value--success">{data.kpis.soldUnits}</span>
      <span class="kpi-card__sub">of {data.kpis.totalUnits} total</span>
    </div>
    <div class="kpi-card">
      <span class="kpi-card__label">Units Reserved</span>
      <span class="kpi-card__value kpi-card__value--warning">{data.kpis.reservedUnits}</span>
      <span class="kpi-card__sub">pending sale</span>
    </div>
    <div class="kpi-card">
      <span class="kpi-card__label">Revenue Paid</span>
      <span class="kpi-card__value kpi-card__value--success">{formatCurrency(data.kpis.totalRevenuePaid)}</span>
      <span class="kpi-card__sub">confirmed payments</span>
    </div>
  </div>

  <!-- Investment Operations -->
  <div style="margin-bottom:var(--space-8);">
    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:var(--space-4);">
      <h2 style="font-size:var(--text-sm);font-weight:700;text-transform:uppercase;letter-spacing:0.06em;color:var(--color-text);">Investment Operations</h2>
    </div>
    <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:var(--space-4);margin-bottom:var(--space-5);">
      <a href="/admin/leads?source=investor_application" style="text-decoration:none;">
        <div style="background:rgba(255,255,255,0.6);backdrop-filter:blur(8px);border:1px solid {data.kpis.investorApplications > 0 ? 'rgba(212,169,68,0.3)' : 'rgba(0,0,0,0.06)'};border-radius:var(--radius-lg);padding:var(--space-5);">
          <p style="font-size:10px;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;color:var(--color-text-muted);">New Investor Applications</p>
          <p style="font-size:var(--text-2xl);font-weight:700;color:{data.kpis.investorApplications > 0 ? 'var(--color-accent)' : 'var(--color-text)'};margin-top:var(--space-2);">{data.kpis.investorApplications}</p>
        </div>
      </a>
      <a href="/admin/kyc" style="text-decoration:none;">
        <div style="background:rgba(255,255,255,0.6);backdrop-filter:blur(8px);border:1px solid {data.kpis.kycPending > 0 ? 'rgba(245,158,11,0.3)' : 'rgba(0,0,0,0.06)'};border-radius:var(--radius-lg);padding:var(--space-5);">
          <p style="font-size:10px;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;color:var(--color-text-muted);">KYC Pending Review</p>
          <p style="font-size:var(--text-2xl);font-weight:700;color:{data.kpis.kycPending > 0 ? '#f59e0b' : 'var(--color-text)'};margin-top:var(--space-2);">{data.kpis.kycPending}</p>
        </div>
      </a>
      <a href="/admin/commits" style="text-decoration:none;">
        <div style="background:rgba(255,255,255,0.6);backdrop-filter:blur(8px);border:1px solid rgba(0,0,0,0.06);border-radius:var(--radius-lg);padding:var(--space-5);">
          <p style="font-size:10px;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;color:var(--color-text-muted);">Pending Commits</p>
          <p style="font-size:var(--text-2xl);font-weight:700;color:var(--color-text);margin-top:var(--space-2);">{data.kpis.pendingCommits}</p>
        </div>
      </a>
    </div>

    {#if data.recentCommits.length > 0}
      <div style="background:rgba(255,255,255,0.55);backdrop-filter:blur(12px);-webkit-backdrop-filter:blur(12px);border:1px solid rgba(0,0,0,0.06);border-radius:var(--radius-lg);overflow:hidden;">
        <div style="padding:var(--space-3) var(--space-5);border-bottom:1px solid rgba(0,0,0,0.06);display:flex;justify-content:space-between;align-items:center;">
          <span style="font-size:var(--text-sm);font-weight:700;color:var(--color-text);">Recent Commits</span>
          <a href="/admin/commits" style="font-size:var(--text-xs);font-weight:600;color:var(--color-accent);text-decoration:none;">View all →</a>
        </div>
        {#each data.recentCommits as c, i}
          <div style="display:flex;align-items:center;justify-content:space-between;padding:var(--space-3) var(--space-5);{i < data.recentCommits.length - 1 ? 'border-bottom:1px solid rgba(0,0,0,0.04);' : ''}">
            <div>
              <p style="font-size:var(--text-sm);font-weight:600;color:var(--color-text);">{c.user.name ?? c.user.email}</p>
              <p style="font-size:10px;color:var(--color-text-muted);">{c.pool.name}</p>
            </div>
            <div style="text-align:right;">
              <p style="font-size:var(--text-sm);font-weight:700;color:var(--color-accent);">{formatCurrency(c.amount)}</p>
              <span style="font-size:10px;font-weight:700;text-transform:uppercase;padding:1px 7px;border-radius:99px;background:rgba(245,158,11,0.1);color:#f59e0b;">{c.status.replace('_', ' ')}</span>
            </div>
          </div>
        {/each}
      </div>
    {/if}
  </div>

  <div class="admin-dash__breakdowns">
    <div class="widget">
      <div class="widget__header">
        <span class="widget__title">Leads by Status</span>
      </div>
      <div class="widget__breakdown">
        {#each [
          { label: 'New', key: 'new' },
          { label: 'Contacted', key: 'contacted' },
          { label: 'Converted', key: 'converted' },
          { label: 'Lost', key: 'lost' },
        ] as item}
          <ProgressBar
            value={data.kpis.totalLeads > 0
              ? Math.round(((data.leadStatusCounts[item.key] ?? 0) / data.kpis.totalLeads) * 100)
              : 0}
            label={item.label}
          />
        {/each}
      </div>
    </div>

    <div class="widget">
      <div class="widget__header">
        <span class="widget__title">Units by Type</span>
      </div>
      <div class="widget__breakdown">
        {#each [
          { label: 'Studio', key: 'studio' },
          { label: '1 Bed', key: '1bed' },
          { label: '2 Bed', key: '2bed' },
          { label: '3 Bed', key: '3bed' },
          { label: 'Penthouse', key: 'penthouse' },
        ] as item}
          <ProgressBar
            value={data.kpis.totalUnits > 0
              ? Math.round(((data.unitTypeCounts[item.key] ?? 0) / data.kpis.totalUnits) * 100)
              : 0}
            label={item.label}
          />
        {/each}
      </div>
    </div>
  </div>

  <div class="admin-dash__widgets">
    <div class="widget">
      <div class="widget__header">
        <span class="widget__title">Recent Leads</span>
        <a href="/admin/leads" class="widget__link">View all →</a>
      </div>
      <div class="widget__list">
        {#each data.recentLeads as lead}
          <a href="/admin/leads/{lead.id}" class="widget__item">
            <div>
              <span class="widget__item-name">{lead.name || lead.email || lead.phone || 'Anonymous'}</span>
              <span class="widget__item-meta">{lead.source} · {new Date(lead.createdAt).toLocaleDateString('en-GB')}</span>
            </div>
            {#if lead.tag}
              <StatusBadge status={lead.tag} />
            {/if}
          </a>
        {:else}
          <p class="widget__empty">No leads yet</p>
        {/each}
      </div>
    </div>

    <div class="widget">
      <div class="widget__header">
        <span class="widget__title">Upcoming Payments</span>
        <a href="/admin/payments" class="widget__link">View all →</a>
      </div>
      <div class="widget__list">
        {#each data.upcomingPayments as payment}
          <div class="widget__item">
            <div>
              <span class="widget__item-name">{formatCurrency(payment.amount)}</span>
              <span class="widget__item-meta">{payment.unit.code} · {payment.user.email}</span>
            </div>
            <StatusBadge status={payment.status} />
          </div>
        {:else}
          <p class="widget__empty">No upcoming payments</p>
        {/each}
      </div>
    </div>
  </div>

  <div class="admin-dash__section">
    <h2 class="admin-dash__section-title">Users by Role</h2>
    <div class="admin-dash__role-cards">
      {#each data.usersByRole as group}
        <div class="role-card">
          <span class="role-card__role">{group.role}</span>
          <span class="role-card__count">{group._count}</span>
        </div>
      {:else}
        <p class="widget__empty">No users found</p>
      {/each}
    </div>
  </div>

</div>

<style>
  .admin-dash__header {
    margin-bottom: var(--space-8);
  }

  .admin-dash__label {
    font-size: 10px;
    font-weight: 700;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    color: var(--color-text-muted);
  }

  .admin-dash__title {
    font-size: var(--text-2xl);
    font-weight: 700;
    color: var(--color-text);
    margin-top: var(--space-1);
  }

  .admin-dash__kpis {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: var(--space-4);
    margin-bottom: var(--space-8);
  }

  .kpi-card {
    background: rgba(255, 255, 255, 0.6);
    -webkit-backdrop-filter: blur(8px);
    backdrop-filter: blur(8px);
    border: 1px solid rgba(0, 0, 0, 0.06);
    border-radius: var(--radius-lg);
    padding: var(--space-5);
    display: flex;
    flex-direction: column;
  }

  .kpi-card__label {
    font-size: 10px;
    font-weight: 700;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    color: var(--color-text-muted);
  }

  .kpi-card__value {
    font-family: var(--font-display);
    font-weight: 300;
    font-style: italic;
    font-size: var(--text-4xl);
    color: var(--color-text);
    line-height: 1.2;
    margin-top: var(--space-2);
  }

  .kpi-card__value--danger { color: #ef4444; }
  .kpi-card__value--warning { color: #f59e0b; }
  .kpi-card__value--success { color: #22c55e; }

  .kpi-card__sub {
    font-size: var(--text-xs);
    color: var(--color-text-muted);
    margin-top: var(--space-1);
  }

  .admin-dash__widgets {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: var(--space-4);
  }

  .widget {
    background: rgba(255, 255, 255, 0.6);
    -webkit-backdrop-filter: blur(8px);
    backdrop-filter: blur(8px);
    border: 1px solid rgba(0, 0, 0, 0.06);
    border-radius: var(--radius-lg);
    padding: var(--space-6);
  }

  .widget__header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: var(--space-4);
  }

  .widget__title {
    font-size: var(--text-sm);
    font-weight: 700;
    color: var(--color-text);
  }

  .widget__link {
    font-size: var(--text-xs);
    font-weight: 600;
    color: var(--color-accent);
    text-decoration: none;
  }

  .widget__list {
    display: flex;
    flex-direction: column;
    gap: var(--space-3);
  }

  .widget__item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: var(--space-3) var(--space-4);
    background: rgba(0, 0, 0, 0.02);
    border-radius: var(--radius-md);
    text-decoration: none;
    transition: background var(--transition-fast);
  }

  .widget__item:hover {
    background: rgba(0, 0, 0, 0.04);
  }

  .widget__item-name {
    display: block;
    font-size: var(--text-sm);
    font-weight: 600;
    color: var(--color-text);
  }

  .widget__item-meta {
    display: block;
    font-size: var(--text-xs);
    color: var(--color-text-muted);
    margin-top: 2px;
  }

  .widget__empty {
    font-size: var(--text-sm);
    color: var(--color-text-muted);
  }

  .admin-dash__section {
    margin-top: var(--space-8);
  }

  .admin-dash__section-title {
    font-size: var(--text-lg);
    font-weight: 700;
    color: var(--color-text);
    margin-bottom: var(--space-4);
  }

  .admin-dash__role-cards {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
    gap: var(--space-3);
  }

  .role-card {
    background: rgba(255, 255, 255, 0.6);
    -webkit-backdrop-filter: blur(8px);
    backdrop-filter: blur(8px);
    border: 1px solid rgba(0, 0, 0, 0.06);
    border-radius: var(--radius-lg);
    padding: var(--space-4) var(--space-5);
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .role-card__role {
    font-size: var(--text-sm);
    font-weight: 600;
    color: var(--color-text);
    text-transform: capitalize;
  }

  .role-card__count {
    font-family: var(--font-display);
    font-weight: 300;
    font-style: italic;
    font-size: var(--text-2xl);
    color: var(--color-text);
  }

  .admin-dash__breakdowns {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: var(--space-4);
    margin-top: var(--space-8);
  }

  .widget__breakdown {
    display: flex;
    flex-direction: column;
    gap: var(--space-4);
  }

  .admin-dash__ai {
    margin-top: var(--space-8);
    border-radius: var(--radius-lg);
    overflow: hidden;
    height: 500px;
  }

  @media (max-width: 768px) {
    .admin-dash__kpis { grid-template-columns: 1fr; }
    .admin-dash__widgets { grid-template-columns: 1fr; }
    .admin-dash__breakdowns { grid-template-columns: 1fr; }
  }
</style>
