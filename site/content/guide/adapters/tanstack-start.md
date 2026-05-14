---
title: TanStack Start
order: 2
---

Wire the adapter once at the top of your root route.

```ts
// src/routes/__root.tsx
import { tanstackStart } from 'yapyak/adapters/tanstack-start';

tanstackStart();
```

That's the entire wiring. Every server-rendered request now resolves its own locale from cookie or `Accept-Language` header.

## Setting `<html lang>`

Drive the root element's `lang` attribute from the locale via `useLocale()`. The component re-renders when the locale changes:

```tsx
// src/routes/__root.tsx
import { createRootRoute, Outlet } from '@tanstack/react-router';
import type { ReactElement } from 'react';
import { tanstackStart } from 'yapyak/adapters/tanstack-start';
import { useLocale } from 'yapyak/react';

tanstackStart();

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

## Cookie persistence

For SSR locale switching to work, the user's choice must be readable by the server. Enable `persistence: 'cookie'` in the Vite plugin:

```ts
// vite.config.ts
yapyak({
  persistence: 'cookie',
})
```

The cookie is written client-side on `setLocale()` and read server-side by the adapter. See [Locales / Persistence](/guide/locales#persistence) for details.
