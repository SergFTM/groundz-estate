<script lang="ts">
  import { page } from '$app/stores';

  interface Tab {
    label: string;
    href: string;
  }

  interface Props {
    tabs: Tab[];
    activeHref?: string;
  }

  let { tabs, activeHref }: Props = $props();

  function isActive(href: string): boolean {
    const path = activeHref ?? $page.url.pathname;
    if (href === path) return true;
    return path.startsWith(href + '/');
  }
</script>

<nav class="cabinet-tabs" aria-label="Cabinet navigation">
  {#each tabs as tab}
    <a
      href={tab.href}
      class="cabinet-tabs__tab"
      class:cabinet-tabs__tab--active={isActive(tab.href)}
    >
      {tab.label}
    </a>
  {/each}
</nav>

<style>
  .cabinet-tabs {
    display: flex;
    gap: 0;
    border-bottom: 1px solid rgba(0, 0, 0, 0.08);
    background: rgba(255, 255, 255, 0.5);
    -webkit-backdrop-filter: blur(8px);
    backdrop-filter: blur(8px);
    overflow-x: auto;
    scrollbar-width: none;
  }

  .cabinet-tabs::-webkit-scrollbar {
    display: none;
  }

  .cabinet-tabs__tab {
    padding: var(--space-4) var(--space-6);
    font-size: var(--text-sm);
    font-weight: 500;
    color: var(--color-text-muted);
    text-decoration: none;
    white-space: nowrap;
    border-bottom: 2px solid transparent;
    transition: all var(--transition-fast);
  }

  .cabinet-tabs__tab:hover {
    color: var(--color-text);
  }

  .cabinet-tabs__tab--active {
    color: var(--color-accent);
    border-bottom-color: var(--color-accent);
    font-weight: 600;
  }
</style>
