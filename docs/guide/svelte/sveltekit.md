---
order: 32
---

# SvelteKit

SvelteKit gives you SSR with request-scoped state via `event.locals`. Yapyak doesn't auto-detect SvelteKit the way it does TanStack — but the wiring is one line in `hooks.server.ts`.

## vite.config.ts

```ts
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';
import { yapyak } from 'yapyak/vite';

export default defineConfig({
  plugins: [
    yapyak({
      defaultLocale: 'en',
      locales: ['en', 'sv'],
      persistence: 'cookie',
      framework: 'svelte',
    }),
    sveltekit(),
  ],
});
```

## Wiring the request cookie

::: warning Heads up
SvelteKit auto-wiring isn't shipped yet — this section is for the day it lands. For now, follow the manual pattern below.
:::

In `hooks.server.ts`, attach the cookie value to `event.locals` so it's available during SSR:

```ts
// src/hooks.server.ts
import type { Handle } from '@sveltejs/kit';

export const handle: Handle = async ({ event, resolve }) => {
  const cookie = event.cookies.get('locale');
  if (cookie) {
    event.locals.locale = cookie;
  }
  return resolve(event);
};
```

Then in your root layout, use the cookie value to seed `<html lang>`:

```svelte
<!-- src/routes/+layout.svelte -->
<script lang="ts">
  import { locale } from 'yapyak';
  let { children } = $props();
</script>

<svelte:head>
  <html lang={locale.current} />
</svelte:head>

{@render children()}
```

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

Same as Vanilla. The locale singleton is the same; the difference is just that on the server, `getLocale()` will know about the request cookie.

## Status

SvelteKit support in yapyak is "works if you wire it manually" right now. The pieces — request-scoped cookies, SSR-safe state, framework adapter — are all there. The auto-wiring (the kind we have for TanStack Start) is the missing piece. Help wanted.

If you're already using SvelteKit and run into edge cases, open an issue. We want this story to be as smooth as the TanStack one.
