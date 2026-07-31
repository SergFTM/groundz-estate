<script lang="ts">
  import { enhance } from '$app/forms';
  import DetailCard from '$lib/components/cabinet/DetailCard.svelte';

  let { data, form } = $props();

  const pool = $derived(data.pool);
  const available = $derived((pool.totalTokens ?? 0) - pool.tokensSold);

  const INTENT_ACTIONS: Record<string, { to: string; label: string }[]> = {
    awaiting_funds: [
      { to: 'confirmed', label: 'Confirm funds' },
      { to: 'underpaid', label: 'Underpaid' },
      { to: 'expired', label: 'Expire' },
      { to: 'cancelled', label: 'Cancel' },
    ],
    underpaid: [
      { to: 'confirmed', label: 'Confirm funds' },
      { to: 'refunded', label: 'Refund' },
    ],
    overpaid: [
      { to: 'confirmed', label: 'Confirm funds' },
      { to: 'refunded', label: 'Refund' },
    ],
    confirmed: [{ to: 'refunded', label: 'Refund' }],
    expired: [{ to: 'refunded', label: 'Refund' }],
  };

  const STATUS_COLOR: Record<string, string> = {
    minted: '#166534', confirmed: '#3a5bc7', awaiting_funds: '#92400e',
    paid: '#166534', completed: '#166534', paying: '#3a5bc7', snapshotted: '#3a5bc7',
    failed: '#b91c1c', refunded: '#b91c1c', cancelled: '#6b7280', expired: '#6b7280',
  };

  function fmt(n: number, currency = 'EUR') {
    return new Intl.NumberFormat('en-GB', { style: 'currency', currency }).format(n);
  }
  function fmtDate(d: string | Date | null) {
    return d ? new Date(d).toLocaleDateString('en-GB') : '—';
  }
</script>

<svelte:head>
  <title>Tokenization — {pool.name} — Admin — Groundz</title>
</svelte:head>

<a href="/admin/investment-pools/{pool.id}/edit" style="font-size:var(--text-sm);color:var(--color-accent);text-decoration:none;font-weight:600;display:inline-block;margin-bottom:var(--space-4);">← Back to pool</a>

