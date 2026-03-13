<script lang="ts">
  import { enhance } from '$app/forms';

  let { data, form } = $props();

  let showInput = $state(!data.openaiKeySet);

  const TEXT_MODELS = [
    { value: 'gpt-4o',          label: 'GPT-4o  — balanced, fast' },
    { value: 'gpt-4o-mini',     label: 'GPT-4o mini  — cheap, quick' },
    { value: 'gpt-4-turbo',     label: 'GPT-4 Turbo  — high quality' },
    { value: 'o1-mini',         label: 'o1-mini  — reasoning' },
  ];

  const IMAGE_MODELS = [
    { value: 'dall-e-3',      label: 'DALL-E 3  — high quality, $0.08/img' },
    { value: 'dall-e-3-hd',   label: 'DALL-E 3 HD  — best quality, $0.12/img' },
    { value: 'gpt-image-1',   label: 'GPT-image-1  — newest, $0.011–$0.222/img' },
    { value: 'dall-e-2',      label: 'DALL-E 2  — basic, $0.02/img' },
  ];

  const IMAGE_QUALITIES = [
    { value: 'low',    label: 'Low  — $0.011/img  (fast, drafts)' },
    { value: 'medium', label: 'Medium  — $0.042/img  (balanced)' },
    { value: 'high',   label: 'High  — $0.222/img  (production)' },
  ];

  let textModel    = $state(data.textModel);
  let imageModel   = $state(data.imageModel);
  let imageQuality = $state(data.imageQuality);
</script>

