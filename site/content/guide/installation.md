---
title: Installation
order: 2
---

Three steps to a translated string.

## 1. Install the package

```bash
npm install yapyak
# or
pnpm add yapyak
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

The plugin has more options for advanced cases (custom locale folder, include/exclude patterns, rename behavior). Most projects don't need to touch them — defaults work out of the box. See the [Vite plugin reference](/reference/vite-plugin) when you do.

## 3. Add a locale

```bash
npx yapyak add es
# or
pnpm yapyak add es
```

This creates `locales/es.json` and translates all your `t()` strings into Spanish. The default locale (`en` by default) stays in your code — it doesn't need a file.

Add multiple at once:

```bash
npx yapyak add es fr de ja
# or
pnpm yapyak add es fr de ja
```

## Write your first translation

::: code-group

```tsx [React]
import { t } from 'yapyak';

export function SaveButton() {
  return <button>{t('Save changes')}</button>;
}
```

```svelte [Svelte]
<script lang="ts">
  import { t } from 'yapyak';
</script>

<button>{t('Save changes')}</button>
```

```vue [Vue]
<script setup lang="ts">
import { t } from 'yapyak';
</script>

<template>
  <button>{{ t('Save changes') }}</button>
</template>
```

:::

Save the file. `locales/es.json` updates automatically:

```json
{
  "Save changes": "Guardar cambios"
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

Add a locale and its file appears in `locales/`. `getLocales()` returns it on the next render. No hardcoded list to keep in sync.

If `persistence: 'cookie'` is set in `vite.config.ts`, the choice is stored automatically and read back on the next request — including SSR.

## SSR setup

For server-rendered apps, wire the adapter once. The adapter resolves locale per request from cookie or `Accept-Language`.

::: code-group

```ts [TanStack Start]
// src/routes/__root.tsx
import { tanstackStart } from 'yapyak/adapters/tanstack-start';
tanstackStart();
```

```ts [SvelteKit]
// src/hooks.server.ts
import { sveltekit } from 'yapyak/adapters/sveltekit';
sveltekit();
```

:::

That's the entirety of the SSR wiring.

### Wiring `<html lang>` (optional)

If you want the resolved locale to drive the `lang` attribute on the root HTML element, opt in.

#### TanStack Start

```tsx
// src/routes/__root.tsx
import { getLocale } from 'yapyak';

<html lang={getLocale()}>
```

#### SvelteKit

```ts
// src/hooks.server.ts
import { sveltekit, handle } from 'yapyak/adapters/sveltekit';

sveltekit();
export { handle };
```

```html
<!-- src/app.html -->
<html lang="%yapyak.lang%">
```

If you already have other handles, compose them with SvelteKit's `sequence`:

```ts
// src/hooks.server.ts
import { sequence } from '@sveltejs/kit/hooks';
import { sveltekit, handle as yapyakHandle } from 'yapyak/adapters/sveltekit';
import { handle as authHandle } from './auth';

sveltekit();
export const handle = sequence(yapyakHandle, authHandle);
```

## Verify

Check translation status:

```bash
npx yapyak status
# or
pnpm yapyak status
```

Run in CI to fail builds on missing translations:

```bash
npx yapyak check
# or
pnpm yapyak check
```

## What's next

- [How it works](/guide/how-it-works) — the auto-translate pipeline, position-aware renames, compile-time rewrite
- [Translations](/guide/translations/) — `t()` API, params, plurals, forced locale
- [Locales](/guide/locales/) — adding locales, persistence, reactive bindings
- [Translators](/guide/translators/) — Anthropic, OpenAI, custom
