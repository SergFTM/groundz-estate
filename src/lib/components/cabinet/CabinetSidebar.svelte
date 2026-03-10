<script lang="ts">
  import { page } from '$app/stores';

  interface NavGroup {
    label: string;
    items: { label: string; href: string }[];
  }

  const groups: NavGroup[] = [
    {
      label: 'CRM',
      items: [
        { label: 'Dashboard', href: '/admin' },
        { label: 'Leads', href: '/admin/leads' },
        { label: 'Users', href: '/admin/users' }
      ]
    },
    {
      label: 'Properties',
      items: [
        { label: 'Projects', href: '/admin/projects' }
      ]
    },
    {
      label: 'Finance',
      items: [
        { label: 'Payments', href: '/admin/payments' },
        { label: 'Documents', href: '/admin/documents' }
      ]
    },
    {
      label: 'Content',
      items: [
        { label: 'Articles', href: '/admin/articles' },
        { label: 'FAQ', href: '/admin/faq' },
        { label: 'Jobs', href: '/admin/jobs' }
      ]
    }
  ];

  let collapsed = $state(false);

  function isActive(href: string): boolean {
    const path = $page.url.pathname;
    if (href === '/admin') return path === '/admin';
    return path.startsWith(href);
  }
</script>

{#if collapsed}
  <button class="sidebar-toggle sidebar-toggle--show" onclick={() => collapsed = false} aria-label="Open sidebar">
    &#9776;
  </button>
{/if}

<aside class="sidebar" class:sidebar--collapsed={collapsed}>
  <div class="sidebar__header">
    <span class="sidebar__brand">DEVELTA</span>
    <button class="sidebar__collapse" onclick={() => collapsed = true} aria-label="Collapse sidebar">
      &#10005;
    </button>
  </div>

  <nav class="sidebar__nav">
    {#each groups as group}
      <div class="sidebar__group-label">{group.label}</div>
      {#each group.items as item}
        <a
          href={item.href}
          class="sidebar__link"
          class:sidebar__link--active={isActive(item.href)}
        >
          {item.label}
        </a>
      {/each}
    {/each}
  </nav>
</aside>

<style>
  .sidebar {
    width: 200px;
    min-height: 100%;
    background: rgba(30, 30, 28, 0.95);
    -webkit-backdrop-filter: blur(20px);
    backdrop-filter: blur(20px);
    color: #fff;
    display: flex;
    flex-direction: column;
    flex-shrink: 0;
    transition: transform var(--transition-base);
  }

  .sidebar--collapsed {
    display: none;
  }

  .sidebar__header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: var(--space-6) var(--space-5);
    border-bottom: 1px solid rgba(255, 255, 255, 0.06);
  }

  .sidebar__brand {
    font-size: var(--text-xs);
    font-weight: 700;
    letter-spacing: 0.2em;
    text-transform: uppercase;
  }

  .sidebar__collapse {
    background: none;
    border: none;
    color: rgba(255, 255, 255, 0.4);
    cursor: pointer;
    font-size: var(--text-base);
    padding: var(--space-1);
    display: none;
  }

  .sidebar__nav {
    padding: var(--space-4) 0;
    flex: 1;
  }

  .sidebar__group-label {
    padding: var(--space-2) var(--space-5);
    font-size: 10px;
    font-weight: 700;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    color: rgba(255, 255, 255, 0.3);
    margin-top: var(--space-4);
  }

  .sidebar__group-label:first-child {
    margin-top: 0;
  }

  .sidebar__link {
    display: block;
    padding: var(--space-3) var(--space-5);
    font-size: var(--text-sm);
    color: rgba(255, 255, 255, 0.5);
    text-decoration: none;
    transition: all var(--transition-fast);
    border-left: 3px solid transparent;
  }

  .sidebar__link:hover {
    color: rgba(255, 255, 255, 0.8);
    background: rgba(255, 255, 255, 0.03);
  }

  .sidebar__link--active {
    color: var(--color-accent);
    background: rgba(122, 140, 110, 0.15);
    border-left-color: var(--color-accent);
    font-weight: 600;
  }

  .sidebar-toggle {
    display: none;
  }

  @media (max-width: 1024px) {
    .sidebar {
      position: fixed;
      top: var(--header-height);
      left: 0;
      bottom: 0;
      z-index: 90;
      box-shadow: 4px 0 24px rgba(0, 0, 0, 0.2);
    }

    .sidebar--collapsed {
      transform: translateX(-100%);
    }

    .sidebar__collapse {
      display: block;
    }

    .sidebar-toggle--show {
      display: flex;
      position: fixed;
      top: calc(var(--header-height) + var(--space-4));
      left: var(--space-4);
      z-index: 89;
      background: rgba(30, 30, 28, 0.85);
      color: #fff;
      border: none;
      border-radius: var(--radius-sm);
      padding: var(--space-2) var(--space-3);
      cursor: pointer;
      font-size: var(--text-base);
    }
  }
</style>
