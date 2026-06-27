---
title: Installation
order: 2
---

Install yapyak in your project.

{% picker group="framework" /%}

{% picker group="adapter" /%}

{% picker group="translator" /%}

{% picker group="packageManager" /%}

## Requirements

{% switch group="framework" %}

{% when value="react" %}
{% switch group="adapter" %}
{% when value="none" %}
- Node.js 22.12 or later
- TypeScript 5 or later
- Vite 8 or later
- React 19 or later
{% /when %}
{% when value="react-router" %}
- Node.js 22.22 or later
- TypeScript 5 or later
- Vite 8 or later
- React 19 or later
- React Router 7.9 or later
{% /when %}
{% when value="tanstack-start" %}
- Node.js 22.12 or later
- TypeScript 5 or later
- Vite 8 or later
- React 19 or later
- TanStack Start 1.168 or later
{% /when %}
{% /switch %}
{% /when %}

{% when value="vue" %}
- Node.js 22.12 or later
- TypeScript 5 or later
- Vite 8 or later
- Vue 3.4 or later
{% /when %}

{% when value="svelte" %}
{% switch group="adapter" %}
{% when value="none" %}
- Node.js 22.12 or later
- TypeScript 5 or later
- Vite 8 or later
- Svelte 5 or later
{% /when %}
{% when value="sveltekit" %}
- Node.js 22.12 or later
- TypeScript 5 or later
- Vite 8 or later
- Svelte 5 or later
- SvelteKit 2 or later
{% /when %}
{% /switch %}
{% /when %}

{% when value="astro" %}
- Node.js 22.12 or later
- TypeScript 5 or later
- Astro 7 or later
{% /when %}

{% /switch %}

## Install

