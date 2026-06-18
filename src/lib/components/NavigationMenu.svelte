<script lang="ts">
  import { locale, setLocale } from '$lib/stores/locale';
  import { t } from '$lib/i18n';

  interface User { id: string; email: string; role: string; name?: string; }
  interface Props { user: User | null; transparent?: boolean; }
  let { user }: Props = $props();

  const cabinetHref = $derived(
    user?.role === 'internal_team' ? '/admin'
    : user?.role === 'buyer' ? '/buyer'
    : user?.role === 'investor' ? '/investor'
    : user?.role === 'agent' ? '/agent'
    : '/auth/login'
  );

  const links = $derived([
    { label: t($locale, 'nav.pools'), href: '/pools' },
    { label: t($locale, 'nav.howItWorks'), href: '/invest/how-it-works' },
    { label: t($locale, 'nav.platform'), href: '/#platform' },
    { label: t($locale, 'nav.pricing'), href: '/pricing' },
    { label: t($locale, 'nav.cabinet'), href: cabinetHref },
  ]);

  let mobileOpen = $state(false);
</script>

<header class="gn">
  <a href="/" class="gn__logo" aria-label="GROUNDZ ESTATE">
    <span class="gn__logo-main">GROUNDZ</span>
    <span class="gn__logo-sub">ESTATE</span>
  </a>

  <nav class="gn__nav" aria-label="Main">
    {#each links as l}
      <a href={l.href} class="gn__link">{l.label}</a>
    {/each}
  </nav>

  <div class="gn__right">
    <div class="gn__lang" role="group" aria-label="Language">
      <button type="button" class="gn__lang-btn" class:gn__lang-btn--active={$locale === 'ru'} onclick={() => setLocale('ru')}>RU</button>
      <button type="button" class="gn__lang-btn" class:gn__lang-btn--active={$locale === 'en'} onclick={() => setLocale('en')}>EN</button>
    </div>
    {#if user}
      <a href={cabinetHref} class="gn__cta">{t($locale, 'nav.cabinet')}</a>
      <form method="POST" action="/auth/logout" class="gn__logout-form">
        <button type="submit" class="gn__logout" title={user.email}>{t($locale, 'nav.logout')}</button>
      </form>
    {:else}
      <a href="/auth/login" class="gn__cta">{t($locale, 'nav.becomeInvestor')}</a>
    {/if}
    <button class="gn__burger" aria-label="Menu" onclick={() => (mobileOpen = !mobileOpen)}>
      <span></span><span></span><span></span>
    </button>
  </div>
</header>

{#if mobileOpen}
  <div class="gn__mobile">
    {#each links as l}
      <a href={l.href} onclick={() => (mobileOpen = false)}>{l.label}</a>
    {/each}
    {#if user}
      <a href={cabinetHref} class="gn__mobile-cta" onclick={() => (mobileOpen = false)}>{t($locale, 'nav.cabinet')}</a>
      <form method="POST" action="/auth/logout"><button type="submit" class="gn__mobile-logout">{t($locale, 'nav.logout')} · {user.email}</button></form>
    {:else}
      <a href="/auth/login" class="gn__mobile-cta" onclick={() => (mobileOpen = false)}>{t($locale, 'nav.becomeInvestor')}</a>
    {/if}
  </div>
{/if}

<style>
  .gn {
    position: sticky; top: 0; z-index: 50;
    display: flex; align-items: center; justify-content: space-between;
    padding: 16px 40px;
    background: rgba(255,255,255,0.82);
    backdrop-filter: blur(14px); -webkit-backdrop-filter: blur(14px);
    border-bottom: 1px solid #ece8e1;
  }
  .gn__logo { display: flex; flex-direction: column; align-items: flex-start; line-height: 1; text-decoration: none; }
  .gn__logo-main { font-size: 21px; font-weight: 700; letter-spacing: 0.03em; color: var(--ink, #104e49); }
  .gn__logo-sub { font-size: 8px; font-weight: 700; letter-spacing: 0.46em; color: var(--acc, #7a8c6e); margin-top: 3px; }

  .gn__nav { display: flex; align-items: center; gap: 30px; margin-left: 48px; margin-right: auto; }
  .gn__link { font-size: 14px; color: #444; text-decoration: none; white-space: nowrap; transition: color .2s; }
  .gn__link:hover { color: var(--ink, #104e49); }

  .gn__right { display: flex; align-items: center; gap: 18px; }
  .gn__lang { display: flex; align-items: center; gap: 2px; border: 1px solid #ddd8d0; border-radius: 999px; padding: 3px; }
  .gn__lang-btn { background: transparent; color: #888; border: none; cursor: pointer; font-family: inherit; font-size: 12px; font-weight: 600; padding: 6px 12px; border-radius: 999px; transition: background .2s, color .2s; }
  .gn__lang-btn--active { background: var(--ink, #104e49); color: #fff; }
  .gn__cta { background: var(--acc, #7a8c6e); color: #fff; font-size: 13px; font-weight: 600; letter-spacing: 0.04em; padding: 11px 22px; border-radius: 999px; white-space: nowrap; text-decoration: none; transition: background .2s; }
  .gn__cta:hover { background: var(--acc-dk, #5f7257); }
  .gn__logout-form { margin: 0; }
  .gn__logout { background: none; border: 1px solid #ddd8d0; color: #5c5c5c; cursor: pointer; font-family: inherit; font-size: 13px; font-weight: 600; padding: 10px 16px; border-radius: 999px; transition: border-color .2s, color .2s; }
  .gn__logout:hover { border-color: var(--ink, #104e49); color: var(--ink, #104e49); }
  .gn__mobile-logout { width: 100%; text-align: left; background: none; border: none; cursor: pointer; font-family: inherit; font-size: 14px; color: #9a948c; padding: 12px 0 0; }

  .gn__burger { display: none; flex-direction: column; gap: 4px; background: none; border: none; cursor: pointer; padding: 6px; }
  .gn__burger span { width: 22px; height: 2px; background: var(--ink, #104e49); border-radius: 2px; }

  .gn__mobile { position: sticky; top: 57px; z-index: 49; display: flex; flex-direction: column; gap: 4px; background: #fff; border-bottom: 1px solid #ece8e1; padding: 12px 22px 18px; }
  .gn__mobile a { font-size: 15px; color: #444; text-decoration: none; padding: 10px 0; border-bottom: 1px solid #f5f3ef; }
  .gn__mobile-cta { color: var(--acc-dk, #5f7257) !important; font-weight: 700; border-bottom: none !important; }

  @media (max-width: 900px) {
    .gn { padding: 14px 22px; }
    .gn__nav { display: none; }
    .gn__burger { display: flex; }
  }
</style>
