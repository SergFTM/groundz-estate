---
name: design-system
description: Use whenever styling components, building UI, or working with brand. Groundz uses custom CSS with CSS Custom Properties, frosted-glass widgets, fixed gradient hero, and self-hosted fonts. Tailwind is forbidden.
---

# Design System Skill

## Use when
- Создаёшь/правишь `.svelte` с UI частью
- Работаешь со стилями, цветами, типографикой
- Адаптируешь tenant-skin к brand

## Tokens (`src/app.css`)

GROUNDZ ESTATE brand: **deep green `#104e49` = primary** (brand/CTA/links/focus), **sage `#7a8c6e` = secondary accent**. Numbers use **IBM Plex Mono**.

```css
:root {
  /* Brand primary — GROUNDZ green */
  --color-primary:        #104e49;
  --color-primary-hover:  #0c3b37;
  --color-primary-light:  rgba(16,78,73,0.08);
  --color-primary-glow:   rgba(16,78,73,0.15);
  --color-primary-contrast: #fff;
  /* Green scale: --color-primary-{50,100,300,500,700,900}, 700 = #104e49 */

  /* Secondary accent — sage & stone */
  --color-accent:         #7a8c6e;
  --color-accent-hover:   #6b7d60;
  --color-bg:             #ffffff;
  --color-text:           #1a1a1a;
  --color-text-body:      #5c5c5c;
  --color-text-muted:     #999999;
  --color-border:         #e5e2dc;

  /* Typography */
  --font-display: 'Ivyora Display', Georgia, serif;   /* headings (h1/h2, light italic) */
  --font-body:    'Helvetica Now Text', system-ui, sans-serif;
  --font-mono:    'IBM Plex Mono', ui-monospace, monospace;  /* numbers/metrics only */

  /* Spacing: --space-1..24 (rem). Radius: --radius-sm..2xl + --radius-full.
     Shadows: --shadow-sm..xl, --shadow-card, --shadow-card-hover, --shadow-glow. */
}
```

**Brand color rule:** new components use `var(--color-primary)` for CTAs, links, active/focus; sage `--color-accent` for supporting highlights/backgrounds. Don't hardcode `#104e49`.

**Numbers:** wrap figures (yield, IRR, amounts, tokens, tickers) in `.num` — applies `--font-mono` + `tabular-nums` so digits align and don't jitter in tables/calculators.

```svelte
<span class="num">{formatPct(pool.targetYield)}</span>
```

> ⚠️ `IBM Plex Mono` .woff2 not yet in `static/fonts/` — `@font-face` is wired with a system-mono fallback. Drop `IBMPlexMono-Regular.woff2` + `-Medium.woff2` (OFL) to finish. Ivyora + Helvetica Now are already present.

## Tenant-driven brand

```ts
// hooks.server.ts → layout transform
const skinCss = `
  :root {
    --color-primary: ${skin.brand.primaryColor};
    --color-accent:  ${skin.brand.accentColor};
    --font-heading:  '${skin.brand.fontHeading}', serif;
    --font-body:     '${skin.brand.fontBody}', sans-serif;
  }
`;
```

Эта строка инжектится в `<head>` в `+layout.svelte` через `{@html}` (контролируется master, не user input — безопасно).

## Frosted glass widget

Каноничный паттерн для cards/panels:

```css
.widget-glass {
  background: rgba(255, 255, 255, 0.6);
  backdrop-filter: blur(20px) saturate(180%);
  -webkit-backdrop-filter: blur(20px) saturate(180%);
  border: 1px solid rgba(255, 255, 255, 0.3);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-glass);
}
```

## Hero parallax (важная деталь)

Текущая реализация в `src/routes/(marketing)/+page.svelte`:
- **Фиксированный градиент** на `.hero` element (НЕ `body`).
- Параллакс через `translateY` на дочерних слоях (НЕ на самом hero).
- Это оставляет фон неподвижным относительно скролла, а контент над ним движется.

**НЕ ломать**, если делаешь редизайн hero:

```css
.hero {
  background: linear-gradient(180deg, #f5f1e8 0%, #e8d5b7 100%);
  /* Фиксированный — НЕ background-attachment: fixed (плохо на mobile) */
}
.hero__layer-1 { transform: translateY(calc(var(--scroll-y, 0) * -0.3)); }
.hero__layer-2 { transform: translateY(calc(var(--scroll-y, 0) * -0.5)); }
```

## Typography hierarchy

```css
h1, .h1 { font-family: var(--font-heading); font-size: clamp(2.5rem, 5vw, 4rem); line-height: 1.1; }
h2, .h2 { font-family: var(--font-heading); font-size: clamp(2rem, 4vw, 3rem); line-height: 1.15; }
h3, .h3 { font-family: var(--font-heading); font-size: clamp(1.5rem, 3vw, 2rem); }
.body-lg { font-size: 1.125rem; line-height: 1.6; }
.body    { font-size: 1rem; line-height: 1.6; }
.small   { font-size: 0.875rem; line-height: 1.5; color: var(--color-text-muted); }
```

## Self-hosted fonts

```html
<!-- src/app.html -->
<link rel="preload" href="/fonts/IvyoraDisplay-LightItalic.woff2" as="font" type="font/woff2" crossorigin>
<link rel="preload" href="/fonts/HelveticaNowText-Regular.woff2" as="font" type="font/woff2" crossorigin>
```

```css
@font-face {
  font-family: 'IvyoraDisplay-LightItalic';
  src: url('/fonts/IvyoraDisplay-LightItalic.woff2') format('woff2'),
       url('/fonts/IvyoraDisplay-LightItalic.woff') format('woff');
  font-display: swap;
}
```

## Component naming (BEM-lite)

```svelte
<style>
  .project-card { /* block */ }
  .project-card__title { /* element */ }
  .project-card__title--featured { /* modifier */ }
</style>
```

Глобальные хелперы — в `src/app.css`. Component-scoped — в `<style>` блоке.

## Responsive breakpoints

```css
/* Mobile-first, без фреймворка */
@media (min-width: 640px) { /* sm */ }
@media (min-width: 1024px) { /* md → desktop */ }
@media (min-width: 1440px) { /* xl */ }
```

## Dynamic skin in components

```svelte
<script lang="ts">
  import { page } from '$app/stores';
  const brand = $derived($page.data.tenant.skin.brand);
</script>

<button style:background-color={brand.primaryColor}
        style:color={brand.primaryTextColor}>
  Узнать больше
</button>
```

Использовать `style:` directive вместо inline-`style="..."`.

## Anti-patterns

| ❌ | ✅ |
|---|---|
| `class="bg-blue-500 p-4"` (Tailwind) | semantic class + custom CSS |
| `<span style="color: red;">` | `<span class="alert">` + CSS |
| Hardcoded цвета в компонентах | через `var(--color-primary)` |
| Google Fonts CDN | self-hosted в `static/fonts/` |
| `background-attachment: fixed` (мерцание на mobile) | parallax через transform на child |
| Раскопали базу tokens, пишем `font-size: 14px` | `var(--font-size-sm)` или утилита |

## Lighthouse target

Каждая публичная страница тенанта должна давать:
- Performance ≥ 90
- Accessibility ≥ 95
- Best Practices ≥ 95
- SEO ≥ 95

Перед каждым merge — `npm run build && npm run preview` и Lighthouse audit (Chrome DevTools).