{% only group="translator" value="ollama" %}
Install and run [Ollama](https://ollama.com/download), then pull a model:

```bash
ollama pull llama3.1
```
{% /only %}

{% switch group="framework" %}

{% when value="react" %}
{% switch group="adapter" %}
{% when value="none" %}
{% switch group="translator" %}
{% when value="none" %}
```bash
npm install yapyak @yapyak/vite @yapyak/react
```
{% /when %}
{% when value="anthropic" %}
```bash
npm install yapyak @yapyak/vite @yapyak/react @yapyak/anthropic
```
{% /when %}
{% when value="openai" %}
```bash
npm install yapyak @yapyak/vite @yapyak/react @yapyak/openai
```
{% /when %}
{% when value="gemini" %}
```bash
npm install yapyak @yapyak/vite @yapyak/react @yapyak/gemini
```
{% /when %}
{% when value="ollama" %}
```bash
npm install yapyak @yapyak/vite @yapyak/react @yapyak/ollama
```
{% /when %}
{% /switch %}
{% /when %}
{% when value="react-router" %}
{% switch group="translator" %}
{% when value="none" %}
```bash
npm install yapyak @yapyak/vite @yapyak/react @yapyak/react-router
```
{% /when %}
{% when value="anthropic" %}
```bash
npm install yapyak @yapyak/vite @yapyak/react @yapyak/react-router @yapyak/anthropic
```
{% /when %}
{% when value="openai" %}
```bash
npm install yapyak @yapyak/vite @yapyak/react @yapyak/react-router @yapyak/openai
```
{% /when %}
{% when value="gemini" %}
```bash
npm install yapyak @yapyak/vite @yapyak/react @yapyak/react-router @yapyak/gemini
```
{% /when %}
{% when value="ollama" %}
```bash
npm install yapyak @yapyak/vite @yapyak/react @yapyak/react-router @yapyak/ollama
```
{% /when %}
{% /switch %}
{% /when %}
{% when value="tanstack-start" %}
{% switch group="translator" %}
{% when value="none" %}
```bash
npm install yapyak @yapyak/vite @yapyak/react @yapyak/tanstack-start
```
{% /when %}
{% when value="anthropic" %}
```bash
npm install yapyak @yapyak/vite @yapyak/react @yapyak/tanstack-start @yapyak/anthropic
```
{% /when %}
{% when value="openai" %}
```bash
npm install yapyak @yapyak/vite @yapyak/react @yapyak/tanstack-start @yapyak/openai
```
{% /when %}
{% when value="gemini" %}
```bash
npm install yapyak @yapyak/vite @yapyak/react @yapyak/tanstack-start @yapyak/gemini
```
{% /when %}
{% when value="ollama" %}
```bash
npm install yapyak @yapyak/vite @yapyak/react @yapyak/tanstack-start @yapyak/ollama
```
{% /when %}
{% /switch %}
{% /when %}
{% /switch %}
{% /when %}

{% when value="vue" %}
{% switch group="translator" %}
{% when value="none" %}
```bash
npm install yapyak @yapyak/vite @yapyak/vue
```
{% /when %}
{% when value="anthropic" %}
```bash
npm install yapyak @yapyak/vite @yapyak/vue @yapyak/anthropic
```
{% /when %}
{% when value="openai" %}
```bash
npm install yapyak @yapyak/vite @yapyak/vue @yapyak/openai
```
{% /when %}
{% when value="gemini" %}
```bash
npm install yapyak @yapyak/vite @yapyak/vue @yapyak/gemini
```
{% /when %}
{% when value="ollama" %}
```bash
npm install yapyak @yapyak/vite @yapyak/vue @yapyak/ollama
```
{% /when %}
{% /switch %}
{% /when %}

{% when value="svelte" %}
{% switch group="adapter" %}
{% when value="none" %}
{% switch group="translator" %}
{% when value="none" %}
```bash
npm install yapyak @yapyak/vite @yapyak/svelte
```
{% /when %}
{% when value="anthropic" %}
```bash
npm install yapyak @yapyak/vite @yapyak/svelte @yapyak/anthropic
```
{% /when %}
{% when value="openai" %}
```bash
npm install yapyak @yapyak/vite @yapyak/svelte @yapyak/openai
```
{% /when %}
{% when value="gemini" %}
```bash
npm install yapyak @yapyak/vite @yapyak/svelte @yapyak/gemini
```
{% /when %}
{% when value="ollama" %}
```bash
npm install yapyak @yapyak/vite @yapyak/svelte @yapyak/ollama
```
{% /when %}
{% /switch %}
{% /when %}
{% when value="sveltekit" %}
{% switch group="translator" %}
{% when value="none" %}
```bash
npm install yapyak @yapyak/vite @yapyak/svelte @yapyak/sveltekit
```
{% /when %}
{% when value="anthropic" %}
```bash
npm install yapyak @yapyak/vite @yapyak/svelte @yapyak/sveltekit @yapyak/anthropic
```
{% /when %}
{% when value="openai" %}
```bash
npm install yapyak @yapyak/vite @yapyak/svelte @yapyak/sveltekit @yapyak/openai
```
{% /when %}
{% when value="gemini" %}
```bash
npm install yapyak @yapyak/vite @yapyak/svelte @yapyak/sveltekit @yapyak/gemini
```
{% /when %}
{% when value="ollama" %}
```bash
npm install yapyak @yapyak/vite @yapyak/svelte @yapyak/sveltekit @yapyak/ollama
```
{% /when %}
{% /switch %}
{% /when %}
{% /switch %}
{% /when %}

{% when value="astro" %}
{% switch group="translator" %}
{% when value="none" %}
```bash
npm install yapyak @yapyak/astro
```
{% /when %}
{% when value="anthropic" %}
```bash
npm install yapyak @yapyak/astro @yapyak/anthropic
```
{% /when %}
{% when value="openai" %}
```bash
npm install yapyak @yapyak/astro @yapyak/openai
```
{% /when %}
{% when value="gemini" %}
```bash
npm install yapyak @yapyak/astro @yapyak/gemini
```
{% /when %}
{% when value="ollama" %}
```bash
npm install yapyak @yapyak/astro @yapyak/ollama
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
{% switch group="translator" %}
{% when value="none" %}
```ts [yapyak.config.ts]
import { defineConfig } from 'yapyak/config';
import { react } from '@yapyak/react/processor';

export default defineConfig({
  processors: [react()]
});
```
{% /when %}
{% when value="anthropic" %}
```ts [yapyak.config.ts]
import { defineConfig } from 'yapyak/config';
import { anthropic } from '@yapyak/anthropic';
import { react } from '@yapyak/react/processor';

export default defineConfig({
  processors: [react()],
  translator: anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY,
  })
});
```
{% /when %}
{% when value="openai" %}
```ts [yapyak.config.ts]
import { defineConfig } from 'yapyak/config';
import { openai } from '@yapyak/openai';
import { react } from '@yapyak/react/processor';

