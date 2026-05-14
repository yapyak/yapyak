---
title: Custom
order: 4
---

If your Vite SSR setup isn't covered by the shipped adapters (TanStack Start, SvelteKit), wire yapyak manually to the framework's per-request headers.

The adapter pattern is small:

```ts
// my-adapter.ts
import { setRequestSource } from 'yapyak';

export function myFrameworkAdapter(): void {
  setRequestSource(() => {
    const headers = getCurrentRequestHeaders();
    return {
      acceptLanguage: headers.get('accept-language') ?? undefined,
      cookieHeader: headers.get('cookie') ?? undefined,
    };
  });
}
```

The provider you pass to `setRequestSource()` is called lazily by yapyak each time `getLocale()` runs during SSR. Read the framework's current request headers inside the provider, return `accept-language` and `cookie`.

## What `setRequestSource()` does

It registers a function that returns the *current* request's headers. yapyak invokes that function whenever locale resolution is needed during server-rendering, then resolves the locale from cookie → `Accept-Language` → default.

Call `setRequestSource()` once at startup — not per request.

## Setting `<html lang>` (manual setups)

Use `useLocale()` (React) or `locale` (Svelte/Vue) in the root component:

```tsx
import type { ReactElement } from 'react';
import { useLocale } from 'yapyak/react';

function Component(): ReactElement {
  const [locale] = useLocale();
  return <html lang={locale}>{/* ... */}</html>;
}
```

The component re-renders when the locale changes.

## Cookie persistence

For SSR locale switching to work, enable cookie persistence:

```ts
yapyak({
  persistence: 'cookie',
})
```

See [Locales / Persistence](/guide/locales#persistence).
