---
order: 32
---

# SvelteKit

SvelteKit gives you SSR with request-scoped state via `event.request.headers`. Yapyak ships an adapter that handles the wiring — set `adapter: 'sveltekit'` in the plugin and re-export `handle` from `hooks.server.ts`. The first byte of HTML lands in the right language.

## vite.config.ts

```ts
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';
import { yapyak } from 'yapyak/vite';

export default defineConfig({
  plugins: [
    yapyak({
      adapter: 'sveltekit',
      defaultLocale: 'en',
      framework: 'svelte',
      locales: ['en', 'sv'],
      persistence: 'cookie',
    }),
    sveltekit(),
  ],
});
```

The `adapter: 'sveltekit'` option tells the plugin to wire `setRequestSource()` to SvelteKit's `getRequestEvent()` during SSR. No app-side code needed for that part.

## hooks.server.ts

```ts
// src/hooks.server.ts
export { handle } from 'yapyak/adapters/sveltekit';
```

The handle reads the locale cookie at SSR time and substitutes `<html lang>` in the streamed HTML response. It expects a `%lang%` placeholder in your `app.html` — see the next section.

If you have your own handle, compose with `sequence`:

```ts
import { sequence } from '@sveltejs/kit/hooks';
import { handle as yapyakHandle } from 'yapyak/adapters/sveltekit';
import { authHandle } from './auth';

export const handle = sequence(yapyakHandle, authHandle);
```

## app.html

Add a `%lang%` placeholder on the root element:

```html
<!-- src/app.html -->
<!doctype html>
<html lang="%lang%">
  <head>
    %sveltekit.head%
  </head>
  <body data-sveltekit-preload-data="hover">
    <div style="display: contents">%sveltekit.body%</div>
  </body>
</html>
```

The placeholder follows SvelteKit's standard template-substitution pattern (the same mechanism `%sveltekit.head%` uses). `transformPageChunk` in the yapyak handle replaces it with the resolved locale per request — `en` for an English visitor, `sv` for a Swedish one, no flicker.

## In a route

```svelte
<!-- src/routes/+page.svelte -->
<script lang="ts">
  import { locale, t } from 'yapyak';
</script>

<h1>{t('Welcome to my site')}</h1>
<button onclick={() => (locale.current = locale.current === 'en' ? 'sv' : 'en')}>
  {locale.current.toUpperCase()}
</button>
```

Same usage as Vanilla. The locale singleton is the same; the difference is just that on the server, `getLocale()` knows about the request cookie.

## What you get for free

- **Right language from the first byte.** SSR HTML ships pre-rendered in the user's locale. The cookie is read via the adapter, the `<html lang>` attribute is correct, no hydration mismatch.
- **Concurrent-safe.** Each request reads its own cookie via SvelteKit's request-scoped event. Two users hitting the server simultaneously don't see each other's locale.
- **Configuration follows the plugin.** The cookie name and default locale you set in `vite.config.ts` flow through to the handle automatically — no duplication in `hooks.server.ts`.