export default defineConfig({
  processors: [react()],
  translator: openai({
    apiKey: process.env.OPENAI_API_KEY,
  })
});
```
{% /when %}
{% when value="gemini" %}
```ts [yapyak.config.ts]
import { defineConfig } from 'yapyak/config';
import { gemini } from '@yapyak/gemini';
import { react } from '@yapyak/react/processor';

export default defineConfig({
  processors: [react()],
  translator: gemini({
    apiKey: process.env.GEMINI_API_KEY,
  })
});
```
{% /when %}
{% when value="ollama" %}
```ts [yapyak.config.ts]
import { defineConfig } from 'yapyak/config';
import { ollama } from '@yapyak/ollama';
import { react } from '@yapyak/react/processor';

export default defineConfig({
  processors: [react()],
  translator: ollama()
});
```
{% /when %}
{% /switch %}
{% /when %}

{% when value="vue" %}
{% switch group="translator" %}
{% when value="none" %}
```ts [yapyak.config.ts]
import { defineConfig } from 'yapyak/config';
import { vue } from '@yapyak/vue/processor';

export default defineConfig({
  processors: [vue()]
});
```
{% /when %}
{% when value="anthropic" %}
```ts [yapyak.config.ts]
import { defineConfig } from 'yapyak/config';
import { anthropic } from '@yapyak/anthropic';
import { vue } from '@yapyak/vue/processor';

export default defineConfig({
  processors: [vue()],
  translator: anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY,
  })
});
```
{% /when %}
{% when value="openai" %}
```ts [yapyak.config.ts]
import { defineConfig } from 'yapyak/config';
import { openai } from '@yapyak/openai';
import { vue } from '@yapyak/vue/processor';

export default defineConfig({
  processors: [vue()],
  translator: openai({
    apiKey: process.env.OPENAI_API_KEY,
  })
});
```
{% /when %}
{% when value="gemini" %}
```ts [yapyak.config.ts]
import { defineConfig } from 'yapyak/config';
import { gemini } from '@yapyak/gemini';
import { vue } from '@yapyak/vue/processor';

export default defineConfig({
  processors: [vue()],
  translator: gemini({
    apiKey: process.env.GEMINI_API_KEY,
  })
});
```
{% /when %}
{% when value="ollama" %}
```ts [yapyak.config.ts]
import { defineConfig } from 'yapyak/config';
import { ollama } from '@yapyak/ollama';
import { vue } from '@yapyak/vue/processor';

export default defineConfig({
  processors: [vue()],
  translator: ollama()
});
```
{% /when %}
{% /switch %}
{% /when %}

{% when value="svelte" %}
{% switch group="translator" %}
{% when value="none" %}
```ts [yapyak.config.ts]
import { defineConfig } from 'yapyak/config';
import { svelte } from '@yapyak/svelte/processor';

export default defineConfig({
  processors: [svelte()]
});
```
{% /when %}
{% when value="anthropic" %}
```ts [yapyak.config.ts]
import { defineConfig } from 'yapyak/config';
import { anthropic } from '@yapyak/anthropic';
import { svelte } from '@yapyak/svelte/processor';

