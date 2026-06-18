---
title: Custom
order: 7
---

`withResponse` ships in the `yapyak` package under the `yapyak/adapter` subpath — no extra install needed.

## Setup

If your Vite SSR setup isn't TanStack Start or SvelteKit, wrap each request with `withResponse()`.

```ts
import { withResponse } from 'yapyak/adapter';

function handler(request: Request): Promise<Response> {
  return withResponse(request, () => renderApp(request));
}
```

`withResponse()` reads `Accept-Language` and `Cookie` from the `Request`, binds them to an async-scoped context, runs the handler inside that scope, and drains any pending response headers (e.g. `Set-Cookie` from a server-side `setLocale()` call) onto the produced `Response` before returning it. `getLocale()`, `t()`, and any other yapyak call inside the handler see this request's locale.

## What withResponse does

It uses Node's `AsyncLocalStorage.run()` for safe per-request isolation. Concurrent requests can't bleed locale state into each other. After the handler returns, yapyak's pending response headers are merged onto the produced `Response`.

```ts
withResponse(
  request: Request,
  handler: () => Response | Promise<Response>,
): Promise<Response>;

withResponse<T>(
  request: Request,
  handler: () => T | Promise<T>,
  extractResponse: (result: T) => Response,
): Promise<T>;
```

Pass an `extractResponse` function when the handler returns a value that wraps the `Response` (e.g. TanStack Start's `{ response, ... }` middleware result).

## Set the page language

If your root component is a reactive framework binding (React/Vue/Svelte), read the locale there so it re-renders on change:

{% switch group="framework" %}

{% when value="react" %}
```tsx
import { useLocale } from '@yapyak/react';

function RootLayout() {
  const [locale] = useLocale();
  return <html lang={locale}>{/* ... */}</html>;
}
```
{% /when %}

{% when value="vue" %}
```vue
<script setup lang="ts">
import { locale } from '@yapyak/vue';
</script>

<template>
  <html :lang="locale">
    <!-- ... -->
  </html>
</template>
```
{% /when %}

{% when value="svelte" %}
```svelte
<script lang="ts">
  import { locale } from '@yapyak/svelte';
</script>

<svelte:element this="html" lang={$locale}>
  <!-- ... -->
</svelte:element>
```
{% /when %}

{% when value="astro" %}
Astro renders `<html>` server-side once per request. Read the locale via `getLocale()` from `yapyak` in your layout — see [Astro adapter](/guide/adapters/astro#set-the-page-language).
{% /when %}

{% /switch %}

If `<html>` is static HTML (no framework binding), enable `syncHtmlLang` and yapyak will keep `document.documentElement.lang` synced with the current locale:

```ts [yapyak.config.ts]
import { defineConfig } from 'yapyak/config';

export default defineConfig({
  syncHtmlLang: true,
});
```

## Cookie persistence

For SSR locale switching to work, enable cookie persistence:

```ts [yapyak.config.ts]
import { defineConfig } from 'yapyak/config';

export default defineConfig({
  persistence: 'cookie',
});
```

See [Locales / Persistence](/guide/locales/persistence).
