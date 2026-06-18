---
title: TanStack Start
order: 5
---

`@yapyak/tanstack-start` is the yapyak SSR adapter for [TanStack Start](https://tanstack.com/start). Register it in your `createStart` instance and yapyak's per-request locale binding is wired across every loader and component render.

## Requirements

- Node.js 22 or later
- TypeScript 5 or later
- Vite 6 or later
- React 19 or later
- TanStack Start 1.168 or later

## Install

{% switch group="pkg" %}
{% when value="pnpm" %}
```bash
pnpm add @yapyak/tanstack-start
```
{% /when %}
{% when value="npm" %}
```bash
npm install @yapyak/tanstack-start
```
{% /when %}
{% when value="bun" %}
```bash
bun add @yapyak/tanstack-start
```
{% /when %}
{% /switch %}

You also need yapyak, the Vite plugin, and the React binding (covered in [Setup — Install](/guide/getting-started/installation)).

## Register the middleware

In your start entry file:

```ts [src/start.ts]
import { createStart } from '@tanstack/react-start';
import { middleware } from '@yapyak/tanstack-start';

export const startInstance = createStart(() => ({
  requestMiddleware: [middleware],
}));
```

If you have other request middleware, include them too — yapyak's adapter should run first so the locale is available to anything downstream:

```ts
import { createStart } from '@tanstack/react-start';
import { middleware as yapyakMiddleware } from '@yapyak/tanstack-start';
import { middleware as authMiddleware } from './auth';

export const startInstance = createStart(() => ({
  requestMiddleware: [yapyakMiddleware, authMiddleware],
}));
```

## Setting `<html lang>`

In your root route, read the locale through the React binding and pass it to `<html lang>`:

```tsx [src/routes/__root.tsx]
import { useLocale } from '@yapyak/react';

function Root() {
  const [locale] = useLocale();
  return (
    <html lang={locale}>
      <head>{/* ... */}</head>
      <body>
        {/* ... */}
      </body>
    </html>
  );
}
```

`useLocale()` reads the request-bound value during SSR and the client store after hydration, so the attribute is correct in both phases.

## Register the processor

```ts [yapyak.config.ts]
import { defineConfig } from 'yapyak/config';
import { react } from '@yapyak/react/processor';

export default defineConfig({
  persistence: 'cookie',
  processors: [react()],
});
```

`persistence: 'cookie'` is the typical pairing — the cookie is written client-side on `setLocale()` and read server-side by the middleware on every request.

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

## SSR-side `setLocale()`

If a server-side route handler calls `setLocale()`, yapyak buffers the `Set-Cookie` write and the middleware flushes it onto the outgoing response. The cookie is written automatically — you don't construct the header yourself.

## Common issues

- **A YAP0022 diagnostic fires on the server.** The adapter isn't running on that request. Make sure the middleware is registered in `requestMiddleware` of your `createStart` config.
- **Locale resets to default on every request.** Persistence isn't configured. Add `persistence: 'cookie'` to your `yapyak.config.ts`.
- **`<html lang>` is wrong on first paint.** Read it through `useLocale()` in your root component rather than hardcoding it.
