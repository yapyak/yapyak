---
title: Astro
order: 2
---

Re-export yapyak's middleware as `onRequest` from `src/middleware.ts`.

```ts
// src/middleware.ts
export { middleware as onRequest } from 'yapyak/adapter/astro';
```

That's the entire wiring.

## Composing with other middlewares

If you have your own middlewares (auth, logging, etc.), compose with Astro's `sequence`:

```ts
// src/middleware.ts
import { sequence } from 'astro:middleware';
import { middleware as yapyakMiddleware } from 'yapyak/adapter/astro';
import { authMiddleware } from './auth';

export const onRequest = sequence(yapyakMiddleware, authMiddleware);
```

## Set the page language

Astro renders `<html>` once per page request as static HTML, not through a reactive framework binding. Server-side, read `getLocale()` in your layout:

```astro
---
// src/layouts/Layout.astro
import { getLocale } from 'yapyak';
const locale = getLocale();
---
<html lang={locale}>
  <head>
    <slot name="head" />
  </head>
  <body>
    <slot />
  </body>
</html>
```

Every navigation re-runs the middleware and re-renders the layout, so `<html lang>` is always correct on full page loads.

### Client-side locale switching (islands)

If a React/Vue/Svelte island calls `setLocale()` without triggering a navigation, the static `<html>` element doesn't re-render — the `lang` attribute stays stale.

Enable `syncHtmlLang` to make yapyak update the attribute on every `setLocale()`:

```ts
// vite.config.ts
yapyak({
  persistence: 'cookie',
  syncHtmlLang: true,
})
```

With this set, `document.documentElement.lang` follows the current locale on store init and on every `setLocale()`. SSR still renders the right `lang` via your layout's `getLocale()` — no hydration mismatch.

If you only switch locale via full navigations (e.g. `<a href="/sv/...">`), leave `syncHtmlLang` off.

## Cookie persistence

For SSR locale switching to work, enable cookie persistence:

```ts
// vite.config.ts
yapyak({
  persistence: 'cookie',
})
```

The cookie is written client-side on `setLocale()` and read server-side by the middleware on every request. See [Locales / Persistence](/guide/locales#persistence).
