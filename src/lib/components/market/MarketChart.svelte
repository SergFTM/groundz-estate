<!-- src/lib/components/market/MarketChart.svelte -->
<script lang="ts">
  const W = 800;
  const H = 200;
  const PAD_TOP = 12;
  const PAD_BOTTOM = 8;

  interface Price { date: string; close: number }

  let {
    prices = [],
    color = '#7a8c6e',
    showCrisisBand = true,
  }: {
    prices: Price[];
    color?: string;
    showCrisisBand?: boolean;
  } = $props();

  let tooltip = $state<{ x: number; y: number; date: string; close: number } | null>(null);

  let minClose = $derived(prices.length ? Math.min(...prices.map(p => p.close)) : 0);
  let maxClose = $derived(prices.length ? Math.max(...prices.map(p => p.close)) : 1);
  let minTime  = $derived(prices.length ? new Date(prices[0].date).getTime() : 0);
  let maxTime  = $derived(prices.length ? new Date(prices[prices.length - 1].date).getTime() : 1);

  function xScale(dateStr: string): number {
    const t = new Date(dateStr).getTime();
    return ((t - minTime) / (maxTime - minTime)) * W;
  }

  function yScale(close: number): number {
    return PAD_TOP + ((maxClose - close) / (maxClose - minClose)) * (H - PAD_TOP - PAD_BOTTOM);
  }

  let polylinePoints = $derived(
    prices.map(p => `${xScale(p.date).toFixed(1)},${yScale(p.close).toFixed(1)}`).join(' ')
  );

  let crisisX1 = $derived(xScale('2008-01-01'));
  let crisisX2 = $derived(xScale('2009-12-31'));
  let showBand = $derived(
    showCrisisBand &&
    prices.length > 0 &&
    new Date(prices[0].date).getTime() < new Date('2009-12-31').getTime() &&
    new Date(prices[prices.length - 1].date).getTime() > new Date('2008-01-01').getTime()
  );

  let areaPath = $derived(
    prices.length
      ? `M${xScale(prices[0].date).toFixed(1)},${H} ` +
        prices.map(p => `L${xScale(p.date).toFixed(1)},${yScale(p.close).toFixed(1)}`).join(' ') +
        ` L${xScale(prices[prices.length - 1].date).toFixed(1)},${H} Z`
      : ''
  );

  function handleMouseMove(e: MouseEvent) {
    const svg = (e.currentTarget as SVGElement).ownerSVGElement!;
    const rect = svg.getBoundingClientRect();
    const svgX = ((e.clientX - rect.left) / rect.width) * W;

    const t = minTime + (svgX / W) * (maxTime - minTime);
    let nearest = prices[0];
    let minDiff = Infinity;
    for (const p of prices) {
      const diff = Math.abs(new Date(p.date).getTime() - t);
      if (diff < minDiff) { minDiff = diff; nearest = p; }
    }
    if (nearest) {
      tooltip = {
        x: Math.min(Math.max(xScale(nearest.date), 40), W - 40),
        y: yScale(nearest.close) - 8,
        date: nearest.date,
        close: nearest.close,
      };
    }
  }

  function handleMouseLeave() { tooltip = null; }
</script>

<div style="position:relative;width:100%;">
  <svg
    viewBox="0 0 {W} {H}"
    preserveAspectRatio="none"
    width="100%"
    height="100%"
    style="display:block;overflow:visible;"
    role="img"
    aria-label="Price chart"
  >
    <defs>
      <linearGradient id="grad-{color.replace('#','')}" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color={color} stop-opacity="0.18" />
        <stop offset="100%" stop-color={color} stop-opacity="0" />
      </linearGradient>
    </defs>

    {#if showBand}
      <rect
        x={crisisX1}
        y={0}
        width={Math.max(0, crisisX2 - crisisX1)}
        height={H}
        fill="rgba(239,68,68,0.06)"
      />
    {/if}

    {#if areaPath}
      <path d={areaPath} fill="url(#grad-{color.replace('#','')})" />
    {/if}

    {#if polylinePoints}
      <polyline
        points={polylinePoints}
        fill="none"
        stroke={color}
        stroke-width="1.5"
        stroke-linejoin="round"
        vector-effect="non-scaling-stroke"
      />
    {/if}

    <rect
      x="0" y="0" width={W} height={H}
      fill="transparent"
      onmousemove={handleMouseMove}
      onmouseleave={handleMouseLeave}
      style="cursor:crosshair;"
    />

    {#if tooltip}
      <circle cx={tooltip.x} cy={tooltip.y + 8} r="3" fill={color} />
      <line x1={tooltip.x} y1={0} x2={tooltip.x} y2={H} stroke={color} stroke-width="0.5" stroke-dasharray="3,3" vector-effect="non-scaling-stroke" />
    {/if}
  </svg>

  {#if tooltip}
    <div style="
      position:absolute;
      left:{(tooltip.x / W * 100).toFixed(1)}%;
      top:{(tooltip.y / H * 100).toFixed(1)}%;
      transform:translate(-50%,-100%);
      background:rgba(0,0,0,0.75);
      color:#fff;
      font-size:11px;
      padding:3px 7px;
      border-radius:4px;
      pointer-events:none;
      white-space:nowrap;
    ">
      {tooltip.date} · {tooltip.close.toFixed(2)}
    </div>
  {/if}
</div>
