---
title: Installation
order: 2
---

{% switch group="framework" %}

{% when value="react" %}
We're going to add yapyak to a fresh Vite + React app and watch the first translation appear on screen. It takes about five minutes if you already have a project ready.

If you don't, this command will set one up for you:
{% /when %}

{% when value="vue" %}
We're going to add yapyak to a fresh Vite + Vue app and watch the first translation appear on screen. It takes about five minutes if you already have a project ready.

If you don't, this command will set one up for you:
{% /when %}

{% when value="svelte" %}
We're going to add yapyak to a fresh Vite + Svelte app and watch the first translation appear on screen. It takes about five minutes if you already have a project ready.

If you don't, this command will set one up for you:
{% /when %}

{% when value="astro" %}
We're going to add yapyak to a fresh Astro app and watch the first translation appear on screen. It takes about five minutes if you already have a project ready.

If you don't, this command will set one up for you:
{% /when %}

{% /switch %}

{% switch group="framework" %}

{% when value="react" %}
{% code-group %}
```bash [pnpm]
pnpm create vite my-app --template react-ts
```
```bash [npm]
npm create vite@latest my-app -- --template react-ts
```
```bash [bun]
bun create vite my-app --template react-ts
```
{% /code-group %}
{% /when %}

{% when value="vue" %}
{% code-group %}
```bash [pnpm]
pnpm create vite my-app --template vue-ts
```
```bash [npm]
npm create vite@latest my-app -- --template vue-ts
```
```bash [bun]
bun create vite my-app --template vue-ts
```
{% /code-group %}
{% /when %}

{% when value="svelte" %}
{% code-group %}
```bash [pnpm]
pnpm create vite my-app --template svelte-ts
```
```bash [npm]
npm create vite@latest my-app -- --template svelte-ts
```
```bash [bun]
bun create vite my-app --template svelte-ts
```
{% /code-group %}
{% /when %}

{% when value="astro" %}
{% code-group %}
```bash [pnpm]
pnpm create astro@latest my-app
```
```bash [npm]
npm create astro@latest my-app
```
```bash [bun]
bun create astro@latest my-app
```
{% /code-group %}
{% /when %}

{% /switch %}

The rest of this page assumes you've got the project up and a terminal open inside it.

## Install

{% switch group="framework" %}

{% when value="react" %}
You'll need three packages from yapyak: the runtime, the Vite plugin, and the React binding.

{% code-group %}
```bash [pnpm]
pnpm add yapyak @yapyak/vite @yapyak/react
```
```bash [npm]
npm install yapyak @yapyak/vite @yapyak/react
```
```bash [bun]
bun add yapyak @yapyak/vite @yapyak/react
```
{% /code-group %}
{% /when %}

{% when value="vue" %}
You'll need three packages from yapyak: the runtime, the Vite plugin, and the Vue binding.

{% code-group %}
```bash [pnpm]
pnpm add yapyak @yapyak/vite @yapyak/vue
```
```bash [npm]
npm install yapyak @yapyak/vite @yapyak/vue
```
```bash [bun]
bun add yapyak @yapyak/vite @yapyak/vue
```
{% /code-group %}
{% /when %}

{% when value="svelte" %}
You'll need three packages from yapyak: the runtime, the Vite plugin, and the Svelte binding.

{% code-group %}
```bash [pnpm]
pnpm add yapyak @yapyak/vite @yapyak/svelte
```
```bash [npm]
npm install yapyak @yapyak/vite @yapyak/svelte
```
```bash [bun]
bun add yapyak @yapyak/vite @yapyak/svelte
```
{% /code-group %}
{% /when %}

{% when value="astro" %}
For Astro you only need two packages — the runtime and the Astro integration. The integration brings the Vite plugin along with it:

{% code-group %}
```bash [pnpm]
pnpm add yapyak @yapyak/astro
```
```bash [npm]
npm install yapyak @yapyak/astro
```
```bash [bun]
bun add yapyak @yapyak/astro
```
{% /code-group %}
{% /when %}

{% /switch %}

That's the i18n side. If you'd like new translations to appear on save instead of staying empty until you fill them in yourself, you'll also want a translator. Anthropic, OpenAI, Gemini, and Ollama all ship as small packages — we'll use Anthropic in this walkthrough, but pick whichever provider you have a key for:

