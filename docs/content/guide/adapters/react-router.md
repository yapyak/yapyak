---
title: React Router
order: 3
---

`@yapyak/react-router` is the yapyak SSR adapter for [React Router](https://reactrouter.com) v7 in framework mode. Drop it into your root route's middleware array and yapyak's per-request locale binding is wired across every loader, action, and component render.

## Install

{% switch group="pkg" %}
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

React Router v7 middleware is opt-in. Turn it on in `react-router.config.ts`:

```ts [react-router.config.ts]
import type { Config } from '@react-router/dev/config';

export default {
  future: {
    v8_middleware: true,
  },
} satisfies Config;
```

Without this flag, the framework ignores `middleware` exports on your routes.

## Register the middleware

In your root route:

```tsx [app/root.tsx]
import type { Route } from './+types/root';
import { middleware as yapyakMiddleware } from '@yapyak/react-router';

export const middleware: Route.MiddlewareFunction[] = [yapyakMiddleware];

// ... your root layout and Outlet ...
```

The middleware runs before every loader and component render, so anything called during the request (`getLocale()`, `t()`, `format.*`, server-side `setLocale()`) sees the right locale.

If you have other middleware, include it in the array. yapyak's middleware should run first so the locale is available to anything downstream:

```tsx
import { middleware as yapyakMiddleware } from '@yapyak/react-router';
import { middleware as authMiddleware } from './auth';

export const middleware: Route.MiddlewareFunction[] = [
  yapyakMiddleware,
  authMiddleware,
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

## Persistence

For server-side cookie reads to work, configure `persistence: 'cookie'` in `yapyak.config.ts`. Without it, the request-bound locale falls back to `defaultLocale` on every request — or to [`Accept-Language`](/guide/getting-started/configuration#detectacceptlanguage) detection if you've enabled `detectAcceptLanguage: true`.

```ts [yapyak.config.ts]
import { defineConfig } from 'yapyak/config';
import { react } from '@yapyak/react/processor';

export default defineConfig({
  persistence: 'cookie',
  processors: [react()],
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

## Common issues

- **A YAP0022 diagnostic fires on the server.** The middleware isn't running on that route. Either it's missing from the root route's `middleware` array, or `future.v8_middleware: true` is off in the config.
- **Locale resets to default on every request.** Persistence isn't configured. Add `persistence: 'cookie'` to your `yapyak.config.ts`.
- **`<html lang>` is wrong on first paint.** Read it through `useLocale()` in your root component rather than hardcoding it — the middleware provides the right value during SSR.
