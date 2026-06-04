---
title: Installation
order: 2
---

Add yapyak to a Vite project.

## Install

{% code-group %}

```bash [npm]
npm install yapyak @yapyak/vite
```

```bash [pnpm]
pnpm add yapyak @yapyak/vite
```

```bash [bun]
bun add yapyak @yapyak/vite
```

{% /code-group %}

- `yapyak` — the runtime (`t()`, format helpers, the raw locale API) plus the `yapyak` CLI command (add locales, status, batch translate)
- `@yapyak/vite` — the Vite plugin (extraction, HMR, compile-time inlining)

## Configure Vite

Add the plugin to `vite.config.ts`:

```ts [vite.config.ts]
import { defineConfig } from 'vite';
import { yapyak } from '@yapyak/vite';

export default defineConfig({
  plugins: [yapyak()],
});
```

## Configure yapyak

Create `yapyak.config.ts` in the project root:

```ts [yapyak.config.ts]
import { defineConfig } from 'yapyak/config';

export default defineConfig({
  persistence: 'cookie',
});
```

Bare minimum. Without a translator, new locale entries land as empty stubs you fill in yourself. To auto-translate on save, [pick a translator](#pick-a-translator) below.

## Write your first translation

{% code-group %}

```tsx [React]
import { t } from 'yapyak';

export function SaveButton() {
  return <button>{t('Save changes')}</button>;
}
```

```vue [Vue]
<script setup lang="ts">
import { t } from 'yapyak'
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

```astro [Astro]
---
import { t } from 'yapyak';
---

<button>{t('Save changes')}</button>
```

{% /code-group %}

## Add a locale

{% code-group %}

```bash [npm]
npx yapyak add sv
```

```bash [pnpm]
pnpm yapyak add sv
```

```bash [bun]
bunx yapyak add sv
```

{% /code-group %}

Creates `locales/sv.json` and stubs every existing `t()` source string. Run with multiple at once:

{% code-group %}

```bash [npm]
npx yapyak add sv de es ja
```

```bash [pnpm]
pnpm yapyak add sv de es ja
```

```bash [bun]
bunx yapyak add sv de es ja
```

{% /code-group %}

The default locale (`en`) stays in your code — it doesn't need a file.

If a translator is configured, the stubs fill automatically on save:

```json
{
  "Save changes": "Spara ändringar"
}
```

HMR pushes the new copy live. Edit the source string, save again, every locale re-translates.

## Pick a translator

To translate automatically on save, install one of yapyak's translators:

| Provider | Package | Setup |
|---|---|---|
| Anthropic (Claude) | `@yapyak/anthropic` | [Anthropic](/guide/translators/anthropic) |
| OpenAI (or compatible) | `@yapyak/openai` | [OpenAI](/guide/translators/openai) |
| Google Gemini | `@yapyak/gemini` | [Gemini](/guide/translators/gemini) |
| Ollama (local) | `@yapyak/ollama` | [Ollama](/guide/translators/ollama) |
| Custom (any LLM) | `yapyak/translator` subpath | [Custom](/guide/translators/custom) |

Each ships first-class. Same shared config interface across providers. See [Translators overview](/guide/translators) for tradeoffs.

## Pick a framework adapter

For server-rendered apps. Skip if your app never renders on a server.

| Framework | Package | Setup |
|---|---|---|
| Astro | `@yapyak/astro` | [Astro adapter](/guide/adapters/astro) |
| React Router | `@yapyak/react-router` | [React Router adapter](/guide/adapters/react-router) |
| SvelteKit | `@yapyak/sveltekit` | [SvelteKit adapter](/guide/adapters/sveltekit) |
| TanStack Start | `@yapyak/tanstack-start` | [TanStack Start adapter](/guide/adapters/tanstack-start) |
| Other Vite SSR | `yapyak/adapter` subpath | [Custom adapter](/guide/adapters/custom) |

## UI bindings

The runtime ships `t()` and the raw locale API (`getLocale`, `setLocale`). For framework-aware features — reactive locale subscriptions, the `<RichText>` component — install the binding for your framework:

| Framework | Package | Provides |
|---|---|---|
| React | `@yapyak/react` | `useLocale()`, `<LocaleProvider>`, `<RichText>` |
| Vue | `@yapyak/vue` | `locale`, `<RichText>` |
| Svelte | `@yapyak/svelte` | `locale`, `<RichText>` |

If you only render static `t()` calls (no locale switching, no rich text), the runtime alone is enough.

## Switch language at runtime

Each framework binds locale state to its idiomatic primitive. See [Locales / Runtime](/guide/locales/runtime) for the full pattern per framework.

## Verify

{% code-group %}

```bash [npm]
npx yapyak status
```

```bash [pnpm]
pnpm yapyak status
```

```bash [bun]
bunx yapyak status
```

{% /code-group %}

Lists every locale, coverage per locale, missing entries.

## CI

Fail builds on missing translations:

{% code-group %}

```bash [npm]
npx yapyak check
```

```bash [pnpm]
pnpm yapyak check
```

```bash [bun]
bunx yapyak check
```

{% /code-group %}

Two common CI shapes:

**Pre-translate locally, commit `locales/*.json`.** No AI calls in CI. The build runs `yapyak check` and fails if anything's missing. Recommended for most projects — you don't ship credentials to your CI provider.

**Translate in CI.** Set your translator's API key as a CI secret. The build runs translation as part of `vite build`. Faster onboarding (no manual translate step) but every CI run hits the AI provider.

## What's next

- [How it works](/guide/getting-started/how-it-works) — the save-loop pipeline, position-aware renames, compile-time rewrite
- [Translations](/guide/translations/) — `t()` API, params, plurals, forced locale
- [Locales](/guide/locales/) — adding locales, persistence, reactive bindings
- [Translators](/guide/translators/) — Anthropic, OpenAI, Gemini, Ollama, custom
