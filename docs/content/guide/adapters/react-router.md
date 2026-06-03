---
title: React Router
order: 4
---

## Install

{% code-group %}

```bash [npm]
npm install @yapyak/react-router
```

```bash [pnpm]
pnpm add @yapyak/react-router
```

```bash [bun]
bun add @yapyak/react-router
```

{% /code-group %}

## Setup

Register yapyak's middleware in your root route. React Router 7 framework mode required, with `v8_middleware` enabled.

## Enable middleware

In `react-router.config.ts`:

```ts
import type { Config } from '@react-router/dev/config';

export default {
  ssr: true,
  future: {
    v8_middleware: true,
  },
} satisfies Config;
```

## Wire the middleware

In `app/root.tsx`:

```tsx [app/root.tsx]
import type { Route } from './+types/root';
import { middleware as yapyakMiddleware } from '@yapyak/react-router';

export const middleware: Route.MiddlewareFunction[] = [yapyakMiddleware];
```

That's the entire wiring.

## Composing with other middlewares

The `middleware` export is an array. Add more middlewares to the same array — they run in order:

```tsx
export const middleware: Route.MiddlewareFunction[] = [
  yapyakMiddleware,
  authMiddleware,
  loggingMiddleware,
];
```

yapyak's middleware should run first so subsequent middlewares can read the locale via `getLocale()` if they need to.

## Set the page language

Read the locale via `useLocale()` inside your `Layout` to drive `<html lang>`, and wrap the routed tree in `LocaleProvider` so `t()` calls re-render when the locale changes — both on the server (per-request locale) and the client:

```tsx [app/root.tsx]
import type { ReactNode } from 'react';

import { Links, Meta, Outlet, Scripts, ScrollRestoration } from 'react-router';
import { LocaleProvider, useLocale } from '@yapyak/react';

export function Layout({ children }: { children: ReactNode }) {
  const [locale] = useLocale();
  return (
    <html lang={locale}>
      <head>
        <Meta />
        <Links />
      </head>
      <body>
        <LocaleProvider>{children}</LocaleProvider>
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}

export default function App() {
  return <Outlet />;
}
```

This is the recommended pattern. The `lang` attribute updates reactively, `LocaleProvider` re-renders the routed tree so `t()` returns the new locale's strings, and SSR renders the correct `lang` per request. No `syncHtmlLang` plugin option needed.

## Cookie persistence

For SSR locale switching to work, the user's choice must be readable by the server. Enable `persistence: 'cookie'`:

```ts [yapyak.config.ts]
import { defineConfig } from 'yapyak';

export default defineConfig({
  persistence: 'cookie',
});
```

The cookie is written client-side on `setLocale()` and read server-side by the middleware. See [Locales / Persistence](/guide/locales/persistence).

## Requirements

- `react-router >= 7.9.0` — middleware became stable here. Earlier versions used `unstable_middleware`-prefixed APIs.
- `future.v8_middleware: true` in `react-router.config.ts` — without this, the `middleware` export is ignored silently.
