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
        { label: 'Users', href: '/admin/users' },
        { label: 'Investors', href: '/admin/investors' },
        { label: 'KYC Review', href: '/admin/kyc' },
      ]
    },
    {
      label: 'Properties',
      items: [
        { label: 'Projects', href: '/admin/projects' },
        { label: 'Tour Gen', href: '/admin/tour-gen' }
      ]
    },
    {
      label: 'Finance',
      items: [
        { label: 'Payments', href: '/admin/payments' },
        { label: 'Documents', href: '/admin/documents' },
        { label: 'Inv. Pools', href: '/admin/investment-pools' },
        { label: 'Commits', href: '/admin/commits' },
        { label: 'Reporting', href: '/admin/reporting' },
      ]
    },
    {
      label: 'Content',
      items: [
        { label: 'Articles', href: '/admin/articles' },
        { label: 'Comments', href: '/admin/comments' },
        { label: 'Market Indices', href: '/admin/market-indices' },
        { label: 'OTC Market', href: '/admin/otc' },
        { label: 'FAQ', href: '/admin/faq' },
        { label: 'Jobs', href: '/admin/jobs' }
      ]
    },
    {
      label: 'SEO',
      items: [
        { label: 'Dashboard', href: '/admin/seo' },
        { label: 'Pages', href: '/admin/seo/pages' },
        { label: 'Clusters', href: '/admin/seo/clusters' },
        { label: 'Issues', href: '/admin/seo/issues' }
      ]
    },
    {
      label: 'System',
      items: [
        { label: 'Settings', href: '/admin/settings' }
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
  <button class="sidebar-toggle" onclick={() => collapsed = false} aria-label="Open sidebar">
    <svg width="18" height="14" viewBox="0 0 18 14" fill="none">
      <rect width="18" height="2" rx="1" fill="currentColor"/>
      <rect y="6" width="18" height="2" rx="1" fill="currentColor"/>
      <rect y="12" width="12" height="2" rx="1" fill="currentColor"/>
    </svg>
  </button>
{/if}

<aside class="sidebar" class:sidebar--collapsed={collapsed}>
  <!-- Building illustration -->
  <div class="sidebar__illustration" aria-hidden="true">
    <svg viewBox="0 0 160 320" fill="none" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMax meet">
      <!-- Main building body -->
      <rect x="28" y="60" width="104" height="250" rx="2" stroke="currentColor" stroke-width="0.8" fill="none"/>
      <!-- Roof line detail -->
      <line x1="28" y1="60" x2="80" y2="30" stroke="currentColor" stroke-width="0.6"/>
      <line x1="132" y1="60" x2="80" y2="30" stroke="currentColor" stroke-width="0.6"/>
      <!-- Floors separator lines -->
      <line x1="28" y1="110" x2="132" y2="110" stroke="currentColor" stroke-width="0.4"/>
      <line x1="28" y1="160" x2="132" y2="160" stroke="currentColor" stroke-width="0.4"/>
      <line x1="28" y1="210" x2="132" y2="210" stroke="currentColor" stroke-width="0.4"/>
      <line x1="28" y1="260" x2="132" y2="260" stroke="currentColor" stroke-width="0.4"/>
      <!-- Windows floor 1 -->
      <rect x="40" y="72" width="18" height="24" rx="1" stroke="currentColor" stroke-width="0.7" fill="none"/>
      <rect x="71" y="72" width="18" height="24" rx="1" stroke="currentColor" stroke-width="0.7" fill="none"/>
      <rect x="102" y="72" width="18" height="24" rx="1" stroke="currentColor" stroke-width="0.7" fill="none"/>
      <!-- Windows floor 2 -->
      <rect x="40" y="122" width="18" height="24" rx="1" stroke="currentColor" stroke-width="0.7" fill="none"/>
      <rect x="71" y="122" width="18" height="24" rx="1" stroke="currentColor" stroke-width="0.7" fill="none"/>
      <rect x="102" y="122" width="18" height="24" rx="1" stroke="currentColor" stroke-width="0.7" fill="none"/>
      <!-- Windows floor 3 -->
      <rect x="40" y="172" width="18" height="24" rx="1" stroke="currentColor" stroke-width="0.7" fill="none"/>
      <rect x="71" y="172" width="18" height="24" rx="1" stroke="currentColor" stroke-width="0.7" fill="none"/>
      <rect x="102" y="172" width="18" height="24" rx="1" stroke="currentColor" stroke-width="0.7" fill="none"/>
      <!-- Windows floor 4 -->
      <rect x="40" y="222" width="18" height="24" rx="1" stroke="currentColor" stroke-width="0.7" fill="none"/>
      <rect x="71" y="222" width="18" height="24" rx="1" stroke="currentColor" stroke-width="0.7" fill="none"/>
      <rect x="102" y="222" width="18" height="24" rx="1" stroke="currentColor" stroke-width="0.7" fill="none"/>
      <!-- Ground floor entrance -->
      <rect x="62" y="278" width="36" height="32" rx="2" stroke="currentColor" stroke-width="0.8" fill="none"/>
      <!-- Ground line -->
      <line x1="10" y1="310" x2="150" y2="310" stroke="currentColor" stroke-width="0.6"/>
    </svg>
  </div>

  <div class="sidebar__header">
    <span class="sidebar__brand">GROUNDZ</span>
    <button class="sidebar__collapse" onclick={() => collapsed = true} aria-label="Collapse sidebar">
      <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
        <path d="M1 1L13 13M13 1L1 13" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
      </svg>
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
    width: 160px;
    height: calc(100vh - var(--header-height));
    position: sticky;
    top: var(--header-height);
    background: linear-gradient(
      180deg,
      #28271f 0%,
      #3a3428 35%,
      #6b5f4a 65%,
      #c4b49a 100%
    );
    color: #fff;
    display: flex;
    flex-direction: column;
    flex-shrink: 0;
    overflow-y: auto;
    overflow-x: hidden;
    transition: transform var(--transition-base);
  }

  .sidebar--collapsed {
    display: none;
  }

  /* Building illustration fills the lower portion */
  .sidebar__illustration {
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    height: 70%;
    color: rgba(255, 255, 255, 0.12);
    pointer-events: none;
  }

  .sidebar__illustration svg {
    width: 100%;
    height: 100%;
  }

  .sidebar__header {
    position: relative;
    z-index: 1;
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: var(--space-6) var(--space-5);
    border-bottom: 1px solid rgba(255, 255, 255, 0.08);
  }

  .sidebar__brand {
    font-size: 11px;
    font-weight: 700;
    letter-spacing: 0.22em;
    text-transform: uppercase;
    color: #fff;
  }

  .sidebar__collapse {
    background: none;
    border: none;
    color: rgba(255, 255, 255, 0.35);
    cursor: pointer;
    padding: var(--space-1);
    display: none;
    line-height: 0;
    transition: color var(--transition-fast);
  }

  .sidebar__collapse:hover {
    color: rgba(255, 255, 255, 0.7);
  }

  .sidebar__nav {
    position: relative;
    z-index: 1;
    padding: var(--space-4) 0;
    flex: 1;
  }

  .sidebar__group-label {
    padding: var(--space-2) var(--space-5);
    font-size: 9px;
    font-weight: 700;
    letter-spacing: 0.14em;
    text-transform: uppercase;
    color: rgba(255, 255, 255, 0.28);
    margin-top: var(--space-4);
  }

  .sidebar__group-label:first-child {
    margin-top: 0;
  }

  .sidebar__link {
    display: block;
    padding: var(--space-2) var(--space-5);
    font-size: var(--text-sm);
    color: rgba(255, 255, 255, 0.52);
    text-decoration: none;
    transition: all var(--transition-fast);
    border-left: 2px solid transparent;
    letter-spacing: 0.01em;
  }

  .sidebar__link:hover {
    color: rgba(255, 255, 255, 0.85);
    background: rgba(255, 255, 255, 0.05);
  }

  .sidebar__link--active {
    color: #fff;
    background: rgba(255, 255, 255, 0.07);
    border-left-color: rgba(255, 255, 255, 0.6);
    font-weight: 500;
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
      box-shadow: 4px 0 32px rgba(0, 0, 0, 0.3);
    }

    .sidebar--collapsed {
      display: flex;
      transform: translateX(-100%);
    }

    .sidebar__collapse {
      display: flex;
    }

    .sidebar-toggle {
      display: flex;
      align-items: center;
      justify-content: center;
      position: fixed;
      top: calc(var(--header-height) + var(--space-4));
      left: var(--space-4);
      z-index: 89;
      background: #28271f;
      color: rgba(255, 255, 255, 0.7);
      border: none;
      border-radius: var(--radius-sm);
      padding: var(--space-2) var(--space-3);
      cursor: pointer;
    }
  }
</style>
