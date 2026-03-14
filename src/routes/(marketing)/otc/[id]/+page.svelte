<!-- src/routes/(marketing)/otc/[id]/+page.svelte -->
<script lang="ts">
  let { data } = $props();

  // Offer form state
  let offerAmount = $state('');
  let offerMessage = $state('');
  let submitting = $state(false);
  let submitError = $state('');
  let submitOk = $state(false);

  async function submitOffer() {
    submitting = true;
    submitError = '';
    submitOk = false;
    try {
      const res = await fetch('/api/otc/offers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          listingId: data.listing.id,
          amount: parseFloat(offerAmount),
          message: offerMessage || undefined,
        }),
      });
      const r = await res.json();
      if (!res.ok) { submitError = r.error ?? 'Failed to submit offer'; return; }
      submitOk = true;
      offerAmount = '';
      offerMessage = '';
      // Reload to show new offer in list
      location.reload();
    } catch {
      submitError = 'Network error';
    } finally {
      submitting = false;
    }
  }

  async function acceptOffer(offerId: string) {
    const res = await fetch(`/api/otc/offers/${offerId}/accept`, { method: 'POST' });
    if (res.ok) location.reload();
  }

  async function declineOffer(offerId: string) {
    const res = await fetch(`/api/otc/offers/${offerId}/decline`, { method: 'POST' });
    if (res.ok) location.reload();
  }

  async function cancelListing() {
    if (!confirm('Cancel this listing?')) return;
    const res = await fetch(`/api/otc/listings/${data.listing.id}`, { method: 'DELETE' });
    if (res.ok) location.href = '/otc';
  }

  function assetTypeBadge(t: string) {
    if (t === 'investment_share') return 'INVESTMENT SHARE';
    if (t === 'option_contract') return 'OPTION CONTRACT';
    return 'APARTMENT';
  }

  function timeAgo(iso: string) {
    const days = Math.floor((Date.now() - new Date(iso).getTime()) / 86400000);
    return days === 0 ? 'today' : days === 1 ? '1 day ago' : `${days} days ago`;
  }
</script>

<svelte:head><title>{data.listing.title} — OTC Market</title></svelte:head>

