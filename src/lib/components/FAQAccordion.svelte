<script lang="ts">
  interface FAQItem {
    question: string;
    answer: string;
    category: string;
  }

  interface Props {
    items: FAQItem[];
  }

  let { items }: Props = $props();
</script>

<div class="faq-accordion">
  {#each items as item}
    <details class="faq-accordion__item">
      <summary class="faq-accordion__question">
        {item.question}
        <span class="faq-accordion__icon">+</span>
      </summary>
      <div class="faq-accordion__answer">
        {item.answer}
      </div>
    </details>
  {/each}
</div>

<style>
  .faq-accordion {
    display: flex;
    flex-direction: column;
    gap: var(--space-3);
  }

  .faq-accordion__item {
    background: rgba(255, 255, 255, 0.55);
    backdrop-filter: blur(12px);
    -webkit-backdrop-filter: blur(12px);
    border: 1px solid rgba(0, 0, 0, 0.06);
    border-radius: var(--radius-md);
    overflow: hidden;
  }

  .faq-accordion__question {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: var(--space-5);
    font-size: var(--text-base);
    font-weight: 600;
    color: var(--color-text);
    cursor: pointer;
    list-style: none;
    gap: var(--space-4);
  }

  .faq-accordion__question::-webkit-details-marker {
    display: none;
  }

  .faq-accordion__icon {
    font-size: var(--text-xl);
    color: var(--color-accent);
    flex-shrink: 0;
    transition: transform 0.2s ease;
    font-weight: 300;
  }

  details[open] .faq-accordion__icon {
    transform: rotate(45deg);
  }

  .faq-accordion__answer {
    padding: 0 var(--space-5) var(--space-5);
    font-size: var(--text-sm);
    color: var(--color-text-muted);
    line-height: 1.7;
    border-top: 1px solid rgba(0, 0, 0, 0.04);
  }
</style>
