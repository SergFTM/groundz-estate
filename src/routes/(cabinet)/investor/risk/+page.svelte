<script lang="ts">
  let { data } = $props();
  const { riskMetrics } = data;

  let aiLoading = $state(false);
  let aiText = $state<string | null>(null);

  async function loadNarrative() {
    if (!riskMetrics || aiText || aiLoading) return;
    aiLoading = true;
    try {
      const res = await fetch('/api/invest/risk-narrative', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          investorId: 'risk',
          riskData: {
            overallScore: riskMetrics.overallScore,
            metrics: riskMetrics.metrics,
            weightedYield: riskMetrics.weightedYield,
            poolCount: riskMetrics.poolCount,
            geoCount: riskMetrics.geoCount,
            stratCount: riskMetrics.stratCount,
          }
        })
      });
      const json = await res.json();
      aiText = json.insight ?? json.error ?? 'Analysis unavailable.';
    } catch {
      aiText = 'Analysis unavailable.';
    } finally {
      aiLoading = false;
    }
  }

  function riskLevel(score: number): { label: string; color: string; bg: string } {
    if (score <= 25)  return { label: 'Low',      color: '#22c55e', bg: 'rgba(34,197,94,0.1)' };
    if (score <= 50)  return { label: 'Moderate', color: '#f59e0b', bg: 'rgba(245,158,11,0.1)' };
    if (score <= 75)  return { label: 'Elevated', color: '#f97316', bg: 'rgba(249,115,22,0.1)' };
    return              { label: 'High',      color: '#ef4444', bg: 'rgba(239,68,68,0.1)' };
  }

  function gaugeColor(score: number): string {
    if (score <= 25) return '#22c55e';
    if (score <= 50) return '#f59e0b';
    if (score <= 75) return '#f97316';
    return '#ef4444';
  }
</script>

<svelte:head>
  <title>Risk Dashboard — Develta</title>
</svelte:head>

