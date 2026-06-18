<script lang="ts">
  let { data } = $props();
</script>

<svelte:head>
  <title>My Clients — Groundz</title>
</svelte:head>

<div class="clients-page">
  <div class="clients-page__header">
    <span class="clients-page__label">AGENT</span>
    <h1 class="clients-page__title">My Clients</h1>
  </div>

  {#if data.convertedLeads.length > 0}
    <div class="clients-list">
      {#each data.convertedLeads as client}
        <div class="client-item">
          <div class="client-item__info">
            <span class="client-item__name">{client.name ?? client.email ?? client.phone ?? 'Anonymous'}</span>
            <div class="client-item__meta">
              {#if client.email}
                <span>{client.email}</span>
              {/if}
              {#if client.phone}
                <span>{client.phone}</span>
              {/if}
            </div>
          </div>
          <div class="client-item__right">
            <span class="client-item__date">
              Converted {new Date(client.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
            </span>
          </div>
        </div>
      {/each}
    </div>
  {:else}
    <div class="empty-state-card">
      <p class="empty-state">No converted clients yet. Keep following up on your leads!</p>
    </div>
  {/if}
</div>

<style>
  .clients-page {
    display: flex;
    flex-direction: column;
    gap: var(--space-6);
    max-width: 900px;
  }

  .clients-page__label {
    font-size: 10px;
    font-weight: 700;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    color: var(--color-text-muted);
  }

  .clients-page__title {
    font-size: var(--text-2xl);
    font-weight: 700;
    color: var(--color-text);
    margin-top: var(--space-1);
  }

  .clients-list {
    background: rgba(255, 255, 255, 0.55);
    -webkit-backdrop-filter: blur(12px);
    backdrop-filter: blur(12px);
    border: 1px solid rgba(0, 0, 0, 0.06);
    border-radius: var(--radius-lg);
    overflow: hidden;
    display: flex;
    flex-direction: column;
  }

  .client-item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: var(--space-4) var(--space-6);
    border-bottom: 1px solid rgba(0, 0, 0, 0.04);
    transition: background var(--transition-fast);
  }

  .client-item:last-child {
    border-bottom: none;
  }

  .client-item:hover {
    background: rgba(0, 0, 0, 0.02);
  }

  .client-item__info {
    display: flex;
    flex-direction: column;
    gap: var(--space-1);
  }

  .client-item__name {
    font-size: var(--text-sm);
    font-weight: 600;
    color: var(--color-text);
  }

  .client-item__meta {
    display: flex;
    gap: var(--space-3);
    font-size: var(--text-xs);
    color: var(--color-text-muted);
  }

  .client-item__right {
    display: flex;
    align-items: center;
  }

  .client-item__date {
    font-size: var(--text-xs);
    color: var(--color-text-muted);
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
</style>
