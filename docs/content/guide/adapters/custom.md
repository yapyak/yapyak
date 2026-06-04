---
title: Custom
order: 7
---

`withRequest` ships in the `yapyak` package under the `yapyak/adapter` subpath — no extra install needed.

## Setup

If your Vite SSR setup isn't TanStack Start or SvelteKit, wrap each request with `withRequest()`.

```ts
import { withRequest } from 'yapyak/adapter';

function handler(request: Request): Response | Promise<Response> {
  return withRequest(request, () => renderApp(request));
}
```

`withRequest()` reads `Accept-Language` and `Cookie` from the `Request`, binds them to an async-scoped context, and runs the callback inside that scope. `getLocale()`, `t()`, and any other yapyak call inside the callback see this request's locale.

## What withRequest does

It uses Node's `AsyncLocalStorage.run()` for safe per-request isolation. Concurrent requests can't bleed locale state into each other. The callback's return value is forwarded.

```ts
withRequest<T>(request: Request, fn: () => T): T;
```

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
