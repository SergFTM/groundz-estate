<script lang="ts">
  // Landing rebuilt to match the GROUNDZ ESTATE prototype (visual source of truth).
  // Tokens (--ink/--acc/--acc-dk/--mint) live in app.css. Numbers use IBM Plex Mono.
  // NOTE: copy reproduced from prototype (RU). i18n re-wiring tracked separately.
  let { data } = $props();
  void data;

  const pools = [
    { tag: 'Активен', tagBg: 'rgba(79,138,91,0.92)', ticker: 'dCYP', img: '/img/p-cyprus.jpg',
      loc: 'Cyprus · Лимасол', name: 'Cyprus Development Pool',
      desc: 'Премиальная резиденция в Лимасоле с PR-правом и VAT 5%.',
      raised: '€5,200,000', pct: 65, goal: '€8,000,000', roi: '12.0%', roiLabel: 'Общий ROI', ticket: '€25,000', slug: 'cyprus-development-pool' },
    { tag: 'Пресейл', tagBg: 'rgba(122,140,110,0.92)', ticker: 'dGEO', img: '/img/p-georgia.jpg',
      loc: 'Georgia · Батуми', name: 'Georgia Presale Pool',
      desc: 'Ранний вход в растущий рынок Батуми до старта продаж.',
      raised: '€1,560,000', pct: 65, goal: '€2,400,000', roi: '18.0%', roiLabel: 'Рост стоимости', ticket: '€5,000', slug: 'georgia-presale-pool' },
    { tag: 'Активен', tagBg: 'rgba(79,138,91,0.92)', ticker: 'dDXB', img: '/img/p-dubai.jpg',
      loc: 'Dubai · JVC, Дубай', name: 'Dubai Rental Yield Pool',
      desc: 'Портфель апартаментов с стабильным арендным доходом.',
      raised: '€3,900,000', pct: 78, goal: '€5,000,000', roi: '9.2%', roiLabel: 'Чист. доходность', ticket: '€10,000', slug: 'dubai-rental-yield-pool' },
  ];

  const markets = [
    { name: 'Кипр', sub: 'PR от €300к · VAT 5%', pools: '2', yield: '8–12%' },
    { name: 'Грузия', sub: 'Пресейл · рост рынка', pools: '1', yield: 'до 18%' },
    { name: 'Дубай', sub: '0% налог · аренда', pools: '1', yield: '9–11%' },
    { name: 'Пхукет', sub: 'Краткоср. аренда', pools: '1', yield: '10–13%' },
    { name: 'Бали', sub: 'Hospitality · скоро', pools: '1', yield: 'до 14%' },
  ];

  const steps = [
    { n: '01', t: 'Объект → пул', d: 'Мы упаковываем объект или портфель в пул: цель сбора, срок, юридическая структура и документы.' },
    { n: '02', t: 'Пул → токены', d: 'Пул делится на токены. Один токен — это ваша доля в активе и в его доходе.' },
    { n: '03', t: 'Токен → доход', d: 'Вы получаете доход от аренды и роста стоимости. Всё видно в кабинете инвестора.' },
    { n: '04', t: 'Выход и ликвидность', d: 'Выход по стратегии пула или продажа токенов на вторичном рынке.' },
  ];

  const layers = [
    { n: '01', t: 'Marketplace', d: 'Каталог объектов и портфелей: карты, фильтры, планировки, цены и статусы.' },
    { n: '02', t: 'Investment Pools', d: 'Пулы и пресейлы: цель сбора, билет, доходность, стратегия выхода.' },
    { n: '03', t: 'Tokenization', d: 'Токены, allocation, vesting, treasury и учёт on-chain / off-chain.' },
    { n: '04', t: 'Investor Cabinet', d: 'Портфель, доли, начисления, отчёты и история операций.' },
    { n: '05', t: 'Compliance & Trust', d: 'Документы, due diligence, KYC/AML и юридическая структура.' },
    { n: '06', t: 'Liquidity', d: 'Вторичный рынок, market making и сценарии выкупа.' },
  ];

  const trust = [
    { t: 'Документы по каждому объекту', d: 'Title deed, разрешения, финансовая модель и investor memo.' },
    { t: 'Due diligence', d: 'Проверка девелопера, прав и юридической чистоты.' },
    { t: 'KYC / AML', d: 'Верификация инвесторов и соблюдение требований.' },
    { t: 'Юридическая структура', d: 'SPV и прозрачная связь токена с активом.' },
    { t: 'Аудит смарт-контрактов', d: 'Независимая проверка кода и логики пула.' },
    { t: 'Отчётность', d: 'Регулярные отчёты по доходу, загрузке и статусу строительства.' },
  ];

  const roles = [
    { tag: 'Инвестор', t: 'Доход без хлопот', d: 'Вход от €5 000, диверсификация по рынкам и прозрачный кабинет с начислениями.' },
    { tag: 'Покупатель', t: 'Прозрачная сделка', d: 'Статусы, платежи, документы и ход строительства в одном месте.' },
    { tag: 'Агент', t: 'Инвентарь и комиссии', d: 'Доступ к объектам, материалы, offer-ссылки и учёт комиссий.' },
  ];
