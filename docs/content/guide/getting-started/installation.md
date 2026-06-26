---
title: Installation
order: 2
---

Install yapyak in your project.

{% picker group="framework" /%}

{% picker group="packageManager" /%}

## Requirements

{% switch group="framework" %}

{% when value="react" %}
- Node.js 22.12 or later
- TypeScript 5 or later
- Vite 8 or later
- React 19 or later
{% /when %}

{% when value="vue" %}
- Node.js 22.12 or later
- TypeScript 5 or later
- Vite 8 or later
- Vue 3.4 or later
{% /when %}

{% when value="svelte" %}
- Node.js 22.12 or later
- TypeScript 5 or later
- Vite 8 or later
- Svelte 5 or later
{% /when %}

{% when value="astro" %}
- Node.js 22.12 or later
- TypeScript 5 or later
- Astro 7 or later
{% /when %}

{% /switch %}

## Install

{% switch group="framework" %}

{% when value="react" %}
{% switch group="packageManager" %}
{% when value="pnpm" %}
```bash
pnpm add yapyak @yapyak/vite @yapyak/react
```
{% /when %}
{% when value="npm" %}
```bash
npm install yapyak @yapyak/vite @yapyak/react
```
{% /when %}
{% when value="bun" %}
```bash
bun add yapyak @yapyak/vite @yapyak/react
```
{% /when %}
{% /switch %}
{% /when %}

{% when value="vue" %}
{% switch group="packageManager" %}
{% when value="pnpm" %}
```bash
pnpm add yapyak @yapyak/vite @yapyak/vue
```
{% /when %}
{% when value="npm" %}
```bash
npm install yapyak @yapyak/vite @yapyak/vue
```
{% /when %}
{% when value="bun" %}
```bash
bun add yapyak @yapyak/vite @yapyak/vue
```
{% /when %}
{% /switch %}
{% /when %}

{% when value="svelte" %}
{% switch group="packageManager" %}
{% when value="pnpm" %}
```bash
pnpm add yapyak @yapyak/vite @yapyak/svelte
```
{% /when %}
{% when value="npm" %}
```bash
npm install yapyak @yapyak/vite @yapyak/svelte
```
{% /when %}
{% when value="bun" %}
```bash
bun add yapyak @yapyak/vite @yapyak/svelte
```
{% /when %}
{% /switch %}
{% /when %}

{% when value="astro" %}
{% switch group="packageManager" %}
{% when value="pnpm" %}
```bash
pnpm add yapyak @yapyak/astro
```
{% /when %}
{% when value="npm" %}
```bash
npm install yapyak @yapyak/astro
```
{% /when %}
{% when value="bun" %}
```bash
bun add yapyak @yapyak/astro
```
{% /when %}
{% /switch %}
{% /when %}

{% /switch %}

## Setup

Add the yapyak plugin to your build config:

{% switch group="framework" %}

{% when value="react" %}
```ts [vite.config.ts]
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { yapyak } from '@yapyak/vite';

export default defineConfig({
  plugins: [react(), yapyak()]
});
```
{% /when %}

{% when value="vue" %}
```ts [vite.config.ts]
import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import { yapyak } from '@yapyak/vite';

export default defineConfig({
  plugins: [vue(), yapyak()]
});
```
{% /when %}

{% when value="svelte" %}
```ts [vite.config.ts]
import { defineConfig } from 'vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';
import { yapyak } from '@yapyak/vite';

export default defineConfig({
  plugins: [svelte(), yapyak()]
});
```
{% /when %}

{% when value="astro" %}
```ts [astro.config.ts]
import { defineConfig } from 'astro/config';
import { yapyak } from '@yapyak/astro/integration';

export default defineConfig({
  integrations: [yapyak()]
});
```
{% /when %}

{% /switch %}

Add yapyak's own config:

{% switch group="framework" %}

{% when value="react" %}
```ts [yapyak.config.ts]
import { defineConfig } from 'yapyak/config';
import { react } from '@yapyak/react/processor';

export default defineConfig({
  processors: [react()]
});
```
{% /when %}

