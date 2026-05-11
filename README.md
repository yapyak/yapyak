# yapyak 🐃

[![Vite](https://img.shields.io/badge/Vite-646CFF?logo=vite&logoColor=white)](https://vitejs.dev/)
[![React](https://img.shields.io/badge/React-20232A?logo=react&logoColor=61DAFB)](https://react.dev/)
[![Svelte](https://img.shields.io/badge/Svelte-FF3E00?logo=svelte&logoColor=white)](https://svelte.dev/)
[![Vue](https://img.shields.io/badge/Vue-4FC08D?logo=vuedotjs&logoColor=white)](https://vuejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

> **Yap in code. The rest translates itself.**
>
> i18n where your code is the source of truth. Translations are side-effects.

**React · Svelte · Vue** — with SSR adapters for **TanStack Start** and **SvelteKit**.

yapyak co-locates your translations with your code and lets AI maintain them.

You write `t('Save changes')` in your component. Save. The AI of your choice (Anthropic, OpenAI, or anything you wire up) regenerates every locale in your voice — with the surrounding code as context — and HMR pushes the new copy live before you switch tabs.

No enterprise portal, no per-seat pricing, no vendor in your billing path. Bring your own key, own the whole loop.

The default language lives only in your code. There's no `en.json`. Other locales are derived from your source like compiled output — regenerated on save, never authored. Translations are side-effects.

What Tailwind did to CSS class names, yapyak does to translation keys: kills the naming meeting. The string in your editor is the string in your app.

It's also the shape AI thrives in. Everything's in one file — the source string, the surrounding code, the component name. Claude reads `t('Save changes')` and sees the meaning right there. No round-trip to figure out what `auth.error.invalid_2` actually says. Every agent in your editor pulls in the same direction.

It's a Vite plugin. MIT, BYO key, no telemetry.

## Quick start

```bash
npm install yapyak
npx yapyak add es
```

```ts
// vite.config.ts
import { defineConfig } from 'vite';
import { yapyak } from 'yapyak/vite';
import { anthropic } from 'yapyak/translators/anthropic';

export default defineConfig({
  plugins: [
    yapyak({
      persistence: 'cookie',
      translator: anthropic({
        apiKey: process.env.ANTHROPIC_API_KEY,
        voice: 'Casual, thoughtful, never corporate.',
      }),
    }),
  ],
});
```

```tsx
import { t } from 'yapyak';

export function SaveButton() {
  return <button>{t('Save changes')}</button>;
}
```

Save the file.

`locales/es.json` appears automatically:

```json
{
  "src/components/save-button.tsx": {
    "Save changes": "Guardar cambios"
  }
}
```

Edit the string. Save again. Every locale updates instantly via HMR.

## Translate by saving

The Vite plugin watches every `t()` call. New strings get added to your locale files. Removed strings get pruned. Edited strings re-translate. All of it on save, in the background.

Each batch goes to your translator with the source string, the file path, the surrounding JSX or template element, your voice prompt, and your glossary. Default batch size is 10 — about 10× fewer API calls than naive one-string-at-a-time. A typical save round-trips in under a second.

```ts
yapyak({
  translator: anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY,
    voice: 'Personal blog voice. Casual, thoughtful, never corporate.',
    glossary: {
      'sign in': { es: 'iniciar sesión', fr: 'se connecter', de: 'anmelden' },
      cart: { es: 'carrito', fr: 'panier', de: 'Warenkorb' },
    },
  }),
}),
```

Each `t('...')` is rewritten at build time into a direct lookup with all locale variants inlined. Routes that don't reference a string don't ship its translations — Vite/Rollup tree-shake per chunk.

## Add a language anytime

Need French? Run one command.

```bash
$ npx yapyak add fr
  Translating via Anthropic  142 strings
  ✔ 142 translated · 14.3s
```

yapyak walks every `t()` call in your codebase, batches them to your translator, and writes `locales/fr.json` in one pass.

## Position-aware rename memory

The classic source-as-keys trap: change `t('Save')` to `t('Save changes')` and you've renamed the key. Naive implementations lose every existing translation. yapyak doesn't.

```diff
- t('Save')
+ t('Save changes')
```

```
[yapyak] ↻ "Save" → "Save changes" (rename detected)
[yapyak] es: re-translating…
```

The plugin compares positions of every `t()` call between saves. If a string disappeared at line 23, column 12, and a new string appeared at the exact same position, that's a rename — not a delete-and-add. Locale files get the key swapped, existing translations stay as placeholders until the new English re-translates.

Position matching is exact. No similarity heuristics. No false positives.

## The string is the key

`t('Save changes')`. The string itself is the lookup. No central key registry, no `i18n.json` ontology to keep in sync.

When two files use the same English string and want different translations — `t('Save')` on a form button vs. `t('Save')` on a settings page — yapyak handles it automatically. Each call is keyed by `(file path, source string)`, so two files = two independent entries. Edit either one in isolation.

```json
{
  "src/components/employee-form.tsx": { "Save": "Guardar" },
  "src/components/contract-actions-bar.tsx": { "Save": "Conservar" }
}
```

The AI gets the file path, the component name, and the enclosing JSX or template element as context — so it can disambiguate without you ever annotating. `t('Save')` inside a `<button>` translates differently from `t('Save')` inside an `<h1>`.

## Typed to the bone

Params are inferred from the source string at compile time.

```tsx
t('Hello {name}', { name: 'Joakim' })   // ✓
t('Hello {name}')                       // ✗ missing { name }
t('Hello')                              // ✓
t('Hello', { name: 'Joakim' })          // ✗ no params expected
```

```tsx
t('You have {count, plural, one {# item} other {# items}}', { count: 3 })
//          ^^^^^                                              ^^^^^^^^
//          ICU plural — count: number is required
```

You can't pass the wrong shape. TypeScript reads the string literal and knows what it asks for. Plurals, selects, named placeholders — all ICU MessageFormat, all checked at the call site.

## Works everywhere Vite works

The same `t` in React, Svelte, Vue, and plain JS. Reactivity is the only framework-specific piece, exposed as `useLocale`.

```tsx
// React
import { t } from 'yapyak';
import { useLocale } from 'yapyak/react';

function App() {
  const [locale, setLocale] = useLocale();
  return <h1>{t('Hello')}</h1>;
}
```

```svelte
<!-- Svelte -->
<script lang="ts">
  import { locale, t } from 'yapyak/svelte';
</script>

<h1>{t('Hello')}</h1>
<button onclick={() => (locale.current = 'es')}>Español</button>
```

```vue
<!-- Vue -->
<script setup lang="ts">
import { locale, t } from 'yapyak/vue';
</script>

<template>
  <h1>{{ t('Hello') }}</h1>
  <button @click="locale = 'es'">Español</button>
</template>
```

`t()` works inline in `.svelte` and `.vue` templates — the plugin extracts and rewrites them the same way it does in `.ts` and `.tsx`.

SSR adapters for TanStack Start and SvelteKit resolve locale per request from cookie or `Accept-Language`. Pre-rendered HTML in the right language from the first byte. No flash, no flicker.

```ts
// React + TanStack Start (in __root.tsx)
import { tanstackStart } from 'yapyak/adapters/tanstack-start';
tanstackStart();

// Svelte + SvelteKit (in hooks.server.ts)
import { sveltekit } from 'yapyak/adapters/sveltekit';
sveltekit();
```

Optional: wire the resolved locale to `<html lang>`. On TanStack Start, write it directly in your root component. On SvelteKit, opt into the placeholder transform.

```tsx
// React: just user code
<html lang={getLocale()}>
```

```ts
// SvelteKit (hooks.server.ts): import + re-export the handle
import { sveltekit, handle } from 'yapyak/adapters/sveltekit';
sveltekit();
export { handle };
```

```html
<!-- SvelteKit (app.html): use the placeholder -->
<html lang="%yapyak.lang%">
```

## vs other libraries

|                              | yapyak | Lingui | i18next | next-intl | paraglide |
|------------------------------|:------:|:------:|:-------:|:---------:|:---------:|
| Source string is the key     |   ✓    |   ✓¹   |    ✗    |     ✗     |     ✗     |
| No default-locale file       |   ✓    |   ✗    |    ✗    |     ✗     |     ✗     |
| Auto-translate on save       |   ✓    |   ✗    |    ✗    |     ✗     |     ✗     |
| Position-aware rename memory |   ✓    |   ✗    |    ✗    |     ✗     |     ✗     |
| Per-file scoping             |   ✓    |   ✗    |    ✗    |     ✗     |     ✗     |
| Compile-time tree-shake      |   ✓    |   ✓    |    ✗    |     ✗     |     ✓     |
| Type-safe params             |   ✓    |   ✓    |    ~    |     ✓     |     ✓     |
| Zero-config SSR adapter      |   ✓    |   ✗    |    ✗    |     ~     |     ✗     |
| One-flag cookie persistence  |   ✓    |   ✗    |    ✗    |     ~     |     ✗     |
| No paid upsell               |   ✓    |   ✓²   |    ✗³   |     ✓     |     ~⁴    |

```
¹ Lingui supports both source-as-key (via t/Trans macros) and explicit IDs.
² Lingui itself is MIT and free. Crowdin is a recommended third-party TMS.
³ Locize is the official i18next-by-same-team paid translation service ($99/mo+).
⁴ paraglide-js is free; the inlang ecosystem includes paid editor features.
```

yapyak's DX bet: nothing you don't have to write. SSR adapter is one function call. Cookie persistence is one config flag. Translation files maintain themselves on save. Position-aware rename means you can refactor freely without losing translations. Tailwind put styling next to the markup; yapyak puts everything else next to it too — and lets the AI handle the rest.

## CLI

```bash
$ npx yapyak status

  Translation status

  Locales   en (default) · es · fr · de · ja
  Total     142 messages × 5 = 710 translations

  Locale        Coverage
  en (default)  142 / 142  ████████████████████  100%
  es            142 / 142  ████████████████████  100%
  fr            139 / 142  ███████████████████░   98%
  de            135 / 142  ███████████████████░   95%
  ja            142 / 142  ████████████████████  100%
```

```
yapyak add <locale...>            add one or more locales, auto-translate everything
yapyak translate                  fill missing translations across every locale
yapyak translate es               fill missing in one locale
yapyak translate --force          re-translate everything across every locale
yapyak translate es --force       re-translate everything in one locale
yapyak status                     coverage report
yapyak status --json              machine-readable, exits 1 if any missing
yapyak check                      exits 1 if anything is missing — for CI
```

`add` takes any number of locales: `npx yapyak add es fr de ja` scaffolds four files and translates them in one go.

## Vite-only

yapyak exists because Vite exists. "Save a file and the right thing happens" is what makes auto-translate-on-HMR feel like magic. Going framework-agnostic would mean meeting eight bundlers' edge cases halfway. We're excellent in one place instead.

---

MIT. No telemetry. No Cloud. Built by [@qwuide](https://github.com/qwuide) for our own products.

🐃

Zero runtime dependencies. Boots in milliseconds.
