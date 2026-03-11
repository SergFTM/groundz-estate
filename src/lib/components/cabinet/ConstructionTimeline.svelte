<script lang="ts">
  interface Phase {
    id: string;
    name: string;
    description?: string | null;
    status: string;
    startDate?: Date | string | null;
    endDate?: Date | string | null;
    sortOrder: number;
    media?: { id: string; url: string; type: string; caption?: string | null }[];
  }

  interface Props {
    phases: Phase[];
  }

  let { phases }: Props = $props();

  let sortedPhases = $derived([...phases].sort((a, b) => a.sortOrder - b.sortOrder));
  let completedCount = $derived(phases.filter((p) => p.status === 'completed').length);
  let progress = $derived(phases.length > 0 ? Math.round((completedCount / phases.length) * 100) : 0);
</script>

<div class="timeline">
  <div class="timeline__header">
    <div class="timeline__progress-label">
      <span>Construction Progress</span>
      <span class="timeline__percent">{progress}%</span>
    </div>
    <div class="timeline__bar">
      <div class="timeline__bar-fill" style="width:{progress}%"></div>
    </div>
  </div>

  <div class="timeline__phases">
    {#each sortedPhases as phase, i}
      <div class="timeline__phase" class:timeline__phase--completed={phase.status === 'completed'} class:timeline__phase--active={phase.status === 'in_progress'}>
        <div class="timeline__dot"></div>
        {#if i < phases.length - 1}
          <div class="timeline__line"></div>
        {/if}
        <div class="timeline__content">
          <div class="timeline__phase-name">{phase.name}</div>
          {#if phase.description}
            <div class="timeline__phase-desc">{phase.description}</div>
          {/if}
          {#if phase.startDate || phase.endDate}
            <div class="timeline__phase-date">
              {phase.startDate ? new Date(phase.startDate).toLocaleDateString('en-GB', { month: 'short', year: 'numeric' }) : ''}
              {#if phase.startDate && phase.endDate} — {/if}
              {phase.endDate ? new Date(phase.endDate).toLocaleDateString('en-GB', { month: 'short', year: 'numeric' }) : ''}
            </div>
          {/if}
          {#if phase.media && phase.media.length > 0}
            <div class="timeline__media">
              {#each phase.media as media}
                <img src={media.url} alt={media.caption ?? phase.name} class="timeline__media-img" />
              {/each}
            </div>
          {/if}
        </div>
      </div>
    {/each}
  </div>
</div>

<style>
  .timeline {
    background: rgba(255, 255, 255, 0.55);
    -webkit-backdrop-filter: blur(12px);
    backdrop-filter: blur(12px);
    border: 1px solid rgba(0, 0, 0, 0.06);
    border-radius: var(--radius-lg);
    padding: var(--space-8);
  }

  .timeline__header {
    margin-bottom: var(--space-8);
  }

  .timeline__progress-label {
    display: flex;
    justify-content: space-between;
    font-size: var(--text-sm);
    font-weight: 600;
    color: var(--color-text);
    margin-bottom: var(--space-3);
  }

  .timeline__percent {
    color: var(--color-accent);
  }

  .timeline__bar {
    height: 4px;
    background: rgba(0, 0, 0, 0.06);
    border-radius: 2px;
    overflow: hidden;
  }

  .timeline__bar-fill {
    height: 100%;
    background: var(--color-accent);
    border-radius: 2px;
    transition: width 0.4s ease;
  }

  .timeline__phases {
    display: flex;
    flex-direction: column;
    gap: 0;
  }

  .timeline__phase {
    display: flex;
    gap: var(--space-4);
    position: relative;
  }

  .timeline__dot {
    width: 12px;
    height: 12px;
    border-radius: 50%;
    background: rgba(0, 0, 0, 0.12);
    border: 2px solid rgba(0, 0, 0, 0.12);
    flex-shrink: 0;
    margin-top: 4px;
    position: relative;
    z-index: 1;
  }

  .timeline__phase--completed .timeline__dot {
    background: var(--color-accent);
    border-color: var(--color-accent);
  }

  .timeline__phase--active .timeline__dot {
    background: #fff;
    border-color: var(--color-accent);
    box-shadow: 0 0 0 3px rgba(122, 140, 110, 0.2);
  }

  .timeline__line {
    position: absolute;
    left: 5px;
    top: 16px;
    bottom: -16px;
    width: 2px;
    background: rgba(0, 0, 0, 0.08);
    z-index: 0;
  }

  .timeline__phase--completed .timeline__line {
    background: var(--color-accent);
  }

  .timeline__content {
    flex: 1;
    min-width: 0;
    padding-bottom: var(--space-8);
  }

  .timeline__phase-name {
    font-size: var(--text-sm);
    font-weight: 700;
    color: var(--color-text);
  }

  .timeline__phase--completed .timeline__phase-name {
    color: var(--color-accent);
  }

  .timeline__phase-desc {
    font-size: var(--text-sm);
    color: var(--color-text-muted);
    margin-top: 2px;
  }

  .timeline__phase-date {
    font-size: var(--text-xs);
    color: var(--color-text-muted);
    margin-top: var(--space-1);
  }

  .timeline__media {
    display: flex;
    gap: var(--space-2);
    margin-top: var(--space-3);
    overflow-x: auto;
  }

  .timeline__media-img {
    width: 80px;
    height: 60px;
    object-fit: cover;
    border-radius: var(--radius-sm);
    border: 1px solid rgba(0, 0, 0, 0.06);
  }
</style>
