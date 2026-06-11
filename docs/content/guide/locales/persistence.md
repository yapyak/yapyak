---
title: Persistence
order: 3
---

Persistence controls where the user's chosen locale is stored between visits. The `persistence` field in `yapyak.config.ts` accepts one of four strategies: `'cookie'`, `'local-storage'`, `'url'`, or `'none'`. Pass a string for default options, or an object for fine-grained control.

## Strategies

| Strategy | Storage | SSR | Default key |
| --- | --- | --- | --- |
| `'cookie'` | HTTP cookie | readable server-side | `locale` |
| `'local-storage'` | `window.localStorage` | client-only | `locale` |
| `'url'` | URL path segment | readable from request URL | `/^[/](?<locale>[^/]+)/` |
| `'none'` | not persisted | n/a | n/a |

## Default

If you omit the field, the default is `'none'`. Locale lives in memory only and resets on reload. Pick one of the other three strategies if the user's choice should survive a page refresh.

```ts [yapyak.config.ts]
import { defineConfig } from 'yapyak/config';

export default defineConfig({
  defaultLocale: 'sv',
});
```

## Short form

Pass the strategy as a string to use default keys and patterns.

```ts [yapyak.config.ts]
import { defineConfig } from 'yapyak/config';

export default defineConfig({
  defaultLocale: 'sv',
  persistence: 'cookie',
});
```

## Options form

To override the cookie name, storage key, or URL pattern, pass an object with `type` plus the strategy-specific field.

```ts [yapyak.config.ts]
import { defineConfig } from 'yapyak/config';

export default defineConfig({
  defaultLocale: 'sv',
  persistence: { type: 'cookie', name: 'lang' },
});
```

### Cookie security

Set `secure: true` on the cookie strategy to add the `Secure` attribute, restricting the cookie to HTTPS contexts. Recommended for server-driven locale switching (e.g., a form POST that emits `Set-Cookie`).

```ts [yapyak.config.ts]
import { defineConfig } from 'yapyak/config';

export default defineConfig({
  defaultLocale: 'sv',
  persistence: { type: 'cookie', name: 'lang', secure: true },
});
```

Client-side `setLocale()` calls then work only when the page is served over HTTPS (or from `localhost`, which modern browsers exempt). On plain HTTP they silently fail — leave `secure: false` for HTTP-only deployments.

```ts [yapyak.config.ts]
import { defineConfig } from 'yapyak/config';

export default defineConfig({
  defaultLocale: 'sv',
  persistence: { type: 'local-storage', key: 'app-locale' },
});
```

```ts [yapyak.config.ts]
import { defineConfig } from 'yapyak/config';

export default defineConfig({
  defaultLocale: 'sv',
  persistence: { type: 'url', match: /^\/(?<locale>en|sv|fr)\//u },
});
```

## When to use which

### `'cookie'`

SSR locale switching. The server reads the cookie from the incoming request and renders the right locale on first paint. See [Astro](/guide/adapters/astro#cookie-persistence), [SvelteKit](/guide/adapters/sveltekit#cookie-persistence), [TanStack Start](/guide/adapters/tanstack-start), and [React Router](/guide/adapters/react-router#cookie-persistence) for adapter setup.

### `'local-storage'`

SPA with no SSR. Choice survives reloads with no server roundtrip. `setLocale()` is a no-op server-side and emits a dev-mode warning.

### `'url'`

SEO-friendly locale routes such as `/sv/about` and `/en/about`. Locale is part of the URL and the source of truth. `setLocale()` is a no-op; drive switches through router navigation.

### `'none'`

Locale resets every reload. Use for prototypes, or when locale comes from somewhere else per request (server headers, user profile, geo-IP).

## What gets read at runtime

Each strategy's normalized config is inlined into the runtime bundle at build time. There is no runtime branch on user-config. The chosen strategy is baked in by the Vite plugin.

`setLocale('sv')` writes through the configured strategy. `getLocale()` reads from the strategy on first call and caches in memory for the lifetime of the page.
