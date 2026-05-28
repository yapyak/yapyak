---
title: Astro
order: 2
---

## Install

```bash
npm install @yapyak/astro
# or
pnpm add @yapyak/astro
```

## Setup

Add the integration to `astro.config.ts`.

```ts
// astro.config.ts
import { yapyak } from '@yapyak/astro';
import { defineConfig } from 'astro/config';

export default defineConfig({
  integrations: [yapyak()],
});
```

That's the entire wiring. The integration registers the build-time plugin and injects a per-request locale middleware that binds the incoming request — so `getLocale()` and `t()` resolve the right locale during rendering — and flushes any cookie written by a server-side `setLocale()` onto the response.

## Set the page language

Astro renders `<html>` once per page request as static HTML, not through a reactive framework binding. Server-side, read `getLocale()` in your layout:

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

Every navigation re-runs the middleware and re-renders the layout, so `<html lang>` is always correct on full page loads.

### Client-side locale switching (islands)

If a React/Vue/Svelte island calls `setLocale()` without triggering a navigation, the static `<html>` element doesn't re-render — the `lang` attribute stays stale.

Enable `syncHtmlLang` to make yapyak update the attribute on every `setLocale()`:

```ts
// yapyak.config.ts
import type { YapyakConfig } from 'yapyak';

export default {
  persistence: 'cookie',
  syncHtmlLang: true,
} satisfies YapyakConfig;
```

With this set, `document.documentElement.lang` follows the current locale on store init and on every `setLocale()`. SSR still renders the right `lang` via your layout's `getLocale()` — no hydration mismatch.

If you only switch locale via full navigations (e.g. `<a href="/sv/...">`), leave `syncHtmlLang` off.

## Cookie persistence

For SSR locale switching to work, enable cookie persistence:

```ts
// yapyak.config.ts
import type { YapyakConfig } from 'yapyak';

export default {
  persistence: 'cookie',
} satisfies YapyakConfig;
```

The cookie is written client-side on `setLocale()` and read server-side by the middleware on every request. See [Locales / Persistence](/guide/locales#persistence).
