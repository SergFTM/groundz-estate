<script lang="ts">
  import { enhance } from '$app/forms';
  import DetailCard from '$lib/components/cabinet/DetailCard.svelte';
  import StatusBadge from '$lib/components/cabinet/StatusBadge.svelte';

  let { data, form } = $props();
</script>

<svelte:head>
  <title>{data.targetUser.name || data.targetUser.email} — Users — Admin — Develta</title>
</svelte:head>

<a href="/admin/users" style="font-size:var(--text-sm);color:var(--color-accent);text-decoration:none;font-weight:600;display:inline-block;margin-bottom:var(--space-4);">← Back to Users</a>

<DetailCard title={data.targetUser.name || 'Unnamed User'} subtitle={data.targetUser.email}>
  {#if form?.success}
    <div style="background:rgba(34,197,94,0.08);border:1px solid rgba(34,197,94,0.2);border-radius:var(--radius-md);padding:var(--space-3) var(--space-4);margin-bottom:var(--space-4);font-size:var(--text-sm);color:#22c55e;">
      Role updated successfully
    </div>
  {/if}
  {#if form?.error}
    <div style="background:rgba(239,68,68,0.08);border:1px solid rgba(239,68,68,0.2);border-radius:var(--radius-md);padding:var(--space-3) var(--space-4);margin-bottom:var(--space-4);font-size:var(--text-sm);color:#ef4444;">
      {form.error}
    </div>
  {/if}

  <div style="display:grid;grid-template-columns:1fr 1fr;gap:var(--space-8);margin-bottom:var(--space-8);">
    <div>
      <h3 style="font-size:10px;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;color:var(--color-text-muted);margin-bottom:var(--space-4);">User Info</h3>
      <div style="display:flex;flex-direction:column;gap:var(--space-3);">
        <div>
          <span style="font-size:var(--text-xs);color:var(--color-text-muted);display:block;margin-bottom:2px;">Name</span>
          <span style="font-size:var(--text-sm);font-weight:600;color:var(--color-text);">{data.targetUser.name || '—'}</span>
        </div>
        <div>
          <span style="font-size:var(--text-xs);color:var(--color-text-muted);display:block;margin-bottom:2px;">Email</span>
          <span style="font-size:var(--text-sm);color:var(--color-text-body);">{data.targetUser.email}</span>
        </div>
        <div>
          <span style="font-size:var(--text-xs);color:var(--color-text-muted);display:block;margin-bottom:2px;">Phone</span>
          <span style="font-size:var(--text-sm);color:var(--color-text-body);">{data.targetUser.phone || '—'}</span>
        </div>
        <div>
          <span style="font-size:var(--text-xs);color:var(--color-text-muted);display:block;margin-bottom:2px;">Role</span>
          <StatusBadge status={data.targetUser.role} />
        </div>
      </div>
    </div>

    <div>
      <h3 style="font-size:10px;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;color:var(--color-text-muted);margin-bottom:var(--space-4);">Activity</h3>
      <div style="display:flex;flex-direction:column;gap:var(--space-3);">
        <div style="background:rgba(0,0,0,0.03);border-radius:var(--radius-md);padding:var(--space-4);">
          <span style="font-size:var(--text-xs);color:var(--color-text-muted);display:block;margin-bottom:var(--space-1);">Payments</span>
          <span style="font-size:var(--text-2xl);font-family:var(--font-display);font-weight:300;font-style:italic;color:var(--color-text);">{data.targetUser.payments.length}</span>
        </div>
        <div style="background:rgba(0,0,0,0.03);border-radius:var(--radius-md);padding:var(--space-4);">
          <span style="font-size:var(--text-xs);color:var(--color-text-muted);display:block;margin-bottom:var(--space-1);">Documents</span>
          <span style="font-size:var(--text-2xl);font-family:var(--font-display);font-weight:300;font-style:italic;color:var(--color-text);">{data.targetUser.documents.length}</span>
        </div>
      </div>
    </div>
  </div>

  <div style="border-top:1px solid rgba(0,0,0,0.06);padding-top:var(--space-6);">
    <h3 style="font-size:10px;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;color:var(--color-text-muted);margin-bottom:var(--space-4);">Update Role</h3>
    <form method="POST" action="?/updateRole" use:enhance style="display:flex;align-items:flex-end;gap:var(--space-3);">
      <div class="form-group" style="margin-bottom:0;flex:1;max-width:280px;">
        <label class="form-label" for="role">Role</label>
        <select class="form-input" id="role" name="role" value={data.targetUser.role}>
          <option value="buyer">Buyer</option>
          <option value="investor">Investor</option>
          <option value="agent">Agent</option>
          <option value="internal_team">Internal Team</option>
        </select>
      </div>
      <button type="submit" class="btn btn--primary">Update Role</button>
    </form>
  </div>
</DetailCard>
