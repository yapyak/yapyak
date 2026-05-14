---
title: TanStack Start
order: 5
---

Register yapyak's request middleware once in `src/start.ts`.

```ts
// src/start.ts
import { middleware } from 'yapyak/adapters/tanstack-start';

export default {
  requestMiddleware: [middleware],
};
```

That's the entire wiring. Every server-rendered request now resolves its own locale from cookie or `Accept-Language` header.

## Setting `<html lang>`

Drive the root element's `lang` attribute from the locale via `useLocale()`. The component re-renders when the locale changes:

```tsx
// src/routes/__root.tsx
import { createRootRoute, Outlet } from '@tanstack/react-router';
import type { ReactElement } from 'react';
import { useLocale } from 'yapyak/react';

function Component(): ReactElement {
  const [locale] = useLocale();
  return (
    <html lang={locale}>
      <head>{/* ... */}</head>
      <body>
        <Outlet />
      </body>
    </html>
  );
}

export const Route = createRootRoute({ component: Component });
```

This is the recommended pattern for TanStack Start. React re-renders the root component on locale change, the `lang` attribute updates reactively, and SSR renders the correct `lang` per request. No extra plugin option needed.

## Cookie persistence

For SSR locale switching to work, the user's choice must be readable by the server. Enable `persistence: 'cookie'` in the Vite plugin:

```ts
// vite.config.ts
yapyak({
  persistence: 'cookie',
})
```

The cookie is written client-side on `setLocale()` and read server-side by the middleware. See [Locales / Persistence](/guide/locales#persistence).
