# yapyak 🐃

[![Vite](https://img.shields.io/badge/Vite-646CFF?logo=vite&logoColor=white)](https://vitejs.dev/)
[![React](https://img.shields.io/badge/React-20232A?logo=react&logoColor=61DAFB)](https://react.dev/)
[![Svelte](https://img.shields.io/badge/Svelte-FF3E00?logo=svelte&logoColor=white)](https://svelte.dev/)
[![Vue](https://img.shields.io/badge/Vue-4FC08D?logo=vuedotjs&logoColor=white)](https://vuejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

> **i18n that maintains itself.**
>
> Wrap your strings in `t()` — translations write themselves.

**React · Svelte · Vue** — with SSR adapters for **TanStack Start** and **SvelteKit**.

You write `t('Save changes')`. Save. The AI of your choice regenerates every locale in your voice, with the surrounding code as context, and HMR pushes new copy before you switch tabs.

The default language lives only in your code. There's no `en.json`. Other locales are derived like compiled output — never authored. What Tailwind did to CSS class names, yapyak does to translation keys.

Vite plugin. MIT. BYO key. No telemetry.

## Installation

```bash
npm install yapyak
npx yapyak add es
```

```ts
// vite.config.ts
import { defineConfig } from 'vite';
import { yapyak } from 'yapyak/vite';
import { anthropic } from 'yapyak/translator';

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

Save the file. `locales/es.json` appears:

```json
{
  "src/components/save-button.tsx": {
    "Save changes": "Guardar cambios"
  }
}
```

Edit the string. Save again. Every locale updates instantly via HMR.

## Add a language anytime

```bash
$ npx yapyak add fr de ja
  ✔ 142 strings × 3 locales · 14.3s
```

One command scaffolds the files and translates everything in one pass.

## Rename detection

```diff
- t('Save')
+ t('Save changes')
```

yapyak compares positions of every `t()` call between saves. String gone at line 23, column 12, new one at the exact same spot — that's a rename, not a delete-and-add. The locale key swaps in place and the new source re-translates in the background. No window where the entry is missing, no flash of fallback to the source language.

Exact position matching. No similarity heuristics, no false positives.

## The string is the key

`t('Save')` on a form button vs. `t('Save')` on a settings page can need different translations. Each call is keyed by `(file path, source string)` — two files, two independent entries. The AI gets the file path, component name, and enclosing JSX as context, so `t('Save')` in a `<button>` translates differently from `t('Save')` in an `<h1>`. No annotation needed.

## ICU at runtime

```tsx
t('Hello {name}', { name: 'Joakim' })
t('You have {count, plural, one {# item} other {# items}}', { count: 3 })
t('{name, select, joakim {Hej} other {Hello}}', { name: 'joakim' })
```

Plurals, ordinals, selects, named placeholders, recursive interpolation. Per-locale CLDR categories via `Intl.PluralRules` — Russian gets `one`/`few`/`many`, Arabic gets `zero`/`one`/`two`/`few`/`many`. Plus `t.in(locale)('...')` for forced-locale rendering — emails, multi-locale digests, that sort of thing.

## Works everywhere Vite works

The same `t` in React, Svelte, Vue. Reactivity is the only framework-specific piece.

```tsx
// React
import { t } from 'yapyak';
import { useLocale } from 'yapyak/react';

const [locale, setLocale] = useLocale();
```

```svelte
<!-- Svelte -->
<script lang="ts">
  import { t } from 'yapyak';
  import { locale } from 'yapyak/svelte';
</script>

<button onclick={() => (locale.current = 'es')}>Español</button>
```

```vue
<!-- Vue -->
<script setup lang="ts">
import { t } from 'yapyak';
import { locale } from 'yapyak/vue';
</script>
```

`t()` works inline in `.svelte` and `.vue` templates — the plugin extracts them the same way it does `.ts` and `.tsx`.

SSR adapters for TanStack Start and SvelteKit resolve locale per request from cookie or `Accept-Language`. Pre-rendered HTML in the right language from the first byte. No flash, no flicker.

```ts
// TanStack Start (src/start.ts)
import { middleware } from 'yapyak/adapter/tanstack-start';
export default {
  requestMiddleware: [middleware],
};

// SvelteKit (src/hooks.server.ts)
export { handle } from 'yapyak/adapter/sveltekit';
```

## CLI

```bash
yapyak add <locale...>           add locales, auto-translate everything
yapyak translate                 fill missing across every locale
yapyak translate es --force      re-translate one locale
yapyak export                    snapshot all locales as wrapped JSON (stdout)
yapyak export sv en              snapshot just these locales
yapyak export --split --out tms/ one file per locale into a directory
yapyak status                    coverage report
yapyak check                     exits 1 if anything is missing — for CI
```

## Vite-only

yapyak exists because Vite exists. "Save a file and the right thing happens" is what makes auto-translate-on-HMR feel like magic. We're excellent in one place instead of meeting eight bundlers' edge cases halfway.

---

MIT. No telemetry. No Cloud. Zero runtime dependencies. Built by [@qwuide](https://github.com/qwuide).

🐃
