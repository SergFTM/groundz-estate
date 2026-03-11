<script lang="ts">
  import { enhance } from '$app/forms';
  import { invalidateAll } from '$app/navigation';
  import DetailCard from '$lib/components/cabinet/DetailCard.svelte';
  import StatusBadge from '$lib/components/cabinet/StatusBadge.svelte';
  import ConstructionTimeline from '$lib/components/cabinet/ConstructionTimeline.svelte';
  import { formatCurrency } from '$lib/utils/formatters';

  let { data, form } = $props();

  let unitErrors = $derived(
    (form as { unitErrors?: Record<string, string> } | null)?.unitErrors ?? {}
  );
</script>

<svelte:head>
  <title>{data.project.name} — Projects — Admin — Develta</title>
</svelte:head>

<a href="/admin/projects" style="font-size:var(--text-sm);color:var(--color-accent);text-decoration:none;font-weight:600;display:inline-block;margin-bottom:var(--space-4);">← Back to Projects</a>

<DetailCard title={data.project.name} subtitle={data.project.location}>
  {#snippet actions()}
    <div style="display:flex;gap:var(--space-3);align-items:center;">
      <StatusBadge status={data.project.status} />
      <a
        href="/admin/projects/{data.project.id}/edit"
        class="btn btn--secondary"
        style="font-size:var(--text-sm);"
      >Edit Project</a>
    </div>
  {/snippet}

  <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:var(--space-4);margin-bottom:var(--space-8);">
    <div style="background:rgba(0,0,0,0.03);border-radius:var(--radius-md);padding:var(--space-4);">
      <span style="font-size:var(--text-xs);color:var(--color-text-muted);display:block;margin-bottom:var(--space-1);">Slug</span>
      <span style="font-size:var(--text-sm);font-weight:600;color:var(--color-text);font-family:monospace;">{data.project.slug}</span>
    </div>
    <div style="background:rgba(0,0,0,0.03);border-radius:var(--radius-md);padding:var(--space-4);">
      <span style="font-size:var(--text-xs);color:var(--color-text-muted);display:block;margin-bottom:var(--space-1);">Units</span>
      <span style="font-size:var(--text-2xl);font-family:var(--font-display);font-weight:300;font-style:italic;color:var(--color-text);">{data.project.units.length}</span>
    </div>
    <div style="background:rgba(0,0,0,0.03);border-radius:var(--radius-md);padding:var(--space-4);">
      <span style="font-size:var(--text-xs);color:var(--color-text-muted);display:block;margin-bottom:var(--space-1);">Phases</span>
      <span style="font-size:var(--text-2xl);font-family:var(--font-display);font-weight:300;font-style:italic;color:var(--color-text);">{data.project.constructionPhases.length}</span>
    </div>
  </div>
</DetailCard>

<!-- Units section -->
<div style="margin-top:var(--space-6);">
  <h2 style="font-size:10px;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;color:var(--color-text-muted);margin-bottom:var(--space-4);">Units</h2>

  {#if data.project.units.length > 0}
    <div style="background:rgba(255,255,255,0.55);backdrop-filter:blur(12px);-webkit-backdrop-filter:blur(12px);border:1px solid rgba(0,0,0,0.06);border-radius:var(--radius-lg);overflow:hidden;margin-bottom:var(--space-4);">
      <table style="width:100%;border-collapse:collapse;">
        <thead>
          <tr style="border-bottom:1px solid rgba(0,0,0,0.06);">
            {#each ['Code','Type','Beds','Floor','Area m²','Price','Status',''] as col}
              <th style="padding:var(--space-3) var(--space-4);text-align:left;font-size:var(--text-xs);font-weight:700;letter-spacing:0.05em;text-transform:uppercase;color:var(--color-text-muted);">{col}</th>
            {/each}
          </tr>
        </thead>
        <tbody>
          {#each data.project.units as unit}
            <tr style="border-bottom:1px solid rgba(0,0,0,0.04);">
              <td style="padding:var(--space-3) var(--space-4);font-size:var(--text-sm);font-family:monospace;font-weight:600;">{unit.code}</td>
              <td style="padding:var(--space-3) var(--space-4);font-size:var(--text-sm);">{unit.type}</td>
              <td style="padding:var(--space-3) var(--space-4);font-size:var(--text-sm);">{unit.bedrooms}</td>
              <td style="padding:var(--space-3) var(--space-4);font-size:var(--text-sm);">{unit.floor}</td>
              <td style="padding:var(--space-3) var(--space-4);font-size:var(--text-sm);">{unit.areaSqm}</td>
              <td style="padding:var(--space-3) var(--space-4);font-size:var(--text-sm);">{unit.price != null ? formatCurrency(unit.price) : '—'}</td>
              <td style="padding:var(--space-3) var(--space-4);font-size:var(--text-sm);">{unit.status}</td>
              <td style="padding:var(--space-3) var(--space-4);">
                <form
                  method="POST"
                  action="?/deleteUnit"
                  use:enhance={() => {
                    return async ({ update }) => {
                      await update();
                      await invalidateAll();
                    };
                  }}
                >
                  <input type="hidden" name="unitId" value={unit.id} />
                  <button
                    type="submit"
                    style="background:none;border:none;color:#ef4444;font-size:var(--text-xs);cursor:pointer;font-weight:600;padding:0;"
                    onclick={(e) => { if (!confirm(`Delete unit ${unit.code}?`)) e.preventDefault(); }}
                  >Delete</button>
                </form>
              </td>
            </tr>
          {/each}
        </tbody>
      </table>
    </div>
  {:else}
    <div style="background:rgba(255,255,255,0.55);backdrop-filter:blur(12px);-webkit-backdrop-filter:blur(12px);border:1px solid rgba(0,0,0,0.06);border-radius:var(--radius-lg);padding:var(--space-8);text-align:center;color:var(--color-text-muted);font-size:var(--text-sm);margin-bottom:var(--space-4);">
      No units for this project yet.
    </div>
  {/if}

  <!-- Add unit form -->
  <div style="background:rgba(255,255,255,0.55);backdrop-filter:blur(12px);-webkit-backdrop-filter:blur(12px);border:1px solid rgba(0,0,0,0.06);border-radius:var(--radius-lg);padding:var(--space-6);">
    <h3 style="font-size:var(--text-sm);font-weight:700;color:var(--color-text);margin-bottom:var(--space-4);">Add Unit</h3>

    {#if form?.unitSuccess}
      <div style="background:rgba(34,197,94,0.08);border:1px solid rgba(34,197,94,0.2);border-radius:var(--radius-md);padding:var(--space-3) var(--space-4);margin-bottom:var(--space-4);font-size:var(--text-sm);color:#22c55e;">
        Unit added successfully.
      </div>
    {/if}

    <form
      method="POST"
      action="?/addUnit"
      use:enhance={({ formElement }) => {
        return async ({ update, result }) => {
          await update();
          await invalidateAll();
          if (result.type === 'success') formElement.reset();
        };
      }}
    >
      <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:var(--space-4);margin-bottom:var(--space-4);">
        <div class="form-group" style="margin-bottom:0;">
          <label class="form-label" for="code">Code</label>
          <input class="form-input" id="code" name="code" placeholder="A-101" required />
          {#if unitErrors.code}<p style="font-size:var(--text-xs);color:#ef4444;margin-top:var(--space-1);">{unitErrors.code}</p>{/if}
        </div>
        <div class="form-group" style="margin-bottom:0;">
          <label class="form-label" for="type">Type</label>
          <select class="form-input" id="type" name="type">
            <option value="studio">Studio</option>
            <option value="1bed">1 Bed</option>
            <option value="2bed">2 Bed</option>
            <option value="3bed">3 Bed</option>
            <option value="penthouse">Penthouse</option>
          </select>
        </div>
        <div class="form-group" style="margin-bottom:0;">
          <label class="form-label" for="bedrooms">Bedrooms</label>
          <input class="form-input" id="bedrooms" name="bedrooms" type="number" min="0" placeholder="0" required />
          {#if unitErrors.bedrooms}<p style="font-size:var(--text-xs);color:#ef4444;margin-top:var(--space-1);">{unitErrors.bedrooms}</p>{/if}
        </div>
        <div class="form-group" style="margin-bottom:0;">
          <label class="form-label" for="floor">Floor</label>
          <input class="form-input" id="floor" name="floor" type="number" placeholder="1" required />
          {#if unitErrors.floor}<p style="font-size:var(--text-xs);color:#ef4444;margin-top:var(--space-1);">{unitErrors.floor}</p>{/if}
        </div>
        <div class="form-group" style="margin-bottom:0;">
          <label class="form-label" for="areaSqm">Area (m²)</label>
          <input class="form-input" id="areaSqm" name="areaSqm" type="number" step="0.1" placeholder="65.5" required />
          {#if unitErrors.areaSqm}<p style="font-size:var(--text-xs);color:#ef4444;margin-top:var(--space-1);">{unitErrors.areaSqm}</p>{/if}
        </div>
        <div class="form-group" style="margin-bottom:0;">
          <label class="form-label" for="price">Price (€)</label>
          <input class="form-input" id="price" name="price" type="number" placeholder="250000" />
          {#if unitErrors.price}<p style="font-size:var(--text-xs);color:#ef4444;margin-top:var(--space-1);">{unitErrors.price}</p>{/if}
        </div>
        <div class="form-group" style="margin-bottom:0;">
          <label class="form-label" for="unitStatus">Status</label>
          <select class="form-input" id="unitStatus" name="status">
            <option value="available">Available</option>
            <option value="reserved">Reserved</option>
            <option value="sold">Sold</option>
          </select>
        </div>
      </div>
      <button type="submit" class="btn btn--primary">Add Unit</button>
    </form>
  </div>
</div>

{#if data.project.constructionPhases.length > 0}
  <div style="margin-top:var(--space-6);">
    <h2 style="font-size:10px;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;color:var(--color-text-muted);margin-bottom:var(--space-4);">Construction Timeline</h2>
    <ConstructionTimeline phases={data.project.constructionPhases} />
  </div>
{/if}
