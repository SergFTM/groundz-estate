<script lang="ts">
  let { data } = $props();

  const steps = [
    {
      num: '01',
      title: 'Upload KYC Documents',
      desc: 'Submit your passport/ID, proof of funds, and any other required documents to begin the compliance process.',
      href: '/investor/documents',
      cta: 'Go to Documents',
      icon: '🪪',
      status: data.kycDone ? 'done' : 'pending',
    },
    {
      num: '02',
      title: 'Browse Investment Pools',
      desc: 'Explore active pools, review deal structures, yields, and protections — and choose the strategy that fits your goals.',
      href: '/investment',
      cta: 'Browse Pools',
      icon: '🏗️',
      status: data.hasPools ? 'done' : 'pending',
    },
    {
      num: '03',
      title: 'Express Interest',
      desc: 'Submit a soft commit on a pool to secure your spot while KYC review is in progress.',
      href: '/investor/pools',
      cta: 'View My Pools',
      icon: '✍️',
      status: data.hasCommit ? 'done' : 'pending',
    },
    {
      num: '04',
      title: 'Review & Sign',
      desc: 'Once KYC is approved, our team will reach out to send subscription agreements and finalise your investment.',
      href: '/investor/documents',
      cta: 'View Documents',
      icon: '📋',
      status: 'upcoming',
    },
  ];

  const completedCount = steps.filter(s => s.status === 'done').length;
</script>

<svelte:head>
  <title>Getting Started — Develta</title>
</svelte:head>

