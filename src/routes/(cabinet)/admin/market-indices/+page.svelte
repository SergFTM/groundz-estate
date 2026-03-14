<!-- src/routes/(cabinet)/admin/market-indices/+page.svelte -->
<script lang="ts">
  import { enhance } from '$app/forms';

  let { data, form } = $props();

  type Index = typeof data.indices[0];

  let showForm = $state(false);
  let editingId = $state<string | null>(null);

  let fSymbol = $state('');
  let fName = $state('');
  let fMarket = $state('global');
  let fType = $state('etf');
  let fColor = $state('#7a8c6e');
  let fActive = $state(true);
  let fComponents = $state<Array<{ symbol: string; name: string; weight: number }>>([]);

  let totalWeight = $derived(fComponents.reduce((s, c) => s + (c.weight || 0), 0));

  // form error union type fix (project convention)
  let formError = $derived((form as { error?: string } | null)?.error ?? null);

  const MARKETS = ['global', 'europe', 'cyprus', 'georgia', 'dubai', 'turkey'];

  function startCreate() {
    editingId = null;
    fSymbol = ''; fName = ''; fMarket = 'global'; fType = 'etf'; fColor = '#7a8c6e'; fActive = true; fComponents = [];
    showForm = true;
  }

  function startEdit(idx: Index) {
    editingId = idx.id;
    fSymbol = idx.symbol; fName = idx.name; fMarket = idx.market; fType = idx.type;
    fColor = idx.color; fActive = idx.active;
    fComponents = idx.components.map(c => ({ symbol: c.symbol, name: c.name, weight: Math.round(c.weight * 100) }));
    showForm = true;
  }

  function cancelForm() { showForm = false; editingId = null; }

  function addComponent() {
    fComponents = [...fComponents, { symbol: '', name: '', weight: 0 }];
  }

  function removeComponent(i: number) {
    fComponents = fComponents.filter((_, idx) => idx !== i);
  }

  let syncing = $state<Record<string, boolean>>({});
  let syncError = $state<Record<string, string>>({});

  async function runSync(indexId: string, mode: 'initial' | 'daily') {
    syncing = { ...syncing, [indexId]: true };
    syncError = { ...syncError, [indexId]: '' };
    try {
      const res = await fetch('/api/market/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ indexId, mode }),
      });
      const r = await res.json();
      if (!res.ok) syncError = { ...syncError, [indexId]: r.error ?? 'Sync failed' };
      else location.reload();
    } catch {
      syncError = { ...syncError, [indexId]: 'Network error' };
    } finally {
      syncing = { ...syncing, [indexId]: false };
    }
  }

  function getComponentsJson() {
    return JSON.stringify(fComponents.map(c => ({ symbol: c.symbol, name: c.name, weight: c.weight / 100 })));
  }
</script>

<svelte:head><title>Market Indices — Admin</title></svelte:head>

