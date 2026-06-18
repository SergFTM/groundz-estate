---
name: svelte5-patterns
description: Use whenever writing or modifying .svelte files, working with reactivity, state, props, derived values, or effects. Groundz is on Svelte 5 with runes; the old Svelte 3/4 syntax (let, $: , export let) is forbidden in new code.
---

# Svelte 5 Runes Skill

## Use when
- Создаёшь/правишь `.svelte` файл
- Видишь warning `state_referenced_locally` в check
- Проектируешь пропс или derived value

## Runes cheat sheet

```svelte
<script lang="ts">
  // Props (replaces export let)
  let { name, age = 18 }: { name: string; age?: number } = $props();

  // Local reactive state
  let count = $state(0);

  // Derived (single-expression)
  let doubled = $derived(count * 2);

  // Derived (multi-line) — MUST use $derived.by
  let summary = $derived.by(() => {
    const x = computeX();
    const y = computeY(x);
    return `${x}-${y}`;
  });

  // Effect
  $effect(() => {
    console.log('count changed', count);
    return () => console.log('cleanup');
  });

  // Bindable two-way prop
  let { value = $bindable() }: { value?: string } = $props();
</script>
```

## Common pitfall: `state_referenced_locally`

```svelte
<!-- ❌ WRONG -->
<script>
  let { data } = $props();
  let projects = data.projects;          // captures initial value, not reactive!
</script>

{#each projects as p}{p.name}{/each}
```

```svelte
<!-- ✅ FIXED -->
<script>
  let { data } = $props();
  let projects = $derived(data.projects);
</script>

{#each projects as p}{p.name}{/each}
```

```svelte
<!-- ✅ Also OK if you genuinely need a one-shot snapshot -->
<script>
  import { untrack } from 'svelte';
  let { data } = $props();
  const initialProjects = untrack(() => data.projects);   // intentional
</script>
```

## Form actions union-type pitfall

`form` prop из `+page.svelte` может быть `null | { errors } | { success } | { error }`:

```svelte
<script>
  let { form } = $props();
  // ❌ Don't: form?.errors  — TypeScript narrows incorrectly
  let formErrors = $derived(
    (form as { errors?: Record<string, string> } | null)?.errors ?? {}
  );
</script>

<input class:error={formErrors.email} />
```

## Component composition

- **Slots:** Svelte 5 use `{#snippet ...}` and `{@render children?.()}` — see official migration.
- **Events:** prefer callback props (`onClick={(e) => ...}`) over `createEventDispatcher`.
- **Stores:** legacy `writable()` still works, but prefer `$state` for component-local state.

## A11y rules (must pass `npm run check`)

- `<label>` → `for=` to control's `id=`
- `<button>` без текста → `aria-label`
- `<div onclick>` → добавь `role="button"` + `tabindex="0"` + `onkeydown`
- `<dialog>` → `tabindex="-1"`
- `<rect>` с mouse-handler в SVG → `role="img"` + `aria-label`

## CSS in Svelte

- Используй scoped `<style>` блок.
- Глобальные токены — `:global(:root)` или `src/app.css`.
- BEM-like классы: `.cabinet-sidebar__item--active`.
- Никогда не пиши `style="color: red"` inline в шаблоне.

## When NOT to use $effect

- Computing derived values → используй `$derived`.
- Updating local state из props → `$derived`.
- Подписки на внешние события (websocket, DOM) → `$effect` ОК с cleanup.
