<script lang="ts">
  interface Message {
    role: 'user' | 'assistant';
    content: string;
  }

  interface Props {
    role: 'public' | 'buyer' | 'investor' | 'agent' | 'internal_team';
    userId?: string;
    floating?: boolean;
  }

  let { role, userId, floating = false }: Props = $props();

  let open = $state(!floating);
  let messages = $state<Message[]>([]);
  let input = $state('');
  let loading = $state(false);
  let hasError = $state(false);

  async function send() {
    const text = input.trim();
    if (!text || loading) return;

    messages = [...messages, { role: 'user', content: text }];
    input = '';
    loading = true;
    hasError = false;

    try {
      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text,
          role,
          userId,
          history: messages.slice(-7, -1),
        }),
      });

      if (!res.ok) throw new Error('Request failed');

      const data = (await res.json()) as { reply: string };
      messages = [...messages, { role: 'assistant', content: data.reply }];
    } catch {
      hasError = true;
      messages = messages.slice(0, -1);
    } finally {
      loading = false;
    }
  }

  function handleKeydown(e: KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  }
</script>

{#if floating}
  <button class="ai-fab" onclick={() => (open = !open)} aria-label="AI Assistant">
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
    </svg>
  </button>
{/if}

{#if open}
  <div class="ai-panel" class:ai-panel--floating={floating}>
    {#if floating}
      <div class="ai-panel__header">
        <span class="ai-panel__title">AI Assistant</span>
        <button class="ai-panel__close" onclick={() => (open = false)} aria-label="Close">✕</button>
      </div>
    {:else}
      <div class="ai-panel__header">
        <span class="ai-panel__title">AI Assistant</span>
      </div>
    {/if}

    <div class="ai-panel__messages">
      {#if messages.length === 0}
        <p class="ai-panel__empty">Задайте вопрос о проектах, инвестициях или платформе.</p>
      {/if}
      {#each messages as msg (msg)}
        <div class="ai-msg" class:ai-msg--user={msg.role === 'user'} class:ai-msg--ai={msg.role === 'assistant'}>
          {msg.content}
        </div>
      {/each}
      {#if loading}
        <div class="ai-msg ai-msg--ai">
          <span class="ai-dots"><span>.</span><span>.</span><span>.</span></span>
        </div>
      {/if}
      {#if hasError}
        <p class="ai-panel__error">Что-то пошло не так. Попробуй ещё раз.</p>
      {/if}
    </div>

    <div class="ai-panel__input">
      <textarea
        bind:value={input}
        onkeydown={handleKeydown}
        placeholder="Написать сообщение..."
        rows="2"
        disabled={loading}
      ></textarea>
      <button onclick={send} disabled={loading || !input.trim()} class="ai-panel__send" aria-label="Send">
        →
      </button>
    </div>
  </div>
{/if}

<style>
  /* FAB button */
  .ai-fab {
    position: fixed;
    bottom: var(--space-6);
    right: var(--space-6);
    width: 52px;
    height: 52px;
    border-radius: 50%;
    background: var(--color-accent);
    color: white;
    border: none;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.2);
    z-index: 200;
    transition: transform var(--transition-fast);
  }

  .ai-fab:hover {
    transform: scale(1.06);
  }

  /* Panel */
  .ai-panel {
    background: rgba(255, 255, 255, 0.88);
    backdrop-filter: blur(8px);
    -webkit-backdrop-filter: blur(8px);
    border: 1px solid rgba(0, 0, 0, 0.08);
    border-radius: var(--radius-lg);
    display: flex;
    flex-direction: column;
    overflow: hidden;
  }

  .ai-panel--floating {
    position: fixed;
    bottom: calc(var(--space-6) + 64px);
    right: var(--space-6);
    width: 380px;
    height: 500px;
    z-index: 199;
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.15);
  }

  /* Header */
  .ai-panel__header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: var(--space-3) var(--space-5);
    border-bottom: 1px solid rgba(0, 0, 0, 0.06);
    flex-shrink: 0;
  }

  .ai-panel__title {
    font-size: var(--text-sm);
    font-weight: 700;
    color: var(--color-text);
    letter-spacing: 0.02em;
  }

  .ai-panel__close {
    background: none;
    border: none;
    cursor: pointer;
    color: var(--color-text-muted);
    font-size: 14px;
    padding: 0;
    line-height: 1;
    transition: color var(--transition-fast);
  }

  .ai-panel__close:hover {
    color: var(--color-text);
  }

  /* Messages */
  .ai-panel__messages {
    flex: 1;
    overflow-y: auto;
    padding: var(--space-4);
    display: flex;
    flex-direction: column;
    gap: var(--space-3);
  }

  .ai-panel__empty {
    font-size: var(--text-sm);
    color: var(--color-text-muted);
    text-align: center;
    margin-top: var(--space-8);
    line-height: 1.5;
  }

  .ai-msg {
    padding: var(--space-3) var(--space-4);
    border-radius: var(--radius-md);
    font-size: var(--text-sm);
    font-family: var(--font-body);
    line-height: 1.6;
    max-width: 88%;
    white-space: pre-wrap;
    word-break: break-word;
  }

  .ai-msg--user {
    background: var(--color-accent);
    color: white;
    align-self: flex-end;
    border-bottom-right-radius: 4px;
  }

  .ai-msg--ai {
    background: rgba(0, 0, 0, 0.05);
    color: var(--color-text);
    align-self: flex-start;
    border-bottom-left-radius: 4px;
  }

  /* Loading dots */
  .ai-dots span {
    animation: ai-blink 1.4s infinite both;
  }
  .ai-dots span:nth-child(2) { animation-delay: 0.2s; }
  .ai-dots span:nth-child(3) { animation-delay: 0.4s; }

  @keyframes ai-blink {
    0%, 80%, 100% { opacity: 0.2; }
    40% { opacity: 1; }
  }

  .ai-panel__error {
    font-size: var(--text-xs);
    color: #ef4444;
    text-align: center;
    padding: 0 var(--space-2);
  }

  /* Input row */
  .ai-panel__input {
    padding: var(--space-3) var(--space-4);
    border-top: 1px solid rgba(0, 0, 0, 0.06);
    display: flex;
    gap: var(--space-2);
    align-items: flex-end;
    flex-shrink: 0;
  }

  .ai-panel__input textarea {
    flex: 1;
    resize: none;
    border: 1px solid rgba(0, 0, 0, 0.12);
    border-radius: var(--radius-md);
    padding: var(--space-2) var(--space-3);
    font-size: var(--text-sm);
    font-family: var(--font-body);
    background: rgba(255, 255, 255, 0.9);
    color: var(--color-text);
    outline: none;
    transition: border-color var(--transition-fast);
    line-height: 1.4;
  }

  .ai-panel__input textarea:focus {
    border-color: var(--color-accent);
  }

  .ai-panel__input textarea:disabled {
    opacity: 0.6;
  }

  .ai-panel__send {
    background: var(--color-accent);
    color: white;
    border: none;
    border-radius: var(--radius-md);
    width: 36px;
    height: 36px;
    cursor: pointer;
    font-size: 18px;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: opacity var(--transition-fast);
    flex-shrink: 0;
    line-height: 1;
  }

  .ai-panel__send:disabled {
    opacity: 0.35;
    cursor: not-allowed;
  }
</style>
