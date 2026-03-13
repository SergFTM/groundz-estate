<script lang="ts">
  interface Message {
    role: 'user' | 'assistant';
    content: string;
  }

  interface Props {
    role: 'public' | 'buyer' | 'investor' | 'agent' | 'internal_team';
    userId?: string;
    floating?: boolean;
    projectName?: string;
    projectSlug?: string;
  }

  let { role, userId, floating = false, projectName, projectSlug }: Props = $props();

  let open = $state(!floating);
  let messages = $state<Message[]>([]);
  let input = $state('');
  let loading = $state(false);
  let hasError = $state(false);

  // Booking flow
  let bookingStep = $state<'idle' | 'form' | 'submitting' | 'done'>('idle');
  let bookingName = $state('');
  let bookingPhone = $state('');
  let bookingTime = $state('');
  let bookingError = $state('');

  let showWelcome = $derived(messages.length === 0 && bookingStep === 'idle');

  const QUICK_PILLS = [
    { label: 'О проекте', msg: 'Расскажи об этом проекте подробнее' },
    { label: 'Планировки и цены', msg: 'Какие планировки и цены доступны?' },
  ] as const;

  async function send(text?: string) {
    const msg = (text ?? input).trim();
    if (!msg || loading) return;

    messages = [...messages, { role: 'user', content: msg }];
    input = '';
    loading = true;
    hasError = false;

    try {
      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: msg,
          role,
          userId,
          projectName,
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

  async function submitBooking() {
    if (!bookingName.trim() || !bookingPhone.trim() || !bookingTime) {
      bookingError = 'Заполните все поля';
      return;
    }
    bookingError = '';
    bookingStep = 'submitting';

    try {
      const res = await fetch('/api/book-consultation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: bookingName.trim(),
          phone: bookingPhone.trim(),
          timeSlot: bookingTime,
          projectSlug: projectSlug ?? '',
        }),
      });

      if (!res.ok) throw new Error();

      bookingStep = 'done';
      messages = [
        ...messages,
        {
          role: 'assistant',
          content: `Отлично, ${bookingName.trim()}! Запрос на просмотр отправлен. Наш менеджер свяжется с вами в ближайшее время по номеру ${bookingPhone.trim()}.`,
        },
      ];
    } catch {
      bookingStep = 'form';
      bookingError = 'Не удалось отправить. Попробуйте ещё раз.';
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
  <button class="ai-fab" onclick={() => (open = !open)} aria-label="AI Ассистент">
    {#if open}
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" aria-hidden="true">
        <path d="M18 6L6 18M6 6l12 12"/>
      </svg>
    {:else}
      <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <path d="M9 2L10.7 7.3 16 9l-5.3 1.7L9 16l-1.7-5.3L2 9l5.3-1.7z"/>
        <path d="M18 12l1 3 3 1-3 1-1 3-1-3-3-1 3-1z"/>
        <circle cx="5.5" cy="17.5" r="1.3"/>
      </svg>
    {/if}
  </button>
{/if}

{#if open}
  <div class="ai-panel" class:ai-panel--floating={floating}>

    <!-- Premium building-gradient header -->
    <div class="ai-panel__header">
      <div class="ai-panel__header-inner">
        <div class="ai-panel__avatar" aria-hidden="true">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
            <path d="M9 2L10.7 7.3 16 9l-5.3 1.7L9 16l-1.7-5.3L2 9l5.3-1.7z"/>
            <path d="M18 12l1 3 3 1-3 1-1 3-1-3-3-1 3-1z"/>
            <circle cx="5.5" cy="17.5" r="1.2"/>
          </svg>
        </div>
        <div class="ai-panel__head-text">
          <span class="ai-panel__title">AI Консьерж</span>
          <span class="ai-panel__subtitle">{projectName ?? 'Develta'}</span>
        </div>
        {#if floating}
          <button class="ai-panel__close" onclick={() => (open = false)} aria-label="Закрыть">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" aria-hidden="true">
              <path d="M18 6L6 18M6 6l12 12"/>
            </svg>
          </button>
        {/if}
      </div>
      <div class="ai-panel__header-glow" aria-hidden="true"></div>
    </div>

    <!-- Message area -->
    <div class="ai-panel__messages">

      {#if showWelcome}
        <div class="ai-welcome">
          <p class="ai-welcome__text">
            {projectName ? `Спросите меня о проекте «${projectName}»` : 'Чем я могу помочь?'}
          </p>
          <div class="ai-pills">
            {#each QUICK_PILLS as pill}
              <button class="ai-pill" onclick={() => send(pill.msg)}>{pill.label}</button>
            {/each}
            <button class="ai-pill ai-pill--booking" onclick={() => (bookingStep = 'form')}>
              Записаться на просмотр
            </button>
          </div>
        </div>
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

      <!-- Inline booking form -->
      {#if bookingStep === 'form' || bookingStep === 'submitting'}
        <div class="ai-booking">
          <p class="ai-booking__title">Запись на просмотр</p>
          {#if projectName}
            <p class="ai-booking__project">{projectName}</p>
          {/if}
          <div class="ai-booking__fields">
            <input
              class="ai-booking__input"
              type="text"
              placeholder="Ваше имя"
              bind:value={bookingName}
              disabled={bookingStep === 'submitting'}
            />
            <input
              class="ai-booking__input"
              type="tel"
              placeholder="+357 99 000000"
              bind:value={bookingPhone}
              disabled={bookingStep === 'submitting'}
            />
            <select
              class="ai-booking__input"
              bind:value={bookingTime}
              disabled={bookingStep === 'submitting'}
            >
              <option value="">Удобное время...</option>
              <option value="morning">Утро (9–12)</option>
              <option value="afternoon">День (12–17)</option>
              <option value="evening">Вечер (17–20)</option>
            </select>
          </div>
          {#if bookingError}
            <p class="ai-booking__error">{bookingError}</p>
          {/if}
          <button
            class="ai-booking__submit"
            onclick={submitBooking}
            disabled={bookingStep === 'submitting'}
          >
            {bookingStep === 'submitting' ? 'Отправка...' : 'Подтвердить встречу →'}
          </button>
          {#if bookingStep !== 'submitting'}
            <button
              class="ai-booking__cancel"
              onclick={() => { bookingStep = 'idle'; bookingError = ''; }}
            >
              Отмена
            </button>
          {/if}
        </div>
      {/if}

    </div>

    <!-- Input -->
    {#if bookingStep === 'idle' || bookingStep === 'done'}
      <div class="ai-panel__input">
        <textarea
          bind:value={input}
          onkeydown={handleKeydown}
          placeholder={messages.length === 0 ? 'Задайте вопрос о проекте...' : 'Написать сообщение...'}
          rows="2"
          disabled={loading}
        ></textarea>
        <button
          onclick={() => send()}
          disabled={loading || !input.trim()}
          class="ai-panel__send"
          aria-label="Отправить"
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z"/>
          </svg>
        </button>
      </div>
    {/if}

  </div>
{/if}

<style>
  /* ── FAB ─────────────────────────────────── */
  .ai-fab {
    position: fixed;
    bottom: var(--space-6);
    right: var(--space-6);
    width: 56px;
    height: 56px;
    border-radius: 50%;
    background: linear-gradient(145deg, #38342e, #2e2c26);
    border: 1.5px solid rgba(122, 140, 110, 0.3);
    color: var(--color-accent);
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.2);
    z-index: 200;
    transition: transform var(--transition-fast), box-shadow var(--transition-base);
  }

  .ai-fab:hover {
    transform: scale(1.06) translateY(-2px);
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.25), 0 0 20px rgba(122, 140, 110, 0.12);
  }

  /* ── Panel ──────────────────────────────── */
  .ai-panel {
    display: flex;
    flex-direction: column;
    border-radius: var(--radius-lg);
    overflow: hidden;
    border: 1px solid rgba(180, 170, 148, 0.3);
    box-shadow: 0 4px 24px rgba(0, 0, 0, 0.07);
    height: 520px;
  }

  .ai-panel--floating {
    position: fixed;
    bottom: calc(var(--space-6) + 70px);
    right: var(--space-6);
    width: 380px;
    height: 540px;
    z-index: 199;
    box-shadow: 0 12px 48px rgba(0, 0, 0, 0.18);
  }

  /* ── Header ─────────────────────────────── */
  .ai-panel__header {
    position: relative;
    overflow: hidden;
    flex-shrink: 0;
    background: linear-gradient(160deg, #2e2c28 0%, #383430 55%, #32302a 100%);
  }

  .ai-panel__header-inner {
    position: relative;
    z-index: 2;
    display: flex;
    align-items: center;
    gap: var(--space-3);
    padding: var(--space-4) var(--space-5);
  }

  /* Warm floor-line atmosphere */
  .ai-panel__header::before {
    content: '';
    position: absolute;
    inset: 0;
    background: repeating-linear-gradient(
      to top,
      transparent 0px,
      transparent 7px,
      rgba(200, 188, 160, 0.045) 7px,
      rgba(200, 188, 160, 0.045) 8px
    );
    pointer-events: none;
    z-index: 1;
  }

  .ai-panel__header-glow {
    position: absolute;
    bottom: -18px;
    left: 50%;
    transform: translateX(-50%);
    width: 80%;
    height: 40px;
    background: radial-gradient(ellipse, rgba(122, 140, 110, 0.14) 0%, transparent 70%);
    pointer-events: none;
    z-index: 1;
  }

  .ai-panel__avatar {
    width: 34px;
    height: 34px;
    border-radius: 50%;
    background: rgba(122, 140, 110, 0.14);
    border: 1px solid rgba(122, 140, 110, 0.3);
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--color-accent);
    flex-shrink: 0;
  }

  .ai-panel__head-text {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 2px;
    min-width: 0;
  }

  .ai-panel__title {
    font-size: var(--text-sm);
    font-weight: 700;
    color: rgba(245, 240, 228, 0.95);
    letter-spacing: 0.02em;
  }

  .ai-panel__subtitle {
    font-size: var(--text-xs);
    color: rgba(200, 190, 165, 0.5);
    letter-spacing: 0.03em;
    font-style: italic;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .ai-panel__close {
    background: rgba(255, 255, 255, 0.07);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 50%;
    width: 28px;
    height: 28px;
    cursor: pointer;
    color: rgba(200, 190, 165, 0.6);
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all var(--transition-fast);
    flex-shrink: 0;
  }

  .ai-panel__close:hover {
    background: rgba(255, 255, 255, 0.12);
    color: rgba(245, 240, 228, 0.9);
  }

  /* ── Messages ───────────────────────────── */
  .ai-panel__messages {
    flex: 1;
    overflow-y: auto;
    padding: var(--space-4);
    display: flex;
    flex-direction: column;
    gap: var(--space-3);
    background: #faf9f7;
  }

  /* ── Welcome / Pills ────────────────────── */
  .ai-welcome {
    text-align: center;
    padding: var(--space-3) 0 var(--space-2);
  }

  .ai-welcome__text {
    font-size: var(--text-sm);
    color: var(--color-text-muted);
    margin: 0 0 var(--space-3);
    line-height: 1.5;
  }

  .ai-pills {
    display: flex;
    flex-wrap: wrap;
    gap: var(--space-2);
    justify-content: center;
  }

  .ai-pill {
    padding: var(--space-2) var(--space-3);
    background: rgba(122, 140, 110, 0.06);
    border: 1px solid rgba(122, 140, 110, 0.2);
    border-radius: 20px;
    font-size: var(--text-xs);
    font-weight: 600;
    color: var(--color-text-muted);
    cursor: pointer;
    transition: all var(--transition-fast);
  }

  .ai-pill:hover {
    background: rgba(122, 140, 110, 0.12);
    border-color: rgba(122, 140, 110, 0.35);
    color: var(--color-text);
  }

  .ai-pill--booking {
    background: rgba(122, 140, 110, 0.1);
    border-color: rgba(122, 140, 110, 0.28);
    color: var(--color-accent);
  }

  .ai-pill--booking:hover {
    background: rgba(122, 140, 110, 0.18);
    border-color: var(--color-accent);
  }

  /* ── Chat bubbles ───────────────────────── */
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
    background: rgba(122, 140, 110, 0.08);
    color: var(--color-text);
    align-self: flex-start;
    border-bottom-left-radius: 4px;
    border: 1px solid rgba(122, 140, 110, 0.1);
  }

  /* Loading dots */
  .ai-dots span { animation: ai-blink 1.4s infinite both; }
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

  /* ── Inline booking form ─────────────────── */
  .ai-booking {
    background: #fff;
    border: 1px solid rgba(122, 140, 110, 0.18);
    border-radius: var(--radius-md);
    padding: var(--space-4);
    display: flex;
    flex-direction: column;
    gap: var(--space-3);
    align-self: stretch;
  }

  .ai-booking__title {
    font-size: var(--text-sm);
    font-weight: 700;
    color: var(--color-text);
    margin: 0;
    text-align: center;
  }

  .ai-booking__project {
    font-size: var(--text-xs);
    color: var(--color-accent);
    font-weight: 600;
    text-align: center;
    margin: 0;
    font-style: italic;
  }

  .ai-booking__fields {
    display: flex;
    flex-direction: column;
    gap: var(--space-2);
  }

  .ai-booking__input {
    width: 100%;
    padding: var(--space-2) var(--space-3);
    border: 1px solid rgba(0, 0, 0, 0.12);
    border-radius: var(--radius-md);
    font-size: var(--text-sm);
    font-family: var(--font-body);
    color: var(--color-text);
    background: rgba(255, 255, 255, 0.9);
    box-sizing: border-box;
    outline: none;
    transition: border-color var(--transition-fast);
  }

  .ai-booking__input:focus {
    border-color: var(--color-accent);
  }

  .ai-booking__input:disabled {
    opacity: 0.6;
  }

  .ai-booking__error {
    font-size: var(--text-xs);
    color: #ef4444;
    margin: 0;
    text-align: center;
  }

  .ai-booking__submit {
    width: 100%;
    padding: var(--space-3);
    background: var(--color-accent);
    color: #fff;
    border: none;
    border-radius: var(--radius-md);
    font-size: var(--text-sm);
    font-weight: 700;
    cursor: pointer;
    transition: opacity var(--transition-fast);
  }

  .ai-booking__submit:hover:not(:disabled) {
    opacity: 0.88;
  }

  .ai-booking__submit:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .ai-booking__cancel {
    background: none;
    border: none;
    font-size: var(--text-xs);
    color: var(--color-text-muted);
    cursor: pointer;
    text-align: center;
    padding: 0;
    text-decoration: underline;
    transition: color var(--transition-fast);
  }

  .ai-booking__cancel:hover {
    color: var(--color-text);
  }

  /* ── Input row ──────────────────────────── */
  .ai-panel__input {
    padding: var(--space-3) var(--space-4);
    border-top: 1px solid rgba(0, 0, 0, 0.06);
    display: flex;
    gap: var(--space-2);
    align-items: flex-end;
    flex-shrink: 0;
    background: #fff;
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
    display: flex;
    align-items: center;
    justify-content: center;
    transition: opacity var(--transition-fast);
    flex-shrink: 0;
  }

  .ai-panel__send:disabled {
    opacity: 0.35;
    cursor: not-allowed;
  }
</style>
