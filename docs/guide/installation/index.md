# Installation

Three steps to a translated string.

## 1. Install the package

```bash
npm install yapyak
# or: pnpm add yapyak
# or: yarn add yapyak
```

`yapyak` ships everything in one package — Vite plugin, runtime, framework adapters, CLI, translators. There are no `@yapyak/*` sub-packages to install.

## 2. Add the plugin to `vite.config.ts`

```ts
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

Add your API key to `.env.local`:

```bash
ANTHROPIC_API_KEY=sk-ant-…
```

OpenAI, Ollama, or any custom translator works the same way — see [Translators](/guide/translators/).

## 3. Add a locale

```bash
npx yapyak add es
```

This creates `locales/es.json` and translates all your `t()` strings into Spanish. The default locale (`en` by default) stays in your code — it doesn't need a file.

Add multiple at once:

```bash
npx yapyak add es fr de ja
```

## Write your first translation

```tsx
import { t } from 'yapyak';

export function SaveButton() {
  return <button>{t('Save changes')}</button>;
}
```

Save the file. `locales/es.json` updates automatically:

```json
{
  "src/components/save-button.tsx": {
    "Save changes": "Guardar cambios"
  }
}
```

HMR pushes the new copy live. Edit the string. Save again. Every locale re-translates.

## Switch language at runtime

Each framework exposes the locale in its idiomatic shape. `getLocales()` returns every configured locale (default + every file in `locales/`) so you don't hardcode the list.

::: code-group

```tsx [React]
import { getLocales } from 'yapyak';
import { useLocale } from 'yapyak/react';

export function LocaleToggle() {
  const [locale, setLocale] = useLocale();
  const locales = getLocales();
  return (
    <select value={locale} onChange={(e) => setLocale(e.target.value)}>
      {locales.map((locale) => (
        <option key={locale} value={locale}>
          {locale.toUpperCase()}
        </option>
      ))}
    </select>
  );
}
```

```svelte [Svelte]
<script lang="ts">
  import { getLocales } from 'yapyak';
  import { locale } from 'yapyak/svelte';
  const locales = getLocales();
</script>

<select bind:value={locale.current}>
  {#each locales as locale}
    <option value={locale}>{locale.toUpperCase()}</option>
  {/each}
</select>
```

```vue [Vue]
<script setup lang="ts">
import { getLocales } from 'yapyak';
import { locale } from 'yapyak/vue';
const locales = getLocales();
</script>

<template>
  <select v-model="locale">
    <option v-for="locale in locales" :key="locale" :value="locale">
      {{ locale.toUpperCase() }}
    </option>
  </select>
</template>
```

:::

Add a locale → its file appears in `locales/` → `getLocales()` returns it on the next render. No hardcoded list to keep in sync.

If `persistence: 'cookie'` is set in `vite.config.ts`, the choice is stored automatically and read back on the next request — including SSR.

## SSR setup

For server-rendered apps, wire the adapter once. The adapter resolves locale per request from cookie or `Accept-Language`.

::: code-group

```ts [TanStack Start (in __root.tsx)]
import { tanstackStart } from 'yapyak/adapters/tanstack-start';
tanstackStart();
```

```ts [SvelteKit (in hooks.server.ts)]
import { sveltekit } from 'yapyak/adapters/sveltekit';
sveltekit();
```

:::

That's the entirety of the SSR wiring.

### Wiring `<html lang>` (optional)

If you want the resolved locale to drive the `lang` attribute on the root HTML element, opt in. Two patterns depending on framework.

::: code-group

```tsx [TanStack Start]
import { getLocale } from 'yapyak';

// in your root component
<html lang={getLocale()}>
```

```ts [SvelteKit (hooks.server.ts)]
import { sveltekit, handle } from 'yapyak/adapters/sveltekit';

sveltekit();
export { handle };  // replaces %yapyak.lang% in app.html
```

```html [SvelteKit (app.html)]
<html lang="%yapyak.lang%">
```

:::

The `handle` export from `yapyak/adapters/sveltekit` is **only** for the `<html lang>` placeholder. SSR locale resolution is wired by `sveltekit()` alone — `handle` is optional.

## Verify

Check translation status:

```bash
npx yapyak status
```

Run in CI to fail builds on missing translations:

```bash
npx yapyak check
```

## What's next

- [How it works](/guide/how-it-works) — the auto-translate pipeline, position-aware renames, compile-time rewrite
- [Translations](/guide/translations/) — `t()` API, params, plurals, forced locale
- [Frameworks](/guide/frameworks/) — framework-specific setup guides
- [Translators](/guide/translators/) — Anthropic, OpenAI, custom
