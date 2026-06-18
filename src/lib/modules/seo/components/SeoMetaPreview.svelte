<script lang="ts">
  interface Props {
    title: string | null;
    description: string | null;
    url?: string;
  }
  let { title, description, url = 'groundz.estate' }: Props = $props();

  const MAX_TITLE = 65;
  const MAX_DESC = 160;

  let titleTrunc = $derived(title ? (title.length > MAX_TITLE ? title.slice(0, MAX_TITLE) + '…' : title) : 'No meta title');
  let descTrunc = $derived(description ? (description.length > MAX_DESC ? description.slice(0, MAX_DESC) + '…' : description) : 'No meta description set.');
</script>

<div class="meta-preview">
  <p class="meta-preview__label">SERP Preview</p>
  <div class="meta-preview__card">
    <div class="meta-preview__url">{url}</div>
    <div class="meta-preview__title" class:meta-preview__title--empty={!title}>{titleTrunc}</div>
    <div class="meta-preview__desc" class:meta-preview__desc--empty={!description}>{descTrunc}</div>
  </div>
  <div class="meta-preview__chars">
    <span class:warn={title && title.length > MAX_TITLE}>Title: {title?.length ?? 0}/{MAX_TITLE}</span>
    <span class:warn={description && description.length > MAX_DESC}>Desc: {description?.length ?? 0}/{MAX_DESC}</span>
  </div>
</div>

<style>
  .meta-preview__label {
    font-size: 9px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.1em;
    color: var(--color-text-muted);
    margin: 0 0 var(--space-2);
  }

  .meta-preview__card {
    background: #fff;
    border: 1px solid var(--color-border);
    border-radius: var(--radius-md);
    padding: var(--space-3) var(--space-3);
  }

  .meta-preview__url {
    font-size: 11px;
    color: #1a7f37;
    margin-bottom: 2px;
  }

  .meta-preview__title {
    font-size: 14px;
    color: #1a0dab;
    font-weight: 400;
    line-height: 1.3;
    margin-bottom: 3px;
  }
  .meta-preview__title--empty { color: var(--color-text-muted); font-style: italic; }

  .meta-preview__desc {
    font-size: 11px;
    color: #4d5156;
    line-height: 1.4;
  }
  .meta-preview__desc--empty { color: var(--color-text-muted); font-style: italic; }

  .meta-preview__chars {
    display: flex;
    gap: var(--space-3);
    margin-top: var(--space-1);
    font-size: 10px;
    color: var(--color-text-muted);
  }
  .warn { color: #e5484d; font-weight: 600; }
</style>
