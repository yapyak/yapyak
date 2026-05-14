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

## 2. Add the plugin to `vite.config.ts`

```ts
import { defineConfig } from 'vite';
import { yapyak } from 'yapyak/vite';
import { anthropic } from 'yapyak/translator/anthropic';

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

```vue [Vue]
<script setup lang="ts">
import { t } from 'yapyak';
</script>

<template>
  <button>{{ t('Save changes') }}</button>
</template>
```

```svelte [Svelte]
<script lang="ts">
  import { t } from 'yapyak';
</script>

<button>{t('Save changes')}</button>
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

`useLocale()` in React, `locale` in Vue and Svelte. The full pattern with code samples for each framework lives in [Locales / Switching locale](/guide/locales#switching-locale).

## SSR setup

If your app is server-rendered, wire the adapter once. Pick the page for your framework:

- [TanStack Start](/guide/adapters/tanstack-start)
- [SvelteKit](/guide/adapters/sveltekit)
- [Custom](/guide/adapters/custom) — any other Vite SSR setup

Pure SPAs (no SSR) don't need an adapter — skip this step.

## Verify

```bash
npx yapyak status
# or
pnpm yapyak status
```

Lists every locale, how many strings each has, and which entries are missing.

## CI

Fail builds on missing translations:

```bash
npx yapyak check
# or
pnpm yapyak check
```

Two common CI shapes:

**Pre-translate locally, commit `locales/*.json`.** No AI calls in CI. The build runs `yapyak check` and fails if anything's missing. Recommended for most projects — you don't ship credentials to your CI provider.

**Translate in CI.** Set your translator's API key as a CI secret. The build runs translation as part of `vite build`. Faster onboarding (no manual translate step) but every CI run hits the AI provider.

## What's next

- [How it works](/guide/how-it-works) — the auto-translate pipeline, position-aware renames, compile-time rewrite
- [Translations](/guide/translations/) — `t()` API, params, plurals, forced locale
- [Locales](/guide/locales/) — adding locales, persistence, reactive bindings
- [Translators](/guide/translators/) — Anthropic, OpenAI, custom
