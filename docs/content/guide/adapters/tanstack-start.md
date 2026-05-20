---
title: TanStack Start
order: 6
---

Register yapyak's request middleware once in `src/start.ts`.

```ts
// src/start.ts
import { middleware } from 'yapyak/adapter/tanstack-start';

export default {
  requestMiddleware: [middleware],
};
```

That's the entire wiring.

## Set the page language

Drive the root element's `lang` attribute from the locale via `useI18n()`. The component re-renders when the locale changes:

```tsx
// src/routes/__root.tsx
import { createRootRoute, Outlet } from '@tanstack/react-router';
import { useI18n } from 'yapyak/react';

function Component() {
  const { locale } = useI18n();
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

The cookie is written client-side on `i18n.setLocale()` and read server-side by the middleware. See [Locales / Persistence](/guide/locales#persistence).
