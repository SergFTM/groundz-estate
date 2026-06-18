<script lang="ts">
  // Reusable pool card (GROUNDZ prototype design). Used on landing + /pools marketplace.
  let { pool, href = undefined }: { pool: any; href?: string } = $props();

  const STATUS: Record<string, { label: string; bg: string }> = {
    active: { label: 'Активен', bg: 'rgba(79,138,91,0.92)' },
    presale: { label: 'Пресейл', bg: 'rgba(122,140,110,0.92)' },
    funding: { label: 'Сбор', bg: 'rgba(122,140,110,0.92)' },
    closed: { label: 'Закрыт', bg: 'rgba(120,120,120,0.92)' },
    completed: { label: 'Завершён', bg: 'rgba(79,138,91,0.92)' },
  };
  const MARKET_IMG: Record<string, string> = {
    Cyprus: '/img/p-cyprus.jpg', Кипр: '/img/p-cyprus.jpg',
    Georgia: '/img/p-georgia.jpg', Грузия: '/img/p-georgia.jpg',
    Dubai: '/img/p-dubai.jpg', UAE: '/img/p-dubai.jpg',
    Thailand: '/img/p-phuket.jpg', Indonesia: '/img/p-bali.jpg',
  };

  const st = $derived(STATUS[pool.status] ?? { label: pool.status, bg: 'rgba(122,140,110,0.92)' });
  const img = $derived(MARKET_IMG[pool.country] || pool.imageUrl || '/img/p-cyprus.jpg');
  const roi = $derived(pool.targetIrr ?? pool.targetYield ?? 0);
  const pct = $derived(pool.goalAmount > 0 ? Math.min(100, Math.round((pool.raisedAmount / pool.goalAmount) * 100)) : 0);
  const link = $derived(href ?? (pool.slug ? `/pools/${pool.slug}` : '/contact'));

  function eur(n: number): string { return '€' + Math.round(n).toLocaleString('en-US'); }
</script>

<a class="pc" href={link}>
  <div class="pc__media">
    <div class="pc__img" style="background-image:url('{img}')"></div>
    <span class="pc__status" style="background:{st.bg}">{st.label}</span>
    {#if pool.tokenSymbol}<span class="pc__ticker num">{pool.tokenSymbol}</span>{/if}
  </div>
  <div class="pc__body">
    <div class="pc__loc num">{pool.country}{pool.city ? ` · ${pool.city}` : ''}</div>
    <h3 class="pc__name">{pool.name}</h3>
    {#if pool.description}<p class="pc__desc">{pool.description}</p>{/if}
    <div class="pc__prog">
      <div class="pc__progrow num"><span style="color:#9a948c">{eur(pool.raisedAmount)}</span><span style="color:#1c1c1a;font-weight:500">{pct}%</span></div>
      <div class="pc__bar"><div class="pc__bar-fill" style="width:{pct}%"></div></div>
      <div class="pc__goal">из <span class="num">{eur(pool.goalAmount)}</span></div>
    </div>
    <div class="pc__foot">
      <div><div class="pc__metric num" style="color:var(--acc-dk)">{roi.toFixed(1)}%</div><div class="pc__metriclabel">Целевой ROI</div></div>
      <div style="text-align:right"><div class="pc__metric num">{eur(pool.minTicket)}</div><div class="pc__metriclabel">Мин. билет</div></div>
    </div>
  </div>
</a>

<style>
  .num { font-family: var(--font-mono); font-variant-numeric: tabular-nums; }
  .pc { background: #fff; border: 1px solid #ece8e1; border-radius: 18px; overflow: hidden; cursor: pointer; transition: box-shadow .3s, transform .3s; display: flex; flex-direction: column; text-decoration: none; color: inherit; }
  .pc:hover { box-shadow: 0 18px 50px rgba(0,0,0,0.13); transform: translateY(-4px); }
  .pc__media { position: relative; height: 190px; overflow: hidden; }
  .pc__img { width: 100%; height: 100%; background-size: cover; background-position: center; }
  .pc__status { position: absolute; top: 14px; left: 14px; font-size: 10.5px; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase; padding: 5px 11px; border-radius: 999px; color: #fff; }
  .pc__ticker { position: absolute; top: 14px; right: 14px; font-size: 11px; font-weight: 500; letter-spacing: 0.06em; background: rgba(16,78,73,0.85); color: #fff; padding: 5px 9px; border-radius: 6px; backdrop-filter: blur(4px); }
  .pc__body { padding: 24px; display: flex; flex-direction: column; flex: 1; }
  .pc__loc { font-size: 11px; letter-spacing: 0.12em; color: #9a948c; text-transform: uppercase; margin-bottom: 8px; }
  .pc__name { font-size: 20px; font-weight: 700; margin-bottom: 8px; color: #1c1c1a; }
  .pc__desc { font-size: 14px; color: #5c5c5c; line-height: 1.55; margin-bottom: 20px; flex: 1; }
  .pc__prog { margin-bottom: 18px; }
  .pc__progrow { display: flex; justify-content: space-between; font-size: 12.5px; margin-bottom: 7px; }
  .pc__bar { height: 5px; background: #eceae4; border-radius: 9px; overflow: hidden; }
  .pc__bar-fill { height: 100%; background: var(--acc); border-radius: 9px; }
  .pc__goal { font-size: 11.5px; color: #9a948c; margin-top: 7px; }
  .pc__foot { display: flex; justify-content: space-between; border-top: 1px solid #f0ede7; padding-top: 16px; }
  .pc__metric { font-size: 18px; font-weight: 600; color: #1c1c1a; }
  .pc__metriclabel { font-size: 10.5px; letter-spacing: 0.08em; text-transform: uppercase; color: #9a948c; margin-top: 3px; }
</style>