{% code-group %}
```bash [pnpm]
pnpm add @yapyak/anthropic
```
```bash [npm]
npm install @yapyak/anthropic
```
```bash [bun]
bun add @yapyak/anthropic
```
{% /code-group %}

The translator is optional. yapyak works without one — new strings just sit as empty stubs in your locale files until something fills them in.

## Wire it up

Two small files.

{% switch group="framework" %}

{% when value="react" %}
First, drop the yapyak plugin into your `vite.config.ts`, next to `@vitejs/plugin-react`:

```ts
// vite.config.ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { yapyak } from '@yapyak/vite';

export default defineConfig({
  plugins: [react(), yapyak()],
});
```
{% /when %}

{% when value="vue" %}
First, drop the yapyak plugin into your `vite.config.ts`, next to `@vitejs/plugin-vue`:

```ts
// vite.config.ts
import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import { yapyak } from '@yapyak/vite';

export default defineConfig({
  plugins: [vue(), yapyak()],
});
```
{% /when %}

{% when value="svelte" %}
First, drop the yapyak plugin into your `vite.config.ts`, next to `@sveltejs/vite-plugin-svelte`:

```ts
// vite.config.ts
import { defineConfig } from 'vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';
import { yapyak } from '@yapyak/vite';

export default defineConfig({
  plugins: [svelte(), yapyak()],
});
```
{% /when %}

{% when value="astro" %}
First, add the yapyak integration to your `astro.config.ts`. It registers the build-time plugin and a per-request middleware in one step:

```ts
// astro.config.ts
import { defineConfig } from 'astro/config';
import { yapyak } from '@yapyak/astro/integration';

export default defineConfig({
  integrations: [yapyak()],
});
```
{% /when %}

{% /switch %}

Then create a `yapyak.config.ts` at the project root. This is yapyak's own config — it tells the build which locales you're shipping, what your source language is, which file types to scan, and how to reach your translator if you've added one:

{% switch group="framework" %}

{% when value="react" %}
```ts
// yapyak.config.ts
import { defineConfig } from 'yapyak/config';
import { react } from '@yapyak/react/processor';
import { anthropic } from '@yapyak/anthropic';

export default defineConfig({
  defaultLocale: 'en',
  processors: [react()],
  translator: anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY,
  }),
});
```
{% /when %}

{% when value="vue" %}
```ts
// yapyak.config.ts
import { defineConfig } from 'yapyak/config';
import { vue } from '@yapyak/vue/processor';
import { anthropic } from '@yapyak/anthropic';

export default defineConfig({
  defaultLocale: 'en',
  processors: [vue()],
  translator: anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY,
  }),
});
```
{% /when %}

{% when value="svelte" %}
```ts
// yapyak.config.ts
import { defineConfig } from 'yapyak/config';
import { svelte } from '@yapyak/svelte/processor';
import { anthropic } from '@yapyak/anthropic';

export default defineConfig({
  defaultLocale: 'en',
  processors: [svelte()],
  translator: anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY,
  }),
});
```
{% /when %}

{% when value="astro" %}
```ts
// yapyak.config.ts
import { defineConfig } from 'yapyak/config';
import { astro } from '@yapyak/astro/processor';
import { anthropic } from '@yapyak/anthropic';

export default defineConfig({
  defaultLocale: 'en',
  persistence: 'url',
  processors: [astro()],
  translator: anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY,
  }),
});
```
{% /when %}

{% /switch %}

Two last bits of housekeeping. Tell TypeScript about the types yapyak generates, so your editor knows the set of locales you've configured:

```json
// tsconfig.json
{
  "include": ["src", ".yapyak/types.d.ts"]
}
```

And ignore yapyak's cache directory:

```
# .gitignore
.yapyak
```

That's everything. The setup ends here.

## Add a locale

Pick a language to translate into. We'll use Swedish for this walkthrough — pick whichever you like, any [BCP 47 tag](/guide/locale/tags) works.

{% code-group %}
```bash [pnpm]
pnpm yapyak add sv
```
```bash [npm]
npm run yapyak add sv
```
```bash [bun]
bun yapyak add sv
```
{% /code-group %}

