---
order: 12
---

# React + TanStack Start

This is where yapyak shows off. TanStack Start gives you SSR with request-scoped headers via h3/AsyncLocalStorage, and yapyak's plugin auto-detects it. You write the same three imports and you're done — but now the first byte of HTML ships in the right language, every time.

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

The plugin sees `@tanstack/react-start` in your `package.json` and wires up `getRequestHeaders()` automatically. You don't write a single adapter line.

## __root.tsx

```tsx
import {
  createRootRoute,
  HeadContent,
  Outlet,
  Scripts,
} from '@tanstack/react-router';
import { getLocale, IntlProvider } from 'yapyak';

export const Route = createRootRoute({
  component: Component,
});

function Component() {
  return (
    <html lang={getLocale()} suppressHydrationWarning>
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

That's the entirety of the SSR wiring. `getLocale()` reads the cookie via TanStack's `getRequestHeaders()` on the server and `document.cookie` on the client. Same import, same call site, no `if (typeof window === 'undefined')` ceremony.

`<IntlProvider>` wraps `<Outlet />` (which is the route tree). Same rule as Vanilla: it goes *outside* the route components, so locale changes remount the subtree and `t()` calls re-evaluate.

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

Identical to Vanilla. The only difference is upstream — the locale is now established server-side from the request cookie.

## What you get for free

- **Right language from the first byte.** SSR HTML ships pre-rendered in the user's locale. No flash, no hydration mismatch (the cookie is the same source on server and client).
- **`Accept-Language` fallback.** First-time visitors with no cookie get their browser's preferred language if you opt in (`acceptLanguage: true` in plugin config).
- **Concurrent-safe.** Each request reads its own cookie via TanStack's request-scoped headers. Two users hitting the server simultaneously don't see each other's locale.

## Prerendered routes

If you have `prerender: true` in your TanStack config, those routes ship at build time without a request — so they always render in the default locale. The client takes over on hydration. If a Swedish user lands on a prerendered route, they'll see English for a frame before React swaps in. Three options if this matters:

1. Disable prerender for routes with translated content.
2. Prerender per-locale (`/sv/...`, `/en/...`) instead of relying on cookie.
3. Accept the flash. For most marketing sites, prerender is the bigger win and the flash is rare in practice.