<div class="settings">
  <div class="settings__header">
    <p class="settings__breadcrumb">Admin</p>
    <h1 class="settings__title">Settings</h1>
  </div>

  <!-- API Key -->
  <div class="settings__section">
    <h2 class="settings__section-title">OpenAI API Key</h2>
    <p class="settings__section-desc">
      One key for all OpenAI features — text generation and image tours.
      Get a key at <code>platform.openai.com/api-keys</code>.
    </p>

    <div class="settings__card">
      <div class="settings__card-header">
        <span class="settings__label">API Key</span>
        {#if data.openaiKeySet}
          <span class="settings__badge settings__badge--active">Active</span>
        {:else}
          <span class="settings__badge settings__badge--empty">Not set</span>
        {/if}
      </div>

      {#if data.openaiKeySet && !showInput}
        <div class="settings__key-preview">
          <code>{data.openaiKeyPreview}</code>
          <button class="settings__btn-link" onclick={() => showInput = true}>Change</button>
        </div>
        <form method="POST" action="?/clearOpenAI" use:enhance>
          <button type="submit" class="settings__btn settings__btn--danger">Remove key</button>
        </form>
      {:else}
        <form method="POST" action="?/saveOpenAI" use:enhance class="settings__form">
          <div class="settings__field">
            <input
              type="password"
              name="key"
              class="settings__input"
              placeholder="sk-proj-..."
              autocomplete="off"
              required
            />
          </div>
          {#if form?.error}
            <p class="settings__error">{form.error}</p>
          {/if}
          <div class="settings__actions">
            <button type="submit" class="settings__btn settings__btn--primary">Save key</button>
            {#if data.openaiKeySet}
              <button type="button" class="settings__btn-link" onclick={() => showInput = false}>Cancel</button>
            {/if}
          </div>
        </form>
      {/if}

      {#if form?.success && !form?.cleared && !form?.savedModels}
        <p class="settings__success">Key saved successfully.</p>
      {/if}
      {#if form?.cleared}
        <p class="settings__success">Key removed.</p>
      {/if}
    </div>
  </div>

  <!-- Model configuration -->
  <div class="settings__section">
    <h2 class="settings__section-title">Model Configuration</h2>
    <p class="settings__section-desc">
      Choose which OpenAI models to use for each task type.
      Changes take effect immediately — no redeploy needed.
    </p>

    <form method="POST" action="?/saveModels" use:enhance class="settings__card">
      <!-- Text model -->
      <div class="settings__model-row">
        <div class="settings__model-info">
          <span class="settings__label">Text Model</span>
          <span class="settings__model-desc">AI assistant, descriptions, chat</span>
        </div>
        <select name="textModel" class="settings__select" bind:value={textModel}>
          {#each TEXT_MODELS as m}
            <option value={m.value} selected={textModel === m.value}>{m.label}</option>
          {/each}
        </select>
      </div>

      <div class="settings__divider"></div>

      <!-- Image model -->
      <div class="settings__model-row">
        <div class="settings__model-info">
          <span class="settings__label">Image Model</span>
          <span class="settings__model-desc">Virtual tour generation</span>
        </div>
        <select name="imageModel" class="settings__select" bind:value={imageModel}>
          {#each IMAGE_MODELS as m}
            <option value={m.value} selected={imageModel === m.value}>{m.label}</option>
          {/each}
        </select>
      </div>

      {#if imageModel === 'gpt-image-1'}
        <div class="settings__divider"></div>
        <!-- Image quality (gpt-image-1 only) -->
        <div class="settings__model-row">
          <div class="settings__model-info">
            <span class="settings__label">Image Quality</span>
            <span class="settings__model-desc">gpt-image-1 quality tier</span>
          </div>
          <select name="imageQuality" class="settings__select" bind:value={imageQuality}>
            {#each IMAGE_QUALITIES as q}
              <option value={q.value} selected={imageQuality === q.value}>{q.label}</option>
            {/each}
          </select>
        </div>
      {:else}
        <!-- Hidden field to preserve quality when switching models -->
        <input type="hidden" name="imageQuality" value={imageQuality} />
      {/if}

      <div class="settings__model-footer">
        <div class="settings__model-active">
          <span class="settings__model-tag">Text: <strong>{textModel}</strong></span>
          <span class="settings__model-tag">Image: <strong>{imageModel}</strong></span>
          {#if imageModel === 'gpt-image-1'}
            <span class="settings__model-tag">Quality: <strong>{imageQuality}</strong></span>
          {/if}
        </div>
        <button type="submit" class="settings__btn settings__btn--primary">Save models</button>
      </div>

      {#if form?.savedModels}
        <p class="settings__success">Models saved.</p>
      {/if}
    </form>
  </div>
</div>

<style>
  .settings {
    max-width: 640px;
  }

  .settings__header {
    margin-bottom: var(--space-8);
  }

  .settings__breadcrumb {
    font-size: var(--text-xs);
    text-transform: uppercase;
    letter-spacing: 0.1em;
    color: var(--color-text-body);
    margin-bottom: var(--space-2);
  }

  .settings__title {
    font-family: var(--font-display);
    font-size: var(--text-4xl);
    font-weight: 300;
    font-style: italic;
    color: var(--color-text);
  }

  .settings__section {
    margin-bottom: var(--space-10);
  }

  .settings__section-title {
    font-size: var(--text-xs);
    font-weight: 700;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    color: var(--color-text-body);
    margin-bottom: var(--space-3);
  }

  .settings__section-desc {
    font-size: var(--text-sm);
    color: var(--color-text-body);
    margin-bottom: var(--space-5);
    line-height: 1.6;
  }

  .settings__section-desc code {
    font-size: 0.85em;
    background: var(--color-bg-alt);
    padding: 1px 5px;
    border-radius: 3px;
  }

  .settings__card {
    border: 1px solid var(--color-border, #e8e4de);
    border-radius: var(--radius-lg);
    padding: var(--space-6);
    background: var(--color-bg);
  }

  .settings__card-header {
    display: flex;
    align-items: center;
    gap: var(--space-3);
    margin-bottom: var(--space-5);
  }

  .settings__label {
    font-size: var(--text-sm);
    font-weight: 600;
    color: var(--color-text);
  }

  .settings__badge {
    font-size: 11px;
    font-weight: 600;
    letter-spacing: 0.06em;
    text-transform: uppercase;
    padding: 2px 8px;
    border-radius: 20px;
  }

  .settings__badge--active {
    background: rgba(122, 140, 110, 0.12);
    color: var(--color-accent);
  }

  .settings__badge--empty {
    background: var(--color-bg-alt);
    color: var(--color-text-body);
  }

  .settings__key-preview {
    display: flex;
    align-items: center;
    gap: var(--space-4);
    margin-bottom: var(--space-4);
    font-size: var(--text-sm);
  }

  .settings__key-preview code {
    background: var(--color-bg-alt);
    padding: var(--space-2) var(--space-3);
    border-radius: var(--radius-sm);
    letter-spacing: 0.05em;
    color: var(--color-text);
  }

  .settings__form {
    display: flex;
    flex-direction: column;
    gap: var(--space-4);
  }

  .settings__input {
    width: 100%;
    padding: var(--space-3) var(--space-4);
    border: 1px solid var(--color-border, #e8e4de);
    border-radius: var(--radius-base);
    font-size: var(--text-sm);
    font-family: monospace;
    background: var(--color-bg-alt);
    color: var(--color-text);
    transition: border-color var(--transition-fast);
  }

  .settings__input:focus {
    outline: none;
    border-color: var(--color-accent);
  }

  .settings__actions {
    display: flex;
    align-items: center;
    gap: var(--space-4);
  }

  .settings__btn {
    padding: var(--space-3) var(--space-6);
    border-radius: var(--radius-base);
    font-size: var(--text-sm);
    font-weight: 600;
    cursor: pointer;
    border: none;
    transition: all var(--transition-fast);
  }

  .settings__btn--primary {
    background: var(--color-accent);
    color: #fff;
  }

  .settings__btn--primary:hover { background: var(--color-accent-hover); }

  .settings__btn--danger {
    background: none;
    border: 1px solid #dc3545;
    color: #dc3545;
    padding: var(--space-2) var(--space-4);
    font-size: var(--text-xs);
    border-radius: var(--radius-base);
    cursor: pointer;
    transition: all var(--transition-fast);
  }

  .settings__btn--danger:hover { background: #dc3545; color: #fff; }

  .settings__btn-link {
    background: none;
    border: none;
    color: var(--color-accent);
    font-size: var(--text-sm);
    cursor: pointer;
    text-decoration: underline;
    padding: 0;
  }

  .settings__error   { font-size: var(--text-sm); color: #dc3545; }
  .settings__success { font-size: var(--text-sm); color: var(--color-accent); margin-top: var(--space-3); }

  /* Model rows */
  .settings__model-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--space-5);
    padding: var(--space-4) 0;
  }

  .settings__model-info {
    display: flex;
    flex-direction: column;
    gap: 2px;
  }

  .settings__model-desc {
    font-size: var(--text-xs);
    color: var(--color-text-muted);
  }

  .settings__select {
    padding: var(--space-2) var(--space-3);
    border: 1px solid var(--color-border, #e8e4de);
    border-radius: var(--radius-base);
    font-size: var(--text-sm);
    background: var(--color-bg-alt);
    color: var(--color-text);
    min-width: 280px;
    cursor: pointer;
    transition: border-color var(--transition-fast);
  }

  .settings__select:focus {
    outline: none;
    border-color: var(--color-accent);
  }

  .settings__divider {
    border: none;
    border-top: 1px solid rgba(0,0,0,0.05);
  }

  .settings__model-footer {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-top: var(--space-5);
    padding-top: var(--space-4);
    border-top: 1px solid rgba(0,0,0,0.05);
    flex-wrap: wrap;
    gap: var(--space-3);
  }

  .settings__model-active {
    display: flex;
    gap: var(--space-4);
    flex-wrap: wrap;
  }

  .settings__model-tag {
    font-size: var(--text-xs);
    color: var(--color-text-muted);
  }

  .settings__model-tag strong {
    color: var(--color-accent);
    font-family: monospace;
  }
</style>