This creates `locales/sv.json` and tells TypeScript about the new locale. Run it again with another tag whenever you want to add one.

## Your first translation

{% switch group="framework" %}

{% when value="react" %}
Now the part you're here for. Pick any component and wrap a piece of text with `t()`:
{% /when %}

{% when value="vue" %}
Now the part you're here for. Pick any component and wrap a piece of text with `t()`:
{% /when %}

{% when value="svelte" %}
Now the part you're here for. Pick any component and wrap a piece of text with `t()`:
{% /when %}

{% when value="astro" %}
Now the part you're here for. Open any page and wrap a piece of text with `t()`:
{% /when %}

{% /switch %}

{% switch group="framework" %}

{% when value="react" %}
```tsx
import { t } from 'yapyak';

export function App() {
  return <h1>{t('Welcome to my shop')}</h1>;
}
```
{% /when %}

{% when value="vue" %}
```vue
<script setup lang="ts">
import { t } from 'yapyak';
</script>

<template>
  <h1>{{ t('Welcome to my shop') }}</h1>
</template>
```
{% /when %}

{% when value="svelte" %}
```svelte
<script lang="ts">
  import { t } from 'yapyak';
</script>

<h1>{t('Welcome to my shop')}</h1>
```
{% /when %}

{% when value="astro" %}
```astro
---
import { t } from 'yapyak';
---

<h1>{t('Welcome to my shop')}</h1>
```
{% /when %}

{% /switch %}

Start the dev server:

{% code-group %}
```bash [pnpm]
pnpm dev
```
```bash [npm]
npm run dev
```
```bash [bun]
bun dev
```
{% /code-group %}

Open the page in your browser. You'll see "Welcome to my shop" — that's your source language, rendered as-is. Behind the scenes, yapyak has already noticed the new string and added an empty stub for it to `locales/sv.json`.

If you've wired up a translator, give it a second or two. The stub fills itself in. Open `locales/sv.json` and you'll find an entry for the file you just edited, keyed by its path:

{% switch group="framework" %}

{% when value="react" %}
```json
{
  "src/App.tsx": {
    "Welcome to my shop": "Välkommen till min butik"
  }
}
```
{% /when %}

{% when value="vue" %}
```json
{
  "src/App.vue": {
    "Welcome to my shop": "Välkommen till min butik"
  }
}
```
{% /when %}

{% when value="svelte" %}
```json
{
  "src/App.svelte": {
    "Welcome to my shop": "Välkommen till min butik"
  }
}
```
{% /when %}

{% when value="astro" %}
```json
{
  "src/pages/index.astro": {
    "Welcome to my shop": "Välkommen till min butik"
  }
}
```
{% /when %}

{% /switch %}

{% callout variant="tip" %}
If the stub isn't filling in, the most common cause is a missing API key. Make sure `ANTHROPIC_API_KEY` (or the equivalent for your provider) is in your shell environment when you start the dev server, or load it from a `.env` file.
{% /callout %}

English is still the active locale, so the heading hasn't changed in the browser. We need to flip it.

## Switching locale

Reading and changing the active locale works a little differently in each framework, but they all come down to the same idea: there's a locale value that components read, and changing it makes anything that calls `t()` render in the new locale.

{% switch group="framework" %}

{% when value="react" %}
React gets a `useLocale` hook that returns the current locale and a setter, like a `useState` you happen to share with the rest of the app:

```tsx
import { useLocale } from '@yapyak/react';
import { t } from 'yapyak';

export function App() {
  const [locale, setLocale] = useLocale();

  return (
    <>
      <h1>{t('Welcome to my shop')}</h1>
      <button onClick={() => setLocale(locale === 'en' ? 'sv' : 'en')}>
        {t('Switch language')}
      </button>
    </>
  );
}
```
{% /when %}

{% when value="vue" %}
Vue exports a reactive `locale` ref. Read it like any other ref, and assign to it to switch:

```vue
<script setup lang="ts">
import { locale } from '@yapyak/vue';
import { t } from 'yapyak';
</script>

<template>
  <h1>{{ t('Welcome to my shop') }}</h1>
  <button @click="locale = locale === 'en' ? 'sv' : 'en'">
    {{ t('Switch language') }}
  </button>
</template>
```
{% /when %}

