<script lang="ts">
  import { enhance } from '$app/forms';
  import { page } from '$app/stores';

  let { data, form } = $props();
  const { pool, user, existing } = data;

  let formErrors = $derived(
    (form as { errors?: Record<string, string> } | null)?.errors ?? {}
  );

  const success = $derived($page.url.searchParams.get('success') === '1');

  function fmt(n: number): string {
    if (n >= 1_000_000) return `€${(n / 1_000_000).toFixed(1)}M`;
    if (n >= 1000) return `€${(n / 1000).toLocaleString()}`;
    return `€${n}`;
  }

  const progress = pool.goalAmount > 0
    ? Math.min(100, Math.round((pool.raisedAmount / pool.goalAmount) * 100))
    : 0;
</script>

<svelte:head>
  <title>Commit to {pool.name} — Groundz</title>
</svelte:head>

<div style="min-height:80vh;display:flex;align-items:flex-start;justify-content:center;padding:var(--space-12) var(--space-4);">
  <div style="width:100%;max-width:560px;">

    <!-- Back link -->
    <a href="/pools/{pool.slug}" style="font-size:var(--text-sm);color:var(--color-primary);font-weight:600;text-decoration:none;display:inline-block;margin-bottom:var(--space-6);">← {pool.name}</a>

    {#if success}
      <!-- Success state -->
      <div style="background:rgba(255,255,255,0.7);backdrop-filter:blur(16px);-webkit-backdrop-filter:blur(16px);border:1px solid rgba(34,197,94,0.2);border-radius:var(--radius-lg);padding:var(--space-10);text-align:center;">
        <div style="font-size:48px;margin-bottom:var(--space-4);">✅</div>
        <h1 style="font-size:var(--text-2xl);font-weight:700;color:var(--color-text);margin-bottom:var(--space-3);">Commitment Received</h1>
        <p style="font-size:var(--text-base);color:var(--color-text-muted);margin-bottom:var(--space-6);line-height:1.6;">
          Thank you, {user.name}. Our IR team will reach out within 1–2 business days with next steps including KYC verification and subscription documents.
        </p>
        <div style="display:flex;flex-direction:column;gap:var(--space-3);">
          <a href="/pools/{pool.slug}" style="display:block;background:var(--color-primary);color:#fff;padding:var(--space-3) var(--space-6);border-radius:var(--radius-md);font-weight:700;text-decoration:none;text-align:center;">Back to {pool.name}</a>
          <a href="/pools" style="display:block;color:var(--color-primary);font-size:var(--text-sm);font-weight:600;text-decoration:none;text-align:center;">Browse Other Pools</a>
        </div>
      </div>

    {:else if existing && existing.status !== 'cancelled'}
      <!-- Already committed -->
      <div style="background:rgba(255,255,255,0.7);backdrop-filter:blur(16px);-webkit-backdrop-filter:blur(16px);border:1px solid rgba(34,197,94,0.2);border-radius:var(--radius-lg);padding:var(--space-8);text-align:center;">
        <div style="font-size:36px;margin-bottom:var(--space-3);">✓</div>
        <h1 style="font-size:var(--text-xl);font-weight:700;color:var(--color-text);margin-bottom:var(--space-2);">Already Committed</h1>
        <p style="font-size:var(--text-sm);color:var(--color-text-muted);margin-bottom:var(--space-1);">
          You have a <strong>{existing.status.replace('_', ' ')}</strong> commitment of <strong>{fmt(existing.amount)}</strong> in this pool.
        </p>
        <p style="font-size:var(--text-sm);color:var(--color-text-muted);margin-bottom:var(--space-6);">Our team will be in touch. Questions? <a href="/contact" style="color:var(--color-primary);font-weight:600;text-decoration:none;">Contact us.</a></p>
        <a href="/pools/{pool.slug}" style="display:inline-block;background:var(--color-primary);color:#fff;padding:var(--space-3) var(--space-6);border-radius:var(--radius-md);font-weight:700;text-decoration:none;">← Back to Pool</a>
      </div>

    {:else}
      <!-- Commit form -->
      <div style="background:rgba(255,255,255,0.7);backdrop-filter:blur(16px);-webkit-backdrop-filter:blur(16px);border:1px solid rgba(0,0,0,0.07);border-radius:var(--radius-lg);overflow:hidden;">

        <!-- Pool summary header -->
        <div style="background:linear-gradient(135deg,#0a0a0a 0%,#1a1a1a 100%);padding:var(--space-6);">
          <p style="font-size:10px;font-weight:700;letter-spacing:0.12em;text-transform:uppercase;color:rgba(255,255,255,0.4);margin-bottom:var(--space-1);">Committing to</p>
          <h1 style="font-size:var(--text-xl);font-weight:700;color:#fff;margin-bottom:var(--space-3);">{pool.name}</h1>
          <div style="display:flex;gap:var(--space-4);">
            <div>
              <p style="font-size:10px;color:rgba(255,255,255,0.4);text-transform:uppercase;letter-spacing:0.08em;margin-bottom:2px;">Target IRR</p>
              <p style="font-size:var(--text-lg);font-weight:800;color:#d4a944;">{(pool.targetIrr ?? pool.targetYield).toFixed(1)}%</p>
            </div>
            <div>
              <p style="font-size:10px;color:rgba(255,255,255,0.4);text-transform:uppercase;letter-spacing:0.08em;margin-bottom:2px;">Term</p>
              <p style="font-size:var(--text-lg);font-weight:800;color:#fff;">{pool.termMonths}m</p>
            </div>
            <div>
              <p style="font-size:10px;color:rgba(255,255,255,0.4);text-transform:uppercase;letter-spacing:0.08em;margin-bottom:2px;">Raised</p>
              <p style="font-size:var(--text-lg);font-weight:800;color:#fff;">{progress}%</p>
            </div>
          </div>
        </div>

        <!-- Form body -->
        <div style="padding:var(--space-8);">
          <form method="POST" action="?/commit" use:enhance>

            <div class="form-group">
              <label class="form-label" for="amount">
                Commitment Amount (€) *
                <span style="font-weight:400;color:var(--color-text-muted);">
                  Min {fmt(pool.minTicket)}{pool.maxTicket ? ` · Max ${fmt(pool.maxTicket)}` : ''}
                </span>
              </label>
              <input
                class="form-input"
                id="amount"
                name="amount"
                type="number"
                min={pool.minTicket}
                max={pool.maxTicket ?? undefined}
                step="1000"
                placeholder={String(pool.minTicket)}
                required
              />
              {#if formErrors.amount}
                <p style="font-size:var(--text-xs);color:#ef4444;margin-top:var(--space-1);">{formErrors.amount}</p>
              {/if}
            </div>

            <div class="form-group">
              <label class="form-label" for="notes">Message to IR Team <span style="font-weight:400;color:var(--color-text-muted);">optional</span></label>
              <textarea
                class="form-input"
                id="notes"
                name="notes"
                rows="2"
                placeholder="Any questions or context for our team…"
                style="resize:vertical;"
              ></textarea>
            </div>

            <!-- Investor info -->
            <div style="background:rgba(0,0,0,0.03);border-radius:var(--radius-md);padding:var(--space-4);margin-bottom:var(--space-5);">
              <p style="font-size:var(--text-xs);font-weight:700;text-transform:uppercase;letter-spacing:0.08em;color:var(--color-text-muted);margin-bottom:var(--space-2);">Committing as</p>
              <p style="font-size:var(--text-sm);font-weight:600;color:var(--color-text);">{user.name}</p>
              <p style="font-size:var(--text-xs);color:var(--color-text-muted);">{user.email}</p>
            </div>

            <!-- Disclosure checkbox -->
            <div style="display:flex;gap:var(--space-3);align-items:flex-start;margin-bottom:var(--space-6);">
              <input type="checkbox" id="agree" name="agree" style="margin-top:3px;flex-shrink:0;width:16px;height:16px;accent-color:var(--color-primary);" required />
              <label for="agree" style="font-size:var(--text-xs);color:var(--color-text-muted);line-height:1.5;cursor:pointer;">
                I understand this is a <strong>soft commitment</strong> (expression of interest) and does not constitute a legally binding obligation. Capital will only be drawn after KYC verification and execution of subscription documents. Past performance does not guarantee future returns.
              </label>
            </div>
            {#if formErrors.agree}
              <p style="font-size:var(--text-xs);color:#ef4444;margin-top:-var(--space-4);margin-bottom:var(--space-4);">{formErrors.agree}</p>
            {/if}

            <button type="submit" class="btn btn--primary" style="width:100%;padding:var(--space-4);font-size:var(--text-base);">
              Submit Soft Commitment →
            </button>

          </form>

          <p style="font-size:11px;color:var(--color-text-muted);text-align:center;margin-top:var(--space-4);line-height:1.5;">
            Our IR team will contact you within 1–2 business days. <a href="/contact" style="color:var(--color-primary);text-decoration:none;">Questions?</a>
          </p>
        </div>
      </div>
    {/if}

  </div>
</div>
