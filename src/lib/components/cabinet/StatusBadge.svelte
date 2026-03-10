<script lang="ts">
  interface Props {
    status: string;
  }

  let { status }: Props = $props();

  const variants: Record<string, { bg: string; color: string }> = {
    paid: { bg: 'rgba(34,197,94,0.1)', color: '#22c55e' },
    approved: { bg: 'rgba(34,197,94,0.1)', color: '#22c55e' },
    active: { bg: 'rgba(34,197,94,0.1)', color: '#22c55e' },
    completed: { bg: 'rgba(34,197,94,0.1)', color: '#22c55e' },
    upcoming: { bg: 'rgba(245,158,11,0.1)', color: '#f59e0b' },
    pending: { bg: 'rgba(245,158,11,0.1)', color: '#f59e0b' },
    warm: { bg: 'rgba(245,158,11,0.1)', color: '#f59e0b' },
    new: { bg: 'rgba(59,130,246,0.1)', color: '#3b82f6' },
    overdue: { bg: 'rgba(239,68,68,0.1)', color: '#ef4444' },
    action_required: { bg: 'rgba(239,68,68,0.1)', color: '#ef4444' },
    hot: { bg: 'rgba(239,68,68,0.1)', color: '#ef4444' },
    cold: { bg: 'rgba(120,120,120,0.1)', color: '#787878' },
    reserved: { bg: 'rgba(120,120,120,0.1)', color: '#787878' },
    contacted: { bg: 'rgba(59,130,246,0.1)', color: '#3b82f6' },
    converted: { bg: 'rgba(34,197,94,0.1)', color: '#22c55e' },
    lost: { bg: 'rgba(120,120,120,0.1)', color: '#787878' }
  };

  let style = $derived(variants[status] ?? { bg: 'rgba(120,120,120,0.1)', color: '#787878' });
  let label = $derived(status.replace(/_/g, ' '));
</script>

<span class="status-badge" style="background:{style.bg};color:{style.color}">
  {label}
</span>

<style>
  .status-badge {
    display: inline-flex;
    align-items: center;
    padding: 3px 10px;
    font-size: 10px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.04em;
    border-radius: var(--radius-full);
    white-space: nowrap;
  }
</style>
