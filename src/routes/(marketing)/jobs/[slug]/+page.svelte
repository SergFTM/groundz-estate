<script lang="ts">
  import { enhance } from '$app/forms';

  let { data, form } = $props();
  let { job } = $derived(data);
  let formErrors = $derived((form as { errors?: Record<string, string>; success?: boolean } | null)?.errors ?? {});

  let typeLabel = $derived(
    job.type === 'full_time' ? 'Full-time' :
    job.type === 'part_time' ? 'Part-time' :
    'Contract'
  );
</script>

<svelte:head>
  <title>{job.title} — Careers at Groundz</title>
</svelte:head>

<article class="job-page">
  <div class="container">
    <a href="/jobs" class="back-link">← Careers</a>

    <header class="job-header">
      <h1 class="job-title">{job.title}</h1>
      <div class="job-meta">
        <span class="meta-tag">{job.department}</span>
        <span class="meta-tag">{typeLabel}</span>
        <span class="meta-tag">📍 {job.location}</span>
      </div>
    </header>

    <div class="job-description prose">
      {@html job.description}
    </div>

    <section class="apply-section">
      <h2 class="apply-title">Apply for This Position</h2>

      {#if form?.success}
        <div class="success-banner">
          Application submitted! We'll be in touch soon.
        </div>
      {:else}
        <form method="POST" action="?/applyJob" use:enhance class="apply-form">
          <div class="form-row">
            <div class="form-field">
              <label for="name">Full Name *</label>
              <input id="name" name="name" type="text" placeholder="Your name" required />
              {#if formErrors.name}<span class="field-error">{formErrors.name}</span>{/if}
            </div>
            <div class="form-field">
              <label for="email">Email Address *</label>
              <input id="email" name="email" type="email" placeholder="you@example.com" required />
              {#if formErrors.email}<span class="field-error">{formErrors.email}</span>{/if}
            </div>
          </div>

          <div class="form-field">
            <label for="linkedinUrl">LinkedIn Profile (optional)</label>
            <input id="linkedinUrl" name="linkedinUrl" type="url" placeholder="https://linkedin.com/in/yourprofile" />
            {#if formErrors.linkedinUrl}<span class="field-error">{formErrors.linkedinUrl}</span>{/if}
          </div>

          <div class="form-field">
            <label for="coverLetter">Cover Letter (optional)</label>
            <textarea id="coverLetter" name="coverLetter" rows="5" placeholder="Tell us why you're a great fit..."></textarea>
            {#if formErrors.coverLetter}<span class="field-error">{formErrors.coverLetter}</span>{/if}
          </div>

          <button type="submit" class="btn-primary">Submit Application →</button>
        </form>
      {/if}
    </section>
  </div>
</article>

<style>
  .job-page {
    padding: var(--space-16) 0 var(--space-20);
  }

  .container {
    max-width: 760px;
    margin: 0 auto;
    padding: 0 var(--space-6);
  }

  .back-link {
    display: inline-block;
    font-size: var(--text-sm);
    font-weight: 600;
    color: var(--color-text-muted);
    text-decoration: none;
    margin-bottom: var(--space-8);
  }

  .back-link:hover { color: var(--color-accent); }

  .job-header {
    margin-bottom: var(--space-10);
    padding-bottom: var(--space-8);
    border-bottom: 1px solid rgba(0, 0, 0, 0.06);
  }

  .job-title {
    font-size: var(--text-4xl);
    font-weight: 300;
    font-style: italic;
    font-family: 'IvyoraDisplay', serif;
    color: var(--color-text);
    margin: 0 0 var(--space-4);
  }

  .job-meta {
    display: flex;
    flex-wrap: wrap;
    gap: var(--space-2);
  }

  .meta-tag {
    font-size: var(--text-xs);
    font-weight: 700;
    padding: 4px 12px;
    background: rgba(122, 140, 110, 0.1);
    color: var(--color-accent);
    border-radius: var(--radius-full);
    text-transform: uppercase;
    letter-spacing: 0.06em;
  }

  .job-description {
    margin-bottom: var(--space-16);
  }

  .prose :global(p) {
    font-size: var(--text-base);
    line-height: 1.8;
    color: var(--color-text);
    margin: 0 0 var(--space-5);
  }

  .prose :global(h3) {
    font-size: var(--text-xl);
    font-weight: 700;
    color: var(--color-text);
    margin: var(--space-8) 0 var(--space-4);
  }

  .prose :global(ul) {
    padding-left: var(--space-6);
    margin: 0 0 var(--space-5);
  }

  .prose :global(li) {
    font-size: var(--text-base);
    line-height: 1.7;
    color: var(--color-text);
    margin-bottom: var(--space-2);
  }

  .apply-section {
    background: rgba(255, 255, 255, 0.55);
    backdrop-filter: blur(12px);
    -webkit-backdrop-filter: blur(12px);
    border: 1px solid rgba(0, 0, 0, 0.06);
    border-radius: var(--radius-lg);
    padding: var(--space-8);
  }

  .apply-title {
    font-size: var(--text-xl);
    font-weight: 700;
    color: var(--color-text);
    margin: 0 0 var(--space-6);
  }

  .apply-form {
    display: flex;
    flex-direction: column;
    gap: var(--space-5);
  }

  .form-row {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: var(--space-5);
  }

  @media (max-width: 600px) {
    .form-row { grid-template-columns: 1fr; }
  }

  .form-field {
    display: flex;
    flex-direction: column;
    gap: var(--space-1);
  }

  .form-field label {
    font-size: var(--text-xs);
    font-weight: 600;
    color: var(--color-text-muted);
    text-transform: uppercase;
    letter-spacing: 0.06em;
  }

  .form-field input,
  .form-field textarea {
    padding: var(--space-3) var(--space-4);
    border: 1px solid rgba(0, 0, 0, 0.12);
    border-radius: var(--radius-md);
    background: rgba(255, 255, 255, 0.8);
    font-size: var(--text-sm);
    color: var(--color-text);
    font-family: inherit;
    resize: vertical;
  }

  .btn-primary {
    align-self: flex-start;
    padding: var(--space-4) var(--space-8);
    background: var(--color-accent);
    color: #fff;
    border: none;
    border-radius: var(--radius-md);
    font-size: var(--text-sm);
    font-weight: 700;
    cursor: pointer;
    transition: opacity var(--transition-base);
  }

  .btn-primary:hover { opacity: 0.88; }

  .field-error {
    font-size: var(--text-xs);
    color: #ef4444;
  }

  .success-banner {
    text-align: center;
    padding: var(--space-8);
    background: rgba(122, 140, 110, 0.08);
    border-radius: var(--radius-md);
    color: var(--color-accent);
    font-weight: 600;
    font-size: var(--text-base);
  }
</style>
