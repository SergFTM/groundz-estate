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
  let phaseErrors = $derived(
    (form as { phaseErrors?: Record<string, string> } | null)?.phaseErrors ?? {}
  );

  let editingUnitId = $state<string | null>(null);

  // Floor plan upload state
  let uploadingUnitId = $state<string | null>(null);
  let uploadedPlans = $state<Record<string, string>>({}); // unitId → url

  async function uploadFloorPlan(unitId: string, fileInput: HTMLInputElement) {
    const file = fileInput.files?.[0];
    if (!file) return;
    uploadingUnitId = unitId;
    try {
      const fd = new FormData();
      fd.append('file', file);
      fd.append('unitId', unitId);
      const res = await fetch('/api/upload-floor-plan', { method: 'POST', body: fd });
      if (!res.ok) { const t = await res.text(); alert('Upload failed: ' + t); return; }
      const { url } = await res.json();
      uploadedPlans = { ...uploadedPlans, [unitId]: url };
      await invalidateAll();
    } finally {
      uploadingUnitId = null;
    }
  }
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
            {#each ['Code','Type','Beds','Floor','Area m²','Price','Status','Plan',''] as col}
              <th style="padding:var(--space-3) var(--space-4);text-align:left;font-size:var(--text-xs);font-weight:700;letter-spacing:0.05em;text-transform:uppercase;color:var(--color-text-muted);">{col}</th>
            {/each}
          </tr>
        </thead>
        <tbody>
          {#each data.project.units as unit}
            {#if editingUnitId === unit.id}
              <tr style="border-bottom:1px solid rgba(0,0,0,0.04);background:rgba(122,140,110,0.05);">
                <td colspan="8" style="padding:var(--space-4);">
                  <form
                    method="POST"
                    action="?/updateUnit"
                    use:enhance={() => {
                      return async ({ update }) => {
                        await update();
                        await invalidateAll();
                        editingUnitId = null;
                      };
                    }}
                  >
                    <input type="hidden" name="unitId" value={unit.id} />
                    <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:var(--space-3);margin-bottom:var(--space-3);">
                      <div class="form-group" style="margin-bottom:0;">
                        <label class="form-label" for="edit-code">Code</label>
                        <input class="form-input" id="edit-code" name="code" value={unit.code} required />
                      </div>
                      <div class="form-group" style="margin-bottom:0;">
                        <label class="form-label" for="edit-type">Type</label>
                        <select class="form-input" id="edit-type" name="type">
                          {#each [['studio','Studio'],['1bed','1 Bed'],['2bed','2 Bed'],['3bed','3 Bed'],['penthouse','Penthouse']] as [val, lbl]}
                            <option value={val} selected={unit.type === val}>{lbl}</option>
                          {/each}
                        </select>
                      </div>
                      <div class="form-group" style="margin-bottom:0;">
                        <label class="form-label" for="edit-bedrooms">Bedrooms</label>
                        <input class="form-input" id="edit-bedrooms" name="bedrooms" type="number" min="0" value={unit.bedrooms} required />
                      </div>
                      <div class="form-group" style="margin-bottom:0;">
                        <label class="form-label" for="edit-floor">Floor</label>
                        <input class="form-input" id="edit-floor" name="floor" type="number" value={unit.floor} required />
                      </div>
                      <div class="form-group" style="margin-bottom:0;">
                        <label class="form-label" for="edit-area">Area (m²)</label>
                        <input class="form-input" id="edit-area" name="areaSqm" type="number" step="0.1" value={unit.areaSqm} required />
                      </div>
                      <div class="form-group" style="margin-bottom:0;">
                        <label class="form-label" for="edit-price">Price (€)</label>
                        <input class="form-input" id="edit-price" name="price" type="number" value={unit.price ?? ''} />
                      </div>
                      <div class="form-group" style="margin-bottom:0;">
                        <label class="form-label" for="edit-status">Status</label>
                        <select class="form-input" id="edit-status" name="status">
                          {#each [['available','Available'],['reserved','Reserved'],['sold','Sold']] as [val, lbl]}
                            <option value={val} selected={unit.status === val}>{lbl}</option>
                          {/each}
                        </select>
                      </div>
                    </div>
                    <div style="display:flex;gap:var(--space-3);align-items:center;">
                      <button type="submit" class="btn btn--primary" style="font-size:var(--text-sm);">Save</button>
                      <button type="button" onclick={() => editingUnitId = null} style="background:none;border:none;color:var(--color-text-muted);font-size:var(--text-sm);cursor:pointer;">Cancel</button>
                    </div>
                  </form>

                  <!-- Floor plan upload (separate from main form) -->
                  <div style="margin-top:var(--space-4);padding-top:var(--space-4);border-top:1px solid rgba(0,0,0,0.06);">
                    <span style="font-size:var(--text-xs);font-weight:700;color:var(--color-text-muted);text-transform:uppercase;letter-spacing:0.06em;display:block;margin-bottom:var(--space-2);">Floor Plan Upload</span>
                    <div style="display:flex;gap:var(--space-3);align-items:center;flex-wrap:wrap;">
                      {#if uploadedPlans[unit.id] ?? unit.floorPlanUrl}
                        <a href={uploadedPlans[unit.id] ?? unit.floorPlanUrl} target="_blank"
                          style="font-size:var(--text-xs);color:var(--color-accent);font-weight:600;text-decoration:none;padding:4px 10px;border:1px solid var(--color-accent);border-radius:4px;">
                          View current plan ↗
                        </a>
                      {/if}
                      <label style="cursor:pointer;display:flex;align-items:center;gap:var(--space-2);">
                        <input
                          type="file"
                          accept=".pdf,.jpg,.jpeg,.png,.svg,.webp"
                          style="display:none;"
                          onchange={(e) => uploadFloorPlan(unit.id, e.currentTarget)}
                        />
                        <span class="btn btn--secondary" style="font-size:var(--text-xs);padding:4px 12px;pointer-events:none;">
                          {uploadingUnitId === unit.id ? 'Uploading…' : (uploadedPlans[unit.id] ?? unit.floorPlanUrl) ? 'Replace plan' : '+ Upload plan'}
                        </span>
                      </label>
                      <span style="font-size:10px;color:var(--color-text-muted);">PDF · JPG · PNG · SVG</span>
                    </div>
                  </div>
                </td>
              </tr>
            {:else}
              <tr style="border-bottom:1px solid rgba(0,0,0,0.04);">
                <td style="padding:var(--space-3) var(--space-4);font-size:var(--text-sm);font-family:monospace;font-weight:600;">{unit.code}</td>
                <td style="padding:var(--space-3) var(--space-4);font-size:var(--text-sm);">{unit.type}</td>
                <td style="padding:var(--space-3) var(--space-4);font-size:var(--text-sm);">{unit.bedrooms}</td>
                <td style="padding:var(--space-3) var(--space-4);font-size:var(--text-sm);">{unit.floor}</td>
                <td style="padding:var(--space-3) var(--space-4);font-size:var(--text-sm);">{unit.areaSqm}</td>
                <td style="padding:var(--space-3) var(--space-4);font-size:var(--text-sm);">{unit.price != null ? formatCurrency(unit.price) : '—'}</td>
                <td style="padding:var(--space-3) var(--space-4);font-size:var(--text-sm);">{unit.status}</td>
                <td style="padding:var(--space-3) var(--space-4);">
                  {#if uploadedPlans[unit.id] ?? unit.floorPlanUrl}
                    <a href={uploadedPlans[unit.id] ?? unit.floorPlanUrl} target="_blank"
                      style="font-size:var(--text-xs);color:var(--color-accent);font-weight:600;text-decoration:none;">
                      ⬛ View
                    </a>
                  {:else}
                    <span style="font-size:var(--text-xs);color:var(--color-text-muted);">—</span>
                  {/if}
                </td>
                <td style="padding:var(--space-3) var(--space-4);">
                  <div style="display:flex;gap:var(--space-3);">
                    <button
                      type="button"
                      onclick={() => editingUnitId = unit.id}
                      style="background:none;border:none;color:var(--color-accent);font-size:var(--text-xs);cursor:pointer;font-weight:600;padding:0;"
                    >Edit</button>
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
                  </div>
                </td>
              </tr>
            {/if}
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

<!-- Construction Phases section -->
<div style="margin-top:var(--space-6);">
  <h2 style="font-size:10px;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;color:var(--color-text-muted);margin-bottom:var(--space-4);">Construction Timeline</h2>

  {#if data.project.constructionPhases.length > 0}
    <ConstructionTimeline phases={data.project.constructionPhases} />

    <div style="background:rgba(255,255,255,0.55);backdrop-filter:blur(12px);-webkit-backdrop-filter:blur(12px);border:1px solid rgba(0,0,0,0.06);border-radius:var(--radius-lg);overflow:hidden;margin-top:var(--space-4);margin-bottom:var(--space-4);">
      <table style="width:100%;border-collapse:collapse;">
        <thead>
          <tr style="border-bottom:1px solid rgba(0,0,0,0.06);">
            {#each ['Order','Name','Status','Start','End',''] as col}
              <th style="padding:var(--space-3) var(--space-4);text-align:left;font-size:var(--text-xs);font-weight:700;letter-spacing:0.05em;text-transform:uppercase;color:var(--color-text-muted);">{col}</th>
            {/each}
          </tr>
        </thead>
        <tbody>
          {#each data.project.constructionPhases as phase}
            <tr style="border-bottom:1px solid rgba(0,0,0,0.04);">
              <td style="padding:var(--space-3) var(--space-4);font-size:var(--text-sm);font-family:monospace;">{phase.sortOrder}</td>
              <td style="padding:var(--space-3) var(--space-4);font-size:var(--text-sm);font-weight:600;">{phase.name}</td>
              <td style="padding:var(--space-3) var(--space-4);font-size:var(--text-sm);"><StatusBadge status={phase.status} /></td>
              <td style="padding:var(--space-3) var(--space-4);font-size:var(--text-sm);">{phase.startDate ? new Date(phase.startDate).toLocaleDateString('en-GB') : '—'}</td>
              <td style="padding:var(--space-3) var(--space-4);font-size:var(--text-sm);">{phase.endDate ? new Date(phase.endDate).toLocaleDateString('en-GB') : '—'}</td>
              <td style="padding:var(--space-3) var(--space-4);">
                <form
                  method="POST"
                  action="?/deletePhase"
                  style="display:inline;"
                  use:enhance={() => {
                    return async ({ update }) => {
                      await update();
                      await invalidateAll();
                    };
                  }}
                >
                  <input type="hidden" name="phaseId" value={phase.id} />
                  <button
                    type="submit"
                    style="background:none;border:none;color:#ef4444;font-size:var(--text-xs);cursor:pointer;font-weight:600;padding:0;"
                    onclick={(e) => { if (!confirm(`Delete phase "${phase.name}"?`)) e.preventDefault(); }}
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
      No construction phases yet.
    </div>
  {/if}

  <!-- Add phase form -->
  <div style="background:rgba(255,255,255,0.55);backdrop-filter:blur(12px);-webkit-backdrop-filter:blur(12px);border:1px solid rgba(0,0,0,0.06);border-radius:var(--radius-lg);padding:var(--space-6);">
    <h3 style="font-size:var(--text-sm);font-weight:700;color:var(--color-text);margin-bottom:var(--space-4);">Add Phase</h3>

    {#if form?.phaseSuccess}
      <div style="background:rgba(34,197,94,0.08);border:1px solid rgba(34,197,94,0.2);border-radius:var(--radius-md);padding:var(--space-3) var(--space-4);margin-bottom:var(--space-4);font-size:var(--text-sm);color:#22c55e;">
        Phase added successfully.
      </div>
    {/if}

    <form
      method="POST"
      action="?/addPhase"
      use:enhance={({ formElement }) => {
        return async ({ update, result }) => {
          await update();
          await invalidateAll();
          if (result.type === 'success') formElement.reset();
        };
      }}
    >
      <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:var(--space-4);margin-bottom:var(--space-4);">
        <div class="form-group" style="margin-bottom:0;">
          <label class="form-label" for="phaseName">Name</label>
          <input class="form-input" id="phaseName" name="name" placeholder="Foundation" required />
          {#if phaseErrors.name}<p style="font-size:var(--text-xs);color:#ef4444;margin-top:var(--space-1);">{phaseErrors.name}</p>{/if}
        </div>
        <div class="form-group" style="margin-bottom:0;">
          <label class="form-label" for="phaseStatus">Status</label>
          <select class="form-input" id="phaseStatus" name="status">
            <option value="pending">Pending</option>
            <option value="in_progress">In Progress</option>
            <option value="completed">Completed</option>
          </select>
        </div>
        <div class="form-group" style="margin-bottom:0;">
          <label class="form-label" for="phaseSortOrder">Sort Order</label>
          <input class="form-input" id="phaseSortOrder" name="sortOrder" type="number" min="0" placeholder="0" />
        </div>
        <div class="form-group" style="margin-bottom:0;">
          <label class="form-label" for="phaseStart">Start Date</label>
          <input class="form-input" id="phaseStart" name="startDate" type="date" />
        </div>
        <div class="form-group" style="margin-bottom:0;">
          <label class="form-label" for="phaseEnd">End Date</label>
          <input class="form-input" id="phaseEnd" name="endDate" type="date" />
        </div>
        <div class="form-group" style="margin-bottom:0;grid-column:1/-1;">
          <label class="form-label" for="phaseDesc">Description</label>
          <textarea class="form-input" id="phaseDesc" name="description" rows="2" placeholder="Phase description…" style="resize:vertical;"></textarea>
        </div>
      </div>
      <button type="submit" class="btn btn--primary">Add Phase</button>
    </form>
  </div>
</div>
