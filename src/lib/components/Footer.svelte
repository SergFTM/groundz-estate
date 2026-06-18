<script lang="ts">
  const platform = [
    { label: 'Пулы', href: '/pools' },
    { label: 'Рассчитать доходность', href: '/pools#calc' },
    { label: 'Тарифы', href: '/pricing' },
    { label: 'Кабинет', href: '/investor' },
  ];
</script>

<footer class="gf">
  <div class="gf__wrap">
    <div class="gf__grid">
      <div class="gf__brand">
        <div class="gf__logo">
          <div class="gf__logo-main">GROUNDZ</div>
          <div class="gf__logo-sub">ESTATE</div>
        </div>
        <p class="gf__desc">Цифровая инфраструктура доверия для рынка недвижимости — от первого контакта до ликвидности.</p>
      </div>

      <div class="gf__col">
        <div class="gf__heading">Платформа</div>
        <div class="gf__links">
          {#each platform as l}<a href={l.href}>{l.label}</a>{/each}
        </div>
      </div>

      <div class="gf__col">
        <div class="gf__heading">Рынки</div>
        <div class="gf__links gf__links--plain">
          <span>Cyprus</span><span>Georgia</span><span>Dubai</span><span>Phuket · Bali</span>
        </div>
      </div>

      <div class="gf__col">
        <div class="gf__heading">Контакты</div>
        <div class="gf__links gf__links--plain">
          <a href="mailto:sales@groundz.estate">sales@groundz.estate</a>
          <a href="tel:+35794098889">+357 94 098 889</a>
          <span>Limassol, Cyprus</span>
        </div>
      </div>
    </div>

    <div class="gf__bottom">
      <span>© 2026 GROUNDZ ESTATE · Все права защищены · HE 450620</span>
      <span class="gf__legal"><a href="/terms">Условия</a><a href="/privacy">Конфиденциальность</a></span>
    </div>
  </div>
</footer>

<style>
  .gf { background: var(--ink-deep, #0c3a35); color: rgba(255,255,255,0.7); padding: 72px 40px 40px; }
  .gf__wrap { max-width: 1200px; margin: 0 auto; }
  .gf__grid { display: grid; grid-template-columns: 1.6fr 1fr 1fr 1fr; gap: 40px; padding-bottom: 48px; border-bottom: 1px solid rgba(255,255,255,0.1); }
  .gf__logo { margin-bottom: 18px; line-height: 1; }
  .gf__logo-main { font-size: 20px; font-weight: 700; letter-spacing: 0.03em; color: #fff; }
  .gf__logo-sub { font-size: 8px; font-weight: 700; letter-spacing: 0.46em; color: var(--acc, #7a8c6e); margin-top: 3px; }
  .gf__desc { font-size: 14px; max-width: 300px; line-height: 1.6; color: rgba(255,255,255,0.55); }
  .gf__heading { font-size: 12px; letter-spacing: 0.12em; text-transform: uppercase; color: rgba(255,255,255,0.4); margin-bottom: 18px; }
  .gf__links { display: flex; flex-direction: column; gap: 11px; font-size: 14px; }
  .gf__links a { color: rgba(255,255,255,0.7); text-decoration: none; transition: color .2s; }
  .gf__links a:hover { color: #fff; }
  .gf__links--plain span { color: rgba(255,255,255,0.7); }
  .gf__bottom { display: flex; justify-content: space-between; align-items: center; padding-top: 28px; flex-wrap: wrap; gap: 14px; font-size: 12.5px; color: rgba(255,255,255,0.4); }
  .gf__legal { display: flex; gap: 22px; }
  .gf__legal a { color: rgba(255,255,255,0.4); text-decoration: none; }
  .gf__legal a:hover { color: #fff; }
  @media (max-width: 860px) { .gf__grid { grid-template-columns: 1fr 1fr; } }
  @media (max-width: 560px) { .gf__grid { grid-template-columns: 1fr; } .gf { padding: 48px 22px 32px; } }
</style>
