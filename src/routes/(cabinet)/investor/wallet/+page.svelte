<script lang="ts">
  import { enhance } from '$app/forms';

  let { data, form } = $props();

  const WALLET_COLOR: Record<string, string> = {
    pending: '#92400e', verified: '#3a5bc7', active: '#166534',
    expired: '#6b7280', revoked: '#b91c1c',
  };
  const STATUS_COLOR: Record<string, string> = {
    minted: '#166534', confirmed: '#3a5bc7', awaiting_funds: '#92400e',
    paid: '#166534', created: '#6b7280',
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
  <title>Wallet — Groundz</title>
</svelte:head>

<div style="max-width:900px;">
  <div style="margin-bottom:var(--space-6);">
    <span style="font-size:10px;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;color:var(--color-text-muted);">Tokenization</span>
    <h1 style="font-size:var(--text-2xl);font-weight:700;color:var(--color-text);margin-top:var(--space-1);">Wallet & Token Operations</h1>
  </div>

  {#if form?.error}
    <div style="background:rgba(229,72,77,0.08);border:1px solid rgba(229,72,77,0.25);border-radius:var(--radius-md);padding:var(--space-3) var(--space-4);margin-bottom:var(--space-4);font-size:var(--text-sm);color:#b91c1c;">{form.error}</div>
  {:else if form?.success}
    <div style="background:rgba(34,197,94,0.08);border:1px solid rgba(34,197,94,0.2);border-radius:var(--radius-md);padding:var(--space-3) var(--space-4);margin-bottom:var(--space-4);font-size:var(--text-sm);color:#22c55e;">
      Wallet added — the Groundz team will verify it shortly.
    </div>
  {/if}

  <!-- Wallets -->
  <section class="card" style="padding:var(--space-5);margin-bottom:var(--space-5);">
    <h2 style="font-size:10px;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;color:var(--color-text-muted);margin-bottom:var(--space-3);">My wallet addresses</h2>
    {#if data.wallets.length === 0}
      <p style="font-size:var(--text-sm);color:var(--color-text-muted);margin-bottom:var(--space-4);">
        No wallet yet. Add an EVM address to receive pool tokens — a verified wallet is required before any token purchase.
      </p>
    {:else}
      <table style="width:100%;font-size:var(--text-xs);border-collapse:collapse;margin-bottom:var(--space-4);">
        <tbody>
          {#each data.wallets as w}
            <tr style="border-bottom:1px solid rgba(0,0,0,0.06);">
              <td style="padding:var(--space-2) 0;font-family:var(--font-mono, monospace);">{w.address}</td>
              <td>{w.label ?? ''}</td>
              <td style="text-align:right;"><span style="font-weight:700;color:{WALLET_COLOR[w.status] ?? 'var(--color-text)'};">{w.status}</span></td>
            </tr>
          {/each}
        </tbody>
      </table>
    {/if}
    <form method="POST" action="?/addWallet" use:enhance style="display:flex;gap:var(--space-3);align-items:flex-end;flex-wrap:wrap;">
      <div class="form-group" style="margin-bottom:0;flex:1;min-width:300px;">
        <label class="form-label" for="w-address">EVM address</label>
        <input class="form-input" id="w-address" name="address" placeholder="0x…" required pattern="^0x[a-fA-F0-9]{'{'}40{'}'}$" />
      </div>
      <div class="form-group" style="margin-bottom:0;width:160px;">
        <label class="form-label" for="w-label">Label (optional)</label>
        <input class="form-input" id="w-label" name="label" placeholder="MetaMask" />
      </div>
      <button class="btn btn--primary">Add wallet</button>
    </form>
  </section>

  <!-- Payment intents -->
  <section class="card" style="padding:var(--space-5);margin-bottom:var(--space-5);">
    <h2 style="font-size:10px;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;color:var(--color-text-muted);margin-bottom:var(--space-3);">Token purchases</h2>
    {#if data.paymentIntents.length === 0}
      <p style="font-size:var(--text-sm);color:var(--color-text-muted);">No token purchases yet.</p>
    {:else}
      <table style="width:100%;font-size:var(--text-xs);border-collapse:collapse;">
        <thead>
          <tr style="text-align:left;color:var(--color-text-muted);">
            <th style="padding:var(--space-2) 0;">Pool</th><th>Reference</th><th>Tokens</th><th>Amount</th><th>Status</th><th>Pay by</th>
          </tr>
        </thead>
        <tbody>
          {#each data.paymentIntents as i}
            <tr style="border-bottom:1px solid rgba(0,0,0,0.06);">
              <td style="padding:var(--space-2) 0;">{i.pool.name} {#if i.pool.tokenSymbol}<span style="color:var(--color-text-muted);">({i.pool.tokenSymbol})</span>{/if}</td>
              <td style="font-family:var(--font-mono, monospace);">{i.paymentReference}</td>
              <td class="num">{i.tokens}</td>
              <td class="num">{fmt(i.amount, i.currency)}</td>
              <td><span style="font-weight:700;color:{STATUS_COLOR[i.status] ?? 'var(--color-text)'};">{i.status}</span></td>
              <td>{fmtDate(i.expiresAt)}</td>
            </tr>
          {/each}
        </tbody>
      </table>
      <p style="font-size:var(--text-xs);color:var(--color-text-muted);margin-top:var(--space-3);">
        Use the payment reference in your transfer. Tokens are delivered after funds are confirmed by the issuer.
      </p>
    {/if}
  </section>

  <!-- Payouts -->
  <section class="card" style="padding:var(--space-5);">
    <h2 style="font-size:10px;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;color:var(--color-text-muted);margin-bottom:var(--space-3);">Income distributions</h2>
    {#if data.payouts.length === 0}
      <p style="font-size:var(--text-sm);color:var(--color-text-muted);">No distributions yet.</p>
    {:else}
      <table style="width:100%;font-size:var(--text-xs);border-collapse:collapse;">
        <thead>
          <tr style="text-align:left;color:var(--color-text-muted);">
            <th style="padding:var(--space-2) 0;">Pool / period</th><th>Tokens @ snapshot</th><th>Net amount</th><th>Status</th><th>Paid</th>
          </tr>
        </thead>
        <tbody>
          {#each data.payouts as p}
            <tr style="border-bottom:1px solid rgba(0,0,0,0.06);">
              <td style="padding:var(--space-2) 0;">{p.distribution.pool.name} — {p.distribution.periodLabel}</td>
              <td class="num">{p.snapshotTokens}</td>
              <td class="num">{fmt(p.netAmount, p.currency)}</td>
              <td><span style="font-weight:700;color:{STATUS_COLOR[p.status] ?? 'var(--color-text)'};">{p.status}</span></td>
              <td>{fmtDate(p.paidAt)}</td>
            </tr>
          {/each}
        </tbody>
      </table>
    {/if}
    <p style="font-size:var(--text-xs);color:var(--color-text-muted);margin-top:var(--space-3);">
      Distributions are forecast-based and not guaranteed. Payouts are made by the issuer / paying agent directly — Groundz does not hold or transfer investor funds.
    </p>
  </section>
</div>
