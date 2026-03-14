<!-- src/routes/(cabinet)/investor/otc/+page.svelte -->
<script lang="ts">
  let { data } = $props();

  type Tab = 'listings' | 'create' | 'offers';
  let activeTab = $state<Tab>('listings');

  // Create form state
  let fInvestmentId = $state('');
  let fTitle = $state('');
  let fDescription = $state('');
  let fAskPrice = $state('');
  let fExpiresAt = $state('');
  let creating = $state(false);
  let createError = $state('');

  async function createListing() {
    if (!fInvestmentId || !fTitle || !fAskPrice) { createError = 'Investment, title and price required'; return; }
    creating = true;
    createError = '';
    try {
      const res = await fetch('/api/otc/listings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          assetType: 'investment_share',
          investmentId: fInvestmentId,
          title: fTitle,
          description: fDescription || undefined,
          askPrice: parseFloat(fAskPrice),
          expiresAt: fExpiresAt || undefined,
        }),
      });
      const r = await res.json();
      if (!res.ok) { createError = r.error ?? 'Failed'; return; }
      location.reload();
    } catch { createError = 'Network error'; }
    finally { creating = false; }
  }

  async function cancelListing(id: string) {
    if (!confirm('Cancel this listing?')) return;
    const res = await fetch(`/api/otc/listings/${id}`, { method: 'DELETE' });
    if (res.ok) location.reload();
  }

  const STATUS_COLORS: Record<string, string> = {
    pending: 'warning', active: 'success', sold: 'info', cancelled: 'neutral', rejected: 'danger'
  };
</script>

<svelte:head><title>Secondary Market — Investor</title></svelte:head>

<h1 style="margin-bottom: var(--space-6);">Secondary Market</h1>

<nav class="cabinet-tabs-inline">
  <button class:active={activeTab === 'listings'} onclick={() => activeTab = 'listings'}>My Listings ({data.myListings.length})</button>
  <button class:active={activeTab === 'create'} onclick={() => activeTab = 'create'}>Create Listing</button>
  <button class:active={activeTab === 'offers'} onclick={() => activeTab = 'offers'}>My Offers ({data.myOffers.length})</button>
</nav>

{#if activeTab === 'listings'}
  {#if data.myListings.length === 0}
    <p class="empty-state">You have no listings yet.</p>
  {:else}
    <table class="data-table">
      <thead><tr><th>Title</th><th>Status</th><th>Ask Price</th><th>Offers</th><th></th></tr></thead>
      <tbody>
        {#each data.myListings as l}
          <tr>
            <td><a href="/otc/{l.id}">{l.title}</a></td>
            <td><span class="status-badge status-badge--{STATUS_COLORS[l.status] ?? 'neutral'}">{l.status}</span></td>
            <td>€{l.askPrice.toLocaleString('en')}</td>
            <td>{l._count.offers}</td>
            <td>
              {#if ['pending','active'].includes(l.status)}
                <button class="btn btn--ghost btn--sm" onclick={() => cancelListing(l.id)}>Cancel</button>
              {/if}
            </td>
          </tr>
        {/each}
      </tbody>
    </table>
  {/if}

{:else if activeTab === 'create'}
  <div class="form-card" style="max-width:480px;">
    <h2 style="margin:0 0 var(--space-4);">List an Investment</h2>
    <label class="form-label">
      Investment to list
      <select class="form-input" bind:value={fInvestmentId}>
        <option value="">— select —</option>
        {#each data.myInvestments as inv}
          <option value={inv.id}>{inv.pool.name} — €{inv.amount.toLocaleString('en')}</option>
        {/each}
      </select>
    </label>
    <label class="form-label">
      Listing title
      <input class="form-input" type="text" bind:value={fTitle} placeholder="Marina Heights stake, €25k" />
    </label>
    <label class="form-label">
      Description (optional)
      <textarea class="form-input" rows="3" bind:value={fDescription}></textarea>
    </label>
    <label class="form-label">
      Ask price (€)
      <input class="form-input" type="number" bind:value={fAskPrice} placeholder="25000" min="1" />
    </label>
    <label class="form-label">
      Expiry date (optional)
      <input class="form-input" type="date" bind:value={fExpiresAt} />
    </label>
    {#if createError}<p class="form-error">{createError}</p>{/if}
    <button class="btn btn--primary" onclick={createListing} disabled={creating}>
      {creating ? 'Creating…' : 'Submit for Review'}
    </button>
    <p class="form-hint">Listings require admin approval before appearing on the marketplace.</p>
  </div>

{:else}
  {#if data.myOffers.length === 0}
    <p class="empty-state">You haven't submitted any offers yet.</p>
  {:else}
    <table class="data-table">
      <thead><tr><th>Listing</th><th>Your Offer</th><th>Status</th></tr></thead>
      <tbody>
        {#each data.myOffers as o}
          <tr>
            <td><a href="/otc/{o.listing.id}">{o.listing.title}</a></td>
            <td>€{o.amount.toLocaleString('en')}</td>
            <td><span class="status-badge status-badge--{STATUS_COLORS[o.status] ?? 'neutral'}">{o.status}</span></td>
          </tr>
        {/each}
      </tbody>
    </table>
  {/if}
{/if}

<style>
  .cabinet-tabs-inline {
    display: flex; gap: var(--space-2); margin-bottom: var(--space-6);
    border-bottom: 1px solid var(--color-border); padding-bottom: var(--space-3);
  }
  .cabinet-tabs-inline button {
    background: none; border: none; cursor: pointer; padding: var(--space-2) var(--space-4);
    color: var(--color-text-muted); font-size: var(--text-sm); font-weight: 500;
    border-radius: var(--radius-sm); transition: color 0.15s, background 0.15s;
  }
  .cabinet-tabs-inline button:hover { color: var(--color-text); background: var(--color-surface); }
  .cabinet-tabs-inline button.active { color: var(--color-accent); background: color-mix(in srgb, var(--color-accent) 10%, transparent); }
  .form-card {
    background: var(--color-surface); border: 1px solid var(--color-border);
    border-radius: var(--radius-lg); padding: var(--space-6);
    display: flex; flex-direction: column; gap: var(--space-4);
  }
  .form-hint { color: var(--color-text-muted); font-size: var(--text-xs); margin: 0; }
  .empty-state { color: var(--color-text-muted); padding: var(--space-8) 0; }
</style>