{#if form?.error}
  <div style="background:rgba(229,72,77,0.08);border:1px solid rgba(229,72,77,0.25);border-radius:var(--radius-md);padding:var(--space-3) var(--space-4);margin-bottom:var(--space-4);font-size:var(--text-sm);color:#b91c1c;">{form.error}</div>
{:else if form?.success}
  <div style="background:rgba(34,197,94,0.08);border:1px solid rgba(34,197,94,0.2);border-radius:var(--radius-md);padding:var(--space-3) var(--space-4);margin-bottom:var(--space-4);font-size:var(--text-sm);color:#22c55e;">Done</div>
{/if}

<DetailCard title="Tokenization — {pool.name}" subtitle="{pool.tokenSymbol ?? 'no symbol'} · ERC-3643 (platform-side ledger)">
  <!-- Supply -->
  <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:var(--space-3);margin-bottom:var(--space-6);">
    {#each [
      ['Total supply', pool.totalTokens ?? '—'],
      ['Sold', pool.tokensSold],
      ['Available', pool.totalTokens ? available : '—'],
      ['Price / token', pool.pricePerToken ? fmt(pool.pricePerToken) : '—'],
    ] as [label, val]}
      <div style="background:rgba(0,0,0,0.02);border-radius:var(--radius-md);padding:var(--space-3);">
        <p style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;color:var(--color-text-muted);">{label}</p>
        <p class="num" style="font-size:var(--text-lg);font-weight:700;color:var(--color-text);margin-top:2px;">{val}</p>
      </div>
    {/each}
  </div>

  {#if !pool.totalTokens || !pool.pricePerToken}
    <p style="font-size:var(--text-sm);color:#92400e;background:#fff8ed;border:1px solid #fad59a;border-radius:var(--radius-md);padding:var(--space-3) var(--space-4);margin-bottom:var(--space-6);">
      Pool is not tokenized yet — set Total Tokens and Price per Token in pool settings before creating payment intents.
    </p>
  {/if}

  <!-- Pending wallets -->
  {#if data.pendingWallets.length > 0}
    <h3 style="font-size:10px;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;color:var(--color-text-muted);margin-bottom:var(--space-3);">Pending wallet verifications ({data.pendingWallets.length})</h3>
    <table style="width:100%;font-size:var(--text-xs);border-collapse:collapse;margin-bottom:var(--space-6);">
      <tbody>
        {#each data.pendingWallets as w}
          <tr style="border-bottom:1px solid rgba(0,0,0,0.06);">
            <td style="padding:var(--space-2) 0;">{w.user.name ?? w.user.email}</td>
            <td style="font-family:var(--font-mono, monospace);">{w.address.slice(0, 10)}…{w.address.slice(-6)}</td>
            <td style="text-align:right;">
              <form method="POST" action="?/walletTransition" use:enhance style="display:inline;">
                <input type="hidden" name="walletId" value={w.id} />
                <input type="hidden" name="to" value="verified" />
                <button class="btn btn--primary" style="font-size:10px;padding:2px 10px;">Verify</button>
              </form>
              <form method="POST" action="?/walletTransition" use:enhance style="display:inline;">
                <input type="hidden" name="walletId" value={w.id} />
                <input type="hidden" name="to" value="revoked" />
                <button class="btn" style="font-size:10px;padding:2px 10px;">Revoke</button>
              </form>
            </td>
          </tr>
        {/each}
      </tbody>
    </table>
  {/if}

  <!-- New payment intent -->
  <h3 style="font-size:10px;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;color:var(--color-text-muted);margin-bottom:var(--space-3);">New payment intent</h3>
  <form method="POST" action="?/createIntent" use:enhance style="display:flex;gap:var(--space-3);align-items:flex-end;flex-wrap:wrap;margin-bottom:var(--space-6);">
    <div class="form-group" style="margin-bottom:0;min-width:240px;">
      <label class="form-label" for="int-user">Investor</label>
      <select class="form-input" id="int-user" name="userId" required>
        <option value="">Select investor…</option>
        {#each data.investors as inv}
          <option value={inv.id}>{inv.name ?? inv.email}</option>
        {/each}
      </select>
    </div>
    <div class="form-group" style="margin-bottom:0;width:120px;">
      <label class="form-label" for="int-tokens">Tokens</label>
      <input class="form-input num" id="int-tokens" name="tokens" type="number" min="1" step="1" required />
    </div>
    <button class="btn btn--primary" disabled={!pool.totalTokens}>Create intent</button>
  </form>
  <p style="font-size:var(--text-xs);color:var(--color-text-muted);margin:calc(-1 * var(--space-4)) 0 var(--space-6);">
    Fail closed: requires approved KYC document and a verified wallet. Tokens are minted only after funds are confirmed.
  </p>

  <!-- Intents table -->
  <h3 style="font-size:10px;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;color:var(--color-text-muted);margin-bottom:var(--space-3);">Payment intents ({pool.paymentIntents.length})</h3>
  {#if pool.paymentIntents.length === 0}
    <p style="font-size:var(--text-sm);color:var(--color-text-muted);margin-bottom:var(--space-6);">No payment intents yet.</p>
  {:else}
    <table style="width:100%;font-size:var(--text-xs);border-collapse:collapse;margin-bottom:var(--space-6);">
      <thead>
        <tr style="text-align:left;color:var(--color-text-muted);">
          <th style="padding:var(--space-2) 0;">Investor</th><th>Reference</th><th>Tokens</th><th>Amount</th><th>Status</th><th>Expires</th><th style="text-align:right;">Actions</th>
        </tr>
      </thead>
      <tbody>
        {#each pool.paymentIntents as i}
          <tr style="border-bottom:1px solid rgba(0,0,0,0.06);">
            <td style="padding:var(--space-2) 0;">{i.user.name ?? i.user.email}</td>
            <td style="font-family:var(--font-mono, monospace);">{i.paymentReference}</td>
            <td class="num">{i.tokens}</td>
            <td class="num">{fmt(i.amount, i.currency)}</td>
            <td><span style="font-weight:700;color:{STATUS_COLOR[i.status] ?? 'var(--color-text)'};">{i.status}</span></td>
            <td>{fmtDate(i.expiresAt)}</td>
            <td style="text-align:right;white-space:nowrap;">
              {#each INTENT_ACTIONS[i.status] ?? [] as a}
                <form method="POST" action="?/intentTransition" use:enhance style="display:inline;">
                  <input type="hidden" name="intentId" value={i.id} />
                  <input type="hidden" name="to" value={a.to} />
                  <button class="btn" style="font-size:10px;padding:2px 8px;">{a.label}</button>
                </form>
              {/each}
              {#if i.status === 'confirmed'}
                <form method="POST" action="?/mintIntent" use:enhance style="display:inline;">
                  <input type="hidden" name="intentId" value={i.id} />
                  <button class="btn btn--primary" style="font-size:10px;padding:2px 10px;">Mint</button>
                </form>
              {/if}
            </td>
          </tr>
        {/each}
      </tbody>
    </table>
  {/if}

  <!-- New distribution -->
  <h3 style="font-size:10px;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;color:var(--color-text-muted);margin-bottom:var(--space-3);">New distribution</h3>
  <form method="POST" action="?/createDistribution" use:enhance style="display:flex;gap:var(--space-3);align-items:flex-end;flex-wrap:wrap;margin-bottom:var(--space-3);">
    <div class="form-group" style="margin-bottom:0;min-width:200px;">
      <label class="form-label" for="d-label">Period label</label>
      <input class="form-input" id="d-label" name="periodLabel" placeholder="Q3 2026 rent" required />
    </div>
    <div class="form-group" style="margin-bottom:0;">
      <label class="form-label" for="d-kind">Kind</label>
      <select class="form-input" id="d-kind" name="kind">
        <option value="rental">Rental income</option>
        <option value="exit">Exit proceeds</option>
      </select>
    </div>
    <div class="form-group" style="margin-bottom:0;width:150px;">
      <label class="form-label" for="d-total">Total, EUR</label>
      <input class="form-input num" id="d-total" name="totalAmount" type="number" min="0.01" step="0.01" required />
    </div>
    <div class="form-group" style="margin-bottom:0;flex:1;min-width:220px;">
      <label class="form-label" for="d-formula">Methodology (shown to investors)</label>
      <input class="form-input" id="d-formula" name="formula" placeholder="70% of net rental income for Q3 2026" />
    </div>
    <button class="btn btn--primary">Create</button>
  </form>
  <p style="font-size:var(--text-xs);color:var(--color-text-muted);margin:0 0 var(--space-6);">
    Snapshot fixes holder balances and computes payouts: total × balance / eligible supply (floor to cents). No rebase — income is paid as a separate asset.
  </p>

  <!-- Distributions -->
  {#each pool.distributions as d}
    <div style="border:1px solid rgba(0,0,0,0.08);border-radius:var(--radius-md);padding:var(--space-4);margin-bottom:var(--space-4);">
      <div style="display:flex;align-items:center;justify-content:space-between;gap:var(--space-3);flex-wrap:wrap;">
        <div>
          <span style="font-weight:700;">{d.periodLabel}</span>
          <span style="font-size:var(--text-xs);color:var(--color-text-muted);"> · {d.kind} · {fmt(d.totalAmount, d.currency)}</span>
          {#if d.formula}<p style="font-size:var(--text-xs);color:var(--color-text-muted);margin-top:2px;">{d.formula}</p>{/if}
        </div>
        <div style="display:flex;align-items:center;gap:var(--space-2);">
          <span style="font-size:var(--text-xs);font-weight:700;color:{STATUS_COLOR[d.status] ?? 'var(--color-text)'};">{d.status}</span>
          {#if d.status === 'draft'}
            <form method="POST" action="?/snapshotDistribution" use:enhance style="display:inline;">
              <input type="hidden" name="distributionId" value={d.id} />
              <button class="btn btn--primary" style="font-size:10px;padding:2px 10px;">Snapshot</button>
            </form>
          {:else if d.status === 'snapshotted'}
            <form method="POST" action="?/startPaying" use:enhance style="display:inline;">
              <input type="hidden" name="distributionId" value={d.id} />
              <button class="btn btn--primary" style="font-size:10px;padding:2px 10px;">Start paying</button>
            </form>
          {/if}
        </div>
      </div>
      {#if d.payouts.length > 0}
        <table style="width:100%;font-size:var(--text-xs);border-collapse:collapse;margin-top:var(--space-3);">
          <thead>
            <tr style="text-align:left;color:var(--color-text-muted);">
              <th style="padding:var(--space-1) 0;">Holder</th><th>Tokens @ snapshot</th><th>Net</th><th>Status</th><th style="text-align:right;">Action</th>
            </tr>
          </thead>
          <tbody>
            {#each d.payouts as p}
              <tr style="border-bottom:1px solid rgba(0,0,0,0.05);">
                <td style="padding:var(--space-1) 0;">{p.user.name ?? p.user.email}</td>
                <td class="num">{p.snapshotTokens}</td>
                <td class="num">{fmt(p.netAmount, p.currency)}</td>
                <td><span style="font-weight:700;color:{STATUS_COLOR[p.status] ?? 'var(--color-text)'};">{p.status}</span></td>
                <td style="text-align:right;">
                  {#if d.status === 'paying' && p.status !== 'paid'}
                    <form method="POST" action="?/markPaid" use:enhance style="display:inline;">
                      <input type="hidden" name="payoutId" value={p.id} />
                      <input name="reference" placeholder="tx / payment ref" style="font-size:10px;padding:2px 6px;border:1px solid rgba(0,0,0,0.15);border-radius:4px;width:130px;" />
                      <button class="btn btn--primary" style="font-size:10px;padding:2px 10px;">Mark paid</button>
                    </form>
                  {/if}
                </td>
              </tr>
            {/each}
          </tbody>
        </table>
      {/if}
    </div>
  {/each}
</DetailCard>
