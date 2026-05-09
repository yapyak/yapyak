---
order: 12
---

# React + TanStack Start

This is where yapyak shows off. TanStack Start gives you SSR with request-scoped headers via h3/AsyncLocalStorage, and yapyak ships an adapter for it. The first byte of HTML lands in the right language, every time.

## vite.config.ts

```ts
import { tanstackStart } from '@tanstack/react-start/plugin/vite';
import { defineConfig, loadEnv } from 'vite';
import { yapyak } from 'yapyak/vite';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  return {
    plugins: [
      yapyak({
        adapter: 'tanstackStart',
        defaultLocale: 'en',
        locales: ['en', 'sv'],
        persistence: 'cookie',
        ai: {
          provider: 'anthropic',
          apiKey: env.ANTHROPIC_API_KEY,
          autoTranslate: true,
        },
      }),
      tanstackStart({ /* ... */ }),
    ],
  };
});
```

The `adapter: 'tanstackStart'` option tells the plugin to wire `setRequestSource()` to TanStack's `getRequestHeaders()` during SSR. No app-side code needed for that part.

## __root.tsx

```tsx
import {
  createRootRoute,
  HeadContent,
  Outlet,
  Scripts,
} from '@tanstack/react-router';
import { IntlProvider, useLocale } from 'yapyak';

export const Route = createRootRoute({
  component: Component,
});

function Component() {
  const [locale] = useLocale();
  return (
    <html lang={locale} suppressHydrationWarning>
      <head>
        <HeadContent />
      </head>
      <body>
        <IntlProvider>
          <Outlet />
        </IntlProvider>
        <Scripts />
      </body>
    </html>
  );
}
```

Two things compared to Vanilla:

1. **`useLocale()` in the root Component.** This is what keeps `<html lang>` reactive. Read on for why.
2. **`<IntlProvider>` wraps `<Outlet />`** (the route tree). Same rule as Vanilla — it goes *outside* the route components.

Notice there's no manual adapter import or wiring call. The plugin handles that via the `adapter: 'tanstackStart'` option.

## Keeping `<html lang>` in sync

Use `useLocale()` in the root Component so the lang attribute updates when the user switches locale:

```tsx
const [locale] = useLocale();
return <html lang={locale}>;
```

`useLocale()` subscribes via `useSyncExternalStore` — Component re-renders on every locale change, and `<html lang>` follows automatically.

### `getLocale()` vs `useLocale()`

- **`getLocale()`** — non-reactive read. Use it for one-off needs, server-side branching, anywhere you don't need re-render on change.
- **`useLocale()`** — reactive read. Use it when the value drives JSX that should update on locale switch.

For `<html lang>`, you want reactive. For a `<meta name="locale">` set once at first render, `getLocale()` is fine. The naming hints at it: hooks (`use*`) are reactive in React.

## In a route component

```tsx
// src/routes/home.tsx
import { createFileRoute } from '@tanstack/react-router';
import { t, useLocale } from 'yapyak';

export const Route = createFileRoute('/')({
  component: Home,
});

function Home() {
  const [locale, setLocale] = useLocale();
  return (
    <main>
      <h1>{t('Welcome to my site')}</h1>
      <button onClick={() => setLocale(locale === 'en' ? 'sv' : 'en')}>
        {locale.toUpperCase()}
      </button>
    </main>
  );
}
```

Identical to Vanilla. The locale is established upstream from the request cookie; this component just consumes and changes it.

## What you get for free

- **Right language from the first byte.** SSR HTML ships pre-rendered in the user's locale. The cookie is read via the adapter, the lang attribute is correct, the translations are correct, no hydration mismatch.
- **`Accept-Language` fallback.** First-time visitors with no cookie get their browser's preferred language if you opt in (`acceptLanguage: true` in plugin config).
- **Concurrent-safe.** Each request reads its own cookie via TanStack's request-scoped headers. Two users hitting the server simultaneously don't see each other's locale.

## Prerendered routes

If you have `prerender: true` in your TanStack config, those routes ship at build time without a request — so they always render in the default locale. The client takes over on hydration. If a Swedish user lands on a prerendered route, they'll see English for a frame before React swaps in.

Three options if this matters:

1. Disable prerender for routes with translated content.
2. Prerender per-locale (`/sv/...`, `/en/...`) instead of relying on cookie.
3. Accept the flash. For most marketing sites, prerender is the bigger win and the flash is rare in practice.
