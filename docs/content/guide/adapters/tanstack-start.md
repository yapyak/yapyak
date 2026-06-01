---
title: TanStack Start
order: 6
---

## Install

```bash
npm install @yapyak/tanstack-start
# or
pnpm add @yapyak/tanstack-start
```

## Setup

Register yapyak's request middleware once in `src/start.ts`.

```ts
// src/start.ts
import { createStart } from '@tanstack/react-start';
import { middleware } from '@yapyak/tanstack-start';

export const startInstance = createStart(() => ({
  requestMiddleware: [middleware],
}));
```

That's the entire wiring.

## Set the page language

Drive the document's `lang` attribute from the locale via `useLocale()` in the shell component, and wrap the routed tree in `LocaleProvider` so `t()` calls re-render when the locale changes:

```tsx
// src/routes/__root.tsx
import type { ReactNode } from 'react';

import { createRootRoute, HeadContent, Scripts } from '@tanstack/react-router';
import { LocaleProvider, useLocale } from '@yapyak/react';

export const Route = createRootRoute({ shellComponent: RootDocument });

function RootDocument({ children }: { children: ReactNode }) {
  const [locale] = useLocale();
  return (
    <html lang={locale}>
      <head>
        <HeadContent />
      </head>
      <body>
        <LocaleProvider>{children}</LocaleProvider>
        <Scripts />
      </body>
    </html>
  );
}
```

This is the recommended pattern for TanStack Start. The shell re-renders on locale change so `lang` updates reactively, `LocaleProvider` re-renders the routed tree so `t()` returns the new locale's strings, and SSR renders the correct `lang` per request. No extra plugin option needed.

## Cookie persistence

For SSR locale switching to work, the user's choice must be readable by the server. Enable `persistence: 'cookie'`:

```ts
// yapyak.config.ts
import { defineConfig } from 'yapyak';

export default defineConfig({
  persistence: 'cookie',
});
```

The cookie is written client-side on `setLocale()` and read server-side by the middleware. See [Locales / Persistence](/guide/locales/persistence).
