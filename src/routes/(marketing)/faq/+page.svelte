<script lang="ts">
  import FAQAccordion from '$lib/components/FAQAccordion.svelte';

  let { data } = $props();

  let search = $state('');

  let filtered = $derived(
    search.trim() === ''
      ? data.faqs
      : data.faqs.filter((f) =>
          f.question.toLowerCase().includes(search.toLowerCase()) ||
          f.answer.toLowerCase().includes(search.toLowerCase())
        )
  );

  let grouped = $derived(
    filtered.reduce<Record<string, typeof filtered>>((acc, faq) => {
      const cat = faq.category;
      if (!acc[cat]) acc[cat] = [];
      acc[cat].push(faq);
      return acc;
    }, {})
  );
</script>

<svelte:head>
  <title>FAQ — Groundz</title>
  <meta name="description" content="Frequently asked questions about buying and investing in Cyprus real estate." />
</svelte:head>

<section class="faq-section">
  <div class="container">
    <div class="section-header">
      <span class="section-label">FAQ</span>
      <h2 class="section-title">Frequently Asked Questions</h2>
    </div>

    <div class="search-wrap">
      <input
        type="search"
        placeholder="Search questions..."
        bind:value={search}
        class="search-input"
      />
    </div>

    {#if filtered.length === 0}
      <p class="empty">No questions match your search.</p>
    {:else}
      {#each Object.entries(grouped) as [category, items]}
        <div class="faq-group">
          <h3 class="faq-category">{category}</h3>
          <FAQAccordion {items} />
        </div>
      {/each}
    {/if}
  </div>
</section>

<style>
  .faq-section {
    padding: var(--space-20) 0;
    min-height: 60vh;
  }

  .container {
    max-width: 800px;
    margin: 0 auto;
    padding: 0 var(--space-6);
  }

  .section-header {
    margin-bottom: var(--space-10);
  }

  .section-label {
    font-size: var(--text-xs);
    font-weight: 800;
    letter-spacing: 0.16em;
    text-transform: uppercase;
    color: var(--color-accent);
    display: block;
    margin-bottom: var(--space-2);
  }

  .section-title {
    font-size: var(--text-4xl);
    font-weight: 300;
    font-style: italic;
    font-family: 'IvyoraDisplay', serif;
    color: var(--color-text);
    margin: 0;
  }

  .search-wrap {
    margin-bottom: var(--space-10);
  }

  .search-input {
    width: 100%;
    padding: var(--space-4) var(--space-5);
    border: 1px solid rgba(0, 0, 0, 0.12);
    border-radius: var(--radius-full);
    background: rgba(255, 255, 255, 0.7);
    font-size: var(--text-base);
    color: var(--color-text);
    box-sizing: border-box;
  }

  .search-input:focus {
    outline: none;
    border-color: var(--color-accent);
  }

  .faq-group {
    margin-bottom: var(--space-10);
  }

  .faq-category {
    font-size: var(--text-xs);
    font-weight: 800;
    text-transform: uppercase;
    letter-spacing: 0.12em;
    color: var(--color-text-muted);
    margin: 0 0 var(--space-4);
  }

  .empty {
    text-align: center;
    color: var(--color-text-muted);
    padding: var(--space-16) 0;
  }
</style>
