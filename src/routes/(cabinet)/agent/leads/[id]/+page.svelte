<script lang="ts">
  import { enhance } from '$app/forms';
  import StatusBadge from '$lib/components/cabinet/StatusBadge.svelte';
  import DetailCard from '$lib/components/cabinet/DetailCard.svelte';

  let { data, form } = $props();
</script>

<svelte:head>
  <title>Lead — Develta</title>
</svelte:head>

<div class="lead-detail-page">
  <a href="/agent/leads" class="back-link">← Back to Leads</a>

  <DetailCard title={data.lead.name ?? 'Anonymous Lead'} subtitle={data.lead.email ?? undefined}>
    <div class="lead-detail">
      <div class="lead-detail__badges">
        {#if data.lead.tag}
          <StatusBadge status={data.lead.tag} />
        {/if}
        <StatusBadge status={data.lead.status} />
      </div>

      <div class="lead-detail__grid">
        <div class="detail-item">
          <span class="detail-item__label">Name</span>
          <span class="detail-item__value">{data.lead.name ?? '—'}</span>
        </div>
        <div class="detail-item">
          <span class="detail-item__label">Email</span>
          <span class="detail-item__value">{data.lead.email ?? '—'}</span>
        </div>
        <div class="detail-item">
          <span class="detail-item__label">Phone</span>
          <span class="detail-item__value">{data.lead.phone ?? '—'}</span>
        </div>
        <div class="detail-item">
          <span class="detail-item__label">Source</span>
          <span class="detail-item__value">{data.lead.source}</span>
        </div>
        <div class="detail-item">
          <span class="detail-item__label">Created</span>
          <span class="detail-item__value">{new Date(data.lead.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
        </div>
      </div>

      {#if data.canEdit}
        <div class="lead-edit-form">
          <h3 class="lead-edit-form__title">Edit Lead</h3>

          {#if form?.success}
            <div class="form-success">Lead updated successfully.</div>
          {/if}

          {#if form?.error}
            <div class="form-error">Please check the form for errors.</div>
          {/if}

          <form method="POST" action="?/updateLead" use:enhance>
            <div class="form-grid">
              <div class="form-field">
                <label class="form-label" for="name">Name</label>
                <input
                  id="name"
                  name="name"
                  type="text"
                  class="form-input"
                  value={data.lead.name ?? ''}
                />
                {#if form?.error?.name}
                  <span class="form-field-error">{form.error.name[0]}</span>
                {/if}
              </div>

              <div class="form-field">
                <label class="form-label" for="phone">Phone</label>
                <input
                  id="phone"
                  name="phone"
                  type="text"
                  class="form-input"
                  value={data.lead.phone ?? ''}
                />
                {#if form?.error?.phone}
                  <span class="form-field-error">{form.error.phone[0]}</span>
                {/if}
              </div>

              <div class="form-field">
                <label class="form-label" for="tag">Tag</label>
                <select id="tag" name="tag" class="form-select">
                  <option value="" selected={!data.lead.tag}>— None —</option>
                  <option value="hot" selected={data.lead.tag === 'hot'}>Hot</option>
                  <option value="warm" selected={data.lead.tag === 'warm'}>Warm</option>
                  <option value="cold" selected={data.lead.tag === 'cold'}>Cold</option>
                </select>
              </div>

              <div class="form-field">
                <label class="form-label" for="status">Status</label>
                <select id="status" name="status" class="form-select">
                  <option value="new" selected={data.lead.status === 'new'}>New</option>
                  <option value="contacted" selected={data.lead.status === 'contacted'}>Contacted</option>
                  <option value="converted" selected={data.lead.status === 'converted'}>Converted</option>
                  <option value="lost" selected={data.lead.status === 'lost'}>Lost</option>
                </select>
              </div>
            </div>

            <button type="submit" class="btn-submit">Save Changes</button>
          </form>
        </div>
      {:else}
        <div class="read-only-notice">
          <p>You cannot edit leads assigned to other agents.</p>
        </div>
      {/if}
    </div>
  </DetailCard>
</div>

<style>
  .lead-detail-page {
    display: flex;
    flex-direction: column;
    gap: var(--space-5);
    max-width: 800px;
  }

  .back-link {
    font-size: var(--text-sm);
    font-weight: 600;
    color: var(--color-text-muted);
    text-decoration: none;
    transition: color var(--transition-fast);
  }

  .back-link:hover {
    color: var(--color-text);
  }

  .lead-detail {
    display: flex;
    flex-direction: column;
    gap: var(--space-6);
  }

  .lead-detail__badges {
    display: flex;
    gap: var(--space-2);
  }

  .lead-detail__grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: var(--space-3);
  }

  .detail-item {
    display: flex;
    flex-direction: column;
    gap: var(--space-1);
    padding: var(--space-4);
    background: rgba(0, 0, 0, 0.02);
    border-radius: var(--radius-md);
  }

  .detail-item__label {
    font-size: var(--text-xs);
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    color: var(--color-text-muted);
  }

  .detail-item__value {
    font-size: var(--text-sm);
    font-weight: 600;
    color: var(--color-text);
  }

  .lead-edit-form {
    padding-top: var(--space-6);
    border-top: 1px solid rgba(0, 0, 0, 0.06);
  }

  .lead-edit-form__title {
    font-size: var(--text-sm);
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.06em;
    color: var(--color-text);
    margin-bottom: var(--space-5);
  }

  .form-success {
    padding: var(--space-3) var(--space-4);
    background: rgba(34, 197, 94, 0.1);
    border: 1px solid rgba(34, 197, 94, 0.3);
    border-radius: var(--radius-md);
    font-size: var(--text-sm);
    color: #166534;
    margin-bottom: var(--space-4);
  }

  .form-error {
    padding: var(--space-3) var(--space-4);
    background: rgba(239, 68, 68, 0.1);
    border: 1px solid rgba(239, 68, 68, 0.3);
    border-radius: var(--radius-md);
    font-size: var(--text-sm);
    color: #991b1b;
    margin-bottom: var(--space-4);
  }

  .form-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: var(--space-4);
    margin-bottom: var(--space-5);
  }

  .form-field {
    display: flex;
    flex-direction: column;
    gap: var(--space-2);
  }

  .form-label {
    font-size: var(--text-xs);
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    color: var(--color-text-muted);
  }

  .form-input,
  .form-select {
    padding: var(--space-2) var(--space-3);
    font-family: var(--font-body);
    font-size: var(--text-sm);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-sm);
    background: var(--color-bg);
    color: var(--color-text);
    outline: none;
    transition: border-color var(--transition-fast);
  }

  .form-input:focus,
  .form-select:focus {
    border-color: var(--color-accent);
  }

  .form-field-error {
    font-size: var(--text-xs);
    color: #ef4444;
  }

  .btn-submit {
    padding: var(--space-3) var(--space-6);
    font-family: var(--font-body);
    font-size: var(--text-sm);
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.06em;
    background: var(--color-accent);
    color: #fff;
    border: none;
    border-radius: var(--radius-md);
    cursor: pointer;
    transition: opacity var(--transition-fast);
  }

  .btn-submit:hover {
    opacity: 0.85;
  }

  .read-only-notice {
    padding: var(--space-4) var(--space-5);
    background: rgba(120, 120, 120, 0.07);
    border: 1px solid rgba(120, 120, 120, 0.15);
    border-radius: var(--radius-md);
  }

  .read-only-notice p {
    font-size: var(--text-sm);
    color: var(--color-text-muted);
  }

  @media (max-width: 600px) {
    .lead-detail__grid,
    .form-grid {
      grid-template-columns: 1fr;
    }
  }
</style>
