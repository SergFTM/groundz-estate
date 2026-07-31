<script lang="ts">
  import { enhance } from '$app/forms';

  let { data, form } = $props();

  function perksText(perks: string | null): string {
    if (!perks) return '';
    try { return (JSON.parse(perks) as string[]).join('\n'); } catch { return ''; }
  }
</script>

<svelte:head><title>Membership Tiers — Groundz Admin</title></svelte:head>

<div class="mt">
  <div class="mt__head">
    <p class="mt__crumb">Admin · Content</p>
    <h1 class="mt__title">Membership Tiers</h1>
    <p class="mt__sub">Уровни участия, которые показываются на <a href="/pricing" target="_blank">/pricing</a>.</p>
  </div>

  {#if form?.error}<div class="mt__alert">{form.error}</div>{/if}

  <!-- Existing tiers -->
  <div class="mt__list">
    {#each data.tiers as t (t.id)}
      <form method="POST" action="?/update" use:enhance class="mt__card" class:mt__card--off={!t.active}>
        <input type="hidden" name="id" value={t.id} />
        <div class="mt__row">
          <label class="mt__f"><span>Slug</span><input name="slug" value={t.slug} required /></label>
          <label class="mt__f"><span>Название</span><input name="name" value={t.name} required /></label>
          <label class="mt__f mt__f--sm"><span>Цена €</span><input name="price" type="number" step="1" value={t.price} /></label>
          <label class="mt__f mt__f--sm"><span>Порядок</span><input name="order" type="number" value={t.order} /></label>
        </div>
        <div class="mt__row">
          <label class="mt__f mt__f--sm"><span>Мин. тикет €</span><input name="minTicket" type="number" value={t.minTicket} /></label>
          <label class="mt__f mt__f--sm"><span>Макс. тикет €</span><input name="maxTicket" type="number" value={t.maxTicket ?? ''} placeholder="—" /></label>
          <label class="mt__f mt__f--grow"><span>Перки (по строке)</span><textarea name="perks" rows="3">{perksText(t.perks)}</textarea></label>
        </div>
        <div class="mt__actions">
          <button class="mt__btn mt__btn--save" type="submit">Сохранить</button>
          <button class="mt__btn" type="submit" formaction="?/toggle" name="active" value={String(t.active)}>{t.active ? 'Деактивировать' : 'Активировать'}</button>
          <button class="mt__btn mt__btn--del" type="submit" formaction="?/remove" onclick={(e) => { if (!confirm('Удалить тариф?')) e.preventDefault(); }}>Удалить</button>
          <span class="mt__status" class:mt__status--on={t.active}>{t.active ? 'активен' : 'скрыт'}</span>
        </div>
      </form>
    {/each}
    {#if data.tiers.length === 0}<p class="mt__empty">Тарифов пока нет — добавьте первый ниже.</p>{/if}
  </div>

  <!-- Create new -->
  <form method="POST" action="?/create" use:enhance class="mt__card mt__card--new">
    <h2 class="mt__new-title">+ Новый тариф</h2>
    <div class="mt__row">
      <label class="mt__f"><span>Slug</span><input name="slug" placeholder="explorer" required /></label>
      <label class="mt__f"><span>Название</span><input name="name" placeholder="Explorer" required /></label>
      <label class="mt__f mt__f--sm"><span>Цена €</span><input name="price" type="number" step="1" value="0" /></label>
      <label class="mt__f mt__f--sm"><span>Порядок</span><input name="order" type="number" value="0" /></label>
    </div>
    <div class="mt__row">
      <label class="mt__f mt__f--sm"><span>Мин. тикет €</span><input name="minTicket" type="number" value="0" /></label>
      <label class="mt__f mt__f--sm"><span>Макс. тикет €</span><input name="maxTicket" type="number" placeholder="—" /></label>
      <label class="mt__f mt__f--grow"><span>Перки (по строке)</span><textarea name="perks" rows="3" placeholder="Доступ к открытым пулам&#10;Квартальные отчёты"></textarea></label>
    </div>
    <div class="mt__actions"><button class="mt__btn mt__btn--save" type="submit">Создать тариф</button></div>
  </form>
</div>

<style>
  .mt { max-width: 920px; }
  .mt__head { margin-bottom: var(--space-6); }
  .mt__crumb { font-size: 10px; font-weight: 700; letter-spacing: 0.1em; text-transform: uppercase; color: var(--color-text-muted); }
  .mt__title { font-size: var(--text-2xl); font-weight: 700; color: var(--color-text); margin-top: var(--space-1); }
  .mt__sub { font-size: var(--text-sm); color: var(--color-text-muted); margin-top: var(--space-1); }
  .mt__sub a { color: var(--color-primary); }
  .mt__alert { background: rgba(239,68,68,0.08); color: #ef4444; border-left: 3px solid #ef4444; padding: var(--space-3); font-size: var(--text-sm); margin-bottom: var(--space-4); }
  .mt__list { display: flex; flex-direction: column; gap: var(--space-4); margin-bottom: var(--space-6); }
  .mt__card { background: #fff; border: 1px solid var(--color-border); border-radius: var(--radius-lg); padding: var(--space-5); }
  .mt__card--off { opacity: 0.6; }
  .mt__card--new { border-style: dashed; background: var(--color-bg-warm, #faf8f5); }
  .mt__new-title { font-size: var(--text-base); font-weight: 700; margin-bottom: var(--space-4); color: var(--color-text); }
  .mt__row { display: flex; gap: var(--space-3); flex-wrap: wrap; margin-bottom: var(--space-3); }
  .mt__f { display: flex; flex-direction: column; gap: 4px; flex: 1; min-width: 120px; }
  .mt__f--sm { flex: 0 0 110px; min-width: 90px; }
  .mt__f--grow { flex: 2; min-width: 220px; }
  .mt__f span { font-size: 10px; font-weight: 700; letter-spacing: 0.06em; text-transform: uppercase; color: var(--color-text-muted); }
  .mt__f input, .mt__f textarea { font-family: inherit; font-size: var(--text-sm); padding: 8px 10px; border: 1px solid var(--color-border); border-radius: var(--radius-sm); background: #fff; }
  .mt__f textarea { resize: vertical; }
  .mt__actions { display: flex; align-items: center; gap: var(--space-2); flex-wrap: wrap; margin-top: var(--space-2); }
  .mt__btn { font-family: inherit; font-size: var(--text-xs); font-weight: 600; padding: 8px 14px; border-radius: var(--radius-md); border: 1px solid var(--color-border); background: #fff; color: var(--color-text); cursor: pointer; }
  .mt__btn--save { background: var(--color-primary); color: #fff; border-color: var(--color-primary); }
  .mt__btn--del { color: #ef4444; border-color: rgba(239,68,68,0.3); }
  .mt__status { font-size: 10px; text-transform: uppercase; letter-spacing: 0.06em; color: var(--color-text-muted); margin-left: auto; }
  .mt__status--on { color: var(--color-positive, #4f8a5b); }
  .mt__empty { color: var(--color-text-muted); font-size: var(--text-sm); }
</style>