<div style="max-width:1000px;">
  <div style="margin-bottom:var(--space-6);">
    <span style="font-size:10px;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;color:var(--color-text-muted);">CONTENT</span>
    <h1 style="font-size:var(--text-2xl);font-weight:700;color:var(--color-text);margin-top:var(--space-1);">Market Indices</h1>
  </div>

  <div style="display:flex;justify-content:flex-end;margin-bottom:var(--space-5);">
    <button
      onclick={startCreate}
      style="padding:var(--space-2) var(--space-5);border-radius:var(--radius-md);border:none;background:var(--color-accent);color:#fff;font-size:var(--text-sm);font-weight:600;cursor:pointer;"
    >+ Add Index</button>
  </div>

  {#if showForm}
    <div style="background:rgba(255,255,255,0.7);backdrop-filter:blur(8px);border:1px solid rgba(0,0,0,0.08);border-radius:var(--radius-lg);padding:var(--space-6);margin-bottom:var(--space-6);">
      <h2 style="font-size:var(--text-sm);font-weight:700;margin-bottom:var(--space-5);">{editingId ? 'Edit Index' : 'New Index'}</h2>

      <form
        method="POST"
        action={editingId ? '?/update' : '?/create'}
        use:enhance={() => async ({ result }) => { if (result.type === 'success') location.reload(); }}
      >
        {#if editingId}<input type="hidden" name="id" value={editingId} />{/if}
        <input type="hidden" name="components" value={getComponentsJson()} />
        {#if editingId}<input type="hidden" name="active" value={String(fActive)} />{/if}

        <div style="display:grid;grid-template-columns:1fr 2fr 1fr 1fr auto;gap:var(--space-3);align-items:end;margin-bottom:var(--space-4);">
          <div>
            <label style="font-size:var(--text-xs);font-weight:600;display:block;margin-bottom:4px;">Symbol</label>
            <input class="form-input" name="symbol" bind:value={fSymbol} placeholder="VNQ" style="text-transform:uppercase;" required />
          </div>
          <div>
            <label style="font-size:var(--text-xs);font-weight:600;display:block;margin-bottom:4px;">Name</label>
            <input class="form-input" name="name" bind:value={fName} placeholder="Vanguard Real Estate ETF" required />
          </div>
          <div>
            <label style="font-size:var(--text-xs);font-weight:600;display:block;margin-bottom:4px;">Market</label>
            <select class="form-input" name="market" bind:value={fMarket}>
              {#each MARKETS as m}<option value={m}>{m}</option>{/each}
            </select>
          </div>
          <div>
            <label style="font-size:var(--text-xs);font-weight:600;display:block;margin-bottom:4px;">Type</label>
            <select class="form-input" name="type" bind:value={fType}>
              <option value="etf">ETF</option>
              <option value="custom">Custom</option>
            </select>
          </div>
          <div>
            <label style="font-size:var(--text-xs);font-weight:600;display:block;margin-bottom:4px;">Color</label>
            <input type="color" name="color" bind:value={fColor} style="height:38px;border:1px solid rgba(0,0,0,0.12);border-radius:var(--radius-base);padding:2px 4px;cursor:pointer;" />
          </div>
        </div>

        {#if fType === 'custom'}
          <div style="margin-bottom:var(--space-4);">
            <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:var(--space-3);">
              <span style="font-size:var(--text-xs);font-weight:700;">Components</span>
              <span style="font-size:var(--text-xs);color:{Math.abs(totalWeight - 100) < 0.01 ? '#16a34a' : '#ef4444'};">
                Total: {totalWeight.toFixed(0)}% {Math.abs(totalWeight - 100) < 0.01 ? '✓' : '(must be 100%)'}
              </span>
            </div>
            {#each fComponents as c, i}
              <div style="display:grid;grid-template-columns:1fr 2fr 80px auto;gap:var(--space-2);margin-bottom:var(--space-2);">
                <input class="form-input" bind:value={c.symbol} placeholder="Symbol" style="font-size:var(--text-xs);text-transform:uppercase;" />
                <input class="form-input" bind:value={c.name} placeholder="Name" style="font-size:var(--text-xs);" />
                <input class="form-input" type="number" bind:value={c.weight} min="0" max="100" step="0.1" style="font-size:var(--text-xs);" />
                <button type="button" onclick={() => removeComponent(i)} style="padding:var(--space-1) var(--space-2);border:1px solid rgba(239,68,68,0.3);border-radius:var(--radius-sm);background:none;color:#ef4444;font-size:var(--text-xs);cursor:pointer;">×</button>
              </div>
            {/each}
            <button type="button" onclick={addComponent} style="font-size:var(--text-xs);color:var(--color-accent);background:none;border:none;cursor:pointer;padding:0;">+ Add component</button>
          </div>
        {/if}

        {#if formError}<p style="color:#ef4444;font-size:var(--text-xs);margin-bottom:var(--space-3);">{formError}</p>{/if}

        <div style="display:flex;gap:var(--space-3);">
          <button type="submit" style="padding:var(--space-2) var(--space-5);border-radius:var(--radius-md);border:none;background:var(--color-accent);color:#fff;font-size:var(--text-sm);font-weight:600;cursor:pointer;">
            {editingId ? 'Save Changes' : 'Create Index'}
          </button>
          <button type="button" onclick={cancelForm} style="padding:var(--space-2) var(--space-4);border-radius:var(--radius-md);border:1px solid rgba(0,0,0,0.1);background:none;font-size:var(--text-sm);cursor:pointer;">Cancel</button>
        </div>
      </form>
    </div>
  {/if}

  <div style="display:flex;flex-direction:column;gap:var(--space-3);">
    {#each data.indices as idx}
      <div style="background:rgba(255,255,255,0.6);backdrop-filter:blur(8px);border:1px solid rgba(0,0,0,0.06);border-radius:var(--radius-lg);padding:var(--space-4) var(--space-5);">
        <div style="display:flex;align-items:center;gap:var(--space-4);flex-wrap:wrap;">
          <span style="width:10px;height:10px;border-radius:50%;background:{idx.color};flex-shrink:0;"></span>
          <div style="flex:1;min-width:0;">
            <div style="display:flex;align-items:center;gap:var(--space-3);flex-wrap:wrap;">
              <span style="font-size:var(--text-sm);font-weight:700;">{idx.symbol}</span>
              <span style="font-size:var(--text-xs);color:var(--color-text-muted);">{idx.name}</span>
              <span style="font-size:10px;padding:1px 7px;border-radius:99px;background:rgba(0,0,0,0.05);color:var(--color-text-muted);text-transform:uppercase;">{idx.type}</span>
              <span style="font-size:10px;padding:1px 7px;border-radius:99px;background:rgba(0,0,0,0.05);color:var(--color-text-muted);">{idx.market}</span>
              {#if !idx.active}
                <span style="font-size:10px;padding:1px 7px;border-radius:99px;background:rgba(239,68,68,0.08);color:#ef4444;">inactive</span>
              {/if}
            </div>
            <div style="font-size:var(--text-xs);color:var(--color-text-muted);margin-top:2px;">
              {idx._count.prices.toLocaleString()} candles ·
              {idx.lastSyncAt ? `Last sync: ${new Date(idx.lastSyncAt).toLocaleDateString()}` : 'Never synced'}
            </div>
          </div>

          <div style="display:flex;align-items:center;gap:var(--space-2);flex-wrap:wrap;">
            {#if !idx.lastSyncAt}
              <button
                onclick={() => runSync(idx.id, 'initial')}
                disabled={syncing[idx.id]}
                style="font-size:var(--text-xs);padding:var(--space-1) var(--space-3);border-radius:var(--radius-sm);border:1px solid var(--color-accent);background:transparent;color:var(--color-accent);cursor:pointer;opacity:{syncing[idx.id] ? 0.6 : 1};"
              >{syncing[idx.id] ? 'Syncing…' : '↓ Initial Sync'}</button>
            {:else}
              <button
                onclick={() => runSync(idx.id, 'daily')}
                disabled={syncing[idx.id]}
                style="font-size:var(--text-xs);padding:var(--space-1) var(--space-3);border-radius:var(--radius-sm);border:1px solid rgba(0,0,0,0.15);background:transparent;color:var(--color-text-muted);cursor:pointer;"
              >{syncing[idx.id] ? 'Updating…' : '↺ Update'}</button>
            {/if}

            <button
              onclick={() => startEdit(idx)}
              style="font-size:var(--text-xs);padding:var(--space-1) var(--space-3);border-radius:var(--radius-sm);border:1px solid rgba(0,0,0,0.12);background:none;cursor:pointer;"
            >Edit</button>

            <form method="POST" action="?/delete" use:enhance={() => async ({ result }) => { if (result.type === 'success') location.reload(); }}>
              <input type="hidden" name="id" value={idx.id} />
              <button
                type="submit"
                onclick={(e) => { if (!confirm(`Delete ${idx.symbol}?`)) e.preventDefault(); }}
                style="font-size:var(--text-xs);padding:var(--space-1) var(--space-3);border-radius:var(--radius-sm);border:1px solid rgba(239,68,68,0.25);background:none;color:#ef4444;cursor:pointer;"
              >Delete</button>
            </form>
          </div>
        </div>

        {#if syncError[idx.id]}
          <p style="font-size:var(--text-xs);color:#ef4444;margin-top:var(--space-2);">⚠ {syncError[idx.id]}</p>
        {/if}
      </div>
    {/each}

    {#if data.indices.length === 0}
      <p style="text-align:center;padding:var(--space-10);font-size:var(--text-sm);color:var(--color-text-muted);">No indices yet. Add one above.</p>
    {/if}
  </div>
</div>