export default defineConfig({
  processors: [svelte()],
  translator: anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY,
  })
});
```
{% /when %}
{% when value="openai" %}
```ts [yapyak.config.ts]
import { defineConfig } from 'yapyak/config';
import { openai } from '@yapyak/openai';
import { svelte } from '@yapyak/svelte/processor';

export default defineConfig({
  processors: [svelte()],
  translator: openai({
    apiKey: process.env.OPENAI_API_KEY,
  })
});
```
{% /when %}
{% when value="gemini" %}
```ts [yapyak.config.ts]
import { defineConfig } from 'yapyak/config';
import { gemini } from '@yapyak/gemini';
import { svelte } from '@yapyak/svelte/processor';

export default defineConfig({
  processors: [svelte()],
  translator: gemini({
    apiKey: process.env.GEMINI_API_KEY,
  })
});
```
{% /when %}
{% when value="ollama" %}
```ts [yapyak.config.ts]
import { defineConfig } from 'yapyak/config';
import { ollama } from '@yapyak/ollama';
import { svelte } from '@yapyak/svelte/processor';

export default defineConfig({
  processors: [svelte()],
  translator: ollama()
});
```
{% /when %}
{% /switch %}
{% /when %}

{% when value="astro" %}
{% switch group="translator" %}
{% when value="none" %}
```ts [yapyak.config.ts]
import { defineConfig } from 'yapyak/config';
import { astro } from '@yapyak/astro/processor';

export default defineConfig({
  processors: [astro()]
});
```
{% /when %}
{% when value="anthropic" %}
```ts [yapyak.config.ts]
import { defineConfig } from 'yapyak/config';
import { anthropic } from '@yapyak/anthropic';
import { astro } from '@yapyak/astro/processor';

export default defineConfig({
  processors: [astro()],
  translator: anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY,
  })
});
```
{% /when %}
{% when value="openai" %}
```ts [yapyak.config.ts]
import { defineConfig } from 'yapyak/config';
import { openai } from '@yapyak/openai';
import { astro } from '@yapyak/astro/processor';

export default defineConfig({
  processors: [astro()],
  translator: openai({
    apiKey: process.env.OPENAI_API_KEY,
  })
});
```
{% /when %}
{% when value="gemini" %}
```ts [yapyak.config.ts]
import { defineConfig } from 'yapyak/config';
import { gemini } from '@yapyak/gemini';
import { astro } from '@yapyak/astro/processor';

export default defineConfig({
  processors: [astro()],
  translator: gemini({
    apiKey: process.env.GEMINI_API_KEY,
  })
});
```
{% /when %}
{% when value="ollama" %}
```ts [yapyak.config.ts]
import { defineConfig } from 'yapyak/config';
import { ollama } from '@yapyak/ollama';
import { astro } from '@yapyak/astro/processor';

export default defineConfig({
  processors: [astro()],
  translator: ollama()
});
```
{% /when %}
{% /switch %}
{% /when %}

{% /switch %}

Tell TypeScript about yapyak's generated types:

{% switch group="adapter" %}
{% when value="sveltekit" %}
```diff [src/app.d.ts]
+/// <reference path="../.yapyak/types.d.ts" />
```
{% /when %}
{% when value="none" %}
```diff [tsconfig.json]
 {
   "include": [
+    ".yapyak/types.d.ts"
   ]
 }
```
{% /when %}
{% when value="react-router" %}
```diff [tsconfig.json]
 {
   "include": [
+    ".yapyak/types.d.ts"
   ]
 }
```
{% /when %}
{% when value="tanstack-start" %}
```diff [tsconfig.json]
 {
   "include": [
+    ".yapyak/types.d.ts"
   ]
 }
```
{% /when %}
{% /switch %}

Ignore yapyak's cache directory:

```diff [.gitignore]
+.yapyak
```

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