</script>

<svelte:head>
  <title>GROUNDZ ESTATE — токенизированная недвижимость</title>
  <meta name="description" content="GROUNDZ превращает объекты и портфели в инвестиционные пулы. Токен = доля в активе и его доходе. Кипр, Грузия, Дубай, Пхукет, Бали." />
</svelte:head>

<!-- HERO -->
<section class="g-hero">
  <img src="/img/hero.jpg" alt="" class="g-hero__img" />
  <div class="g-hero__overlay"></div>
  <div class="g-hero__inner">
    <div class="g-eyebrow g-eyebrow--light">Токенизированная недвижимость · Кипр · Грузия · Дубай</div>
    <h1 class="g-hero__title">Инвестируйте в недвижимость по частям.</h1>
    <p class="g-hero__sub">GROUNDZ превращает объекты и портфели в инвестиционные пулы. Вы покупаете токен — он закреплён за реальным активом, документами и долей в доходе.</p>
    <div class="g-hero__cta">
      <a href="/pools" class="g-btn g-btn--acc g-btn--shadow">Смотреть пулы</a>
      <a href="/pools#calc" class="g-btn g-btn--ghost">Рассчитать доходность</a>
    </div>
  </div>
</section>

<!-- METRICS -->
<section class="g-metrics">
  <div class="g-metrics__grid">
    <div class="g-metric"><div class="g-metric__val num">€23.8M</div><div class="g-metric__label">Собрано в пулах</div></div>
    <div class="g-metric"><div class="g-metric__val num">1,240</div><div class="g-metric__label">Инвесторов</div></div>
    <div class="g-metric"><div class="g-metric__val num">5</div><div class="g-metric__label">Рынка</div></div>
    <div class="g-metric"><div class="g-metric__val num" style="color:var(--mint)">9.4%</div><div class="g-metric__label">Ср. чистая доходность</div></div>
  </div>
</section>

