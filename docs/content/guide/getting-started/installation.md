---
title: Installation
order: 2
---

Add yapyak to a Vite project. Pick your framework in the sidebar — the install command, the build-tool wiring and the processor differ. Everything below the install step is shared.

## Install

{% switch group="framework" %}

{% when value="react" %}

Install the runtime, the Vite plugin and the React binding:

{% switch group="pkg" %}
{% when value="npm" %}
```bash
npm install yapyak @yapyak/vite @yapyak/react
```
{% /when %}
{% when value="pnpm" %}
```bash
pnpm add yapyak @yapyak/vite @yapyak/react
```
{% /when %}
{% when value="bun" %}
```bash
bun add yapyak @yapyak/vite @yapyak/react
```
{% /when %}
{% /switch %}

Add the plugin to `vite.config.ts`:

```ts [vite.config.ts]
import { defineConfig } from 'vite';
import { yapyak } from '@yapyak/vite';

export default defineConfig({
  plugins: [yapyak()],
});
```

`.ts`/`.tsx` is handled by the built-in vanilla processor — no further wiring needed.

{% /when %}

{% when value="vue" %}

Install the runtime, the Vite plugin and the Vue binding:

{% switch group="pkg" %}
{% when value="npm" %}
```bash
npm install yapyak @yapyak/vite @yapyak/vue
```
{% /when %}
{% when value="pnpm" %}
```bash
pnpm add yapyak @yapyak/vite @yapyak/vue
```
{% /when %}
{% when value="bun" %}
```bash
bun add yapyak @yapyak/vite @yapyak/vue
```
{% /when %}
{% /switch %}

Add the plugin to `vite.config.ts`:

```ts [vite.config.ts]
import { defineConfig } from 'vite';
import { yapyak } from '@yapyak/vite';

export default defineConfig({
  plugins: [yapyak()],
});
```

Register the Vue processor in `yapyak.config.ts` so `.vue` files are scanned:

```ts [yapyak.config.ts]
import { vue } from '@yapyak/vue/processor';
import { defineConfig } from 'yapyak/config';

export default defineConfig({
  processors: [vue()],
});
```

{% /when %}

{% when value="svelte" %}

Install the runtime, the Vite plugin and the Svelte binding:

{% switch group="pkg" %}
{% when value="npm" %}
```bash
npm install yapyak @yapyak/vite @yapyak/svelte
```
{% /when %}
{% when value="pnpm" %}
```bash
pnpm add yapyak @yapyak/vite @yapyak/svelte
```
{% /when %}
{% when value="bun" %}
```bash
bun add yapyak @yapyak/vite @yapyak/svelte
```
{% /when %}
{% /switch %}

Add the plugin to `vite.config.ts`:

```ts [vite.config.ts]
import { defineConfig } from 'vite';
import { yapyak } from '@yapyak/vite';

export default defineConfig({
  plugins: [yapyak()],
});
```

Register the Svelte processor in `yapyak.config.ts` so `.svelte` files are scanned:

```ts [yapyak.config.ts]
import { svelte } from '@yapyak/svelte/processor';
import { defineConfig } from 'yapyak/config';

export default defineConfig({
  processors: [svelte()],
});
```

{% /when %}

{% when value="astro" %}

Install the runtime and the Astro integration — the integration brings the Vite plugin and the processor host along with it:

{% switch group="pkg" %}
{% when value="npm" %}
```bash
npm install yapyak @yapyak/astro
```
{% /when %}
{% when value="pnpm" %}
```bash
pnpm add yapyak @yapyak/astro
```
{% /when %}
{% when value="bun" %}
```bash
bun add yapyak @yapyak/astro
```
{% /when %}
{% /switch %}

Add the integration to `astro.config.ts` — it registers the Vite plugin and injects the per-request locale middleware:

```ts [astro.config.ts]
import { yapyak } from '@yapyak/astro/integration';
import { defineConfig } from 'astro/config';

export default defineConfig({
  integrations: [yapyak()],
});
```

Register the Astro processor in `yapyak.config.ts` so `.astro` files are scanned:

```ts [yapyak.config.ts]
import { astro } from '@yapyak/astro/processor';
import { defineConfig } from 'yapyak/config';

export default defineConfig({
  processors: [astro()],
});
```

{% /when %}

{% /switch %}

## Configure yapyak

Create `yapyak.config.ts` in the project root (merge with the processor registration above if it already exists):

```ts [yapyak.config.ts]
import { defineConfig } from 'yapyak/config';

export default defineConfig({
  persistence: 'cookie',
});
```