{% when value="vue" %}
```ts [yapyak.config.ts]
import { defineConfig } from 'yapyak/config';
import { vue } from '@yapyak/vue/processor';

export default defineConfig({
  processors: [vue()]
});
```
{% /when %}

{% when value="svelte" %}
```ts [yapyak.config.ts]
import { defineConfig } from 'yapyak/config';
import { svelte } from '@yapyak/svelte/processor';

export default defineConfig({
  processors: [svelte()]
});
```
{% /when %}

{% when value="astro" %}
```ts [yapyak.config.ts]
import { defineConfig } from 'yapyak/config';
import { astro } from '@yapyak/astro/processor';

export default defineConfig({
  processors: [astro()]
});
```
{% /when %}

{% /switch %}

Tell TypeScript about yapyak's generated types:

```json [tsconfig.json]
{ "include": ["src", ".yapyak/types.d.ts"] }
```

Ignore yapyak's cache directory:

```[.gitignore]
.yapyak
```

## Translator

If you'd like new strings to translate themselves on save, add a [translator](/guide/translators/overview). yapyak ships first-party support for Anthropic, OpenAI, Gemini, and Ollama. We'll use Anthropic as the example, but the install is the same shape for any of them:

{% switch group="packageManager" %}
{% when value="pnpm" %}
```bash
pnpm add @yapyak/anthropic
```
{% /when %}
{% when value="npm" %}
```bash
npm install @yapyak/anthropic
```
{% /when %}
{% when value="bun" %}
```bash
bun add @yapyak/anthropic
```
{% /when %}
{% /switch %}

Wire it into your `yapyak.config.ts`:

{% switch group="framework" %}

{% when value="react" %}
```ts [yapyak.config.ts]
import { defineConfig } from 'yapyak/config';
import { anthropic } from '@yapyak/anthropic';
import { react } from '@yapyak/react/processor';

export default defineConfig({
  processors: [react()],
  translator: anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
});
```
{% /when %}

{% when value="vue" %}
```ts [yapyak.config.ts]
import { defineConfig } from 'yapyak/config';
import { anthropic } from '@yapyak/anthropic';
import { vue } from '@yapyak/vue/processor';

export default defineConfig({
  processors: [vue()],
  translator: anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
});
```
{% /when %}

{% when value="svelte" %}
```ts [yapyak.config.ts]
import { defineConfig } from 'yapyak/config';
import { anthropic } from '@yapyak/anthropic';
import { svelte } from '@yapyak/svelte/processor';

export default defineConfig({
  processors: [svelte()],
  translator: anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
});
```
{% /when %}

{% when value="astro" %}
```ts [yapyak.config.ts]
import { defineConfig } from 'yapyak/config';
import { anthropic } from '@yapyak/anthropic';
import { astro } from '@yapyak/astro/processor';

export default defineConfig({
  processors: [astro()],
  translator: anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
});
```
{% /when %}

{% /switch %}

Without a translator, new strings sit as empty stubs in your locale files. Which works just as well if you'd rather fill them in yourself, or have your code agent (Claude, Cursor, etc.) do it.

## Add your first locale

Pick a target language and create its locale file in [`localesDir`](/guide/getting-started/configuration#localesdir) (`locales/` by default). Any [BCP 47 tag](/guide/locale/tags) works:

{% switch group="packageManager" %}
{% when value="pnpm" %}
```bash
pnpm yapyak add sv
```
{% /when %}
{% when value="npm" %}
```bash
npm run yapyak add sv
```
{% /when %}
{% when value="bun" %}
```bash
bun yapyak add sv
```
{% /when %}
{% /switch %}

This creates `locales/sv.json` and updates the `Locale` literal type. Run it again with any other tag whenever you want to add a language. See [`yapyak add`](/guide/cli/add) for the full set of options.

{% callout variant="tip" %}
Or create the file by hand. Drop `sv.json` into the folder and yapyak picks it up automatically.
{% /callout %}
