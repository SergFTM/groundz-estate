<script lang="ts">
  import CabinetSidebar from '$lib/components/cabinet/CabinetSidebar.svelte';
  import CabinetTabs from '$lib/components/cabinet/CabinetTabs.svelte';

  let { data, children } = $props();

  const buyerTabs = [
    { label: 'Overview', href: '/buyer' },
    { label: 'My Property', href: '/buyer/property' },
    { label: 'Construction', href: '/buyer/construction' },
    { label: 'Payments', href: '/buyer/payments' },
    { label: 'Documents', href: '/buyer/documents' }
  ];

  const investorTabs = [
    { label: 'Portfolio', href: '/investor' },
    { label: 'Pools', href: '/investor/pools' },
    { label: 'Documents', href: '/investor/documents' }
  ];

  const agentTabs = [
    { label: 'Dashboard', href: '/agent' },
    { label: 'All Leads', href: '/agent/leads' },
    { label: 'My Clients', href: '/agent/clients' }
  ];

  let isAdmin = $derived(data.user.role === 'internal_team');
  let tabs = $derived.by(() => {
    switch (data.user.role) {
      case 'buyer': return buyerTabs;
      case 'investor': return investorTabs;
      case 'agent': return agentTabs;
      default: return [];
    }
  });
</script>

<div class="cabinet" class:cabinet--with-sidebar={isAdmin}>
  {#if isAdmin}
    <CabinetSidebar />
  {:else}
    <CabinetTabs {tabs} />
  {/if}

  <div class="cabinet__content">
    {@render children()}
  </div>
</div>

<style>
  .cabinet {
    display: flex;
    flex-direction: column;
    min-height: calc(100vh - var(--header-height));
  }

  .cabinet--with-sidebar {
    flex-direction: row;
  }

  .cabinet__content {
    flex: 1;
    padding: var(--space-8);
    background: var(--color-bg);
    min-width: 0;
  }

  @media (max-width: 768px) {
    .cabinet__content {
      padding: var(--space-4);
    }
  }
</style>
