<script lang="ts">
  // Generic schema.org JSON-LD injector (AEO: answer engines read this markup).
  let { data }: { data: Record<string, unknown> } = $props();
  let json = $derived(JSON.stringify({ '@context': 'https://schema.org', ...data }));
</script>

<svelte:head>
  <!-- eslint-disable-next-line svelte/no-at-html-tags — serialized JSON, not user HTML -->
  {@html `<script type="application/ld+json">${json.replace(/</g, '\\u003c')}${'<'}/script>`}
</svelte:head>
