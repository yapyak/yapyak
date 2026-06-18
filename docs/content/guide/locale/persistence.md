---
title: Persistence
order: 3
---

Without persistence, the active locale lives only for the current page session — close the tab and the choice is gone. yapyak ships four strategies for storing the user's pick somewhere it survives reloads: cookie, local storage, URL, or none.

```ts [yapyak.config.ts]
import { defineConfig } from 'yapyak/config';

export default defineConfig({
  persistence: 'cookie',
});
```

That's the shorthand. Each strategy also accepts a configuration object for customizing names, keys, or matching patterns.

## Cookie

The default for server-rendered apps. The cookie is written client-side when `setLocale()` is called, and read server-side by the middleware on every request — so the same locale renders on both sides without a hydration mismatch.

```ts
persistence: 'cookie',
// or with options:
persistence: { type: 'cookie', name: 'lang', secure: true },
```

| Option | Default | Purpose |
|---|---|---|
| `name` | `'locale'` | The cookie's name |
| `secure` | `false` | Marks the cookie `Secure`, restricting it to HTTPS contexts |

The cookie is set with `SameSite=Lax` and a long expiry. On a fresh browser, it's absent until the first `setLocale()` call — until then, the active locale falls back to `defaultLocale` (or to [`Accept-Language`](/guide/getting-started/configuration#detectacceptlanguage) detection if enabled).

{% callout variant="info" %}
`secure: true` restricts the cookie to HTTPS-only contexts. On plain HTTP, client-side `setLocale()` writes will silently fail — the browser refuses to set a secure cookie. Leave `secure` off for local development; enable it in production. The flag has no effect on `localhost` regardless.
{% /callout %}

Use cookie persistence whenever your app renders on the server and you want a single source of truth that's available to both the request handler and the client runtime. See [SSR](/guide/adapters/overview) for the per-framework adapter setup.

## Local storage

Browser-only. The locale lives in `localStorage`, read once at startup and written on every `setLocale()`. There's no server involvement, so this strategy fits client-only apps — a plain Vite + React SPA without SSR.

```ts
persistence: 'local-storage',
// or with options:
persistence: { type: 'local-storage', key: 'lang' },
```

| Option | Default | Purpose |
|---|---|---|
| `key` | `'locale'` | The `localStorage` key |

`localStorage` is per-origin and survives across tabs and sessions. On a fresh device, the key is absent until the first `setLocale()` call — the active locale starts at `defaultLocale`.

{% callout variant="warning" %}
Local storage isn't available during SSR. If your app server-renders, the server has no way to read the user's stored choice on the first request, and the initial render will be in `defaultLocale`. The page then hydrates and the runtime reads `localStorage` and triggers a re-render in the right locale — visible as a flash of the wrong language. Use [cookie](#cookie) or [url](#url) persistence for server-rendered apps.
{% /callout %}

## URL

The locale lives in the URL, either as a path segment (`/sv/settings`) or as a query parameter (`?locale=sv`). It's read on every request by the middleware and on every navigation by the client.

```ts
persistence: 'url',
// or with a query-parameter matcher:
persistence: {
  type: 'url',
  match: /[?&]lang=(?<locale>[^&]+)/,
},
```

| Option | Default | Purpose |
|---|---|---|
| `match` | first path segment | A `RegExp` whose first capture group (named `locale` or positional `$1`) carries the locale string |

Without `match`, yapyak reads the first path segment — `/sv/settings` resolves to `'sv'` if `'sv'` is one of the locales you've added. Anything else falls through to `defaultLocale`.

With a `match` regex, you control where the locale lives. The example above pulls it from a `lang` query parameter, so URLs look like `/settings?lang=sv` instead of `/sv/settings`.

URL persistence is the right choice when:

- The locale should be shareable through a link (a Swedish reader sends the page URL and the recipient sees Swedish too)
- You're SEO-sensitive and want per-locale URLs for search engines to index
- Your routing already has locale-prefixed paths

It's the wrong choice when:

- The locale is a personal preference that shouldn't show up in every URL
- You don't want every link to grow a parameter

## None

The default. The active locale lives only in memory for the current page session — switching it doesn't persist anywhere. A refresh resets the locale to `defaultLocale`.

```ts
persistence: 'none',  // or just omit the field entirely
```

Useful when you genuinely don't want persistence — a kiosk app, a development build, or a setup where another system (the URL path itself, a server-set user preference) carries the locale.

## Composing with `defaultLocale` and `Accept-Language`

The active locale on a fresh visit is resolved in order:

1. **Persisted value**, if any. Cookie, local-storage entry, or URL match.
2. **[`Accept-Language` header](/guide/getting-started/configuration#detectacceptlanguage)**, if `detectAcceptLanguage: true` and the request includes one.
3. **`defaultLocale`** from your config.

The first match wins. Persistence is checked first because an explicit user choice always beats a guess.
