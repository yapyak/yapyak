---
title: Custom
order: 4
---

If your Vite SSR setup isn't TanStack Start or SvelteKit, wrap each request with `withRequest()`.

```ts
import { withRequest } from 'yapyak/server';

function handler(request: Request): Response | Promise<Response> {
  return withRequest(request, () => renderApp(request));
}
```

`withRequest()` reads `accept-language` and `cookie` from the `Request`, binds them to an async-scoped context, and runs the callback inside that scope. `getLocale()`, `t()`, and any other yapyak call inside the callback see this request's locale.

## What `withRequest()` does

It uses Node's `AsyncLocalStorage.run()` for safe per-request isolation. Concurrent requests can't bleed locale state into each other. The callback's return value is forwarded.

```ts
withRequest<T>(request: Request, fn: () => T): T;
```

## Setting `<html lang>`

Read the locale via `useLocale()` (React) or `locale` (Svelte/Vue) inside your root component so it re-renders on locale change:

```tsx
import type { ReactElement } from 'react';
import { useLocale } from 'yapyak/react';

function Component(): ReactElement {
  const [locale] = useLocale();
  return <html lang={locale}>{/* ... */}</html>;
}
```

## Cookie persistence

For SSR locale switching to work, enable cookie persistence:

```ts
yapyak({
  persistence: 'cookie',
})
```

See [Locales / Persistence](/guide/locales#persistence).