<div style="max-width:760px;">
  <!-- Header -->
  <div style="margin-bottom:var(--space-8);">
    <span style="font-size:10px;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;color:var(--color-accent);">WELCOME</span>
    <h1 style="font-size:var(--text-3xl);font-weight:700;color:var(--color-text);margin-top:var(--space-1);margin-bottom:var(--space-2);">
      Welcome to Develta{data.user?.name ? `, ${data.user.name.split(' ')[0]}` : ''}
    </h1>
    <p style="font-size:var(--text-base);color:var(--color-text-muted);line-height:1.65;">
      Your investor account is ready. Follow these steps to complete your onboarding and make your first investment.
    </p>
  </div>

  <!-- Progress bar -->
  <div style="background:rgba(255,255,255,0.55);backdrop-filter:blur(12px);-webkit-backdrop-filter:blur(12px);border:1px solid rgba(0,0,0,0.06);border-radius:var(--radius-lg);padding:var(--space-5) var(--space-6);margin-bottom:var(--space-6);display:flex;align-items:center;gap:var(--space-5);">
    <div style="flex:1;">
      <div style="display:flex;justify-content:space-between;margin-bottom:var(--space-2);">
        <span style="font-size:var(--text-sm);font-weight:600;color:var(--color-text);">Onboarding Progress</span>
        <span style="font-size:var(--text-sm);font-weight:700;color:var(--color-accent);">{completedCount} / {steps.length} steps</span>
      </div>
      <div style="height:6px;background:rgba(0,0,0,0.06);border-radius:3px;overflow:hidden;">
        <div style="height:100%;width:{Math.round((completedCount / steps.length) * 100)}%;background:var(--color-accent);border-radius:3px;transition:width 0.5s ease;"></div>
      </div>
    </div>
    {#if completedCount === steps.length}
      <span style="font-size:var(--text-xs);font-weight:700;color:#22c55e;background:rgba(34,197,94,0.1);padding:var(--space-1) var(--space-3);border-radius:99px;white-space:nowrap;">All done ✓</span>
    {/if}
  </div>

  <!-- Steps -->
  <div style="display:flex;flex-direction:column;gap:var(--space-4);margin-bottom:var(--space-8);">
    {#each steps as step}
      {@const isDone = step.status === 'done'}
      {@const isUpcoming = step.status === 'upcoming'}
      <div style="background:rgba(255,255,255,0.55);backdrop-filter:blur(12px);-webkit-backdrop-filter:blur(12px);border:1px solid {isDone ? 'rgba(34,197,94,0.2)' : 'rgba(0,0,0,0.06)'};border-radius:var(--radius-lg);padding:var(--space-5) var(--space-6);display:flex;align-items:flex-start;gap:var(--space-5);opacity:{isUpcoming ? '0.65' : '1'};">
        <!-- Step icon -->
        <div style="width:44px;height:44px;border-radius:var(--radius-md);background:{isDone ? 'rgba(34,197,94,0.1)' : 'rgba(212,169,68,0.08)'};display:flex;align-items:center;justify-content:center;font-size:20px;flex-shrink:0;">
          {#if isDone}
            <span style="font-size:18px;">✓</span>
          {:else}
            {step.icon}
          {/if}
        </div>

        <!-- Content -->
        <div style="flex:1;min-width:0;">
          <div style="display:flex;align-items:center;gap:var(--space-3);margin-bottom:var(--space-1);">
            <span style="font-size:10px;font-weight:800;letter-spacing:0.1em;color:{isDone ? '#22c55e' : 'var(--color-accent)'};">{step.num}</span>
            <h3 style="font-size:var(--text-base);font-weight:700;color:var(--color-text);margin:0;">{step.title}</h3>
            {#if isDone}
              <span style="font-size:10px;font-weight:700;text-transform:uppercase;padding:1px 8px;border-radius:99px;background:rgba(34,197,94,0.1);color:#22c55e;flex-shrink:0;">Done</span>
            {:else if isUpcoming}
              <span style="font-size:10px;font-weight:700;text-transform:uppercase;padding:1px 8px;border-radius:99px;background:rgba(0,0,0,0.05);color:var(--color-text-muted);flex-shrink:0;">After KYC</span>
            {/if}
          </div>
          <p style="font-size:var(--text-sm);color:var(--color-text-muted);line-height:1.6;margin:0 0 var(--space-3);">{step.desc}</p>
          {#if !isUpcoming}
            <a
              href={step.href}
              style="font-size:var(--text-xs);font-weight:700;color:{isDone ? '#22c55e' : 'var(--color-accent)'};text-decoration:none;border:1px solid {isDone ? 'rgba(34,197,94,0.25)' : 'rgba(212,169,68,0.3)'};border-radius:var(--radius-md);padding:var(--space-1) var(--space-3);display:inline-block;transition:opacity 0.2s;"
            >{step.cta} →</a>
          {/if}
        </div>
      </div>
    {/each}
  </div>

  <!-- Quick links footer -->
  <div style="background:linear-gradient(135deg,rgba(212,169,68,0.06) 0%,rgba(212,169,68,0.02) 100%);border:1px solid rgba(212,169,68,0.15);border-radius:var(--radius-lg);padding:var(--space-6);">
    <p style="font-size:10px;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;color:var(--color-accent);margin-bottom:var(--space-4);">Useful Resources</p>
    <div style="display:flex;gap:var(--space-3);flex-wrap:wrap;">
      <a href="/invest/how-it-works" style="font-size:var(--text-sm);color:var(--color-text-muted);text-decoration:none;font-weight:500;">How it works →</a>
      <a href="/invest/protections" style="font-size:var(--text-sm);color:var(--color-text-muted);text-decoration:none;font-weight:500;">Investor protections →</a>
      <a href="/knowledge" style="font-size:var(--text-sm);color:var(--color-text-muted);text-decoration:none;font-weight:500;">Knowledge base →</a>
      <a href="/contact" style="font-size:var(--text-sm);color:var(--color-text-muted);text-decoration:none;font-weight:500;">Contact us →</a>
    </div>
  </div>

  <!-- Skip link -->
  <div style="text-align:center;margin-top:var(--space-6);">
    <a href="/investor" style="font-size:var(--text-sm);color:var(--color-text-muted);text-decoration:none;">Go to dashboard →</a>
  </div>
</div>