Bare minimum. Without a translator, new locale entries land as empty stubs you fill in yourself. To auto-translate on save, [pick a translator](#pick-a-translator) below.

## Ignore the `.yapyak/` directory

Yapyak writes local state (rename history, in-flight translations, generated types) to `.yapyak/` in your project root. It is per-developer working state and must not be committed.

```sh [.gitignore]
.yapyak/
```

## Wire up the generated types

Yapyak generates declaration files into `.yapyak/` for locale narrowing and other type augmentations. They need to be visible to TypeScript.

{% switch group="framework" %}

{% when value="react" %}

Add `.yapyak/types.d.ts` to the `include` array in `tsconfig.json`:

```json [tsconfig.json]
{
  "include": [".yapyak/types.d.ts", "src"]
}
```

{% /when %}

{% when value="vue" %}

Add `.yapyak/types.d.ts` to the `include` array in `tsconfig.json`:

```json [tsconfig.json]
{
  "include": [".yapyak/types.d.ts", "src"]
}
```

{% /when %}

{% when value="svelte" %}

SvelteKit owns its `tsconfig.json` (auto-generated under `.svelte-kit/`). Add a reference at the top of `src/app.d.ts` instead — same path, just a different syntax:

```ts [src/app.d.ts]
/// <reference path="../.yapyak/types.d.ts" />

declare global {
  namespace App {}
}

export {};
```

{% /when %}

{% when value="astro" %}

Add `.yapyak/types.d.ts` to the `include` array in `tsconfig.json`:

```json [tsconfig.json]
{
  "include": [".yapyak/types.d.ts", "src"]
}
```

{% /when %}

{% /switch %}

With this in place, yapyak's `Locale` type narrows to a literal union of your configured locales — `setLocale('xx')` becomes a TypeScript error, `useLocale()` returns the union, and `isLocale()` narrows arbitrary strings.

## Write your first translation

{% switch group="framework" %}

{% when value="react" %}

```tsx [SaveButton.tsx]
import { t } from 'yapyak';

export function SaveButton() {
  return <button>{t('Save changes')}</button>;
}
```

{% /when %}

{% when value="vue" %}

```vue [SaveButton.vue]
<script setup lang="ts">
import { t } from 'yapyak'
</script>

<template>
  <button>{{ t('Save changes') }}</button>
</template>
```

{% /when %}

{% when value="svelte" %}

```svelte [SaveButton.svelte]
<script lang="ts">
  import { t } from 'yapyak';
</script>

<button>{t('Save changes')}</button>
```

{% /when %}

{% when value="astro" %}

```astro [SaveButton.astro]
---
import { t } from 'yapyak';
---

<button>{t('Save changes')}</button>
```

{% /when %}

{% /switch %}

## Add a locale

{% switch group="pkg" %}
{% when value="npm" %}
```bash
npx yapyak add sv
```
{% /when %}
{% when value="pnpm" %}
```bash
pnpm yapyak add sv
```
{% /when %}
{% when value="bun" %}
```bash
bunx yapyak add sv
```
{% /when %}
{% /switch %}

Creates `locales/sv.json` and stubs every existing `t()` source string. Run with multiple at once:

{% switch group="pkg" %}
{% when value="npm" %}
```bash
npx yapyak add sv de es ja
```
{% /when %}
{% when value="pnpm" %}
```bash
pnpm yapyak add sv de es ja
```
{% /when %}
{% when value="bun" %}
```bash
bunx yapyak add sv de es ja
```
{% /when %}
{% /switch %}

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

For server-rendered apps. Skip if your app never renders on a server, or if you're on Astro — the Astro integration above already handles SSR.

| Framework | Package | Setup |
|---|---|---|
| React Router | `@yapyak/react-router` | [React Router adapter](/guide/adapters/react-router) |
| SvelteKit | `@yapyak/sveltekit` | [SvelteKit adapter](/guide/adapters/sveltekit) |
| TanStack Start | `@yapyak/tanstack-start` | [TanStack Start adapter](/guide/adapters/tanstack-start) |
| Other Vite SSR | `yapyak/adapter` subpath | [Custom adapter](/guide/adapters/custom) |

## Switch language at runtime

Each framework binds locale state to its idiomatic primitive. See [Locales / Runtime](/guide/locales/runtime) for the full pattern per framework.

## Verify

{% switch group="pkg" %}
{% when value="npm" %}
```bash
npx yapyak status
```
{% /when %}
{% when value="pnpm" %}
```bash
pnpm yapyak status
```
{% /when %}
{% when value="bun" %}
```bash
bunx yapyak status
```
{% /when %}
{% /switch %}

Lists every locale, coverage per locale, missing entries.

## CI

Fail builds on missing translations:

{% switch group="pkg" %}
{% when value="npm" %}
```bash
npx yapyak check
```
{% /when %}
{% when value="pnpm" %}
```bash
pnpm yapyak check
```
{% /when %}
{% when value="bun" %}
```bash
bunx yapyak check
```
{% /when %}
{% /switch %}

Two common CI shapes:

**Pre-translate locally, commit `locales/*.json`.** No AI calls in CI. The build runs `yapyak check` and fails if anything's missing. Recommended for most projects — you don't ship credentials to your CI provider.

**Translate in CI.** Set your translator's API key as a CI secret. The build runs translation as part of `vite build`. Faster onboarding (no manual translate step) but every CI run hits the AI provider.

## What's next

- [How it works](/guide/getting-started/how-it-works) — the save-loop pipeline, position-aware renames, compile-time rewrite
- [Translations](/guide/translations/) — `t()` API, params, plurals, forced locale
- [Locales](/guide/locales/) — adding locales, persistence, reactive bindings
- [Translators](/guide/translators/) — Anthropic, OpenAI, Gemini, Ollama, custom
