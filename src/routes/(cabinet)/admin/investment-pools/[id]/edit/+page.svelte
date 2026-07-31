<script lang="ts">
  import { enhance } from '$app/forms';
  import { formatCurrency, formatDate } from '$lib/utils/formatters';

  let { data, form } = $props();

  let formErrors = $derived(
    (form as { errors?: Record<string, string> } | null)?.errors ?? {}
  );
</script>

<svelte:head>
  <title>Edit {data.pool.name} — Admin — Groundz</title>
</svelte:head>

<a href="/admin/investment-pools" style="font-size:var(--text-sm);color:var(--color-accent);text-decoration:none;font-weight:600;display:inline-block;margin-bottom:var(--space-4);">← Back to Pools</a>

<div style="display:flex;align-items:flex-end;justify-content:space-between;margin-bottom:var(--space-6);">
  <div>
    <span style="font-size:10px;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;color:var(--color-text-muted);">Finance</span>
    <h1 style="font-size:var(--text-2xl);font-weight:700;color:var(--color-text);margin-top:var(--space-1);">Edit Investment Pool</h1>
  </div>
</div>

{#if form?.success}
  <div style="background:rgba(34,197,94,0.08);border:1px solid rgba(34,197,94,0.2);border-radius:var(--radius-md);padding:var(--space-3) var(--space-4);margin-bottom:var(--space-4);font-size:var(--text-sm);color:#22c55e;">
    Pool updated successfully.
  </div>
{/if}

<div style="background:rgba(255,255,255,0.55);backdrop-filter:blur(12px);-webkit-backdrop-filter:blur(12px);border:1px solid rgba(0,0,0,0.06);border-radius:var(--radius-lg);padding:var(--space-8);margin-bottom:var(--space-6);">
  <form method="POST" action="?/update" use:enhance>

    <!-- Basic Info -->
    <p style="font-size:10px;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;color:var(--color-text-muted);margin-bottom:var(--space-4);">Basic Info</p>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:var(--space-6);margin-bottom:var(--space-6);">
      <div class="form-group" style="margin-bottom:0;">
        <label class="form-label" for="name">Pool Name *</label>
        <input class="form-input" id="name" name="name" value={data.pool.name} required />
        {#if formErrors.name}<p style="font-size:var(--text-xs);color:#ef4444;margin-top:var(--space-1);">{formErrors.name}</p>{/if}
      </div>
      <div class="form-group" style="margin-bottom:0;">
        <label class="form-label" for="slug">Slug (URL) <span style="color:var(--color-text-muted);font-weight:400;">optional</span></label>
        <input class="form-input" id="slug" name="slug" value={data.pool.slug ?? ''} placeholder="marina-tower-fund" />
        {#if formErrors.slug}<p style="font-size:var(--text-xs);color:#ef4444;margin-top:var(--space-1);">{formErrors.slug}</p>{/if}
      </div>
      <div class="form-group" style="margin-bottom:0;">
        <label class="form-label" for="projectName">Project Name *</label>
        <input class="form-input" id="projectName" name="projectName" value={data.pool.projectName} required />
        {#if formErrors.projectName}<p style="font-size:var(--text-xs);color:#ef4444;margin-top:var(--space-1);">{formErrors.projectName}</p>{/if}
      </div>
      <div class="form-group" style="margin-bottom:0;">
        <label class="form-label" for="dealType">Deal Type</label>
        <select class="form-input" id="dealType" name="dealType">
          <option value="">— select —</option>
          {#each [['equity','Equity'],['debt_note','Debt Note'],['rental','Rental'],['club_deal','Club Deal']] as [val, lbl]}
            <option value={val} selected={data.pool.dealType === val}>{lbl}</option>
          {/each}
        </select>
      </div>
      <div class="form-group" style="margin-bottom:0;">
        <label class="form-label" for="country">Country *</label>
        <input class="form-input" id="country" name="country" value={data.pool.country} required />
      </div>
      <div class="form-group" style="margin-bottom:0;">
        <label class="form-label" for="city">City <span style="color:var(--color-text-muted);font-weight:400;">optional</span></label>
        <input class="form-input" id="city" name="city" value={data.pool.city ?? ''} placeholder="Limassol" />
      </div>
    </div>

    <hr style="border:none;border-top:1px solid rgba(0,0,0,0.06);margin-bottom:var(--space-6);" />

    <!-- Financial Terms -->
    <p style="font-size:10px;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;color:var(--color-text-muted);margin-bottom:var(--space-4);">Financial Terms</p>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:var(--space-6);margin-bottom:var(--space-6);">
      <div class="form-group" style="margin-bottom:0;">
        <label class="form-label" for="goalAmount">Goal Amount (€) *</label>
        <input class="form-input" id="goalAmount" name="goalAmount" type="number" value={data.pool.goalAmount} required />
        {#if formErrors.goalAmount}<p style="font-size:var(--text-xs);color:#ef4444;margin-top:var(--space-1);">{formErrors.goalAmount}</p>{/if}
      </div>
      <div class="form-group" style="margin-bottom:0;">
        <label class="form-label" for="raisedAmount">Raised Amount (€)</label>
        <input class="form-input" id="raisedAmount" name="raisedAmount" type="number" value={data.pool.raisedAmount} />
        {#if formErrors.raisedAmount}<p style="font-size:var(--text-xs);color:#ef4444;margin-top:var(--space-1);">{formErrors.raisedAmount}</p>{/if}
      </div>
      <div class="form-group" style="margin-bottom:0;">
        <label class="form-label" for="targetYield">Target Yield (% p.a.) *</label>
        <input class="form-input" id="targetYield" name="targetYield" type="number" step="0.1" value={data.pool.targetYield} required />
        {#if formErrors.targetYield}<p style="font-size:var(--text-xs);color:#ef4444;margin-top:var(--space-1);">{formErrors.targetYield}</p>{/if}
      </div>
      <div class="form-group" style="margin-bottom:0;">
        <label class="form-label" for="targetIrr">Target IRR (%) <span style="color:var(--color-text-muted);font-weight:400;">optional</span></label>
        <input class="form-input" id="targetIrr" name="targetIrr" type="number" step="0.1" value={data.pool.targetIrr ?? ''} placeholder="12" />
      </div>
      <div class="form-group" style="margin-bottom:0;">
        <label class="form-label" for="preferredReturn">Preferred Return (%) <span style="color:var(--color-text-muted);font-weight:400;">optional</span></label>
        <input class="form-input" id="preferredReturn" name="preferredReturn" type="number" step="0.1" value={data.pool.preferredReturn ?? ''} placeholder="7" />
      </div>
      <div class="form-group" style="margin-bottom:0;">
        <label class="form-label" for="termMonths">Term (months) *</label>
        <input class="form-input" id="termMonths" name="termMonths" type="number" value={data.pool.termMonths} required />
        {#if formErrors.termMonths}<p style="font-size:var(--text-xs);color:#ef4444;margin-top:var(--space-1);">{formErrors.termMonths}</p>{/if}
      </div>
      <div class="form-group" style="margin-bottom:0;">
        <label class="form-label" for="minTicket">Min Ticket (€) *</label>
        <input class="form-input" id="minTicket" name="minTicket" type="number" value={data.pool.minTicket} required />
        {#if formErrors.minTicket}<p style="font-size:var(--text-xs);color:#ef4444;margin-top:var(--space-1);">{formErrors.minTicket}</p>{/if}
      </div>
      <div class="form-group" style="margin-bottom:0;">
        <label class="form-label" for="maxTicket">Max Ticket (€) <span style="color:var(--color-text-muted);font-weight:400;">optional</span></label>
        <input class="form-input" id="maxTicket" name="maxTicket" type="number" value={data.pool.maxTicket ?? ''} placeholder="500000" />
      </div>
    </div>

    <hr style="border:none;border-top:1px solid rgba(0,0,0,0.06);margin-bottom:var(--space-6);" />

    <!-- Deal Structure -->
    <p style="font-size:10px;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;color:var(--color-text-muted);margin-bottom:var(--space-4);">Deal Structure</p>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:var(--space-6);margin-bottom:var(--space-6);">
      <div class="form-group" style="margin-bottom:0;">
        <label class="form-label" for="exitType">Exit Type</label>
        <select class="form-input" id="exitType" name="exitType">
          <option value="">— select —</option>
          {#each [['sale','Sale'],['refinance','Refinance'],['hybrid','Hybrid']] as [val, lbl]}
            <option value={val} selected={data.pool.exitType === val}>{lbl}</option>
          {/each}
        </select>
      </div>
      <div class="form-group" style="margin-bottom:0;">
        <label class="form-label" for="capitalType">Capital Type</label>
        <select class="form-input" id="capitalType" name="capitalType">
          <option value="">— select —</option>
          {#each [['equity','Equity'],['mezzanine','Mezzanine'],['senior_debt','Senior Debt']] as [val, lbl]}
            <option value={val} selected={data.pool.capitalType === val}>{lbl}</option>
          {/each}
        </select>
      </div>
      <div class="form-group" style="margin-bottom:0;">
        <label class="form-label" for="spvName">SPV Name <span style="color:var(--color-text-muted);font-weight:400;">optional</span></label>
        <input class="form-input" id="spvName" name="spvName" value={data.pool.spvName ?? ''} placeholder="Marina Tower SPV Ltd" />
      </div>
      <div class="form-group" style="margin-bottom:0;">
        <label class="form-label" for="developerCoinvestPct">Developer Co-invest (%) <span style="color:var(--color-text-muted);font-weight:400;">0–100</span></label>
        <input class="form-input" id="developerCoinvestPct" name="developerCoinvestPct" type="number" step="0.1" min="0" max="100" value={data.pool.developerCoinvestPct ?? ''} placeholder="20" />
      </div>
      <div class="form-group" style="margin-bottom:0;">
        <label class="form-label" for="ltv">LTV (%) <span style="color:var(--color-text-muted);font-weight:400;">optional</span></label>
        <input class="form-input" id="ltv" name="ltv" type="number" step="0.1" value={data.pool.ltv ?? ''} placeholder="65" />
      </div>
      <div class="form-group" style="margin-bottom:0;">
        <label class="form-label" for="ltc">LTC (%) <span style="color:var(--color-text-muted);font-weight:400;">optional</span></label>
        <input class="form-input" id="ltc" name="ltc" type="number" step="0.1" value={data.pool.ltc ?? ''} placeholder="70" />
      </div>
    </div>

    <hr style="border:none;border-top:1px solid rgba(0,0,0,0.06);margin-bottom:var(--space-6);" />

    <!-- Status & Media -->
    <p style="font-size:10px;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;color:var(--color-text-muted);margin-bottom:var(--space-4);">Status & Media</p>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:var(--space-6);margin-bottom:var(--space-6);">
      <div class="form-group" style="margin-bottom:0;">
        <label class="form-label" for="status">Status</label>
        <select class="form-input" id="status" name="status">
          {#each [['active','Active'],['closed','Closed'],['completed','Completed']] as [val, lbl]}
            <option value={val} selected={data.pool.status === val}>{lbl}</option>
          {/each}
        </select>
      </div>
      <div class="form-group" style="margin-bottom:0;">
        <label class="form-label" for="imageUrl">Image URL <span style="color:var(--color-text-muted);font-weight:400;">optional</span></label>
        <input class="form-input" id="imageUrl" name="imageUrl" type="url" value={data.pool.imageUrl ?? ''} placeholder="https://..." />
        {#if formErrors.imageUrl}<p style="font-size:var(--text-xs);color:#ef4444;margin-top:var(--space-1);">{formErrors.imageUrl}</p>{/if}
      </div>
      <div class="form-group" style="margin-bottom:0;grid-column:1/-1;">
        <label class="form-label" for="description">Description <span style="color:var(--color-text-muted);font-weight:400;">optional</span></label>
        <textarea class="form-input" id="description" name="description" rows="3" style="resize:vertical;">{data.pool.description ?? ''}</textarea>
      </div>
    </div>

    <hr style="border:none;border-top:1px solid rgba(0,0,0,0.06);margin-bottom:var(--space-6);" />

    <!-- Investment Thesis -->
    <p style="font-size:10px;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;color:var(--color-text-muted);margin-bottom:var(--space-4);">Investment Thesis <span style="font-weight:400;color:var(--color-text-muted);">— shown on pool detail page</span></p>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:var(--space-6);margin-bottom:var(--space-6);">
      <div class="form-group" style="margin-bottom:0;">
        <label class="form-label" for="locationThesis">Location Thesis</label>
        <textarea class="form-input" id="locationThesis" name="locationThesis" rows="3" style="resize:vertical;">{data.pool.locationThesis ?? ''}</textarea>
      </div>
      <div class="form-group" style="margin-bottom:0;">
        <label class="form-label" for="demandThesis">Demand Thesis</label>
        <textarea class="form-input" id="demandThesis" name="demandThesis" rows="3" style="resize:vertical;">{data.pool.demandThesis ?? ''}</textarea>
      </div>
      <div class="form-group" style="margin-bottom:0;">
        <label class="form-label" for="constructionThesis">Construction Thesis</label>
        <textarea class="form-input" id="constructionThesis" name="constructionThesis" rows="3" style="resize:vertical;">{data.pool.constructionThesis ?? ''}</textarea>
      </div>
      <div class="form-group" style="margin-bottom:0;">
        <label class="form-label" for="exitThesis">Exit Thesis</label>
        <textarea class="form-input" id="exitThesis" name="exitThesis" rows="3" style="resize:vertical;">{data.pool.exitThesis ?? ''}</textarea>
      </div>
    </div>

    <div style="display:flex;gap:var(--space-3);align-items:center;">
      <button type="submit" class="btn btn--primary">Save Changes</button>
      <a href="/admin/investment-pools" style="font-size:var(--text-sm);color:var(--color-text-muted);text-decoration:none;">Cancel</a>
    </div>
  </form>
</div>

<!-- Quick sub-section links -->
<div style="display:flex;gap:var(--space-3);margin-bottom:var(--space-6);flex-wrap:wrap;">
  <a href="/admin/investment-pools/{data.pool.id}/construction" style="font-size:var(--text-xs);font-weight:700;color:var(--color-accent);background:rgba(212,169,68,0.08);border:1px solid rgba(212,169,68,0.2);border-radius:var(--radius-md);padding:var(--space-2) var(--space-4);text-decoration:none;">🏗 Construction Reports →</a>
  <a href="/admin/investment-pools/{data.pool.id}/data-room" style="font-size:var(--text-xs);font-weight:700;color:var(--color-accent);background:rgba(212,169,68,0.08);border:1px solid rgba(212,169,68,0.2);border-radius:var(--radius-md);padding:var(--space-2) var(--space-4);text-decoration:none;">📁 Data Room →</a>
  <a href="/admin/investment-pools/{data.pool.id}/tokenization" style="font-size:var(--text-xs);font-weight:700;color:var(--color-accent);background:rgba(212,169,68,0.08);border:1px solid rgba(212,169,68,0.2);border-radius:var(--radius-md);padding:var(--space-2) var(--space-4);text-decoration:none;">🪙 Tokenization →</a>
</div>

<!-- Milestones -->
<div style="margin-bottom:var(--space-6);">
  <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:var(--space-4);">
    <h2 style="font-size:10px;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;color:var(--color-text-muted);">Milestones ({data.pool.milestones?.length ?? 0})</h2>
    <a href="/admin/investment-pools/{data.pool.id}/milestones/new" style="font-size:var(--text-sm);color:var(--color-accent);font-weight:600;text-decoration:none;">+ Add Milestone</a>
  </div>
  {#if data.pool.milestones?.length}
    <div style="background:rgba(255,255,255,0.55);backdrop-filter:blur(12px);-webkit-backdrop-filter:blur(12px);border:1px solid rgba(0,0,0,0.06);border-radius:var(--radius-lg);overflow:hidden;">
      <table style="width:100%;border-collapse:collapse;">
        <thead>
          <tr style="border-bottom:1px solid rgba(0,0,0,0.06);">
            {#each ['Title','Status','Target Date','Actions'] as col}
              <th style="padding:var(--space-3) var(--space-4);text-align:left;font-size:var(--text-xs);font-weight:700;letter-spacing:0.05em;text-transform:uppercase;color:var(--color-text-muted);">{col}</th>
            {/each}
          </tr>
        </thead>
        <tbody>
          {#each data.pool.milestones as ms}
            <tr style="border-bottom:1px solid rgba(0,0,0,0.04);">
              <td style="padding:var(--space-3) var(--space-4);font-size:var(--text-sm);font-weight:600;">{ms.name}</td>
              <td style="padding:var(--space-3) var(--space-4);">
                <span style="font-size:var(--text-xs);font-weight:700;text-transform:uppercase;padding:2px 8px;border-radius:99px;
                  background:{ms.status === 'completed' ? 'rgba(34,197,94,0.12)' : ms.status === 'in_progress' ? 'rgba(234,179,8,0.12)' : 'rgba(0,0,0,0.06)'};
                  color:{ms.status === 'completed' ? '#22c55e' : ms.status === 'in_progress' ? '#ca8a04' : 'var(--color-text-muted)'};">
                  {ms.status}
                </span>
              </td>
              <td style="padding:var(--space-3) var(--space-4);font-size:var(--text-sm);color:var(--color-text-muted);">{formatDate(ms.plannedDate)}</td>
              <td style="padding:var(--space-3) var(--space-4);">
                <a href="/admin/investment-pools/{data.pool.id}/milestones/{ms.id}/edit" style="font-size:var(--text-xs);color:var(--color-accent);text-decoration:none;font-weight:600;">Edit</a>
              </td>
            </tr>
          {/each}
        </tbody>
      </table>
    </div>
  {:else}
    <div style="background:rgba(255,255,255,0.55);backdrop-filter:blur(12px);-webkit-backdrop-filter:blur(12px);border:1px solid rgba(0,0,0,0.06);border-radius:var(--radius-lg);padding:var(--space-6);text-align:center;color:var(--color-text-muted);font-size:var(--text-sm);">
      No milestones yet. <a href="/admin/investment-pools/{data.pool.id}/milestones/new" style="color:var(--color-accent);font-weight:600;text-decoration:none;">Add one →</a>
    </div>
  {/if}
</div>

<!-- Investors -->
{#if data.pool.investments.length > 0}
  <div style="margin-bottom:var(--space-6);">
    <h2 style="font-size:10px;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;color:var(--color-text-muted);margin-bottom:var(--space-4);">Investors ({data.pool.investments.length})</h2>
    <div style="background:rgba(255,255,255,0.55);backdrop-filter:blur(12px);-webkit-backdrop-filter:blur(12px);border:1px solid rgba(0,0,0,0.06);border-radius:var(--radius-lg);overflow:hidden;">
      <table style="width:100%;border-collapse:collapse;">
        <thead>
          <tr style="border-bottom:1px solid rgba(0,0,0,0.06);">
            {#each ['Investor','Email','Amount','Date'] as col}
              <th style="padding:var(--space-3) var(--space-4);text-align:left;font-size:var(--text-xs);font-weight:700;letter-spacing:0.05em;text-transform:uppercase;color:var(--color-text-muted);">{col}</th>
            {/each}
          </tr>
        </thead>
        <tbody>
          {#each data.pool.investments as inv}
            <tr style="border-bottom:1px solid rgba(0,0,0,0.04);">
              <td style="padding:var(--space-3) var(--space-4);font-size:var(--text-sm);font-weight:600;">{inv.user.name}</td>
              <td style="padding:var(--space-3) var(--space-4);font-size:var(--text-sm);color:var(--color-text-muted);">{inv.user.email}</td>
              <td style="padding:var(--space-3) var(--space-4);font-size:var(--text-sm);font-weight:600;">{formatCurrency(inv.amount)}</td>
              <td style="padding:var(--space-3) var(--space-4);font-size:var(--text-sm);">{formatDate(inv.createdAt)}</td>
            </tr>
          {/each}
        </tbody>
      </table>
    </div>
  </div>
{/if}

<div style="background:rgba(255,255,255,0.55);backdrop-filter:blur(12px);-webkit-backdrop-filter:blur(12px);border:1px solid rgba(239,68,68,0.12);border-radius:var(--radius-lg);padding:var(--space-8);">
  <h2 style="font-size:var(--text-base);font-weight:700;color:#ef4444;margin-bottom:var(--space-2);">Danger Zone</h2>
  <p style="font-size:var(--text-sm);color:var(--color-text-muted);margin-bottom:var(--space-4);">Permanently delete this pool. This cannot be undone.</p>
  <form method="POST" action="?/delete" use:enhance>
    <button
      type="submit"
      style="background:#ef4444;color:white;border:none;border-radius:var(--radius-md);padding:var(--space-2) var(--space-4);font-size:var(--text-sm);font-weight:600;cursor:pointer;"
      onclick={(e) => { if (!confirm('Delete this investment pool? This cannot be undone.')) e.preventDefault(); }}
    >Delete Pool</button>
  </form>
</div>
