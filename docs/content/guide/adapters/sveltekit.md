---
title: SvelteKit
order: 4
---

[SvelteKit](https://kit.svelte.dev) adapter for yapyak.

## Requirements

- Node.js 22.12 or later
- TypeScript 5 or later
- Vite 8 or later
- Svelte 5 or later
- SvelteKit 2 or later

## Install

{% switch group="packageManager" %}
{% when value="pnpm" %}
```bash
pnpm add @yapyak/sveltekit
```
{% /when %}
{% when value="npm" %}
```bash
npm install @yapyak/sveltekit
```
{% /when %}
{% when value="bun" %}
```bash
bun add @yapyak/sveltekit
```
{% /when %}
{% /switch %}

You also need yapyak, the Vite plugin, and the Svelte binding (covered in [Install](/guide/getting-started/installation)).

## Register the handle

The simplest setup re-exports the handle directly:

```ts [src/hooks.server.ts]
export { handle } from '@yapyak/sveltekit';
```

If you have other handles to compose, use SvelteKit's `sequence`:

```ts [src/hooks.server.ts]
import { sequence } from '@sveltejs/kit/hooks';
import { handle as yapyakHandle } from '@yapyak/sveltekit';
import { handle as authHandle } from './auth';

export const handle = sequence(yapyakHandle, authHandle);
```

`yapyakHandle` should run first so the request-bound locale is available to anything downstream.

## Setting `<html lang>`

The handle substitutes a `%yapyak.lang%` placeholder in `app.html` with the resolved locale on every request. Put the placeholder at the top of the file:

```html
<!-- src/app.html -->
<!DOCTYPE html>
<html lang="%yapyak.lang%">
  <head>
    <meta charset="utf-8" />
    <link rel="icon" href="%sveltekit.assets%/favicon.png" />
    <meta name="viewport" content="width=device-width" />
    %sveltekit.head%
  </head>
  <body data-sveltekit-preload-data="hover">
    <div style="display: contents">%sveltekit.body%</div>
  </body>
</html>
```

The handle replaces `%yapyak.lang%` with the active locale on every page render. `en`, `sv`, whatever the request resolved to. The browser, screen readers, and search engines see the right language hint immediately.

{% callout variant="info" %}
Placeholder substitution requires `%yapyak.lang%` to fall within a single streamed chunk. Placing it at the top of `app.html` (inside the first `<html>` tag) keeps it in the first chunk. Long head content that pushes the placeholder past a chunk boundary causes substitution to silently skip. Keep it early in the document.
{% /callout %}

## Register the processor

```ts [yapyak.config.ts]
import { defineConfig } from 'yapyak/config';
import { svelte } from '@yapyak/svelte/processor';

export default defineConfig({
  persistence: 'cookie',
  processors: [svelte()]
});
```

`persistence: 'cookie'` is the typical pairing for SvelteKit. The cookie is written client-side on `setLocale()` and read server-side by the handle on every request.

## Switching locale

Use the [`locale` rune](/guide/switching/switch) anywhere in a Svelte component:

```svelte
<script lang="ts">
  import { locale } from '@yapyak/svelte';
  import { t } from 'yapyak';
</script>

<button
  onclick={() => (locale.current = locale.current === 'en' ? 'sv' : 'en')}
>
  {t('Switch language')}
</button>
```

On click, the client store updates, the cookie writes, and every component that called `t()` re-renders.

## SSR-side `setLocale()`

If a server-side load function or form action calls `setLocale()` to update the user's preference, yapyak buffers the `Set-Cookie` write and the handle flushes it onto the outgoing response:

```ts [src/routes/settings/+page.server.ts]
import { setLocale } from 'yapyak';
import type { Actions } from './$types';

export const actions: Actions = {
  setLanguage: async ({ request }) => {
    const data = await request.formData();
    const locale = data.get('locale');
    if (typeof locale === 'string') { setLocale(locale); }
    return { success: true };
  }
};
```

The cookie is written automatically. You don't construct the `Set-Cookie` header yourself.