<div style="max-width:900px;">
  <div style="margin-bottom:var(--space-6);">
    <span style="font-size:10px;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;color:var(--color-text-muted);">INVESTOR</span>
    <h1 style="font-size:var(--text-2xl);font-weight:700;color:var(--color-text);margin-top:var(--space-1);">Risk Dashboard</h1>
  </div>

  {#if !riskMetrics}
    <div style="background:rgba(255,255,255,0.55);backdrop-filter:blur(12px);-webkit-backdrop-filter:blur(12px);border:1px solid rgba(0,0,0,0.06);border-radius:var(--radius-lg);padding:var(--space-12);text-align:center;">
      <p style="color:var(--color-text-muted);font-size:var(--text-sm);margin-bottom:var(--space-4);">No investments to analyse yet.</p>
      <a href="/investment" style="color:var(--color-accent);font-weight:600;text-decoration:none;">Browse Investment Pools →</a>
    </div>

  {:else}
    {@const overall = riskLevel(riskMetrics.overallScore)}

    <!-- Overall risk score card -->
    <div style="background:rgba(255,255,255,0.55);backdrop-filter:blur(12px);-webkit-backdrop-filter:blur(12px);border:1px solid rgba(0,0,0,0.06);border-radius:var(--radius-lg);padding:var(--space-6);margin-bottom:var(--space-6);display:flex;align-items:center;gap:var(--space-8);">
      <!-- Circular gauge (CSS arc approximation) -->
      <div style="flex-shrink:0;position:relative;width:96px;height:96px;">
        <svg viewBox="0 0 100 100" width="96" height="96" style="transform:rotate(-90deg);">
          <circle cx="50" cy="50" r="42" fill="none" stroke="rgba(0,0,0,0.07)" stroke-width="10"/>
          <circle cx="50" cy="50" r="42" fill="none"
            stroke={gaugeColor(riskMetrics.overallScore)}
            stroke-width="10"
            stroke-linecap="round"
            stroke-dasharray="{riskMetrics.overallScore * 2.638} 263.8"
          />
        </svg>
        <div style="position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;">
          <span style="font-size:22px;font-weight:800;color:{gaugeColor(riskMetrics.overallScore)};line-height:1;">{riskMetrics.overallScore}</span>
          <span style="font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:0.05em;color:var(--color-text-muted);">/ 100</span>
        </div>
      </div>
      <div>
        <span style="font-size:10px;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;color:var(--color-text-muted);">Overall Risk Score</span>
        <p style="font-size:var(--text-2xl);font-weight:700;color:{overall.color};margin-top:var(--space-1);">{overall.label} Risk</p>
        <p style="font-size:var(--text-sm);color:var(--color-text-muted);margin-top:var(--space-1);">{riskMetrics.poolCount} pool{riskMetrics.poolCount !== 1 ? 's' : ''} · {riskMetrics.geoCount} countr{riskMetrics.geoCount !== 1 ? 'ies' : 'y'} · {riskMetrics.stratCount} strateg{riskMetrics.stratCount !== 1 ? 'ies' : 'y'}</p>
      </div>
    </div>

    <!-- Risk metrics grid -->
    <div style="background:rgba(255,255,255,0.55);backdrop-filter:blur(12px);-webkit-backdrop-filter:blur(12px);border:1px solid rgba(0,0,0,0.06);border-radius:var(--radius-lg);padding:var(--space-6);margin-bottom:var(--space-6);">
      <p style="font-size:10px;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;color:var(--color-text-muted);margin-bottom:var(--space-5);">Risk Breakdown</p>
      <div style="display:flex;flex-direction:column;gap:var(--space-5);">
        {#each riskMetrics.metrics as metric}
          {@const rl = riskLevel(metric.score)}
          <div>
            <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:var(--space-2);">
              <div style="display:flex;align-items:center;gap:var(--space-3);">
                <span style="font-size:var(--text-sm);font-weight:600;color:var(--color-text);">{metric.label}</span>
                <span style="font-size:10px;font-weight:700;text-transform:uppercase;padding:1px 7px;border-radius:99px;background:{rl.bg};color:{rl.color};">{rl.label}</span>
              </div>
              <span style="font-size:var(--text-sm);font-weight:700;color:{rl.color};">{metric.score}</span>
            </div>
            <div style="height:6px;background:rgba(0,0,0,0.06);border-radius:3px;overflow:hidden;margin-bottom:var(--space-1);">
              <div style="height:100%;width:{metric.score}%;background:{rl.color};border-radius:3px;transition:width 0.5s ease;"></div>
            </div>
            <p style="font-size:var(--text-xs);color:var(--color-text-muted);">{metric.detail}</p>
          </div>
        {/each}
      </div>
    </div>

    <!-- Risk scale legend -->
    <div style="display:flex;gap:var(--space-4);margin-bottom:var(--space-6);flex-wrap:wrap;">
      {#each [['Low','#22c55e','0–25'],['Moderate','#f59e0b','26–50'],['Elevated','#f97316','51–75'],['High','#ef4444','76–100']] as [label, color, range]}
        <div style="display:flex;align-items:center;gap:var(--space-2);">
          <span style="width:10px;height:10px;border-radius:50%;background:{color};display:inline-block;"></span>
          <span style="font-size:var(--text-xs);color:var(--color-text-muted);">{label} ({range})</span>
        </div>
      {/each}
    </div>

    <!-- AI Risk Narrative -->
    <div style="background:linear-gradient(135deg,rgba(212,169,68,0.08) 0%,rgba(212,169,68,0.03) 100%);border:1px solid rgba(212,169,68,0.2);border-radius:var(--radius-lg);padding:var(--space-6);">
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:var(--space-3);">
        <p style="font-size:10px;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;color:#d4a944;">AI Risk Narrative</p>
        {#if !aiText}
          <button
            onclick={loadNarrative}
            disabled={aiLoading}
            style="font-size:var(--text-xs);font-weight:700;color:#d4a944;background:rgba(212,169,68,0.12);border:1px solid rgba(212,169,68,0.25);border-radius:var(--radius-md);padding:var(--space-1) var(--space-3);cursor:pointer;"
          >
            {aiLoading ? 'Analyzing…' : 'Generate Narrative ✦'}
          </button>
        {/if}
      </div>
      {#if aiText}
        <p style="font-size:var(--text-sm);color:var(--color-text);line-height:1.7;">{aiText}</p>
      {:else if aiLoading}
        <div style="display:flex;gap:var(--space-2);align-items:center;">
          <div style="width:6px;height:6px;border-radius:50%;background:#d4a944;animation:pulse 1s infinite;"></div>
          <p style="font-size:var(--text-sm);color:var(--color-text-muted);">Assessing risk profile…</p>
        </div>
      {:else}
        <p style="font-size:var(--text-sm);color:var(--color-text-muted);">Get an AI narrative covering your headline risk factors, specific exposures, and one action to reduce risk.</p>
      {/if}
    </div>

  {/if}
</div>

<style>
  @keyframes pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.3; }
  }
</style>