{% when value="svelte" %}
Svelte exports a `locale` object with a `current` property — reading it tracks the active locale, and assigning to it switches:

```svelte
<script lang="ts">
  import { locale } from '@yapyak/svelte';
  import { t } from 'yapyak';
</script>

<h1>{t('Welcome to my shop')}</h1>
<button
  onclick={() => (locale.current = locale.current === 'en' ? 'sv' : 'en')}
>
  {t('Switch language')}
</button>
```
{% /when %}

{% when value="astro" %}
Astro renders on the server, so switching happens through a navigation rather than a client-side event. With `persistence: 'url'` set in your config, the locale rides on the URL — a plain link is enough:

```astro
---
import { getLocale, t } from 'yapyak';

const current = getLocale();
const next = current === 'en' ? 'sv' : 'en';
---

<h1>{t('Welcome to my shop')}</h1>
<a href={`?locale=${next}`}>{t('Switch language')}</a>
```
{% /when %}

{% /switch %}

{% switch group="framework" %}
{% when value="astro" %}
Click the link. The page navigates to itself with the new locale, the middleware picks it up, and the layout re-renders with the translated copy. If "Switch language" hadn't been translated yet, save the page once and the model fills it in.
{% /when %}
{% when value="react" %}
Click the button. The heading switches over, and the button label with it. If "Switch language" hadn't been translated yet, you'd watch it fill in over the next second — yapyak picks up new strings as you type them and asks the model right then.
{% /when %}
{% when value="vue" %}
Click the button. The heading switches over, and the button label with it. If "Switch language" hadn't been translated yet, you'd watch it fill in over the next second — yapyak picks up new strings as you type them and asks the model right then.
{% /when %}
{% when value="svelte" %}
Click the button. The heading switches over, and the button label with it. If "Switch language" hadn't been translated yet, you'd watch it fill in over the next second — yapyak picks up new strings as you type them and asks the model right then.
{% /when %}
{% /switch %}

## Server-rendered apps

If your project renders on the server — SvelteKit, TanStack Start, React Router (framework mode), or Astro — there's a per-request locale binding to set up so `getLocale()` resolves to the right value during render. For Astro this happens automatically through the integration above. For the others, see [Adapters](/guide/adapters/overview).

## React Server Components

If you're working with React Server Components, the React processor takes an optional `rsc` flag:

```ts
processors: [react({ rsc: true })],
```

With `rsc: true`, only files marked `'use client'` get the locale subscription hook injected. Server components still have their `t()` calls rewritten, but they read the request-bound locale from the SSR adapter instead of subscribing to a store.

## Building for a single locale

For static deploys that serve one locale per artifact, pass `fixedLocale` to the Vite plugin (or set `YAPYAK_LOCALE` in the environment):

```ts
// vite.config.ts
yapyak({ fixedLocale: 'sv' }),
```

yapyak inlines that locale's strings as literals at build time, tree-shakes the picker, and the bundle ships with no i18n runtime at all. See [Configuration — `fixedLocale`](/guide/getting-started/configuration#fixed-locale-builds) for details.

## A different framework

yapyak doesn't have to know about your framework out of the box. If you're on a format the shipped processors don't cover, you can build a custom one using `createProcessor` from `yapyak/processor`. The function takes the file extensions to claim, an optional fragment parser that splits your format into TypeScript-readable pieces, and the runtime module yapyak should wire into compiled output. The result drops into the same `processors: [...]` array as the built-in ones.

## Where to go from here

That's the loop in five minutes: write, save, switch. From here you can keep going wider or deeper, whichever you need:

- [Writing](/guide/writing/basics) — `t()` is more than a function call. Placeholders, plurals, select, and rich text are all on the table.
- [Translators](/guide/translators/overview) — voice and glossary are the two biggest knobs for shaping how the model writes. They're worth ten minutes of reading.
- [Locale](/guide/locale/persistence) — keep the user's choice across reloads through cookies, URL, or local storage.
- [Adapters](/guide/adapters/overview) — if your app renders on the server, the locale needs a per-request scope. There's an adapter for each major SSR framework.

But honestly, the best next step is to add another component, save, and watch yapyak keep up.
