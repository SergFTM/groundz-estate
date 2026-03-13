<script lang="ts">
  import { enhance } from '$app/forms';
  import DetailCard from '$lib/components/cabinet/DetailCard.svelte';
  import StatusBadge from '$lib/components/cabinet/StatusBadge.svelte';

  let { data, form } = $props();
</script>

<svelte:head>
  <title>{data.lead.name || 'Lead'} — Admin — Develta</title>
</svelte:head>

<a href="/admin/leads" style="font-size:var(--text-sm);color:var(--color-accent);text-decoration:none;font-weight:600;display:inline-block;margin-bottom:var(--space-4);">← Back to Leads</a>

<DetailCard title={data.lead.name || 'Anonymous Lead'} subtitle="Source: {data.lead.source} · Created: {new Date(data.lead.createdAt).toLocaleDateString('en-GB')}">
  {#if form?.success}
    <div style="background:rgba(34,197,94,0.08);border:1px solid rgba(34,197,94,0.2);border-radius:var(--radius-md);padding:var(--space-3) var(--space-4);margin-bottom:var(--space-4);font-size:var(--text-sm);color:#22c55e;">
      Lead updated successfully
    </div>
  {/if}

  <form method="POST" action="?/updateLead" use:enhance>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:var(--space-6);margin-bottom:var(--space-6);">
      <div>
        <h3 style="font-size:10px;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;color:var(--color-text-muted);margin-bottom:var(--space-3);">Contact Info</h3>
        <div style="display:flex;flex-direction:column;gap:var(--space-3);">
          <div class="form-group" style="margin-bottom:0;">
            <label class="form-label" for="name">Name</label>
            <input class="form-input" id="name" name="name" value={data.lead.name ?? ''} />
          </div>
          <div class="form-group" style="margin-bottom:0;">
            <label class="form-label" for="phone">Phone</label>
            <input class="form-input" id="phone" name="phone" value={data.lead.phone ?? ''} />
          </div>
          <div>
            <span style="font-size:var(--text-xs);color:var(--color-text-muted);">Email:</span>
            <span style="font-size:var(--text-sm);">{data.lead.email || '—'}</span>
          </div>
        </div>
      </div>

      <div>
        <h3 style="font-size:10px;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;color:var(--color-text-muted);margin-bottom:var(--space-3);">Classification</h3>
        <div style="display:flex;flex-direction:column;gap:var(--space-3);">
          <div class="form-group" style="margin-bottom:0;">
            <label class="form-label" for="tag">Tag</label>
            <select class="form-input" id="tag" name="tag" value={data.lead.tag}>
              <option value="hot">Hot</option>
              <option value="warm">Warm</option>
              <option value="cold">Cold</option>
            </select>
          </div>
          <div class="form-group" style="margin-bottom:0;">
            <label class="form-label" for="status">Status</label>
            <select class="form-input" id="status" name="status" value={data.lead.status}>
              <option value="new">New</option>
              <option value="contacted">Contacted</option>
              <option value="converted">Converted</option>
              <option value="lost">Lost</option>
            </select>
          </div>
          <div class="form-group" style="margin-bottom:0;">
            <label class="form-label" for="agentId">Assigned Agent</label>
            <select class="form-input" id="agentId" name="agentId" value={data.lead.agentId ?? ''}>
              <option value="">Unassigned</option>
              {#each data.agents as agent}
                <option value={agent.id}>{agent.name || agent.email}</option>
              {/each}
            </select>
          </div>
        </div>
      </div>
    </div>

    {#if data.lead.data}
      {@const parsed = (() => { try { return JSON.parse(data.lead.data); } catch { return null; } })()}
      {#if parsed}
        <div style="margin-bottom:var(--space-6);">
          {#if data.lead.source === 'investor_application'}
            <h3 style="font-size:10px;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;color:var(--color-text-muted);margin-bottom:var(--space-4);">Application Details</h3>
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:var(--space-3);">
              {#each [
                ['Nationality',       parsed.nationality],
                ['Investor Type',     parsed.investorType?.replace('_', ' ')],
                ['Ticket Size',       parsed.ticketSize?.replace(/_/g, ' ')],
                ['Deal Types',        parsed.dealTypeInterest],
                ['Time Horizon',      parsed.timeHorizon],
              ] as [label, val]}
                {#if val}
                  <div style="background:rgba(0,0,0,0.02);border-radius:var(--radius-md);padding:var(--space-3);">
                    <p style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;color:var(--color-text-muted);">{label}</p>
                    <p style="font-size:var(--text-sm);font-weight:600;color:var(--color-text);margin-top:2px;">{val}</p>
                  </div>
                {/if}
              {/each}
            </div>
            {#if parsed.message}
              <div style="margin-top:var(--space-4);background:rgba(0,0,0,0.02);border-radius:var(--radius-md);padding:var(--space-3);">
                <p style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;color:var(--color-text-muted);margin-bottom:var(--space-2);">Message</p>
                <p style="font-size:var(--text-sm);color:var(--color-text-muted);line-height:1.65;">{parsed.message}</p>
              </div>
            {/if}
          {:else}
            <h3 style="font-size:10px;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;color:var(--color-text-muted);margin-bottom:var(--space-3);">Form Data</h3>
            <pre style="font-size:var(--text-xs);background:rgba(0,0,0,0.03);padding:var(--space-4);border-radius:var(--radius-md);overflow-x:auto;">{JSON.stringify(parsed, null, 2)}</pre>
          {/if}
        </div>
      {/if}
    {/if}

    <button type="submit" class="btn btn--primary">Save Changes</button>
  </form>
</DetailCard>
