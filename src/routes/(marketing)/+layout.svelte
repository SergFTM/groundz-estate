<script lang="ts">
  import AIChatWidget from '$lib/components/AIChatWidget.svelte';
  let { children } = $props();
</script>

{@render children()}

<AIChatWidget role="public" floating />