<div class="otc-detail">
  <div class="otc-detail__header">
    <span class="otc-detail__badge">{assetTypeBadge(data.listing.assetType)}</span>
    {#if data.isSeller}<span class="otc-detail__role-badge">My Listing — ACTIVE</span>{/if}
    <h1 class="otc-detail__title">{data.listing.title}</h1>
    <p class="otc-detail__asset">{data.listing.assetSummary}</p>
    {#if data.listing.description}
      <p class="otc-detail__desc">{data.listing.description}</p>
    {/if}
    <p class="otc-detail__price">Ask price: <strong>€{data.listing.askPrice.toLocaleString('en')}</strong> {data.listing.currency}</p>
  </div>

  {#if data.isSeller}
    <!-- Seller view -->
    <section class="otc-detail__offers">
      <h2>Received Offers ({data.offers.length})</h2>
      {#if data.offers.length === 0}
        <p class="otc-empty">No offers yet.</p>
      {:else}
        {#each data.offers as offer}
          <div class="offer-row">
            <span class="offer-row__amount">€{offer.amount.toLocaleString('en')}</span>
            {#if offer.message}<span class="offer-row__msg">"{offer.message}"</span>{/if}
            <span class="offer-row__meta">{timeAgo(offer.createdAt)}</span>
            {#if offer.status === 'pending'}
              <button class="btn btn--primary btn--sm" onclick={() => acceptOffer(offer.id)}>Accept</button>
              <button class="btn btn--ghost btn--sm" onclick={() => declineOffer(offer.id)}>Decline</button>
            {:else}
              <span class="offer-row__status offer-row__status--{offer.status}">{offer.status}</span>
            {/if}
          </div>
        {/each}
      {/if}
    </section>
    <button class="btn btn--danger btn--sm" onclick={cancelListing}>Cancel Listing</button>

  {:else if data.isLoggedIn}
    <!-- Buyer view -->
    <section class="otc-detail__form">
      <h2>Make an Offer</h2>
      {#if submitOk}
        <p class="form-success">Offer submitted!</p>
      {:else}
        <label class="form-label">
          Amount (€)
          <input class="form-input" type="number" bind:value={offerAmount} placeholder="45000" min="1" />
        </label>
        <label class="form-label">
          Message (optional)
          <input class="form-input" type="text" bind:value={offerMessage} placeholder="I'm a long-term investor…" />
        </label>
        {#if submitError}<p class="form-error">{submitError}</p>{/if}
        <button class="btn btn--primary" onclick={submitOffer} disabled={submitting || !offerAmount}>
          {submitting ? 'Submitting…' : 'Submit Offer'}
        </button>
      {/if}
    </section>

    {#if data.offers.length > 0}
      <section class="otc-detail__my-offers">
        <h3>My offers on this listing</h3>
        {#each data.offers as offer}
          <div class="offer-row">
            <span class="offer-row__amount">€{offer.amount.toLocaleString('en')}</span>
            <span class="offer-row__status offer-row__status--{offer.status}">{offer.status}</span>
            <span class="offer-row__meta">submitted {timeAgo(offer.createdAt)}</span>
          </div>
        {/each}
      </section>
    {/if}

  {:else}
    <!-- Public (not logged in) -->
    <div class="otc-detail__auth-cta">
      <a href="/auth/login">Log in</a> or <a href="/auth/register">register</a> to submit an offer.
    </div>
  {/if}
</div>

<style>
  .otc-detail {
    max-width: 720px;
    margin: 0 auto;
    padding: var(--space-12) var(--space-8);
    display: flex;
    flex-direction: column;
    gap: var(--space-8);
  }
  .otc-detail__header { display: flex; flex-direction: column; gap: var(--space-2); }
  .otc-detail__badge {
    font-size: var(--text-xs); font-weight: 700; letter-spacing: 0.08em;
    color: var(--color-accent); text-transform: uppercase;
  }
  .otc-detail__role-badge {
    font-size: var(--text-xs); font-weight: 600; color: var(--color-success, #5a8c5a);
    background: color-mix(in srgb, var(--color-success, #5a8c5a) 12%, transparent);
    padding: 2px 8px; border-radius: var(--radius-sm); align-self: flex-start;
  }
  .otc-detail__title { font-family: var(--font-display); font-size: var(--text-3xl); margin: 0; }
  .otc-detail__asset, .otc-detail__desc { color: var(--color-text-muted); margin: 0; }
  .otc-detail__price { font-size: var(--text-xl); margin: 0; }
  .otc-detail__offers, .otc-detail__form, .otc-detail__my-offers {
    background: var(--color-surface);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-lg);
    padding: var(--space-6);
    display: flex;
    flex-direction: column;
    gap: var(--space-4);
  }
  .otc-detail__offers h2, .otc-detail__form h2, .otc-detail__my-offers h3 {
    margin: 0; font-size: var(--text-lg);
  }
  .offer-row {
    display: flex;
    align-items: center;
    gap: var(--space-3);
    padding: var(--space-3) 0;
    border-bottom: 1px solid var(--color-border);
    flex-wrap: wrap;
  }
  .offer-row:last-child { border-bottom: none; }
  .offer-row__amount { font-weight: 700; font-size: var(--text-lg); }
  .offer-row__msg { color: var(--color-text-muted); font-style: italic; font-size: var(--text-sm); flex: 1; }
  .offer-row__meta { color: var(--color-text-muted); font-size: var(--text-xs); margin-left: auto; }
  .offer-row__status { font-size: var(--text-xs); font-weight: 600; padding: 2px 8px; border-radius: var(--radius-sm); }
  .offer-row__status--pending { background: color-mix(in srgb, var(--color-accent) 12%, transparent); color: var(--color-accent); }
  .offer-row__status--accepted { background: color-mix(in srgb, #5a8c5a 12%, transparent); color: #5a8c5a; }
  .offer-row__status--declined { background: color-mix(in srgb, #8c5a5a 12%, transparent); color: #8c5a5a; }
  .otc-detail__auth-cta {
    padding: var(--space-8);
    text-align: center;
    background: var(--color-surface);
    border-radius: var(--radius-lg);
    border: 1px solid var(--color-border);
  }
  .otc-detail__auth-cta a { color: var(--color-accent); font-weight: 600; }
  .otc-empty { color: var(--color-text-muted); }
  .form-success { color: #5a8c5a; font-weight: 500; }
</style>
