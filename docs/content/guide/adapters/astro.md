---
title: Astro
order: 2
---

Astro renders every page on the server. yapyak's Astro integration wires the per-request locale binding and the compile-time Vite plugin in one step, so the same `t()`, `getLocale()`, and `format.*` calls work in `.astro` frontmatter, in islands, and across navigations.

## Requirements

- Node.js 22 or later
- TypeScript 5 or later
- Astro 5 or later

## Install

{% switch group="pkg" %}
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

## Register the integration

```ts [astro.config.ts]
import { defineConfig } from 'astro/config';
import { yapyak } from '@yapyak/astro/integration';

export default defineConfig({
  integrations: [yapyak()],
});
```

The integration registers two things: yapyak's compile-time Vite plugin (so `t()` calls get extracted from your `.astro` files) and a per-request middleware (so `getLocale()` resolves correctly during render).

## Register the processor

```ts [yapyak.config.ts]
import { defineConfig } from 'yapyak/config';
import { astro } from '@yapyak/astro/processor';

export default defineConfig({
  persistence: 'cookie',
  processors: [astro()],
});
```

The Astro processor is what teaches yapyak how to read `.astro` frontmatter and template expressions. Pair it with `persistence: 'cookie'` for a typical SSR setup — the cookie is written client-side on `setLocale()` and read server-side on every request.

## Setting `<html lang>`

Astro renders `<html>` server-side once per page. Set `lang` in your layout by reading `getLocale()`:

```astro
---
// src/layouts/Layout.astro
import { getLocale } from 'yapyak';
---
<html lang={getLocale()}>
  <head>
    <slot name="head" />
  </head>
  <body>
    <slot />
  </body>
</html>
```

Every navigation re-runs the middleware and re-renders the layout, so `<html lang>` stays correct on full page loads.

## Client-side switching from inside an island

If a React/Vue/Svelte island calls `setLocale()` without triggering a navigation, the static `<html>` element doesn't re-render — the attribute stays at whatever the server rendered. Enable [`syncHtmlLang`](/guide/getting-started/configuration#synchtmllang) to update it on every client-side `setLocale()` call:

```ts [yapyak.config.ts]
export default defineConfig({
  persistence: 'cookie',
  processors: [astro()],
  syncHtmlLang: true,
});
```

With this set, `document.documentElement.lang` follows the active locale through every client-side switch. SSR still renders the right `lang` via your layout's `getLocale()`, so there's no hydration mismatch.

If you only switch locale through full navigations (`<a href="/sv/...">` style), leave `syncHtmlLang` off — Astro's normal re-render handles it.

## URL-based switching

The simplest pattern: read locale from the URL with [`persistence: 'url'`](/guide/locale/persistence#url). A plain link is enough:

```astro
---
import { getLocale, t } from 'yapyak';

const current = getLocale();
const next = current === 'en' ? 'sv' : 'en';
---

<a href={`?locale=${next}`}>{t('Switch language')}</a>
```

The middleware reads the URL on the next request, binds the locale, and the layout re-renders. No JS required.

## Cookie-based switching

For longer-lived preference: use [`persistence: 'cookie'`](/guide/locale/persistence#cookie). The client-side switch from an island (React/Vue/Svelte) calls `setLocale()`; the browser writes the cookie; subsequent server renders read it.

For a non-island server-side switch (a form POST to set the cookie from a server endpoint), call `setLocale()` inside the request handler — yapyak buffers the `Set-Cookie` write and flushes it onto the response when the page renders.

## `<RichText>` in `.astro` files

Rich-text rendering works the same way as in other frameworks — see [Rich text](/guide/writing/rich-text) for the Astro-specific slot pattern with `<RichText.Children />`.

## Common issues

- **`getLocale()` returns `defaultLocale` everywhere on the server.** The middleware isn't installed. Make sure `integrations: [yapyak()]` is in `astro.config.ts`.
- **A YAP0022 diagnostic fires.** Same cause: a render path is happening outside the per-request scope. Usually a custom server-side route or hook that bypasses the integration.
- **Cookie isn't set after a server-side `setLocale()`.** The handler returned a response before the integration flushed pending headers. Make sure your endpoint returns the response object the framework expects, not a manually-constructed one that bypasses the middleware chain.
