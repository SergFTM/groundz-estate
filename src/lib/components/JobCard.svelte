<script lang="ts">
  interface Props {
    slug: string;
    title: string;
    department: string;
    type: string;
    location: string;
  }

  let { slug, title, department, type, location }: Props = $props();

  let typeLabel = $derived(
    type === 'full_time' ? 'Full-time' :
    type === 'part_time' ? 'Part-time' :
    'Contract'
  );
</script>

<div class="job-card">
  <div class="job-card__header">
    <h3 class="job-card__title">{title}</h3>
    <span class="job-card__dept">{department}</span>
  </div>
  <div class="job-card__meta">
    <span class="job-card__tag">{typeLabel}</span>
    <span class="job-card__location">📍 {location}</span>
  </div>
  <a href="/jobs/{slug}" class="job-card__link">Apply →</a>
</div>

<style>
  .job-card {
    background: rgba(255, 255, 255, 0.55);
    backdrop-filter: blur(12px);
    -webkit-backdrop-filter: blur(12px);
    border: 1px solid rgba(0, 0, 0, 0.06);
    border-radius: var(--radius-lg);
    padding: var(--space-6);
    display: flex;
    flex-direction: column;
    gap: var(--space-3);
    transition: box-shadow var(--transition-base);
  }

  .job-card:hover {
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
  }

  .job-card__header {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: var(--space-3);
  }

  .job-card__title {
    font-size: var(--text-lg);
    font-weight: 700;
    color: var(--color-text);
    margin: 0;
  }

  .job-card__dept {
    font-size: var(--text-xs);
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    color: var(--color-accent);
    white-space: nowrap;
    padding: 3px 10px;
    background: rgba(122, 140, 110, 0.1);
    border-radius: var(--radius-full);
  }

  .job-card__meta {
    display: flex;
    align-items: center;
    gap: var(--space-4);
    font-size: var(--text-sm);
    color: var(--color-text-muted);
  }

  .job-card__tag {
    font-weight: 600;
  }

  .job-card__link {
    display: inline-block;
    font-size: var(--text-sm);
    font-weight: 700;
    color: var(--color-accent);
    text-decoration: none;
    margin-top: auto;
  }

  .job-card__link:hover {
    text-decoration: underline;
  }
</style>