<!-- HOW IT WORKS -->
<section class="g-sec g-sec--warm">
  <div class="g-wrap">
    <div class="g-eyebrow">Как это работает</div>
    <h2 class="g-h2">Токены — это просто ваша доля.</h2>
    <p class="g-lead">Никакой крипто-магии. Четыре шага от объекта до дохода.</p>
    <div class="g-grid-4">
      {#each steps as s}
        <div class="g-card">
          <div class="g-card__n num">{s.n}</div>
          <h3 class="g-card__t">{s.t}</h3>
          <p class="g-card__d">{s.d}</p>
        </div>
      {/each}
    </div>
  </div>
</section>

<!-- POOLS -->
<section class="g-sec">
  <div class="g-wrap">
    <div class="g-sec__head">
      <div>
        <div class="g-eyebrow">Открытые пулы</div>
        <h2 class="g-h2">Выберите рынок и стратегию.</h2>
      </div>
      <a href="/pools" class="g-btn g-btn--outline">Все пулы →</a>
    </div>
    <div class="g-grid-3">
      {#each pools as p}
        <a class="g-pool" href="/pools/{p.slug}">
          <div class="g-pool__media">
            <div class="g-pool__img" style="background-image:url('{p.img}')"></div>
            <span class="g-pool__status" style="background:{p.tagBg}">{p.tag}</span>
            <span class="g-pool__ticker num">{p.ticker}</span>
          </div>
          <div class="g-pool__body">
            <div class="g-pool__loc num">{p.loc}</div>
            <h3 class="g-pool__name">{p.name}</h3>
            <p class="g-pool__desc">{p.desc}</p>
            <div class="g-pool__prog">
              <div class="g-pool__progrow num"><span style="color:var(--color-text-muted)">{p.raised}</span><span style="color:#1c1c1a;font-weight:500">{p.pct}%</span></div>
              <div class="g-bar"><div class="g-bar__fill" style="width:{p.pct}%"></div></div>
              <div class="g-pool__goal">из <span class="num">{p.goal}</span></div>
            </div>
            <div class="g-pool__foot">
              <div><div class="g-pool__metric num" style="color:var(--acc-dk)">{p.roi}</div><div class="g-pool__metriclabel">{p.roiLabel}</div></div>
              <div style="text-align:right"><div class="g-pool__metric num">{p.ticket}</div><div class="g-pool__metriclabel">Мин. билет</div></div>
            </div>
          </div>
        </a>
      {/each}
    </div>
  </div>
</section>

<!-- MARKETS -->
<section class="g-sec g-sec--alt">
  <div class="g-wrap">
    <div class="g-eyebrow">Мультимаркет</div>
    <h2 class="g-h2">Одна платформа — пять рынков.</h2>
    <p class="g-lead">Разные юрисдикции, налоги и сценарии — единый инвестиционный опыт.</p>
    <div class="g-grid-5">
      {#each markets as m}
        <div class="g-market">
          <h3 class="g-market__name">{m.name}</h3>
          <div class="g-market__sub">{m.sub}</div>
          <div class="g-market__foot">
            <div><div class="g-market__val num">{m.pools}</div><div class="g-market__lbl">пулов</div></div>
            <div style="text-align:right"><div class="g-market__val num" style="color:var(--acc-dk)">{m.yield}</div><div class="g-market__lbl">доходность</div></div>
          </div>
        </div>
      {/each}
    </div>
  </div>
</section>

<!-- ROI CALC -->
<section class="g-sec g-calc" id="calc">
  <div class="g-calc__grid">
    <div>
      <div class="g-eyebrow" style="color:var(--mint)">Калькулятор доходности</div>
      <h2 class="g-h2 g-h2--light">Посчитайте свой доход.</h2>
      <p class="g-lead g-lead--light" style="max-width:440px">Прозрачная экономика до сделки, а не после. Выберите сумму, пул и срок.</p>
      <div class="g-field">
        <div class="g-field__row"><span class="g-field__label">Сумма инвестиции</span><span class="g-field__val num">€50,000</span></div>
        <input type="range" min="5000" max="500000" step="5000" value="50000" style="width:100%" aria-label="Сумма" />
      </div>
      <div class="g-field">
        <div class="g-field__label" style="margin-bottom:14px">Пул</div>
        <div class="g-chips">
          <button class="g-chip">Cyprus · 12.0%</button>
          <button class="g-chip">Georgia · 18.0%</button>
          <button class="g-chip g-chip--active">Dubai · 9.2%</button>
          <button class="g-chip">Phuket · 11.5%</button>
          <button class="g-chip">Cyprus · 21.0%</button>
        </div>
      </div>
      <div class="g-field">
        <div class="g-field__row"><span class="g-field__label">Горизонт</span><span class="g-field__val num">5 лет</span></div>
        <input type="range" min="1" max="10" step="1" value="5" style="width:100%" aria-label="Горизонт" />
      </div>
    </div>
    <div class="g-calc__panel">
      <div class="g-calc__phead"><span>Расчёт</span><span class="num g-calc__tag">dDXB</span></div>
      <div class="g-calc__line"><span>Токенов</span><span class="num">500</span></div>
      <div class="g-calc__line"><span>Доход в год</span><span class="num" style="color:var(--mint)">€4,600</span></div>
      <div class="g-calc__line"><span>Доход за весь срок</span><span class="num">€23,000</span></div>
      <div class="g-calc__result">
        <div><div class="g-calc__rlabel">Прогноз стоимости</div><div class="g-calc__rsub num">5 лет · dDXB</div></div>
        <div class="g-calc__rval num">€86,814</div>
      </div>
      <p class="g-calc__note">Прогноз носит иллюстративный характер и не является гарантией доходности.</p>
    </div>
  </div>
</section>

<!-- PLATFORM -->
<section class="g-sec">
  <div class="g-wrap">
    <div class="g-eyebrow">Платформа</div>
    <h2 class="g-h2">Это не сайт недвижимости. Это инфраструктура.</h2>
    <p class="g-lead">Шесть слоёв, которые превращают недвижимость в управляемый цифровой актив.</p>
    <div class="g-layers">
      {#each layers as l}
        <div class="g-layer">
          <div class="g-layer__n num">{l.n}</div>
          <h3 class="g-layer__t">{l.t}</h3>
          <p class="g-layer__d">{l.d}</p>
        </div>
      {/each}
    </div>
  </div>
</section>

<!-- TRUST -->
<section class="g-sec g-sec--warm">
  <div class="g-wrap">
    <div class="g-eyebrow">Прозрачность</div>
    <h2 class="g-h2">Доверие — это архитектура данных.</h2>
    <p class="g-lead">Каждый пул опирается на документы и проверки, а не на обещания.</p>
    <div class="g-trust">
      {#each trust as item}
        <div class="g-trust__item">
          <div class="g-trust__ico">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 6L9 17l-5-5"></path></svg>
          </div>
          <div><h3 class="g-trust__t">{item.t}</h3><p class="g-trust__d">{item.d}</p></div>
        </div>
      {/each}
    </div>
    <div class="g-disclaimer">Инвестиции в недвижимость и токенизированные активы связаны с риском. Доходность не гарантирована. Это демо-прототип и не является офертой.</div>
  </div>
</section>

<!-- FOR WHOM -->
<section class="g-sec">
  <div class="g-wrap">
    <div class="g-eyebrow">Для кого</div>
    <h2 class="g-h2">Одна платформа — три роли.</h2>
    <div class="g-grid-3">
      {#each roles as r}
        <div class="g-role">
          <div class="g-role__tag num">{r.tag}</div>
          <h3 class="g-role__t">{r.t}</h3>
          <p class="g-role__d">{r.d}</p>
        </div>
      {/each}
    </div>
  </div>
</section>

<!-- CTA -->
<section class="g-cta">
  <div class="g-cta__inner">
    <h2 class="g-cta__title">Начните с одного токена.</h2>
    <p class="g-cta__sub">Посмотрите открытые пулы или выберите уровень участия.</p>
    <div class="g-cta__btns">
      <a href="/pools" class="g-btn g-btn--acc">Смотреть пулы</a>
      <a href="/pricing" class="g-btn g-btn--ghost">Уровни участия</a>
    </div>
  </div>
</section>

<style>
  /* GROUNDZ landing — faithful to prototype */
  .num { font-family: var(--font-mono); font-variant-numeric: tabular-nums; }
  .g-wrap { max-width: 1200px; margin: 0 auto; }
  .g-sec { padding: 108px 40px; background: #fff; }
  .g-sec--warm { background: #faf8f5; }
  .g-sec--alt { background: #f5f3ef; }
  .g-eyebrow { font-family: var(--font-mono); font-size: 12px; letter-spacing: 0.2em; color: var(--acc-dk); text-transform: uppercase; margin-bottom: 16px; }
  .g-eyebrow--light { color: rgba(255,255,255,0.82); letter-spacing: 0.22em; }
  .g-h2 { font-family: var(--font-display); font-style: italic; font-weight: 300; font-size: 46px; line-height: 1.08; color: #1c1c1a; max-width: 700px; margin-bottom: 14px; }
  .g-h2--light { color: #fff; }
  .g-lead { font-size: 17px; color: #5c5c5c; max-width: 600px; margin-bottom: 56px; }
  .g-lead--light { color: rgba(255,255,255,0.7); }

  /* Buttons */
  .g-btn { display: inline-block; font-size: 14px; font-weight: 600; letter-spacing: 0.04em; padding: 16px 32px; border-radius: 999px; text-decoration: none; cursor: pointer; transition: opacity .2s, background .2s; }
  .g-btn--acc { background: var(--acc); color: #fff; }
  .g-btn--acc:hover { background: var(--acc-dk); }
  .g-btn--shadow { box-shadow: 0 8px 28px rgba(122,140,110,0.4); }
  .g-btn--ghost { background: rgba(255,255,255,0.12); color: #fff; border: 1px solid rgba(255,255,255,0.45); backdrop-filter: blur(4px); }
  .g-btn--ghost:hover { background: rgba(255,255,255,0.2); }
  .g-btn--outline { background: none; border: 1px solid #1c1c1a; color: #1c1c1a; padding: 14px 26px; }
  .g-btn--outline:hover { background: #1c1c1a; color: #fff; }

  /* Hero */
  .g-hero { position: relative; min-height: 86vh; display: flex; align-items: flex-end; overflow: hidden; }
  .g-hero__img { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; }
  .g-hero__overlay { position: absolute; inset: 0; background: linear-gradient(rgba(20,24,22,0.34) 0%, rgba(20,24,22,0.12) 38%, rgba(20,24,22,0.62) 100%); }
  .g-hero__inner { position: relative; max-width: 1200px; margin: 0 auto; width: 100%; padding: 0 40px 64px; color: #fff; }
  .g-hero__title { font-family: var(--font-display); font-style: italic; font-weight: 300; font-size: 74px; line-height: 1.04; letter-spacing: -0.01em; max-width: 880px; margin-bottom: 24px; }
  .g-hero__sub { font-size: 19px; line-height: 1.6; max-width: 560px; color: rgba(255,255,255,0.9); margin-bottom: 34px; }
  .g-hero__cta { display: flex; gap: 14px; flex-wrap: wrap; }

  /* Metrics */
  .g-metrics { background: var(--ink); color: #fff; }
  .g-metrics__grid { max-width: 1200px; margin: 0 auto; padding: 38px 40px; display: grid; grid-template-columns: repeat(4,1fr); gap: 24px; }
  .g-metric { border-left: 1px solid rgba(255,255,255,0.16); padding-left: 22px; }
  .g-metric__val { font-size: 38px; font-weight: 500; letter-spacing: -0.02em; }
  .g-metric__label { font-size: 12px; letter-spacing: 0.14em; text-transform: uppercase; color: rgba(255,255,255,0.55); margin-top: 6px; }

  /* Cards (how it works) */
  .g-grid-4 { display: grid; grid-template-columns: repeat(4,1fr); gap: 28px; }
  .g-card { background: #fff; border: 1px solid #ece8e1; border-radius: 18px; padding: 30px 26px; }
  .g-card__n { font-size: 13px; color: var(--acc); letter-spacing: 0.1em; margin-bottom: 38px; }
  .g-card__t { font-size: 19px; font-weight: 700; margin-bottom: 10px; color: #1c1c1a; }
  .g-card__d { font-size: 14.5px; color: #5c5c5c; line-height: 1.6; }

  /* Pools */
  .g-sec__head { display: flex; align-items: flex-end; justify-content: space-between; margin-bottom: 48px; flex-wrap: wrap; gap: 20px; }
  .g-grid-3 { display: grid; grid-template-columns: repeat(3,1fr); gap: 26px; }
  .g-pool { background: #fff; border: 1px solid #ece8e1; border-radius: 18px; overflow: hidden; cursor: pointer; transition: box-shadow .3s, transform .3s; display: flex; flex-direction: column; text-decoration: none; color: inherit; }
  .g-pool:hover { box-shadow: 0 18px 50px rgba(0,0,0,0.13); transform: translateY(-4px); }
  .g-pool__media { position: relative; height: 190px; overflow: hidden; }
  .g-pool__img { width: 100%; height: 100%; background-size: cover; background-position: center; }
  .g-pool__status { position: absolute; top: 14px; left: 14px; font-size: 10.5px; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase; padding: 5px 11px; border-radius: 999px; color: #fff; }
  .g-pool__ticker { position: absolute; top: 14px; right: 14px; font-size: 11px; font-weight: 500; letter-spacing: 0.06em; background: rgba(16,78,73,0.85); color: #fff; padding: 5px 9px; border-radius: 6px; backdrop-filter: blur(4px); }
  .g-pool__body { padding: 24px; display: flex; flex-direction: column; flex: 1; }
  .g-pool__loc { font-size: 11px; letter-spacing: 0.12em; color: #9a948c; text-transform: uppercase; margin-bottom: 8px; }
  .g-pool__name { font-size: 20px; font-weight: 700; margin-bottom: 8px; color: #1c1c1a; }
  .g-pool__desc { font-size: 14px; color: #5c5c5c; line-height: 1.55; margin-bottom: 20px; flex: 1; }
  .g-pool__prog { margin-bottom: 18px; }
  .g-pool__progrow { display: flex; justify-content: space-between; font-size: 12.5px; margin-bottom: 7px; }
  .g-bar { height: 5px; background: #eceae4; border-radius: 9px; overflow: hidden; }
  .g-bar__fill { height: 100%; background: var(--acc); border-radius: 9px; }
  .g-pool__goal { font-size: 11.5px; color: #9a948c; margin-top: 7px; }
  .g-pool__foot { display: flex; justify-content: space-between; border-top: 1px solid #f0ede7; padding-top: 16px; }
  .g-pool__metric { font-size: 18px; font-weight: 600; color: #1c1c1a; }
  .g-pool__metriclabel { font-size: 10.5px; letter-spacing: 0.08em; text-transform: uppercase; color: #9a948c; margin-top: 3px; }

  /* Markets */
  .g-grid-5 { display: grid; grid-template-columns: repeat(5,1fr); gap: 16px; }
  .g-market { background: #fff; border: 1px solid #e8e4dd; border-radius: 16px; padding: 26px 22px; }
  .g-market__name { font-family: var(--font-display); font-style: italic; font-weight: 300; font-size: 27px; color: #1c1c1a; margin-bottom: 6px; }
  .g-market__sub { font-size: 12.5px; color: var(--acc-dk); margin-bottom: 22px; }
  .g-market__foot { display: flex; justify-content: space-between; border-top: 1px solid #f0ede7; padding-top: 14px; }
  .g-market__val { font-size: 17px; font-weight: 600; }
  .g-market__lbl { font-size: 10px; letter-spacing: 0.08em; text-transform: uppercase; color: #9a948c; margin-top: 2px; }

  /* ROI calc */
  .g-calc { background: var(--ink); color: #fff; }
  .g-calc__grid { max-width: 1200px; margin: 0 auto; display: grid; grid-template-columns: 1fr 1.05fr; gap: 64px; align-items: center; }
  .g-field { margin-bottom: 34px; }
  .g-field__row { display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 14px; }
  .g-field__label { font-size: 13px; letter-spacing: 0.06em; text-transform: uppercase; color: rgba(255,255,255,0.6); }
  .g-field__val { font-size: 24px; font-weight: 500; }
  .g-chips { display: flex; flex-wrap: wrap; gap: 8px; }
  .g-chip { font-size: 12.5px; cursor: pointer; padding: 9px 14px; border-radius: 999px; border: 1px solid rgba(255,255,255,0.22); background: transparent; color: #fff; font-weight: 400; }
  .g-chip--active { border-color: transparent; background: var(--acc); font-weight: 600; }
  .g-calc__panel { background: #0e453f; border: 1px solid rgba(255,255,255,0.1); border-radius: 22px; padding: 40px; }
  .g-calc__phead { display: flex; justify-content: space-between; align-items: center; margin-bottom: 28px; font-size: 12px; letter-spacing: 0.14em; text-transform: uppercase; color: rgba(255,255,255,0.5); }
  .g-calc__tag { font-size: 12px; color: var(--mint); border: 1px solid rgba(159,192,163,0.4); padding: 4px 9px; border-radius: 6px; text-transform: none; letter-spacing: 0; }
  .g-calc__line { display: flex; justify-content: space-between; padding: 16px 0; border-bottom: 1px solid rgba(255,255,255,0.08); font-size: 15px; color: rgba(255,255,255,0.7); }
  .g-calc__line .num { font-size: 17px; color: #fff; }
  .g-calc__result { background: #08302b; border-radius: 14px; padding: 22px; margin-top: 24px; display: flex; justify-content: space-between; align-items: center; }
  .g-calc__rlabel { font-size: 11px; letter-spacing: 0.12em; text-transform: uppercase; color: rgba(255,255,255,0.5); margin-bottom: 6px; }
  .g-calc__rsub { font-size: 11px; color: rgba(255,255,255,0.4); }
  .g-calc__rval { font-size: 34px; font-weight: 600; color: #fff; }
  .g-calc__note { font-size: 11.5px; color: rgba(255,255,255,0.4); margin-top: 18px; line-height: 1.5; }

  /* Platform layers */
  .g-layers { display: grid; grid-template-columns: repeat(3,1fr); gap: 1px; background: #ece8e1; border: 1px solid #ece8e1; border-radius: 18px; overflow: hidden; }
  .g-layer { background: #fff; padding: 34px 30px; }
  .g-layer__n { font-size: 12px; color: var(--acc); letter-spacing: 0.08em; margin-bottom: 20px; }
  .g-layer__t { font-size: 18px; font-weight: 700; margin-bottom: 10px; color: #1c1c1a; }
  .g-layer__d { font-size: 14px; color: #5c5c5c; line-height: 1.6; }

  /* Trust */
  .g-trust { display: grid; grid-template-columns: repeat(3,1fr); gap: 22px; margin-bottom: 36px; }
  .g-trust__item { display: flex; gap: 14px; align-items: flex-start; }
  .g-trust__ico { flex: 0 0 auto; width: 32px; height: 32px; border-radius: 9px; background: var(--acc-light); display: flex; align-items: center; justify-content: center; color: var(--acc-dk); }
  .g-trust__t { font-size: 16px; font-weight: 700; margin-bottom: 5px; color: #1c1c1a; }
  .g-trust__d { font-size: 13.5px; color: #5c5c5c; line-height: 1.55; }
  .g-disclaimer { background: #fff; border: 1px solid #ece8e1; border-left: 3px solid var(--acc); border-radius: 12px; padding: 20px 24px; font-size: 13px; color: #7a756c; line-height: 1.6; }

  /* Roles */
  .g-role { background: #faf8f5; border: 1px solid #ece8e1; border-radius: 18px; padding: 34px 30px; }
  .g-role__tag { font-size: 11px; letter-spacing: 0.14em; text-transform: uppercase; color: var(--acc); margin-bottom: 18px; }
  .g-role__t { font-family: var(--font-display); font-style: italic; font-weight: 300; font-size: 28px; color: #1c1c1a; margin-bottom: 12px; }
  .g-role__d { font-size: 14.5px; color: #5c5c5c; line-height: 1.6; }

  /* CTA */
  .g-cta { background: var(--ink); color: #fff; padding: 96px 40px; text-align: center; }
  .g-cta__inner { max-width: 720px; margin: 0 auto; }
  .g-cta__title { font-family: var(--font-display); font-style: italic; font-weight: 300; font-size: 48px; line-height: 1.1; color: #fff; margin-bottom: 18px; }
  .g-cta__sub { font-size: 17px; color: rgba(255,255,255,0.72); margin-bottom: 34px; }
  .g-cta__btns { display: flex; gap: 14px; justify-content: center; flex-wrap: wrap; }

  /* Responsive */
  @media (max-width: 960px) {
    .g-grid-4, .g-grid-5, .g-grid-3, .g-layers, .g-trust { grid-template-columns: repeat(2,1fr); }
    .g-calc__grid { grid-template-columns: 1fr; gap: 32px; }
    .g-hero__title { font-size: 48px; }
    .g-h2 { font-size: 34px; }
  }
  @media (max-width: 560px) {
    .g-sec { padding: 64px 22px; }
    .g-grid-4, .g-grid-5, .g-grid-3, .g-layers, .g-trust, .g-metrics__grid { grid-template-columns: 1fr; }
    .g-hero__inner { padding: 0 22px 44px; }
    .g-hero__title { font-size: 38px; }
  }
</style>
