<script lang="ts">
  import StatusBadge from '$lib/components/cabinet/StatusBadge.svelte';

  let { data } = $props();
</script>

<svelte:head>
  <title>Agent Dashboard — Groundz</title>
</svelte:head>

<div class="agent-dash">
  <div class="agent-dash__header">
    <span class="agent-dash__label">AGENT</span>
    <h1 class="agent-dash__title">My Dashboard</h1>
  </div>

  <div class="agent-dash__kpis">
    <div class="kpi-card">
      <span class="kpi-card__label">My Leads</span>
      <span class="kpi-card__value">{data.kpis.myLeadCount}</span>
    </div>
    <div class="kpi-card">
      <span class="kpi-card__label">Hot Leads</span>
      <span class="kpi-card__value kpi-card__value--danger">{data.kpis.myHotLeads}</span>
    </div>
    <div class="kpi-card">
      <span class="kpi-card__label">Total Leads</span>
      <span class="kpi-card__value">{data.kpis.totalLeads}</span>
    </div>
  </div>

  <div class="leads-section">
    <div class="leads-section__header">
      <h2 class="leads-section__title">My Assigned Leads</h2>
      <a href="/agent/leads" class="leads-section__link">View All Leads →</a>
    </div>

    {#if data.myLeads.length > 0}
      <div class="leads-list">
        {#each data.myLeads as lead}
          <a href="/agent/leads/{lead.id}" class="lead-item">
            <div class="lead-item__info">
              <span class="lead-item__name">{lead.name || lead.email || lead.phone || 'Anonymous'}</span>
              <div class="lead-item__meta">
                {#if lead.email}
                  <span>{lead.email}</span>
                {/if}
                {#if lead.phone}
                  <span>{lead.phone}</span>
                {/if}
                <span class="lead-item__date">{new Date(lead.createdAt).toLocaleDateString('en-GB')}</span>
              </div>
            </div>
            <div class="lead-item__badges">
              {#if lead.tag}
                <StatusBadge status={lead.tag} />
              {/if}
              <StatusBadge status={lead.status} />
            </div>
          </a>
        {/each}
      </div>
    {:else}
      <div class="empty-state-card">
        <p class="empty-state">No leads assigned to you yet.</p>
      </div>
    {/if}
  </div>
</div>

<style>
  .agent-dash {
    display: flex;
    flex-direction: column;
    gap: var(--space-8);
    max-width: 1100px;
  }

  .agent-dash__label {
    font-size: 10px;
    font-weight: 700;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    color: var(--color-text-muted);
  }

  .agent-dash__title {
    font-size: var(--text-2xl);
    font-weight: 700;
    color: var(--color-text);
    margin-top: var(--space-1);
  }

  .agent-dash__kpis {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: var(--space-4);
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

  .kpi-card__value--danger {
    color: #ef4444;
  }

  .leads-section__header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: var(--space-4);
  }

  .leads-section__title {
    font-size: var(--text-base);
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.06em;
    color: var(--color-text);
  }

  .leads-section__link {
    font-size: var(--text-sm);
    font-weight: 600;
    color: var(--color-accent);
    text-decoration: none;
  }

  .leads-section__link:hover {
    opacity: 0.75;
  }

  .leads-list {
    background: rgba(255, 255, 255, 0.55);
    -webkit-backdrop-filter: blur(12px);
    backdrop-filter: blur(12px);
    border: 1px solid rgba(0, 0, 0, 0.06);
    border-radius: var(--radius-lg);
    overflow: hidden;
    display: flex;
    flex-direction: column;
  }

  .lead-item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: var(--space-4) var(--space-6);
    border-bottom: 1px solid rgba(0, 0, 0, 0.04);
    text-decoration: none;
    transition: background var(--transition-fast);
  }

  .lead-item:last-child {
    border-bottom: none;
  }

  .lead-item:hover {
    background: rgba(0, 0, 0, 0.02);
  }

  .lead-item__info {
    display: flex;
    flex-direction: column;
    gap: var(--space-1);
  }

  .lead-item__name {
    font-size: var(--text-sm);
    font-weight: 600;
    color: var(--color-text);
  }

  .lead-item__meta {
    display: flex;
    gap: var(--space-3);
    font-size: var(--text-xs);
    color: var(--color-text-muted);
  }

  .lead-item__date {
    color: var(--color-text-muted);
  }

  .lead-item__badges {
    display: flex;
    align-items: center;
    gap: var(--space-2);
  }

  .empty-state-card {
    background: rgba(255, 255, 255, 0.55);
    -webkit-backdrop-filter: blur(12px);
    backdrop-filter: blur(12px);
    border: 1px solid rgba(0, 0, 0, 0.06);
    border-radius: var(--radius-lg);
    padding: var(--space-12);
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .empty-state {
    font-size: var(--text-sm);
    color: var(--color-text-muted);
    text-align: center;
  }

  @media (max-width: 768px) {
    .agent-dash__kpis {
      grid-template-columns: 1fr;
    }
  }
</style>
