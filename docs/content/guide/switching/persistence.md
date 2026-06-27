---
title: Persistence
order: 3
---

Without persistence, the active locale lives only for the current page session. Close the tab and the choice is gone. yapyak ships four strategies for storing the user's pick somewhere it survives reloads: cookie, local storage, URL, or none.

```ts [yapyak.config.ts]
import { defineConfig } from 'yapyak/config';

export default defineConfig({
  persistence: 'cookie'
});
```

Each strategy also accepts a configuration object for customizing names, keys, or matching patterns.

## Cookie

The default for server-rendered apps. Two sides:

- **Write:** `setLocale()` writes the cookie. Client-side, that's `document.cookie`. Server-side (inside an SSR adapter), yapyak buffers a `Set-Cookie` header and flushes it onto the response.
- **Read:** the SSR adapter reads the cookie off the request on every render.

The same locale renders on both sides, so there's no hydration mismatch.

```ts
persistence: 'cookie',
```

Or with options:

```ts
persistence: {
  name: 'lang',
  secure: true,
  type: 'cookie'
},
```

| Option | Default | Purpose |
|---|---|---|
| `name` | `'locale'` | The cookie's name |
| `secure` | `false` | Marks the cookie `Secure`, restricting it to HTTPS contexts |

The cookie is set with `SameSite=Lax` and a long expiry. On a fresh browser, it's absent until the first `setLocale()` call. Until then, the active locale falls back to `defaultLocale` (or to [environment detection](/guide/getting-started/configuration#detectuserlocale) if enabled).

{% callout variant="info" %}
`secure: true` restricts the cookie to HTTPS-only contexts. On plain HTTP, client-side `setLocale()` writes silently fail because the browser refuses to set a secure cookie. Leave `secure` off for local development; enable it in production. The flag has no effect on `localhost` regardless.
{% /callout %}

## Local storage

Browser-only. The locale lives in `localStorage`, read once at startup and written on every `setLocale()`. There's no server involvement, so this strategy fits client-only apps (a plain Vite + React SPA without SSR).

```ts
persistence: 'local-storage',
```

Or with options:

```ts
persistence: {
  key: 'lang',
  type: 'local-storage'
},
```

| Option | Default | Purpose |
|---|---|---|
| `key` | `'locale'` | The `localStorage` key |

`localStorage` is per-origin and survives across tabs and sessions. On a fresh device, the key is absent until the first `setLocale()` call; the active locale starts at `defaultLocale`.

{% callout variant="warning" %}
Local storage isn't available during SSR. If your app server-renders, the server can't read the user's stored choice on the first request, so the initial render uses `defaultLocale`.

What the user sees: the page renders in the default locale, hydrates, the runtime reads `localStorage`, and the locale flips. That flip is a visible flash of the wrong language.

Use [cookie](#cookie) or [url](#url) persistence for server-rendered apps.
{% /callout %}

## URL

The locale lives in the URL, either as a path segment (`/sv/settings`) or as a query parameter (`?locale=sv`). It's read on every request by the middleware and on every navigation by the client.

```ts
persistence: 'url',
```

Or with a query-parameter matcher:

```ts
persistence: {
  match: /[?&]lang=(?<locale>[^&]+)/,
  type: 'url'
},
```

| Option | Default | Purpose |
|---|---|---|
| `match` | first path segment | A `RegExp` whose first capture group (named `locale` or positional `$1`) carries the locale string |

Without `match`, yapyak reads the first path segment. `/sv/settings` resolves to `'sv'` if `'sv'` is one of the locales you've added. Anything else falls through to `defaultLocale`.

With a `match` regex, you control where the locale lives. The example above pulls it from a `lang` query parameter, so URLs look like `/settings?lang=sv` instead of `/sv/settings`.

{% callout variant="info" %}
Calling `setLocale()` under URL persistence is a no-op — the URL itself carries the locale, so a programmatic switch needs a navigation. yapyak emits a `YAP0026` diagnostic when this happens.
{% /callout %}

## None

The default. The active locale lives only in memory for the current page session; switching it doesn't persist anywhere, and a refresh resets the locale to `defaultLocale`.

```ts
persistence: 'none',
```

Or omit the field entirely. `'none'` is the default.

Useful when you don't want persistence: a kiosk app, a development build, or a setup where another system (the URL path itself, a server-set user preference) carries the locale.

## Composing with `defaultLocale` and detection

Persistence sits at the top of the resolution chain: an explicit user choice always beats a guess. When no persisted value exists, yapyak falls back to environment detection (if enabled) and then to `defaultLocale`. See [Locale overview](/guide/switching/overview#where-the-active-locale-comes-from) for the full order.
