<!-- src/routes/(cabinet)/admin/otc/+page.svelte -->
<script lang="ts">
  import { enhance } from '$app/forms';

  let { data, form } = $props();

  type Tab = 'pending' | 'all';
  let activeTab = $state<Tab>('pending');
  let rejectingId = $state<string | null>(null);
  let rejectNote = $state('');

  let formError = $derived((form as { error?: string } | null)?.error ?? null);

  function formatDate(iso: string) {
    return new Date(iso).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  }

  function assetLabel(t: string) {
    if (t === 'investment_share') return 'Investment Share';
    if (t === 'option_contract') return 'Option Contract';
    return 'Apartment';
  }

  const STATUS_COLORS: Record<string, string> = {
    pending: 'warning', active: 'success', sold: 'info', cancelled: 'neutral', rejected: 'danger'
  };
</script>

<svelte:head><title>OTC Market — Admin</title></svelte:head>

<div style="max-width:1100px;">
  <h1 style="margin-bottom:var(--space-6);">OTC Market</h1>

  {#if formError}<p class="form-error">{formError}</p>{/if}

  <nav class="cabinet-tabs-inline">
    <button class:active={activeTab === 'pending'} onclick={() => activeTab = 'pending'}>
      Pending ({data.pending.length})
    </button>
    <button class:active={activeTab === 'all'} onclick={() => activeTab = 'all'}>
      All Listings ({data.all.length})
    </button>
  </nav>

  {#if activeTab === 'pending'}
    {#if data.pending.length === 0}
      <p class="empty-state">No listings awaiting approval.</p>
    {:else}
      <table class="data-table">
        <thead>
          <tr>
            <th>Title</th><th>Type</th><th>Seller</th><th>Ask Price</th><th>Created</th><th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {#each data.pending as l}
            <tr>
              <td>{l.title}</td>
              <td>{assetLabel(l.assetType)}</td>
              <td>{l.seller.name ?? l.seller.email}</td>
              <td>€{l.askPrice.toLocaleString('en')}</td>
              <td>{formatDate(String(l.createdAt))}</td>
              <td style="display:flex;gap:var(--space-2);flex-wrap:wrap;align-items:center;">
                <form method="POST" action="?/approve" use:enhance>
                  <input type="hidden" name="id" value={l.id} />
                  <button class="btn btn--primary btn--sm" type="submit">Approve</button>
                </form>
                {#if rejectingId === l.id}
                  <form method="POST" action="?/reject" use:enhance onsubmit={() => { rejectingId = null; rejectNote = ''; }}>
                    <input type="hidden" name="id" value={l.id} />
                    <input class="form-input" style="width:160px;" type="text" name="note" bind:value={rejectNote} placeholder="Reason…" required />
                    <button class="btn btn--danger btn--sm" type="submit">Confirm</button>
                    <button type="button" class="btn btn--ghost btn--sm" onclick={() => rejectingId = null}>Cancel</button>
                  </form>
                {:else}
                  <button class="btn btn--ghost btn--sm" onclick={() => { rejectingId = l.id; rejectNote = ''; }}>Reject</button>
                {/if}
              </td>
            </tr>
          {/each}
        </tbody>
      </table>
    {/if}

  {:else}
    <table class="data-table">
      <thead>
        <tr><th>Title</th><th>Status</th><th>Type</th><th>Ask Price</th><th>Offers</th><th>Created</th><th></th></tr>
      </thead>
      <tbody>
        {#each data.all as l}
          <tr>
            <td>{l.title}</td>
            <td><span class="status-badge status-badge--{STATUS_COLORS[l.status] ?? 'neutral'}">{l.status}</span></td>
            <td>{assetLabel(l.assetType)}</td>
            <td>€{l.askPrice.toLocaleString('en')}</td>
            <td>{l._count.offers}</td>
            <td>{formatDate(String(l.createdAt))}</td>
            <td>
              {#if ['pending','active'].includes(l.status)}
                <form method="POST" action="?/cancel" use:enhance>
                  <input type="hidden" name="id" value={l.id} />
                  <button class="btn btn--ghost btn--sm" type="submit">Cancel</button>
                </form>
              {/if}
            </td>
          </tr>
        {/each}
      </tbody>
    </table>
  {/if}
</div>

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
  .empty-state { color: var(--color-text-muted); padding: var(--space-8) 0; }
</style>
