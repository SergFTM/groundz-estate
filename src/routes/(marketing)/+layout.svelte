<script lang="ts">
  import AIChatWidget from '$lib/components/AIChatWidget.svelte';
  import JsonLd from '$lib/components/seo/JsonLd.svelte';
  let { children } = $props();
</script>

<JsonLd data={{
  '@type': 'Organization',
  name: 'GROUNDZ ESTATE',
  url: 'https://groundz.estate',
  logo: 'https://groundz.estate/img/hero.jpg',
  sameAs: [],
}} />

{@render children()}

<AIChatWidget role="public" floating />
