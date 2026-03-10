<script lang="ts">
  import { formatCurrency } from '$lib/utils/formatters';
  import StatusBadge from '$lib/components/cabinet/StatusBadge.svelte';

  let { data } = $props();
</script>

<svelte:head>
  <title>Admin Dashboard — Develta</title>
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

  @media (max-width: 768px) {
    .admin-dash__kpis { grid-template-columns: 1fr; }
    .admin-dash__widgets { grid-template-columns: 1fr; }
  }
</style>
