<script lang="ts">
  import { enhance } from '$app/forms';

  let { form } = $props();

  let formErrors = $derived(
    (form as { errors?: Record<string, string> } | null)?.errors ?? {}
  );
</script>

<svelte:head>
  <title>New Investment Pool — Admin — Groundz</title>
</svelte:head>

<a href="/admin/investment-pools" style="font-size:var(--text-sm);color:var(--color-accent);text-decoration:none;font-weight:600;display:inline-block;margin-bottom:var(--space-4);">← Back to Pools</a>

<div style="display:flex;align-items:flex-end;justify-content:space-between;margin-bottom:var(--space-6);">
  <div>
    <span style="font-size:10px;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;color:var(--color-text-muted);">Finance</span>
    <h1 style="font-size:var(--text-2xl);font-weight:700;color:var(--color-text);margin-top:var(--space-1);">New Investment Pool</h1>
  </div>
</div>

<div style="background:rgba(255,255,255,0.55);backdrop-filter:blur(12px);-webkit-backdrop-filter:blur(12px);border:1px solid rgba(0,0,0,0.06);border-radius:var(--radius-lg);padding:var(--space-8);">
  <form method="POST" action="?/create" use:enhance>

    <!-- Basic Info -->
    <p style="font-size:10px;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;color:var(--color-text-muted);margin-bottom:var(--space-4);">Basic Info</p>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:var(--space-6);margin-bottom:var(--space-6);">
      <div class="form-group" style="margin-bottom:0;">
        <label class="form-label" for="name">Pool Name *</label>
        <input class="form-input" id="name" name="name" placeholder="e.g. Marina Tower Fund" required />
        {#if formErrors.name}<p style="font-size:var(--text-xs);color:#ef4444;margin-top:var(--space-1);">{formErrors.name}</p>{/if}
      </div>
      <div class="form-group" style="margin-bottom:0;">
        <label class="form-label" for="slug">Slug (URL) <span style="color:var(--color-text-muted);font-weight:400;">optional</span></label>
        <input class="form-input" id="slug" name="slug" placeholder="marina-tower-fund" />
        {#if formErrors.slug}<p style="font-size:var(--text-xs);color:#ef4444;margin-top:var(--space-1);">{formErrors.slug}</p>{/if}
      </div>
      <div class="form-group" style="margin-bottom:0;">
        <label class="form-label" for="projectName">Project Name *</label>
        <input class="form-input" id="projectName" name="projectName" placeholder="e.g. Marina Tower" required />
        {#if formErrors.projectName}<p style="font-size:var(--text-xs);color:#ef4444;margin-top:var(--space-1);">{formErrors.projectName}</p>{/if}
      </div>
      <div class="form-group" style="margin-bottom:0;">
        <label class="form-label" for="dealType">Deal Type</label>
        <select class="form-input" id="dealType" name="dealType">
          <option value="">— select —</option>
          <option value="equity">Equity</option>
          <option value="debt_note">Debt Note</option>
          <option value="rental">Rental</option>
          <option value="club_deal">Club Deal</option>
        </select>
      </div>
      <div class="form-group" style="margin-bottom:0;">
        <label class="form-label" for="country">Country *</label>
        <input class="form-input" id="country" name="country" value="Cyprus" required />
      </div>
      <div class="form-group" style="margin-bottom:0;">
        <label class="form-label" for="city">City <span style="color:var(--color-text-muted);font-weight:400;">optional</span></label>
        <input class="form-input" id="city" name="city" placeholder="Limassol" />
      </div>
    </div>

    <hr style="border:none;border-top:1px solid rgba(0,0,0,0.06);margin-bottom:var(--space-6);" />

    <!-- Financial Terms -->
    <p style="font-size:10px;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;color:var(--color-text-muted);margin-bottom:var(--space-4);">Financial Terms</p>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:var(--space-6);margin-bottom:var(--space-6);">
      <div class="form-group" style="margin-bottom:0;">
        <label class="form-label" for="goalAmount">Goal Amount (€) *</label>
        <input class="form-input" id="goalAmount" name="goalAmount" type="number" placeholder="5000000" required />
        {#if formErrors.goalAmount}<p style="font-size:var(--text-xs);color:#ef4444;margin-top:var(--space-1);">{formErrors.goalAmount}</p>{/if}
      </div>
      <div class="form-group" style="margin-bottom:0;">
        <label class="form-label" for="raisedAmount">Raised Amount (€)</label>
        <input class="form-input" id="raisedAmount" name="raisedAmount" type="number" value="0" />
        {#if formErrors.raisedAmount}<p style="font-size:var(--text-xs);color:#ef4444;margin-top:var(--space-1);">{formErrors.raisedAmount}</p>{/if}
      </div>
      <div class="form-group" style="margin-bottom:0;">
        <label class="form-label" for="targetYield">Target Yield (% p.a.) *</label>
        <input class="form-input" id="targetYield" name="targetYield" type="number" step="0.1" placeholder="8" required />
        {#if formErrors.targetYield}<p style="font-size:var(--text-xs);color:#ef4444;margin-top:var(--space-1);">{formErrors.targetYield}</p>{/if}
      </div>
      <div class="form-group" style="margin-bottom:0;">
        <label class="form-label" for="targetIrr">Target IRR (%) <span style="color:var(--color-text-muted);font-weight:400;">optional</span></label>
        <input class="form-input" id="targetIrr" name="targetIrr" type="number" step="0.1" placeholder="12" />
        {#if formErrors.targetIrr}<p style="font-size:var(--text-xs);color:#ef4444;margin-top:var(--space-1);">{formErrors.targetIrr}</p>{/if}
      </div>
      <div class="form-group" style="margin-bottom:0;">
        <label class="form-label" for="preferredReturn">Preferred Return (%) <span style="color:var(--color-text-muted);font-weight:400;">optional</span></label>
        <input class="form-input" id="preferredReturn" name="preferredReturn" type="number" step="0.1" placeholder="7" />
      </div>
      <div class="form-group" style="margin-bottom:0;">
        <label class="form-label" for="termMonths">Term (months) *</label>
        <input class="form-input" id="termMonths" name="termMonths" type="number" placeholder="24" required />
        {#if formErrors.termMonths}<p style="font-size:var(--text-xs);color:#ef4444;margin-top:var(--space-1);">{formErrors.termMonths}</p>{/if}
      </div>
      <div class="form-group" style="margin-bottom:0;">
        <label class="form-label" for="minTicket">Min Ticket (€) *</label>
        <input class="form-input" id="minTicket" name="minTicket" type="number" placeholder="50000" required />
        {#if formErrors.minTicket}<p style="font-size:var(--text-xs);color:#ef4444;margin-top:var(--space-1);">{formErrors.minTicket}</p>{/if}
      </div>
      <div class="form-group" style="margin-bottom:0;">
        <label class="form-label" for="maxTicket">Max Ticket (€) <span style="color:var(--color-text-muted);font-weight:400;">optional</span></label>
        <input class="form-input" id="maxTicket" name="maxTicket" type="number" placeholder="500000" />
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
          <option value="sale">Sale</option>
          <option value="refinance">Refinance</option>
          <option value="hybrid">Hybrid</option>
        </select>
      </div>
      <div class="form-group" style="margin-bottom:0;">
        <label class="form-label" for="capitalType">Capital Type</label>
        <select class="form-input" id="capitalType" name="capitalType">
          <option value="">— select —</option>
          <option value="equity">Equity</option>
          <option value="mezzanine">Mezzanine</option>
          <option value="senior_debt">Senior Debt</option>
        </select>
      </div>
      <div class="form-group" style="margin-bottom:0;">
        <label class="form-label" for="spvName">SPV Name <span style="color:var(--color-text-muted);font-weight:400;">optional</span></label>
        <input class="form-input" id="spvName" name="spvName" placeholder="Marina Tower SPV Ltd" />
      </div>
      <div class="form-group" style="margin-bottom:0;">
        <label class="form-label" for="developerCoinvestPct">Developer Co-invest (%) <span style="color:var(--color-text-muted);font-weight:400;">0–100</span></label>
        <input class="form-input" id="developerCoinvestPct" name="developerCoinvestPct" type="number" step="0.1" min="0" max="100" placeholder="20" />
      </div>
      <div class="form-group" style="margin-bottom:0;">
        <label class="form-label" for="ltv">LTV (%) <span style="color:var(--color-text-muted);font-weight:400;">optional</span></label>
        <input class="form-input" id="ltv" name="ltv" type="number" step="0.1" placeholder="65" />
      </div>
      <div class="form-group" style="margin-bottom:0;">
        <label class="form-label" for="ltc">LTC (%) <span style="color:var(--color-text-muted);font-weight:400;">optional</span></label>
        <input class="form-input" id="ltc" name="ltc" type="number" step="0.1" placeholder="70" />
      </div>
    </div>

    <hr style="border:none;border-top:1px solid rgba(0,0,0,0.06);margin-bottom:var(--space-6);" />

    <!-- Status & Media -->
    <p style="font-size:10px;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;color:var(--color-text-muted);margin-bottom:var(--space-4);">Status & Media</p>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:var(--space-6);margin-bottom:var(--space-6);">
      <div class="form-group" style="margin-bottom:0;">
        <label class="form-label" for="status">Status</label>
        <select class="form-input" id="status" name="status">
          <option value="active">Active</option>
          <option value="closed">Closed</option>
          <option value="completed">Completed</option>
        </select>
      </div>
      <div class="form-group" style="margin-bottom:0;">
        <label class="form-label" for="imageUrl">Image URL <span style="color:var(--color-text-muted);font-weight:400;">optional</span></label>
        <input class="form-input" id="imageUrl" name="imageUrl" type="url" placeholder="https://..." />
        {#if formErrors.imageUrl}<p style="font-size:var(--text-xs);color:#ef4444;margin-top:var(--space-1);">{formErrors.imageUrl}</p>{/if}
      </div>
      <div class="form-group" style="margin-bottom:0;grid-column:1/-1;">
        <label class="form-label" for="description">Description <span style="color:var(--color-text-muted);font-weight:400;">optional</span></label>
        <textarea class="form-input" id="description" name="description" rows="3" placeholder="Pool overview…" style="resize:vertical;"></textarea>
      </div>
    </div>

    <hr style="border:none;border-top:1px solid rgba(0,0,0,0.06);margin-bottom:var(--space-6);" />

    <!-- Investment Thesis -->
    <p style="font-size:10px;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;color:var(--color-text-muted);margin-bottom:var(--space-4);">Investment Thesis <span style="font-weight:400;color:var(--color-text-muted);">— shown on pool detail page</span></p>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:var(--space-6);margin-bottom:var(--space-6);">
      <div class="form-group" style="margin-bottom:0;">
        <label class="form-label" for="locationThesis">Location Thesis</label>
        <textarea class="form-input" id="locationThesis" name="locationThesis" rows="3" placeholder="Why this location?" style="resize:vertical;"></textarea>
      </div>
      <div class="form-group" style="margin-bottom:0;">
        <label class="form-label" for="demandThesis">Demand Thesis</label>
        <textarea class="form-input" id="demandThesis" name="demandThesis" rows="3" placeholder="Who will buy / rent?" style="resize:vertical;"></textarea>
      </div>
      <div class="form-group" style="margin-bottom:0;">
        <label class="form-label" for="constructionThesis">Construction Thesis</label>
        <textarea class="form-input" id="constructionThesis" name="constructionThesis" rows="3" placeholder="Developer track record, timeline…" style="resize:vertical;"></textarea>
      </div>
      <div class="form-group" style="margin-bottom:0;">
        <label class="form-label" for="exitThesis">Exit Thesis</label>
        <textarea class="form-input" id="exitThesis" name="exitThesis" rows="3" placeholder="Exit strategy and timeline…" style="resize:vertical;"></textarea>
      </div>
    </div>

    <div style="display:flex;gap:var(--space-3);align-items:center;">
      <button type="submit" class="btn btn--primary">Create Pool</button>
      <a href="/admin/investment-pools" style="font-size:var(--text-sm);color:var(--color-text-muted);text-decoration:none;">Cancel</a>
    </div>
  </form>
</div>
