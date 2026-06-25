---
title: React Router
order: 3
---

`@yapyak/react-router` is the yapyak SSR adapter for [React Router](https://reactrouter.com) in framework mode. Drop it into your root route's middleware array and yapyak's per-request locale binding is wired across every loader, action, and component render.

Works with React Router v7 (7.9+) and v8.

## Requirements

- Node.js 22 or later
- TypeScript 5 or later
- Vite 6 or later
- React 19 or later
- React Router 7.9 or later

## Install

{% switch group="packageManager" %}
{% when value="pnpm" %}
```bash
pnpm add @yapyak/react-router
```
{% /when %}
{% when value="npm" %}
```bash
npm install @yapyak/react-router
```
{% /when %}
{% when value="bun" %}
```bash
bun add @yapyak/react-router
```
{% /when %}
{% /switch %}

You also need yapyak, the Vite plugin, and the React binding (covered in [Setup — Install](/guide/getting-started/installation)).

## Enable middleware in React Router

In v8, middleware is default — skip to [Register the middleware](#register-the-middleware) below.

In v7 (7.9+), middleware is opt-in. Turn it on in `react-router.config.ts`:

```ts [react-router.config.ts]
import type { Config } from '@react-router/dev/config';

export default {
  future: { v8_middleware: true }
} satisfies Config;
```

Without this flag, v7 ignores `middleware` exports on your routes. The flag was removed in v8 — middleware is always on there.

## Register the middleware

In your root route:

```tsx [app/root.tsx]
import type { Route } from './+types/root';
import { middleware as yapyakMiddleware } from '@yapyak/react-router';

export const middleware: Route.MiddlewareFunction[] = [yapyakMiddleware];
```

Add the export alongside your existing root layout and `Outlet`.

The middleware runs before every loader and component render, so anything called during the request (`getLocale()`, `t()`, `format.*`, server-side `setLocale()`) sees the right locale.

If you have other middleware, include it in the array. yapyak's middleware should run first so the locale is available to anything downstream:

```tsx
import { middleware as yapyakMiddleware } from '@yapyak/react-router';
import { middleware as authMiddleware } from './auth';

export const middleware: Route.MiddlewareFunction[] = [
  yapyakMiddleware,
  authMiddleware
];
```

## Setting `<html lang>`

In your root component, read `useLocale()` and pass it to `<html lang>`:

```tsx [app/root.tsx]
import { useLocale } from '@yapyak/react';

export default function Root() {
  const [locale] = useLocale();
  return (
    <html lang={locale}>
      <head>{/* … */}</head>
      <body>
        <Outlet />
      </body>
    </html>
  );
}
```

`useLocale()` reads the server-bound value during SSR and the client-side store after hydration, so the attribute is correct in both phases. No `syncHtmlLang` setting needed — the component re-renders on locale changes anyway.

## Configure yapyak

React Router projects keep source code under `app/`, not `src/`. Override yapyak's default `include` so it scans the right folder. Add `persistence: 'cookie'` so the middleware can read the locale on each request — without it, the request-bound locale falls back to `defaultLocale` (or to [`Accept-Language`](/guide/getting-started/configuration#detectuserlocale) detection if you've enabled `detectUserLocale: true`).

```ts [yapyak.config.ts]
import { defineConfig } from 'yapyak/config';
import { react } from '@yapyak/react/processor';

export default defineConfig({
  include: ['app'],
  persistence: 'cookie',
  processors: [react()]
});
```

The cookie is written client-side on `setLocale()` and read server-side by the middleware on the next request.

## Switching locale

Use [`useLocale()`](/guide/locale/switch) anywhere in your tree:

```tsx
import { useLocale } from '@yapyak/react';
import { t } from 'yapyak';

export function LanguageSwitcher() {
  const [locale, setLocale] = useLocale();

  return (
    <button onClick={() => setLocale(locale === 'en' ? 'sv' : 'en')}>
      {t('Switch language')}
    </button>
  );
}
```

On click, the client store updates, the cookie writes, and every component that called `t()` re-renders.

## React Server Components (experimental)

React Router shipped v8 on June 17, 2026 with RSC support marked unstable. The official [RSC docs](https://reactrouter.com/how-to/react-server-components) state that "React Server Components support is experimental and subject to breaking changes in minor/patch releases." React Router plans to stabilize RSC in a post-v8 minor.

If you opt into RSC, set `rsc: true` on the React processor. Server modules cannot host React hooks, and yapyak's `useYapyak()` injection would crash the build. The flag gates injection on the standard React [`'use client'`](https://react.dev/reference/rsc/use-client) directive — only files whose prologue declares it get the hook. Server modules still get `t()` lookups rewritten to synchronous `_pick()` calls; no hook is injected.

```ts [yapyak.config.ts]
import { defineConfig } from 'yapyak/config';
import { react } from '@yapyak/react/processor';

export default defineConfig({
  include: ['app'],
  persistence: 'cookie',
  processors: [react({ rsc: true })]
});
```

Wire the RR-RSC Vite plugin and its peer `@vitejs/plugin-rsc` into your `vite.config.ts`. The order matters: the RR plugin must come before `@vitejs/plugin-rsc`.

```ts [vite.config.ts]
import { unstable_reactRouterRSC as reactRouterRSC } from '@react-router/dev/vite';
import rsc from '@vitejs/plugin-rsc';
import { yapyak } from '@yapyak/vite';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [reactRouterRSC(), rsc(), yapyak()]
});
```

{% callout variant="warning" %}
Pin `@react-router/dev`, `@vitejs/plugin-rsc`, and `@yapyak/react` while RSC is unstable. The stack has already broken once across a `@vitejs/plugin-rsc` minor (RR issue [#14633](https://github.com/remix-run/react-router/issues/14633), fixed in 7.11.0). The `unstable_reactRouterRSC` plugin name will change when RR stabilizes the API — expect the import to be renamed in a future minor.
{% /callout %}

## Common issues

- **A YAP0022 diagnostic fires on the server.** The middleware isn't running on that route. It's either missing from the root route's `middleware` array, or — on v7 — `future.v8_middleware: true` is off in the config.
- **Locale resets to default on every request.** Persistence isn't configured. Add `persistence: 'cookie'` to your `yapyak.config.ts`.
- **`<html lang>` is wrong on first paint.** Read it through `useLocale()` in your root component rather than hardcoding it — the middleware provides the right value during SSR.
